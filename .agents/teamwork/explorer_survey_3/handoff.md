# Handoff Report: Payments, Content Delivery & Admin Survey

**Agent Folder:** `c:\Users\DELL\Documents\antigravity\radiant-maxwell\.agents\teamwork\explorer_survey_3`  
**Mission:** In-depth survey of pricing logic, Razorpay integration, protected content delivery (PDFs & Test Hall), and the admin management panel.  
**Mode:** Read-Only Investigation  

---

## 1. Observation

### 1.1 Pricing & Razorpay Integration
1. **Timezone & Price Cutoff:**
   - File: `api/store/price.js` (lines 11–21, 23–40):
     ```javascript
     export const DEFAULT_STORE_SETTINGS = {
       productSlug: 'final-pack-2026',
       productName: 'GSET + UGC NET English Final Pack 2026',
       earlyBirdPrice: 799,
       standardPrice: 999,
       earlyBirdCutoff: '2026-11-10T23:59:59+05:30',
       accessExpiryDate: '2026-12-31T23:59:59+05:30',
       sellerLine: 'Sold by NET Vidya (proprietor: Nilam Dodiya). Content by Dr Rajnikant Dodiya.',
     ```
     `new Date('2026-11-10T23:59:59+05:30').getTime()` evaluates to epoch millisecond `1794335399000` (UTC `2026-11-10T18:29:59.000Z`).
2. **Dynamic Price Override Disconnect:**
   - In `api/store/price.js` (lines 48–67), the function queries Supabase `netvidya_store_settings`.
   - In `api/store/create-order.js` (line 28) and `api/store/verify-payment.js` (line 62):
     ```javascript
     const priceCalculation = computeCurrentServerPrice(DEFAULT_STORE_SETTINGS);
     ```
     `create-order.js` and `verify-payment.js` completely ignore the database table `netvidya_store_settings` and hardcode `DEFAULT_STORE_SETTINGS`.
3. **Price Parameter Ignored from Client:**
   - `api/store/create-order.js` (lines 18–25) extracts only `studentName`, `email`, and `mobile` from `req.body`. Price is determined server-side as `priceCalculation.price * 100` paise.
4. **Prohibited Strike-Through Price:**
   - `src/components/store/NetVidyaStoreHome.tsx` (line 129):
     ```tsx
     <span className="text-xs sm:text-sm font-semibold text-gray-400 line-through">₹1,499</span>
     ```
     Directly violates Requirement R6 prohibiting fake MRP or strike-through prices.
5. **Fail-Open Signature Verification:**
   - `api/store/verify-payment.js` (lines 35–59):
     ```javascript
     if (keySecret && razorpay_payment_id && razorpay_signature) {
       ...
       const isValid = expectedBuf.length === receivedBuf.length && crypto.timingSafeEqual(expectedBuf, receivedBuf);
       if (!isValid) return res.status(400).json({ ... });
     }
     ```
     If an attacker omits `razorpay_signature` in `req.body`, or if `keySecret` is missing, the entire `if` condition evaluates to `false` and skips signature verification, proceeding to enroll the buyer.
6. **Webhook Handler Body Parsing Issue:**
   - `api/store/razorpay-webhook.js` (lines 19–30):
     ```javascript
     const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
     ```
     Because Vercel serverless auto-parses the incoming request body into an Object, re-stringifying via `JSON.stringify` does not reproduce the exact original raw byte stream, causing signature mismatch in production.
7. **Purchase Confirmation Email Missing:**
   - Ripgrep for email dispatch (`resend`, `sendEmail`, `nodemailer`, `@sendgrid/mail`) across `api/` and `src/` yielded zero hits. Neither `verify-payment.js` nor `razorpay-webhook.js` sends an email.

### 1.2 Protected Reading Files
1. **Zero PDF Files in Repository:**
   - `find_by_name` searching for `*.pdf` in the workspace returned 0 files.
2. **Backdoor in Download Verification:**
   - `api/store/download-file.js` (lines 55–57):
     ```javascript
     if (!isAuthorized && userToken && userToken.startsWith('nv_buyer_')) {
       isAuthorized = true;
     }
     ```
     Any visitor can pass `?userToken=nv_buyer_test` and obtain file access without payment.
3. **Prohibited University Affiliation in Code:**
   - `api/store/download-file.js` (line 26):
     ```javascript
     const AUTHOR_EMAILS = ['rajnikantdodiya2@gmail.com', 'rajnikantdodiya@hmpenglish.com', 'rajnikant.dodiya@spuvvn.edu'];
     ```
4. **Client Dummy Blob Generation:**
   - `src/components/store/NetVidyaDashboard.tsx` (lines 76–85):
     The download handler calls `/api/store/download-file`, but ignores `data.downloadUrl`, instead creating an in-memory string:
     ```typescript
     const sampleBlobText = `%PDF-1.4\n% NET Vidya English Private Reading Material\n...`;
     const blob = new Blob([sampleBlobText], { type: 'application/pdf' });
     ```

### 1.3 Test Hall Delivery
1. **Zero Test HTML Files in Repository:**
   - `find_by_name` for `*.html` returned only `index.html` and unrelated WebGL demo `public/landing-pages/kage.html`.
2. **Missing Test Runner File:**
   - `api/store/serve-test.js` (line 153):
     ```javascript
     runnerUrl: `/test-hall/runner.html?testId=${testId}`
     ```
     `/test-hall/runner.html` does not exist on disk.
3. **Authorization Bypass in Test Delivery:**
   - `api/store/serve-test.js` (line 115):
     ```javascript
     if (!isAuthorized && (userToken?.startsWith('nv_buyer_') || cleanEmail)) {
       isAuthorized = true;
     }
     ```
     Passing any email address (e.g. `?email=stranger@example.com`) satisfies `cleanEmail`, instantly bypassing buyer authorization.
4. **Frontend Bypasses Server Test Route:**
   - `src/components/store/NetVidyaDashboard.tsx` (lines 244, 326–334): Clicking "Launch CBT Test" does not call `serve-test.js`. It directly opens `<NtaTestRunnerModal>`, rendering 8 hardcoded questions from `SAMPLE_NTA_QUESTIONS` in React.

### 1.4 Admin Management Panel
1. **Zero Authentication on Admin Panel:**
   - `src/components/store/NetVidyaStoreLayout.tsx` (lines 150–154, 317–322):
     ```tsx
     <button onClick={() => setIsAdminOpen(true)} title="Dr. Rajnikant Admin Studio">
       <Lock className="w-4 h-4" />
     </button>
     ```
     Any visitor clicking this button in the navbar directly opens `NetVidyaAdminModal` without entering a password, PIN, or auth session.
2. **Mock File Uploads via `localStorage`:**
   - `src/components/store/NetVidyaAdminModal.tsx` contains no `<input type="file">` for PDFs or HTML tests.
   - `src/contexts/NetVidyaStoreContext.tsx` (lines 364–416): Submissions only append metadata to `localStorage.getItem('netvidya_reading_files_v1')` and `localStorage.getItem('netvidya_tests_v1')`. No files are uploaded to Supabase Storage, and no rows are inserted into `netvidya_reading_files` or `netvidya_tests`.
3. **Pricing Settings Disconnect & Timezone Bug:**
   - In `NetVidyaAdminModal.tsx` (lines 136–144), saving pricing writes solely to `localStorage`. It does not execute an `UPDATE` on `netvidya_store_settings` in Supabase.
   - In `NetVidyaAdminModal.tsx` (line 141), `new Date(cutoffDateInput).toISOString()` parses `<input type="datetime-local">` in the local browser timezone rather than forcing IST (`+05:30`).
4. **Buyers Table Disconnect & CSV Export:**
   - `NetVidyaAdminModal.tsx` displays `buyersRegistry` from `localStorage` (initialized with 3 hardcoded records), completely disconnected from Supabase `netvidya_buyers`.
   - `exportBuyersToExcel` (lines 452–477 in `NetVidyaStoreContext.tsx`) creates a `.csv` file (`text/csv`), failing the requirement for an Excel `.xlsx` export.
5. **Missing Confirmation Email Resend:**
   - `NetVidyaAdminModal.tsx` contains no option or function to resend purchase confirmation emails.

---

## 2. Logic Chain

1. **Premise:** The original developer brief requires authoritative server-side pricing, cryptographic Razorpay fulfillment, short-lived signed links for private PDFs, server date-gated NTA test HTML files, and an admin management panel.
2. **From Observation 1.1.2:** Because `api/store/create-order.js` and `api/store/verify-payment.js` call `computeCurrentServerPrice(DEFAULT_STORE_SETTINGS)` without reading `netvidya_store_settings` from Supabase, dynamic prices set in the database will have no effect on actual order charges.
3. **From Observation 1.1.5:** Because line 35 of `api/store/verify-payment.js` wraps verification in `if (keySecret && razorpay_payment_id && razorpay_signature)`, any request omitting `razorpay_signature` will bypass HMAC checking and enroll the student into `netvidya_buyers`.
4. **From Observation 1.2.1, 1.2.2, & 1.2.4:** Because 0 PDF files exist on disk, `download-file.js` contains a `userToken.startsWith('nv_buyer_')` backdoor, and `NetVidyaDashboard.tsx` generates a dummy ASCII string in memory instead of downloading the signed URL, protected PDF delivery is non-operational.
5. **From Observation 1.3.1, 1.3.3, & 1.3.4:** Because no HTML test files exist, `serve-test.js` marks any non-empty `cleanEmail` as authorized, and the dashboard launches a local React modal with 8 sample questions, the date-gated NTA test delivery server is non-operational.
6. **From Observation 1.4.1–1.4.5:** Because `NetVidyaAdminModal` opens from an unauthenticated navbar button, saves files and prices only to local browser memory (`localStorage`), exports `.csv` instead of `.xlsx`, and has no email resend capability, the admin panel is a client-side mockup rather than a functional administrative backend.

---

## 3. Caveats

1. **Supabase Cloud Environment:** The current local inspection evaluated files, schemas, and endpoints in the repository. The active remote Supabase project (`ztqmrikjwmlawifjekdy.supabase.co`) was not modified or queried directly due to read-only constraint.
2. **Razorpay Live Gateway Credentials:** `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` are not committed to `.env`, which is standard security practice. Live order creation was evaluated using the server's fallback test mode.
3. **Read-Only Scope:** No source code was modified during this survey.

---

## 4. Conclusion

The current radiant-maxwell codebase has the conceptual scaffolding for the NET Vidya English student store, but contains **critical implementation gaps and security flaws**:
1. **Security Vulnerabilities:** Paywall bypasses exist in `serve-test.js` (`cleanEmail` check), `download-file.js` (`nv_buyer_` token check), and `verify-payment.js` (fail-open signature check). The admin modal has zero authentication.
2. **Missing Core Features:** Purchase confirmation emails and password reset emails are completely absent.
3. **Mock vs Production Disconnect:** PDF downloads and CBT tests are client-side synthetic mocks; file uploads in admin modal only persist to `localStorage`.
4. **Compliance Violations:** Hero section displays a strike-through price (`₹1,499`) and omits Dr. Rajnikant Dodiya's photo (`public/dr-rajnikant-dodiya.jpg`).

---

## 5. Verification Method

To independently reproduce and verify these findings, perform the following steps:

1. **Verify Prohibited Strike-Through Price:**
   - Inspect `src/components/store/NetVidyaStoreHome.tsx:129`:
     ```bash
     git grep -n "line-through" src/components/store/
     ```
     Output will confirm `₹1,499` in `NetVidyaStoreHome.tsx:129`.

2. **Verify Paywall Bypass in `serve-test.js`:**
   - Inspect `api/store/serve-test.js:115`:
     ```javascript
     if (!isAuthorized && (userToken?.startsWith('nv_buyer_') || cleanEmail)) {
       isAuthorized = true;
     }
     ```
     Any query with `?email=test@test.com` evaluates `cleanEmail` to truthy.

3. **Verify Download Backdoor & Dummy Blob:**
   - Inspect `api/store/download-file.js:55`:
     ```javascript
     if (!isAuthorized && userToken && userToken.startsWith('nv_buyer_')) {
       isAuthorized = true;
     }
     ```
   - Inspect `src/components/store/NetVidyaDashboard.tsx:76–85`:
     Observe `sampleBlobText` hardcoded ASCII string.

4. **Verify Missing File Picker in Admin Modal:**
   - Inspect `src/components/store/NetVidyaAdminModal.tsx`:
     Search for `<input type="file"`. Result will be 0 matches.

5. **Run Existing Store Test Script:**
   ```bash
   node scripts/testNetVidyaStore.mjs
   ```
   Note that this script only verifies in-memory mock functions, not the real API endpoints.
