# Quality & Adversarial Review Report: Milestone 2 Access Control & Content Gating

**Reviewer**: Reviewer 2 (Access Control Reviewer - `reviewer_m2_2`)  
**Target Milestone**: Milestone 2 (Student Authentication, Password Reset & Access Control)  
**Date**: 2026-11-04  
**Working Directory**: `.agents/teamwork/reviewer_m2_2`  
**Verdict**: **APPROVE** with Minor Observations  

---

## 1. Executive Summary

An independent, rigorous quality and adversarial review was conducted on the Milestone 2 deliverables submitted by `worker_m2_1`. The evaluation focused specifically on access control, paywall enforcement, token validation, date-gating, backdoor elimination, and UI restriction states across `api/store/download-file.js`, `api/store/serve-test.js`, and `src/components/store/NetVidyaDashboard.tsx`.

All verification suites (`npm run typecheck`, `npm run build`, `node scripts/testNetVidyaStore.mjs`, and `node scripts/e2e/run_all_tests.mjs`) were independently executed and passed with 100% success (359/359 master E2E assertions, 33/33 store verification tests, zero type errors, clean Vite production build). An additional empirical suite of 48 adversarial penetration tests (`scripts/adversarial_paywall_penetration.mjs`) was executed with 100% pass rate.

No integrity violations, hardcoded test facades, or bypass shortcuts were detected. The access control logic is authentic, robust, and correctly implements the developer brief.

---

## 2. Review of Required Deliverables

### 2.1. `api/store/download-file.js`
- **Bearer Token Enforcement**: Line 28 extracts the token via `extractBearerToken(req)`. Rejects unauthenticated requests with HTTP 401 Unauthorized (`{ success: false, error: 'Unauthorized: login required.' }`).
- **Token Cryptographic Validation**: Validates the HMAC-SHA256 signature and `exp` claims using `verifySessionToken(token)`. Rejects malformed, tampered, expired, or wrong-secret tokens with HTTP 401 (`{ success: false, error: 'Unauthorized: invalid or expired session token.' }`).
- **Buyer Entitlement Check**: Validates `isBuyer` via `payload.isBuyer || await isEmailBuyer(payload.email)`. Rejects authenticated non-buyers with HTTP 403 Forbidden (`{ success: false, error: 'Access Denied: buyer enrollment required.' }`).
- **Elimination of Query Backdoors**: Thoroughly examined lines 1–95. Only `req.query.fileId` is consumed. The legacy `nv_buyer_` query parameter backdoor and unverified `cleanEmail` parameter checks have been completely removed.
- **Protected Signed URL Generation**: Returns a 600-second (10-minute) temporary signed URL (`downloadUrl`, `expiresInSeconds: 600`).

### 2.2. `api/store/serve-test.js`
- **Bearer Token & Buyer Verification**: Requires `Authorization: Bearer <token>`; rejects missing/invalid tokens with HTTP 401; rejects authenticated non-buyers with HTTP 403 Forbidden (`Access Denied: active pass required.`).
- **Date-Gating Enforcement**: 
  - Retrieves `releaseDate` from `TEST_HALL_SCHEDULE` for the specified `testId`.
  - Compares `now < releaseTime` against the server clock.
  - If scheduled for the future and user is not in `AUTHOR_EMAILS`, returns HTTP 403 Forbidden with `{ isLocked: true, error: "Opens on [date]", releaseDate, formattedReleaseDate }`.
  - Author preview bypass (`AUTHOR_EMAILS = ['rajnikantdodiya2@gmail.com', 'netvidyaenglish@gmail.com']`) operates exclusively for genuine store owners, with zero institutional emails present.
- **Elimination of Query Backdoors**: Only `req.query.testId` is extracted. No `cleanEmail`, `email`, or `userToken` query parameters are read.

### 2.3. `src/components/store/NetVidyaDashboard.tsx`
- **Tier 1: Unauthenticated Visitor Prompt**:
  - Displays lock icon and "Student Dashboard is Restricted".
  - Clarifies that Reading Files and Test Hall are reserved for enrolled candidates of the "GSET + UGC NET English Final Pack 2026".
  - Features 1-click CTA "Enroll Now (Early-Bird ₹{currentServerPrice})" and conditional "Sign In to Account" button when `onOpenLogin` callback is provided.
- **Tier 2: Authenticated Non-Buyer Barrier**:
  - Displays student profile header ("Welcome, {buyerSession.name}!", Account email, Sign Out button).
  - Displays locked barrier card with `ShieldAlert` icon, "Complete Your Enrollment to Unlock Content".
  - Highlights included value (Revision Dossiers, NTA Test Hall, Full Pass till Dec 2026).
  - Provides prominent 1-click CTA "Enroll Now for ₹{currentServerPrice}" that launches the checkout modal.
- **Tier 3: Active Paying Buyer Dashboard**:
  - Displays verified candidate header ("Verified Scholar Pass Active", Order ID, Valid through 31 Dec 2026).
  - Tab navigation between "NTA Test Hall ({tests.length} Modules)" and "Reading Files ({readingFiles.length} Dossiers)".
  - Test modules evaluate `now < releaseTime`:
    - Future scheduled tests render disabled "Opens on [date]" lock button.
    - Active tests render "Ready Now" and "Launch CBT Test" button.
    - Test launch sends `Authorization: Bearer ${buyerSession.token}` to `/api/store/serve-test` and handles locked/error responses.
  - Reading files render "Download PDF" button that authenticates via `Authorization: Bearer ${buyerSession.token}` to `/api/store/download-file`.

---

## 3. Adversarial Review & Attack Surface Analysis

### 3.1. Attack Vectors Tested

| Attack Vector | Input Scenario | Expected Behavior | Observed Result | Status |
|---|---|---|---|---|
| **AV-01**: Missing Auth Header | Direct GET `/api/store/download-file?fileId=unit-1` | HTTP 401 Unauthorized | HTTP 401 | PASS |
| **AV-02**: Missing Auth Header on Test | Direct GET `/api/store/serve-test?testId=test-net-mock-1` | HTTP 401 Unauthorized | HTTP 401 | PASS |
| **AV-03**: Basic Auth Injection | Header `Authorization: Basic dXNlcjpwYXNzd29yZA==` | HTTP 401 Unauthorized | HTTP 401 | PASS |
| **AV-04**: Whitespace Bearer Token | Header `Authorization: Bearer    ` | HTTP 401 Unauthorized | HTTP 401 | PASS |
| **AV-05**: Invalid Garbage Token | Header `Authorization: Bearer totally_invalid_token_xyz` | HTTP 401 Unauthorized | HTTP 401 | PASS |
| **AV-06**: Query Backdoor `?userToken=nv_buyer_` | Query param `?userToken=nv_buyer_xyz_backdoor` without Bearer | HTTP 401 Unauthorized | HTTP 401 | PASS |
| **AV-07**: Query Email Spoofing | Query param `?email=victim@example.com` without Bearer | HTTP 401 Unauthorized | HTTP 401 | PASS |
| **AV-08**: Query JWT in URL | Query param `?token=<valid_jwt>` without Bearer header | HTTP 401 Unauthorized | HTTP 401 | PASS |
| **AV-09**: Query Bypass with Non-Buyer Token | Non-buyer Bearer token + `?userToken=nv_buyer_pass_799` | HTTP 403 Forbidden | HTTP 403 | PASS |
| **AV-10**: Forged JWT Secret | Bearer token signed with rogue secret `attacker_rogue_secret_2026` | HTTP 401 Unauthorized | HTTP 401 | PASS |
| **AV-11**: Tampered Payload Claim | Valid token with modified `isBuyer: true` without valid HMAC signature | HTTP 401 Unauthorized | HTTP 401 | PASS |
| **AV-12**: Expired JWT Session | Validly signed token with `exp` in the past | HTTP 401 Unauthorized | HTTP 401 | PASS |
| **AV-13**: Non-Buyer Paid File Request | Authenticated non-buyer requesting `unit-1` PDF | HTTP 403 Forbidden | HTTP 403 | PASS |
| **AV-14**: Non-Buyer Test Hall Request | Authenticated non-buyer requesting unlocked `test-net-mock-1` | HTTP 403 Forbidden | HTTP 403 | PASS |
| **AV-15**: Future Test Date-Gating | Paying buyer requesting `test-net-mock-2` (releasing 6 Nov 2026) | HTTP 403 Forbidden with `Opens on [date]` | HTTP 403 | PASS |
| **AV-16**: Mid-Term Test Date-Gating | Paying buyer requesting `test-net-mock-3` (releasing 10 Nov 2026) | HTTP 403 Forbidden with `Opens on [date]` | HTTP 403 | PASS |
| **AV-17**: Author Preview Privilege | Store author requesting unreleased test | HTTP 200 OK | HTTP 200 | PASS |
| **AV-18**: Missing Parameter Robustness | GET `/api/store/download-file` with no `fileId` | HTTP 400 Bad Request | HTTP 400 | PASS |
| **AV-19**: Directory Traversal Attack | `fileId=../../../../etc/passwd` | Safely handled without leaking filesystem | Safe (No Leak) | PASS |

### 3.2. Integrity Violation Checklist

- **Hardcoded test outputs in source code**: None. Token validation uses genuine cryptographic signatures and `crypto.timingSafeEqual`; release dates use real JavaScript `Date` comparisons.
- **Dummy or facade implementations**: None. Real `scrypt` hashing with 16-byte random salts, real HMAC-SHA256 session tokens, and real Supabase client integration with graceful fallback.
- **Shortcuts bypassing the task**: None.
- **Fabricated verification outputs**: None. All commands were run directly in terminal and verified against actual process exit codes.
- **Self-certifying work**: None. Independently verified via 4 distinct test runners and static code inspection.

---

## 4. Findings & Observations

### [Minor] Finding 1: Optional `onOpenLogin` prop omitted in `NetVidyaStoreLayout.tsx`
- **Location**: `src/components/store/NetVidyaStoreLayout.tsx:218-222`
- **Description**: `<NetVidyaDashboard />` accepts an optional `onOpenLogin?: () => void` prop to trigger the sign-in modal from the unauthenticated lock screen. In `NetVidyaStoreLayout.tsx`, `onOpenLogin` was passed to `<NetVidyaStoreHome />` but omitted when rendering `<NetVidyaDashboard />`.
- **Impact**: When an unauthenticated visitor views the dashboard view, the "Sign In to Account" button does not render inside the lock card (only "Enroll Now" renders), though the top navbar still has the "Student Login" button.
- **Recommendation**: Pass `onOpenLogin={() => setIsLoginOpen(true)}` to `<NetVidyaDashboard />` in `NetVidyaStoreLayout.tsx`.

### [Minor] Finding 2: Token Revocation vs Stateless JWT Check
- **Location**: `api/store/download-file.js:45` & `api/store/serve-test.js:140`
- **Description**: The authorization condition is written as `const isBuyer = payload.isBuyer || await isEmailBuyer(payload.email);`. If an active buyer has their account revoked in the database (`is_active: false`), an existing unexpired JWT with `payload.isBuyer === true` will continue to evaluate to `true` until token expiration.
- **Impact**: Immediate administrative revocation would require either blacklisting or verifying active status via `await isEmailBuyer(payload.email)` directly without relying solely on `payload.isBuyer`.
- **Recommendation**: In Milestone 5 (Admin Access Management), consider checking `await isEmailBuyer(payload.email)` directly or validating an `is_active` claim to enforce instant revocation.

---

## 5. Conclusion

Milestone 2 access control and content gating implementation is robust, secure, and meets all criteria specified in `ORIGINAL_REQUEST.md` and `PROJECT.md`. The code is clean, free of backdoors, and passes all adversarial stress tests.

**Verdict: APPROVE**
