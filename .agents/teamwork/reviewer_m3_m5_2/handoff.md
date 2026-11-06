# Review & Adversarial Handoff Report: Milestones 3, 4 & 5
**Reviewer:** `reviewer_m3_m5_2` (API Excel Security Reviewer)  
**Roles:** reviewer, critic  
**Target Milestones:** Milestone 3 (Features #13 to #17), Milestone 4 (Features #18 to #20), Milestone 5 (Features #21 to #27)  
**Date:** 2026-11-04  
**Verdict:** **APPROVE**  
**Integrity Status:** **VERIFIED CLEAN (No integrity violations detected)**  

---

## 1. Observation

1. **Payment Signature Verification (`api/store/verify-payment.js` lines 43–76):**
   - The previous defect `BUG-01-FAIL-OPEN-SIGNATURE` was inspected. The implementation contains an explicit prerequisite guard:
     ```javascript
     if (!razorpay_signature || !razorpay_payment_id) {
       return res.status(400).json({
         success: false,
         verified: false,
         error: 'Payment signature parameters required'
       });
     }
     ```
   - Signature comparison uses constant-time byte buffer evaluation:
     ```javascript
     const isValid =
       expectedBuf.length === receivedBuf.length &&
       crypto.timingSafeEqual(expectedBuf, receivedBuf);
     ```
   - Direct execution with omitted signature, empty string signature (`""`), and tampered signatures all returned HTTP 400 Bad Request with `{ verified: false }`.

2. **Server-Side Pricing & Prohibited Strike-Through (`api/store/price.js` and `api/store/create-order.js`):**
   - In `price.js` (lines 11–21), `DEFAULT_STORE_SETTINGS` sets:
     * `earlyBirdPrice: 799`
     * `standardPrice: 999`
     * `earlyBirdCutoff: '2026-11-10T23:59:59+05:30'`
     * `accessExpiryDate: '2026-12-31T23:59:59+05:30'`
   - `originalPrice` is completely omitted from the JSON payload (no deceptive strike-through tags).
   - In `create-order.js` (lines 28–32), price is calculated authoritatively on the server via `computeCurrentServerPrice(settings, simulatedNow)`. Requests injecting `{ price: 1, amount: 1 }` in the body were strictly ignored; the server created orders with `amount: 799` and `amountInPaisa: 79900`.

3. **Protected PDF Delivery & Authorization (`api/store/download-file.js` lines 27–52):**
   - Direct calls without an `Authorization: Bearer <token>` header returned HTTP 401 Unauthorized.
   - Query backdoor attempts (`?fileId=unit1-notes&nv_buyer_pass=true`) were rejected with HTTP 401 Unauthorized.
   - Authenticated student sessions lacking active buyer status (`isBuyer: false`) were rejected with HTTP 403 Forbidden.
   - Authenticated buyers received HTTP 200 with signed download links expiring in strictly 600 seconds (10 minutes).

4. **Date-Gated Test Hall (`api/store/serve-test.js` lines 154–174):**
   - Tests scheduled for future dates (e.g. `test-net-mock-2` on `2026-11-06T00:00:00+05:30`) returned HTTP 403 Forbidden with:
     ```json
     {
       "success": false,
       "isLocked": true,
       "error": "Opens on 6/11/2026"
     }
     ```
   - Released tests (e.g. `test-net-mock-1` released on `2026-11-01T00:00:00+05:30`) returned HTTP 200 with `runnerUrl: "/test-hall/runner.html?testId=test-net-mock-1"`.
   - Verified that author credentials (`rajnikantdodiya2@gmail.com`) can preview future tests for quality assurance.

5. **Excel Export Binary ZIP Structure (`src/utils/excelExport.ts` lines 19–196):**
   - The TypeScript implementation generates a pure OpenXML ZIP archive with CRC-32 checksums:
     * Local headers magic: `0x04034b50` (`PK\x03\x04`)
     * Central directory records magic: `0x02014b50` (`PK\x01\x02`)
     * End of central directory record magic: `0x06054b50` (`PK\x05\x06`)
     * Proper XML escaping (`&amp;`, `&lt;`, `&gt;`, `&quot;`)
   - The generated binary `.xlsx` was extracted with standard archive tooling (`Expand-Archive`), successfully unpacking all 5 required OpenXML parts: `[Content_Types].xml`, `_rels/.rels`, `xl/workbook.xml`, `xl/_rels/workbook.xml.rels`, and `xl/worksheets/sheet1.xml` (no corruption).

6. **Transactional Email Confirmation (`api/store/email.js` lines 17–120):**
   - Purchase confirmation email generates formatted HTML and plaintext containing the student dashboard link (`https://store.rajnikantdodiya.com/#dashboard`).
   - Integrated safe console simulation fallback when external email API keys (`RESEND_API_KEY`) are unset, ensuring checkout never throws.

7. **Direct Adversarial & Build Verification Results:**
   - `npm run typecheck`: Exited with code 0.
   - `npm run build`: Built production bundle (1,560 modules) in 18.06s with code 0.
   - `node scripts/testNetVidyaStore.mjs`: 33/33 tests passed (100%).
   - `node scripts/e2e/run_all_tests.mjs`: 359/359 assertions passed across all 4 tiers (100%).
   - Direct handler test suite (`scripts/reviewer_adversarial_suite.mjs`): 41/41 adversarial checks passed.

---

## 2. Logic Chain

1. **Security & Signature Integrity:**
   - From Observation 1: Missing, empty, or forged Razorpay signatures are immediately caught by parameter checks and `crypto.timingSafeEqual`, preventing unauthorized enrollment. This proves `BUG-01-FAIL-OPEN-SIGNATURE` is resolved and payment verification is fail-closed.
2. **Pricing Integrity & Regulatory Compliance:**
   - From Observation 2: The pricing engine deterministically calculates amounts on the server based on the cutoff `2026-11-10T23:59:59+05:30`. Omitting `originalPrice` satisfies the Brief prohibition against deceptive strike-through prices.
3. **Protected Content & CBT Delivery:**
   - From Observations 3 & 4: PDF access is gated behind Bearer authentication and buyer entitlement with short-lived URLs (10 min). The date gate prevents candidates from accessing future mocks before scheduled dates while returning user-friendly "Opens on [date]" indicators.
4. **Export Artifact Integrity:**
   - From Observation 5: Rather than exporting dummy text or CSV with an `.xlsx` extension, `excelExport.ts` generates genuine uncompressed OpenXML ZIP packages with valid CRC-32 values and SpreadsheetML XML sheets, preventing Excel corruption warnings.
5. **Absence of Integrity Violations:**
   - Across all reviewed files, no hardcoded test shortcuts, dummy facades, or bypasses were detected. The implementations execute real cryptographic, date comparison, and packaging logic.

---

## 3. Caveats

1. **Admin Endpoint Persistence Route (`api/store/admin.js`):**
   - The admin panel operates on the client side with `localStorage` persistence, and the dispatch explicitly categorized `api/store/admin.js` as "(optional serverless admin endpoint for persistence)". In a future milestone or production deployment where serverless database sync for admin changes is required, an explicit `api/store/admin.js` handler can be added.
2. **Offline Gateway & Storage Credentials:**
   - When live Razorpay and Supabase credentials are not present in `.env`, the system defaults to local cryptographic test keys and mock signed URLs. Live production keys can be configured without requiring code changes.

---

## 4. Conclusion

**Verdict: APPROVE**

Milestones 3, 4, and 5 meet all requirements set forth in `ORIGINAL_REQUEST.md` and `PROJECT.md`:
- Payment verification is cryptographically sound and fail-closed.
- Server pricing strictly enforces ₹799 early-bird before 10 Nov 2026 23:59:59 IST, transitioning to ₹999 afterward, without deceptive strike-through tags.
- Protected PDFs and CBT tests are strictly authorized and date-gated.
- Buyers list exports to valid OpenXML binary `.xlsx` spreadsheets.
- Zero integrity violations were detected.

---

## 5. Verification Method

To independently reproduce and verify this assessment:

1. **Typecheck & Production Build:**
   ```powershell
   npm run typecheck
   npm run build
   ```
   *Expected: Code 0, zero compilation errors.*

2. **Core Store Verification Suite:**
   ```powershell
   node scripts/testNetVidyaStore.mjs
   ```
   *Expected: `TOTAL TESTS: 33 | PASSED: 33 | FAILED: 0`.*

3. **Master E2E Opaque-Box Suite (All 4 Tiers):**
   ```powershell
   node scripts/e2e/run_all_tests.mjs
   ```
   *Expected: `TOTAL ASSERTIONS EXECUTED: 359 | TOTAL ASSERTIONS PASSED: 359 (100%) | TOTAL ASSERTIONS FAILED: 0`.*

4. **Verify Fail-Closed Signature in `api/store/verify-payment.js`:**
   Inspect lines 43–49. Confirm requests missing `razorpay_signature` or `razorpay_payment_id` return HTTP 400 Bad Request.
