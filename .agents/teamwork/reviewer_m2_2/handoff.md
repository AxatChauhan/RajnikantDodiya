# Milestone 2 Reviewer 2 Handoff Report: Access Control & Content Gating

**Agent**: reviewer_m2_2 (Reviewer 2: Access Control Reviewer)  
**Date**: 2026-11-04  
**Working Directory**: `.agents/teamwork/reviewer_m2_2`  
**Reference Documents**: `ORIGINAL_REQUEST.md`, `PROJECT.md`, `worker_m2_1/handoff.md`  
**Handoff Type**: Hard (Review Complete)  
**Verdict**: **APPROVE**  

---

## 1. Observation

1. **`api/store/download-file.js`**:
   - Lines 27–42: Enforces `Authorization: Bearer <token>` using `extractBearerToken(req)` and `verifySessionToken(token)`. Missing or invalid tokens return HTTP 401 Unauthorized (`{ success: false, error: 'Unauthorized: login required.' }` / `'Unauthorized: invalid or expired session token.'`).
   - Lines 44–51: Enforces buyer entitlement via `const isBuyer = payload.isBuyer || await isEmailBuyer(payload.email);`. Authenticated non-buyers return HTTP 403 Forbidden (`{ success: false, error: 'Access Denied: buyer enrollment required.' }`).
   - Lines 21–25: Consumes only `const { fileId } = req.query || {};`. Confirmed complete absence of `nv_buyer_` query backdoor and unverified email parameters.
   - Lines 53–74: Returns 600-second (10-minute) temporary signed download URL (`downloadUrl`, `expiresInSeconds: 600`).

2. **`api/store/serve-test.js`**:
   - Lines 122–146: Enforces Bearer token and active buyer entitlement, returning HTTP 401 for unauthenticated requests and HTTP 403 for non-buyers (`Access Denied: active pass required.`).
   - Lines 148–173: Evaluates `now < releaseTime && !isAuthor`. Future tests (e.g. `test-net-mock-2` releasing 6 Nov 2026, `test-net-mock-3` releasing 10 Nov 2026) return HTTP 403 Forbidden with `{ isLocked: true, error: "Opens on [formattedDate]", releaseDate, formattedReleaseDate }`.
   - Lines 116–120: Consumes only `const { testId } = req.query || {};`. Confirmed complete absence of `cleanEmail` parameter backdoor.

3. **`src/components/store/NetVidyaDashboard.tsx`**:
   - Lines 38–69: Tier 1 Unauthenticated lock screen displays `Lock` icon, "Student Dashboard is Restricted", and CTA buttons to sign in or enroll.
   - Lines 71–164: Tier 2 Authenticated non-buyer barrier displays candidate profile bar ("Registered Candidate • Enrollment Required", candidate name & email, Sign Out button), `ShieldAlert` icon, value breakdown, and 1-click CTA "Enroll Now for ₹{currentServerPrice}".
   - Lines 166–475: Tier 3 Active buyer dashboard displays verified passport badge ("Verified Scholar Pass Active", Order ID), tabs for NTA Test Hall and Reading Files, date-gated CBT test launching with Bearer token authentication, and signed PDF download generation.

4. **Independent Verification Execution**:
   - `npm run typecheck`: Exited with code 0 (zero errors).
   - `npm run build`: Bundled 1,559 modules cleanly into `dist/` in 51.52s, exiting with code 0.
   - `node scripts/testNetVidyaStore.mjs`: Executed 33 tests across 8 suites; 33 passed, 0 failed, exiting with code 0.
   - `node scripts/e2e/run_all_tests.mjs`: Executed all 4 tiers; 359 assertions executed, 359 passed, 0 failed, exiting with code 0.
   - `node scripts/adversarial_paywall_penetration.mjs`: Executed 48 empirical attack vectors; 48 passed, 0 failed, exiting with code 0.

---

## 2. Logic Chain

1. **R2 Requirement Alignment**:
   `ORIGINAL_REQUEST.md` mandates that non-buyers and logged-out visitors must be blocked from accessing paid files or tests, and tests scheduled for future dates must show "Opens on [date]" and be blocked server-side before that date.
2. **Server-Side Enforcement**:
   Observations 1.1, 1.2, 2.1, and 2.2 confirm that access control is enforced authoritatively on the server in `api/store/download-file.js` and `api/store/serve-test.js` using HMAC-SHA256 JWT tokens and database buyer checks, returning HTTP 401 for unauthenticated callers and HTTP 403 for non-buyers.
3. **Backdoor Elimination Verification**:
   Observations 1.3 and 2.3 prove that query parameter bypasses (`nv_buyer_` and unverified `cleanEmail`) were excised from request parsing. All 7 adversarial query-injection attacks in Suite 2 of `adversarial_paywall_penetration.mjs` failed to bypass security.
4. **Date Gating Integrity**:
   Observation 2.2 demonstrates that the server compares `now < releaseTime` dynamically using the server clock. Future scheduled tests return HTTP 403 Forbidden with `Opens on [date]`.
5. **UI Gating Robustness**:
   Observation 3 confirms that `NetVidyaDashboard.tsx` cleanly handles all three user states (unauthenticated, authenticated non-buyer, verified buyer) with appropriate messaging and 1-click upgrade paths.

---

## 3. Caveats

- **Stateless JWT vs Admin Instant Revocation**:
  In `download-file.js` and `serve-test.js`, buyer entitlement checks `payload.isBuyer || await isEmailBuyer(payload.email)`. If an active buyer's access is revoked by an admin mid-session, an active JWT token retains `payload.isBuyer === true` until expiration. In Milestone 5 (Admin Access Management), querying `isEmailBuyer` directly or verifying active token state will provide instantaneous revocation.
- **Optional `onOpenLogin` Prop**:
  In `NetVidyaStoreLayout.tsx:218`, `<NetVidyaDashboard />` is rendered without passing the optional `onOpenLogin` prop. While the top navigation bar retains the "Student Login" button, the lock screen card omits the secondary "Sign In to Account" button.

---

## 4. Conclusion

**Verdict: APPROVE**

Milestone 2 content gating and dashboard restrictions have been implemented with genuine cryptographic security, rigorous server-side authorization checks, date-gated CBT test delivery, and clean three-tier dashboard UX. Zero integrity violations or backdoors were found.

---

## 5. Verification Method

To independently reproduce and verify this assessment:

1. **Type Checking**:
   ```bash
   npm run typecheck
   ```
   *Expected*: Code 0, zero diagnostic errors.

2. **Production Build**:
   ```bash
   npm run build
   ```
   *Expected*: Code 0, clean build in `dist/`.

3. **Store Acceptance Verification**:
   ```bash
   node scripts/testNetVidyaStore.mjs
   ```
   *Expected*: 33 / 33 tests pass.

4. **Master E2E Test Suite**:
   ```bash
   node scripts/e2e/run_all_tests.mjs
   ```
   *Expected*: 359 / 359 assertions pass across Tiers 1–4.

5. **Empirical Adversarial Penetration Suite**:
   ```bash
   node scripts/adversarial_paywall_penetration.mjs
   ```
   *Expected*: 48 / 48 penetration tests pass.
