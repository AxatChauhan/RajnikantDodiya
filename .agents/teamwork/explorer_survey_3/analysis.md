# Technical Analysis: Payments, Content Delivery, and Admin Management Survey

**Author:** Explorer 3 (Payments, Content Delivery & Admin Specialist)  
**Date:** 2026-11-04  
**Target Codebase:** `c:\Users\DELL\Documents\antigravity\radiant-maxwell`  
**Scope:** Pricing logic & Razorpay integration, protected PDF storage and delivery, NTA-style test hall delivery, and the admin management panel.

---

## 1. Executive Summary

This in-depth survey analyzes the payment processing, access control, protected digital content delivery (PDFs & CBT HTML tests), and store administration features for the single-bundle product: **"GSET + UGC NET English Final Pack 2026"** (Merchant: Nilam Dodiya / NET Vidya; Content: Dr. Rajnikant Dodiya).

While foundational schemas and basic Vercel serverless endpoints exist in `api/store/`, the current implementation relies heavily on **in-browser `localStorage` mocks**, contains **critical security bypasses** in payment verification and content gating, lacks **email infrastructure entirely**, and fails to serve actual binary PDFs or self-contained NTA HTML test files.

### Key Audit Highlights
| Component | Requirement | Current Status | Critical Deficiencies |
|---|---|---|---|
| **Pricing Engine** | ₹799 before 10 Nov 2026 23:59 IST, then ₹999. Decided exclusively on server. | ⚠️ Partial | Correct calculation in `api/store/price.js`, but `create-order.js` and `verify-payment.js` bypass Supabase dynamic settings. UI contains prohibited strike-through price (`₹1,499`). |
| **Razorpay Integration** | Server order creation, signature verification, webhook (`payment.captured`), secure keys. | ⚠️ Partial | Secret key missing in local env; signature check fails open if signature omitted; webhook body verification breaks due to parsed JSON stringification. |
| **Confirmation Email** | Send purchase confirmation email with student dashboard link. | ❌ Missing | No email provider, API endpoint, or webhook trigger implemented anywhere. |
| **Protected Reading Files** | Private storage, 5–10 min short-lived signed links, verify buyer before delivery. | ⚠️ Broken | Zero PDFs exist; signed URL ignored on client; dummy text blob generated on client; `?userToken=nv_buyer_` backdoors bypass paywall. |
| **Test Hall Delivery** | Ready-made self-contained NTA HTML test runners, date-gating ("Opens on [date]"). | ⚠️ Mock Only | Zero test HTML files exist; `runnerUrl` points to missing file; client runs 8-question React demo; `api/store/serve-test.js` allows any email to bypass auth. |
| **Admin Panel** | No-code management for Dr. Rajnikant: PDF upload, test HTML upload, pricing, buyers (.xlsx), grant/revoke, resend emails. | ❌ Client Mock | Unprotected navbar lock icon (0 auth); file uploads only write metadata to browser `localStorage`; export is `.csv` not `.xlsx`; resend email absent. |

---

## 2. In-Depth Component Analysis

### Component 1: Pricing & Razorpay Integration

#### 1.1 Server-Side Price Calculation & Timezone Handling
- **Location:** `api/store/price.js` (lines 11–40), `api/store/create-order.js` (lines 27–30), `api/store/verify-payment.js` (lines 61–65).
- **Cutoff Specification:** `2026-11-10T23:59:59+05:30`.
- **Logic:**
  ```javascript
  const now = new Date();
  const cutoff = new Date(settings.earlyBirdCutoff);
  const isEarlyBird = now <= cutoff;
  const currentPrice = isEarlyBird ? settings.earlyBirdPrice : settings.standardPrice;
  ```
- **Timezone Verification:** 
  The string `'2026-11-10T23:59:59+05:30'` includes the explicit `+05:30` IST offset. In JavaScript, `new Date('2026-11-10T23:59:59+05:30').getTime()` unambiguously resolves to epoch millisecond `1794335399000` (which is `2026-11-10T18:29:59.000Z` UTC). The comparison `now <= cutoff` compares epoch timestamps and is timezone-agnostic.
- **Client Price Isolation:**
  In `api/store/create-order.js`, the request body (`req.body`) is destructured strictly for `{ studentName, email, mobile }`. Client-provided prices are completely discarded. Amount sent to Razorpay is computed strictly as `priceCalculation.price * 100` (paise).
- **Architectural Disconnect:**
  In `api/store/price.js`, the handler checks Supabase table `netvidya_store_settings` for dynamic overrides. However, `api/store/create-order.js` (line 28) and `api/store/verify-payment.js` (line 62) call `computeCurrentServerPrice(DEFAULT_STORE_SETTINGS)` directly, ignoring Supabase settings! If an admin modifies prices in the database, `price.js` will show the new price, but `create-order.js` will still charge the hardcoded `DEFAULT_STORE_SETTINGS` amount.
- **Compliance Violation (R6):**
  `src/components/store/NetVidyaStoreHome.tsx` line 129 displays:
  `<span className="text-xs sm:text-sm font-semibold text-gray-400 line-through">₹1,499</span>`
  This violates Requirement R6 ("Prohibit fake reviews and fake MRP or strike-through prices").

#### 1.2 Razorpay Order Creation (`api/store/create-order.js`)
- Requires `studentName`, `email`, `mobile`.
- Fetches `https://api.razorpay.com/v1/orders` using HTTP Basic Auth (`RAZORPAY_KEY_ID:RAZORPAY_KEY_SECRET`).
- Key Management:
  - `VITE_RAZORPAY_KEY_ID=rzp_test_TpOz4ZlxJBGo0E` exists in `.env`.
  - `RAZORPAY_KEY_SECRET` is missing from the environment.
  - When `RAZORPAY_KEY_SECRET` is unset, it generates a mock order ID (`order_test_...`) with `isTestMode: true`.

#### 1.3 Signature Verification (`api/store/verify-payment.js`)
- Signature calculation:
  ```javascript
  const payload = razorpay_order_id ? `${razorpay_order_id}|${razorpay_payment_id}` : razorpay_payment_id;
  const expectedSignature = crypto.createHmac('sha256', keySecret).update(payload).digest('hex');
  ```
- Evaluates using `crypto.timingSafeEqual` (resistant to timing attacks).
- **Critical Vulnerability (Fail-Open Bypass):**
  Line 35 checks:
  ```javascript
  if (keySecret && razorpay_payment_id && razorpay_signature) { ... }
  ```
  If `razorpay_signature` is omitted by an attacker, or if `keySecret` is missing on the server, the cryptographic check is completely bypassed! The handler proceeds to lines 66–96 to upsert the buyer into Supabase as `is_active: true`. Signature verification must be fail-closed.

#### 1.4 Webhook Handler (`api/store/razorpay-webhook.js`)
- Listens for `event === 'payment.captured'`.
- Extracts `notes.student_name`, `email`, `mobile`, `amount`.
- Upserts student into `netvidya_buyers` with `payment_method: 'razorpay_webhook'`.
- **Payload Verification Flaw:**
  Line 19: `const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);`
  In Vercel Serverless Functions, incoming JSON is automatically parsed into an object. Re-stringifying with `JSON.stringify` does not guarantee original byte ordering or whitespace, resulting in webhook signature verification failures in production.
- **Missing Confirmation Email:**
  Neither the webhook handler nor `verify-payment.js` triggers an email.

---

### Component 2: Protected Reading Files

#### 2.1 Private Storage Architecture
- **Database Schema:** `supabase/netvidya_store_schema.sql` defines `netvidya_reading_files`:
  - `id UUID`, `title TEXT`, `category TEXT`, `description TEXT`, `file_path TEXT`, `file_size_mb NUMERIC`, `download_count INTEGER`, `is_active BOOLEAN`.
- **Storage Bucket:** Code references private Supabase bucket `netvidya-materials`.
- **Current Deficit:** Zero PDF files exist in `public/` or anywhere in the repository.

#### 2.2 Delivery Endpoint (`api/store/download-file.js`)
- Attempts to call `supabase.storage.from('netvidya-materials').createSignedUrl(filePath, 600)` (10-minute expiry).
- **Flaws & Vulnerabilities:**
  1. **Hardcoded File Path:** Assumes `reading-files/${fileId}.pdf` instead of reading the `file_path` column from `netvidya_reading_files`.
  2. **Paywall Backdoor (Line 55):**
     ```javascript
     if (!isAuthorized && userToken && userToken.startsWith('nv_buyer_')) {
       isAuthorized = true;
     }
     ```
     Any visitor can pass `?userToken=nv_buyer_hack` to download files without paying.
  3. **Unauthenticated Impersonation:** Authorization only checks `?email=`. There is no JWT or signed session validation; anyone knowing an enrolled buyer's email can spoof them.
  4. **Prohibited Branding:** Hardcodes legacy university emails (`rajnikant.dodiya@spuvvn.edu`, `rajnikantdodiya@hmpenglish.com`).
  5. **Client Disconnect (`NetVidyaDashboard.tsx`):**
     When the student clicks "Download PDF", the dashboard calls `download-file.js`, but completely ignores `data.downloadUrl`! Lines 76–85 create a synthetic text string (`const sampleBlobText = %PDF-1.4...`) in memory and downloads an ASCII dummy file.

---

### Component 3: Test Hall Delivery

#### 3.1 NTA-Style Test Storage & Serving
- **Requirement:** Serve ready-made, self-contained NTA-style test HTML files through the server to logged-in buyers only.
- **Current State:**
  - Zero test HTML files exist in the repository.
  - `api/store/serve-test.js` defines an in-memory `TEST_HALL_SCHEDULE` array. It does not query `netvidya_tests` from Supabase.
  - Line 153 returns `runnerUrl: /test-hall/runner.html?testId=${testId}`. This file does not exist anywhere on disk.
  - In `NetVidyaDashboard.tsx`, clicking "Launch CBT Test" bypasses `serve-test.js` completely and mounts `NtaTestRunnerModal.tsx`, an in-React client modal with 8 sample questions.

#### 3.2 Date-Gating Enforcement
- **Server Rule (`api/store/serve-test.js` lines 128–146):**
  If `now < releaseTime`, the server responds with HTTP 403 Forbidden:
  `{ success: false, isLocked: true, error: "Test Scheduled: This test opens on [date]. Access is not yet permitted." }`.
- **Client Display (`NetVidyaDashboard.tsx` lines 185–241):**
  If `now < releaseTime`, displays "Opens on [formattedDate]" and disables the button.
- **Critical Auth Bypass in `serve-test.js` line 115:**
  ```javascript
  if (!isAuthorized && (userToken?.startsWith('nv_buyer_') || cleanEmail)) {
    isAuthorized = true;
  }
  ```
  Because `cleanEmail` is truthy for any provided email string, non-buyers passing `?email=anyone@gmail.com` are marked authorized!

---

### Component 4: Admin Management Panel

#### 4.1 Admin Authentication & Authorization
- **Location:** `src/components/store/NetVidyaStoreLayout.tsx` lines 150–154.
- **Vulnerability:** The admin modal is opened by clicking `<button onClick={() => setIsAdminOpen(true)} title="Dr. Rajnikant Admin Studio"><Lock className="w-4 h-4" /></button>`.
- **Assessment:** There is **NO password, NO PIN, NO session check, and NO Supabase Auth**. Any unauthenticated visitor who clicks the icon gets full access to the admin panel.

#### 4.2 PDF & Test Upload Mechanisms
- `NetVidyaAdminModal.tsx` provides form fields (title, category, duration, release date), but has **no file input (`<input type="file">`)**.
- Submitting the forms calls `addReadingFile()` or `addTest()` in `NetVidyaStoreContext.tsx`, which merely appends records to browser `localStorage` (`netvidya_reading_files_v1`, `netvidya_tests_v1`).
- Files are not uploaded to Supabase Storage, and records are not inserted into `netvidya_reading_files` or `netvidya_tests`.

#### 4.3 Dynamic Store Pricing Configuration
- Admin modal has inputs for early-bird price, standard price, and cutoff date.
- Saves only to `localStorage` (`netvidya_store_settings_v1`).
- Does not update `netvidya_store_settings` in Supabase.
- **Timezone Bug:** `cutoffDateInput` uses `new Date(cutoffDateInput).toISOString()`, which parses the local browser timezone instead of preserving the required `+05:30` IST offset.

#### 4.4 Buyers List Table & Export
- Table renders from `buyersRegistry` in `localStorage` (seeded with 3 mock records).
- Does not query `netvidya_buyers` table in Supabase.
- `exportBuyersToExcel()` exports plain CSV (`text/csv`), not Excel `.xlsx`.

#### 4.5 Manual Grant / Revoke Access
- Manual grant form appends a record to `localStorage`.
- Revoke button toggles `isActive` in `localStorage`.
- Neither action interacts with Supabase `netvidya_buyers`.

#### 4.6 Resend Purchase Confirmation Email
- Completely absent. There is no UI button, handler, or backend endpoint.

---

## 3. Student Authentication System (Requirement R2)

The developer brief requires replacing access passes with an email/password authentication system, including password reset by email, and restricting dashboard access to paying buyers.
- **Current Implementation:** `src/components/store/NetVidyaStudentLoginModal.tsx`.
- **Deficiencies:**
  1. `handlePasswordSignIn` only checks `password.length >= 4`. It never checks credentials against Supabase Auth or a database.
  2. If the entered email is not in the hardcoded `buyersRegistry`, line 73 logs the user in anyway as `NV_SCHOLAR_...` and sets `isBuyer: true`.
  3. In OTP mode, it prompts for a hardcoded code (`123456`) and grants immediate full buyer access.
  4. There is no password reset ("Forgot Password") flow.

---

## 4. Remediation Roadmap

To achieve full compliance with the developer brief, the following architectural steps must be implemented:

1. **Email Delivery Infrastructure:**
   - Integrate an email API (e.g. Resend via REST fetch with `RESEND_API_KEY`).
   - Create serverless helper `api/send-email.js` for purchase confirmations (with dashboard URL) and password reset links.
   - Wire email triggers into `verify-payment.js`, `razorpay-webhook.js`, and an admin resend endpoint.

2. **Student Authentication & Access Control:**
   - Implement Supabase Auth email/password login, registration, and `resetPasswordForEmail`.
   - Protect dashboard routes by checking active enrollment in `netvidya_buyers` (where `is_active = true` and `now() <= expires_at`).

3. **Secure Content Delivery:**
   - Store PDFs in a private Supabase Storage bucket (`netvidya-materials`).
   - Remove `?userToken=nv_buyer_` backdoors and enforce authenticated session tokens in `download-file.js`.
   - Update `NetVidyaDashboard.tsx` to download from the signed URL returned by the server.
   - For tests, store ready-made self-contained HTML test files in private storage and serve them via a serverless streaming/signed URL route that enforces `release_date <= now()`.

4. **Admin Management Panel Security & Backend Integration:**
   - Gate `NetVidyaAdminModal` behind an authenticated admin session (checking admin credentials or role).
   - Add real file upload inputs for PDFs and HTML test files, uploading to Supabase Storage and inserting records into `netvidya_reading_files` and `netvidya_tests`.
   - Sync pricing changes to `netvidya_store_settings` in Supabase with explicit `+05:30` IST timezone formatting.
   - Connect the buyers registry table to `netvidya_buyers` in Supabase.
   - Implement Excel export (.xlsx) using a lightweight library or structured XML spreadsheet format.
   - Add "Resend Confirmation Email" action for any student in the buyers table.
