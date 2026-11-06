# Milestone 2 Adversarial Challenge Report: Paywall Penetration & Content Gating

**Agent**: challenger_m2_2 (Paywall Penetration Challenger)  
**Date**: 2026-11-04  
**Working Directory**: `.agents/teamwork/challenger_m2_2`  
**Reference Documents**: `ORIGINAL_REQUEST.md`, `PROJECT.md`, `worker_m2_1/handoff.md`  
**Handoff Type**: Hard (Verification Complete)  
**Final Verdict**: **APPROVE**

---

## 1. Observation

### 1.1 Direct Source Code Audit of Protected Endpoints
1. **`api/store/download-file.js`**:
   - Lines 28–34: Session authentication extracted strictly from `Authorization: Bearer <token>`.
     ```javascript
     const token = extractBearerToken(req);
     if (!token) {
       return res.status(401).json({ success: false, error: 'Unauthorized: login required.' });
     }
     ```
   - Lines 36–42: Session token verified cryptographically via `verifySessionToken(token)`. Expired, invalid, or forged tokens return HTTP 401 Unauthorized.
   - Lines 45–51: Buyer entitlement check.
     ```javascript
     const isBuyer = payload.isBuyer || await isEmailBuyer(payload.email);
     if (!isBuyer) {
       return res.status(403).json({ success: false, error: 'Access Denied: buyer enrollment required.' });
     }
     ```
   - Lines 53–87: Delivers a 10-minute temporary signed download link (`expiresInSeconds: 600`).
   - Query backdoors (`nv_buyer_` query parameters and unverified email parameters) are completely absent.

2. **`api/store/serve-test.js`**:
   - Lines 123–137: Strict Bearer token extraction and JWT cryptographic verification returning HTTP 401 Unauthorized for missing or invalid tokens.
   - Lines 140–146: Restricts test hall to active buyers, returning HTTP 403 Forbidden for non-buyers.
     ```javascript
     const isBuyer = payload.isBuyer || await isEmailBuyer(payload.email);
     if (!isBuyer) {
       return res.status(403).json({ success: false, error: 'Access Denied: active pass required.' });
     }
     ```
   - Lines 155–173: Server-side release date verification:
     ```javascript
     const now = new Date();
     const releaseTime = new Date(testItem.releaseDate);
     const isAuthor = AUTHOR_EMAILS.includes(payload.email.toLowerCase().trim());
     if (now < releaseTime && !isAuthor) {
       const formattedDate = releaseTime.toLocaleDateString('en-IN', {
         day: 'numeric',
         month: 'short',
         year: 'numeric'
       });
       return res.status(403).json({
         success: false,
         isLocked: true,
         releaseDate: testItem.releaseDate,
         formattedReleaseDate: formattedDate,
         error: `Opens on ${releaseTime.toLocaleDateString('en-IN')}`
       });
     }
     ```
   - Schedule configuration in `TEST_HALL_SCHEDULE`:
     - `test-net-mock-1`: Release date `2026-11-01T00:00:00+05:30` (Unlocked as of 2026-11-04).
     - `test-net-mock-2`: Release date `2026-11-06T00:00:00+05:30` (Locked; opens in 2 days).
     - `test-net-mock-3`: Release date `2026-11-10T00:00:00+05:30` (Locked; opens in 6 days).
     - `test-future-mock`: Release date `2026-11-25T00:00:00+05:30` (Locked; opens in 21 days).

---

### 1.2 Verification Commands and Tool Outputs

1. **TypeScript Typecheck**:
   - Command: `npm run typecheck`
   - Result: Exited with code 0 (zero type errors).
   ```text
   > radiant-maxwell@1.0.0 typecheck
   > tsc --noEmit
   ```

2. **Vite Production Build**:
   - Command: `npm run build`
   - Result: Exited with code 0 (built in 31.55s).
   ```text
   ✓ 1559 modules transformed.
   rendering chunks...
   computing gzip size...
   dist/index.html 4.63 kB
   dist/assets/index-BVlf68ja.css 125.07 kB
   dist/assets/NetVidyaStoreLayout-B5HhXLSB.js 112.16 kB
   dist/assets/vendor-supabase-f4bNl52y.js 227.07 kB
   ✓ built in 31.55s
   ```

3. **Master E2E Test Suite**:
   - Command: `node scripts/e2e/run_all_tests.mjs`
   - Result: Exited with code 0; 359 / 359 assertions passed across Tiers 1–4.
   ```text
   TOTAL ASSERTIONS EXECUTED : 359
   TOTAL ASSERTIONS PASSED   : 359
   TOTAL ASSERTIONS FAILED   : 0
   RIGOROUS THRESHOLD (>=200): MET (EXCEEDED)
   >>> ALL TEST TIERS PASSED WITH 100% SUCCESS <<<
   ```

4. **Dedicated Adversarial Penetration Suite**:
   - Command: `node scripts/adversarial_paywall_penetration.mjs`
   - Script created by challenger: `scripts/adversarial_paywall_penetration.mjs`
   - Result: Exited with code 0; 48 / 48 checks passed with 100% success.
   ```text
   ================================================================================
         ADVERSARIAL PENETRATION SUITE: PAYWALL & CONTENT GATING VERIFICATION      
   ================================================================================

   --- Suite 1: Anonymous & Missing Authentication Attacks ---
     ✓ PASS: 1.1 download-file with no Authorization header returns 401
     ✓ PASS: 1.2 serve-test with no Authorization header returns 401
     ✓ PASS: 1.3 download-file with empty Authorization header returns 401
     ✓ PASS: 1.4 serve-test with empty Authorization header returns 401
     ✓ PASS: 1.5 download-file with Basic auth scheme returns 401
     ✓ PASS: 1.6 serve-test with Basic auth scheme returns 401
     ✓ PASS: 1.7 download-file with whitespace Bearer token returns 401
     ✓ PASS: 1.8 download-file with random invalid Bearer token returns 401
     ✓ PASS: 1.9 serve-test with random invalid Bearer token returns 401

   --- Suite 2: Legacy Query Parameter Backdoor Attacks ---
     ✓ PASS: 2.1 download-file ?userToken=nv_buyer_xyz returns 401 without Bearer
     ✓ PASS: 2.2 download-file ?email=victim@example.com returns 401 without Bearer
     ✓ PASS: 2.3 download-file ?token=jwt in query returns 401 (must use Bearer header)
     ✓ PASS: 2.4 serve-test ?userToken=nv_buyer_xyz returns 401 without Bearer
     ✓ PASS: 2.5 serve-test ?email=victim@example.com returns 401 without Bearer
     ✓ PASS: 2.6 download-file rejects non-buyer token attempting query email spoofing with 403
     ✓ PASS: 2.7 serve-test rejects non-buyer token attempting query bypass with 403

   --- Suite 3: Cryptographic Forgery & Token Tampering Attacks ---
     ✓ PASS: 3.1 download-file with forged JWT (wrong secret) returns 401
     ✓ PASS: 3.2 serve-test with forged JWT (wrong secret) returns 401
     ✓ PASS: 3.3 download-file with tampered payload claims returns 401 (signature mismatch)
     ✓ PASS: 3.4 serve-test with tampered payload claims returns 401 (signature mismatch)
     ✓ PASS: 3.5 download-file with expired session token returns 401
     ✓ PASS: 3.6 serve-test with expired session token returns 401

   --- Suite 4: Authenticated Non-Buyer Privilege Escalation Attacks ---
     ✓ PASS: 4.1 download-file with registered non-buyer token returns 403 Forbidden
     ✓ PASS: 4.1b download-file 403 error message indicates enrollment required
     ✓ PASS: 4.2 serve-test with registered non-buyer token on unlocked test returns 403
     ✓ PASS: 4.3 serve-test with registered non-buyer token on future test returns 403

   --- Suite 5: Scheduled Future Test Date-Gating Leaks ---
     ✓ PASS: 5.1 Paying buyer requesting test-net-mock-2 (future 6 Nov 2026) returns 403
     ✓ PASS: 5.1b test-net-mock-2 response body has isLocked: true
     ✓ PASS: 5.1c test-net-mock-2 response error contains "Opens on [date]"
     ✓ PASS: 5.1d test-net-mock-2 response exposes formatted release date
     ✓ PASS: 5.2 Paying buyer requesting test-net-mock-3 (future 10 Nov 2026) returns 403
     ✓ PASS: 5.2b test-net-mock-3 error contains "Opens on"
     ✓ PASS: 5.3 Paying buyer requesting test-net-mock-4 (future 14 Nov 2026) returns 403
     ✓ PASS: 5.4 Paying buyer requesting test-future-mock (future 25 Nov 2026) returns 403
     ✓ PASS: 5.5 Paying buyer requesting test-grand-final-booster (future 5 Dec 2026) returns 403

   --- Suite 6: Legitimate Paying Buyer Access ---
     ✓ PASS: 6.1 Paying buyer requesting download-file returns 200 OK
     ✓ PASS: 6.1b download-file returns signed downloadUrl
     ✓ PASS: 6.1c download-file returns 600s (10 min) expiry window
     ✓ PASS: 6.2 Paying buyer requesting unlocked test-net-mock-1 returns 200 OK
     ✓ PASS: 6.2b unlocked test-net-mock-1 has isLocked: false
     ✓ PASS: 6.2c unlocked test-net-mock-1 returns runnerUrl
     ✓ PASS: 6.2d unlocked test-net-mock-1 returns test metadata payload
     ✓ PASS: 6.3 Paying buyer requesting unlocked test-unit-1 returns 200 OK
     ✓ PASS: 6.4 Author can preview unreleased test-net-mock-2 before public date (200 OK)

   --- Suite 7: Parameter Validation & Input Robustness ---
     ✓ PASS: 7.1 download-file without fileId parameter returns 400 Bad Request
     ✓ PASS: 7.2 serve-test without testId parameter returns 400 Bad Request
     ✓ PASS: 7.3 serve-test with non-existent testId returns 404 Not Found
     ✓ PASS: 7.4 download-file safely handles directory traversal string without leaking filesystem

   ================================================================================
                    ADVERSARIAL PENETRATION TEST SUMMARY SCORECARD                 
   ================================================================================
   Total Adversarial Checks : 48
   Passed Checks            : 48
   Failed Checks            : 0
   Pass Rate                : 100.0%
   --------------------------------------------------------------------------------
   ALL ADVERSARIAL PENETRATION CHECKS PASSED EMPIRICALLY! ZERO VULNERABILITIES FOUND.
   ```

5. **Store Acceptance Verification**:
   - Command: `node scripts/testNetVidyaStore.mjs`
   - Result: Exited with code 0; 33 / 33 tests passed.

---

## 2. Logic Chain

1. **Unauthenticated Access Defeated (Requirement R2, R4)**:
   - *Observation 1.1* shows `api/store/download-file.js` (lines 28–34) and `api/store/serve-test.js` (lines 123–129) extract tokens strictly from the `Authorization` header.
   - *Observation 1.2.4 (Tests 1.1–1.9)* empirically confirms that missing, empty, malformed, or random Bearer tokens result in HTTP 401 Unauthorized.
   - Therefore, unauthenticated anonymous visitors are completely blocked from accessing reading materials or test hall modules.

2. **Query Parameter Bypass Backdoors Eliminated (Requirement R4)**:
   - *Observation 1.1* confirms neither endpoint checks `req.query.userToken` or `req.query.email` for authentication.
   - *Observation 1.2.4 (Tests 2.1–2.7)* proves that legacy query strings (`?userToken=nv_buyer_xyz`, `?email=victim@example.com`, `?token=...`) fail with 401 Unauthorized without a valid Bearer header, and cannot override or elevate an authenticated non-buyer session (403 Forbidden).
   - Therefore, the legacy query backdoor vulnerability is verified completely closed.

3. **Cryptographic Integrity & Signature Verification**:
   - *Observation 1.1* verifies HMAC-SHA256 signature checking in `verifySessionToken`.
   - *Observation 1.2.4 (Tests 3.1–3.6)* demonstrates that forged tokens, spliced payload claims (altering `isBuyer: false` to `isBuyer: true`), and expired tokens fail signature validation and return 401 Unauthorized.
   - Therefore, privilege escalation via client-side token tampering is impossible.

4. **Non-Buyer Student Access Control (Requirement R2)**:
   - *Observation 1.1* reveals `isBuyer` check in both handlers.
   - *Observation 1.2.4 (Tests 4.1–4.3)* proves that registered students who have not completed payment (`is_buyer === false`) are rejected with HTTP 403 Forbidden across all paid PDF downloads and tests.
   - Therefore, student accounts without paid entitlement are strictly segregated from paid resources.

5. **Server-Side Date-Gating Enforcement (Requirement R4)**:
   - *Observation 1.1* confirms that `api/store/serve-test.js` compares `new Date()` against `testItem.releaseDate`.
   - *Observation 1.2.4 (Tests 5.1–5.5)* verifies that future tests (`test-net-mock-2` opening 6 Nov 2026, `test-net-mock-3` opening 10 Nov 2026, `test-future-mock` opening 25 Nov 2026, etc.) return HTTP 403 Forbidden with `{ isLocked: true, error: "Opens on [date]" }` even when requested by active paying buyers.
   - Conversely, Tests 6.1–6.3 confirm that unlocked tests (`test-net-mock-1`, `test-unit-1`) and reading files open immediately (HTTP 200 OK) for paying buyers with 10-minute temporary signed links and NTA CBT runner payloads.
   - Therefore, release dates are strictly enforced on the server and cannot be bypassed from the client.

6. **Build & Test Suite Stability**:
   - *Observation 1.2.1–1.2.3* shows `npm run typecheck`, `npm run build`, and `node scripts/e2e/run_all_tests.mjs` (359 assertions) all succeed with 0 failures.
   - Therefore, the codebase maintains pristine structural integrity.

---

## 3. Caveats

1. **Supabase Live Bucket Connectivity**:
   - When live Supabase credentials (`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`) are present, `api/store/download-file.js` utilizes `@supabase/supabase-js` storage API to generate signed URLs for `reading-files/${fileId}.pdf`.
   - In local and CI environments without live network credentials, it utilizes a cryptographic signed URL fallback format with identical 600-second expiration. Both code paths enforce identical 401 and 403 gating prior to URL generation.
2. **Author Preview Bypass**:
   - `api/store/serve-test.js` intentionally permits Dr. Rajnikant Dodiya's verified author emails (`AUTHOR_EMAILS`) to preview future tests before the scheduled date (verified in Test 6.4). This is an intended administrative capability.

---

## 4. Conclusion

**Verdict: APPROVE**

The paywall and content-gating infrastructure is robust, impervious to query bypasses, cryptographic token tampering, and privilege escalation attacks. All four required adversarial conditions—along with 44 additional penetration vectors—have been empirically probed and verified with a 100% pass rate:
- Direct requests without token return **401 Unauthorized**.
- Requests with non-buyer student token return **403 Forbidden**.
- Requests attempting legacy query bypasses (`?userToken=nv_buyer_xyz`, `?email=...`) return **401 Unauthorized**.
- Future scheduled tests (`test-net-mock-2` opening 6 Nov 2026) return **403 Forbidden** with `{ isLocked: true, error: "Opens on [date]" }`.
- TypeScript typecheck, Vite production build, and all 359 E2E test assertions pass cleanly with zero defects.

---

## 5. Verification Method

To independently reproduce the empirical findings in this report:

1. **Execute TypeScript Typecheck**:
   ```bash
   npm run typecheck
   ```
   *Expected*: Code 0, 0 errors.

2. **Execute Production Build**:
   ```bash
   npm run build
   ```
   *Expected*: Code 0, clean Vite output in `dist/`.

3. **Execute Full Adversarial Paywall Penetration Suite**:
   ```bash
   node scripts/adversarial_paywall_penetration.mjs
   ```
   *Expected*: 48 / 48 checks pass (100%).

4. **Execute Master E2E Test Runner**:
   ```bash
   node scripts/e2e/run_all_tests.mjs
   ```
   *Expected*: 359 / 359 assertions pass across Tiers 1–4.

5. **Inspect Implementation Files**:
   - `api/store/download-file.js` (Lines 28–51)
   - `api/store/serve-test.js` (Lines 123–173)
