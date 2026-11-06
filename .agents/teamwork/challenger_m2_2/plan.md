# Adversarial Verification Plan: Paywall Penetration & Content-Gating (challenger_m2_2)

## Objective
Empirically stress-test, penetration-test, and verify the security posture of the paywall and content-gating endpoints (`api/store/download-file.js` and `api/store/serve-test.js`), as well as execute full build and test suites to assess Milestone 2 delivery.

---

## Phase 1: Environment & Baseline Verification
1. Run `npm run typecheck` (`tsc --noEmit`) to verify zero TypeScript compile errors.
2. Run `npm run build` (`vite build`) to verify clean production asset bundling.
3. Run `node scripts/e2e/run_all_tests.mjs` to establish baseline test status across Tiers 1-4.

---

## Phase 2: Static Code Audit & Threat Modeling
Inspect `api/store/download-file.js`, `api/store/serve-test.js`, and `api/auth/auth-helper.js` for:
- Missing authentication checks (fail-open vulnerabilities)
- Query parameter backdoors or fallback parameter leakage (`userToken`, `email`, `nv_buyer_`)
- Token signature verification and tamper detection
- Authorization check order (`extractBearerToken` -> `verifySessionToken` -> `isEmailBuyer` / `isBuyer`)
- Release date parsing and timezone handling (`testItem.releaseDate` vs `new Date()`)
- Author email bypass logic (`AUTHOR_EMAILS`)

---

## Phase 3: Adversarial Penetration Test Suite Construction & Execution
Create an independent adversarial test suite in `scripts/adversarial/paywall_penetration_test.mjs` directly testing the real endpoints against the following attack vectors:

### A. Missing / Anonymous Authentication Attacks (Expected: 401 Unauthorized)
1. `GET /api/store/download-file?fileId=unit-1` with no Authorization header.
2. `GET /api/store/serve-test?testId=test-net-mock-1` with no Authorization header.
3. Empty Authorization header (`Authorization: ""`).
4. Malformed Authorization scheme (`Authorization: Basic dXNlcjpwYXNz`).
5. Incomplete Bearer header (`Authorization: Bearer `).
6. Random garbage Bearer token (`Authorization: Bearer not_a_valid_token`).

### B. Token Tampering & Cryptographic Forgery Attacks (Expected: 401 Unauthorized)
7. Forged JWT with incorrect HMAC secret.
8. Tampered payload claim (altering `isBuyer: false` to `isBuyer: true` without re-signing).
9. Algorithm confusion / 'none' algorithm token.
10. Expired JWT session token (`exp` timestamp in the past).

### C. Query Parameter Backdoor & Bypass Attacks (Expected: 401 Unauthorized)
11. Direct request with legacy `?userToken=nv_buyer_xyz` without Bearer header.
12. Direct request with `?email=student@example.com` (known buyer) without Bearer header.
13. Direct request with `?token=<valid_buyer_jwt>` in query param instead of Bearer header.
14. Direct request with `?userToken=nv_buyer_pass_799` on `serve-test.js`.
15. Bearer token of non-buyer student + `?email=student@example.com` (spoofing query param).

### D. Authenticated Non-Buyer Privilege Escalation (Expected: 403 Forbidden)
16. Valid registered student token (`is_buyer === false`) requesting `download-file?fileId=unit-1`.
17. Valid registered student token (`is_buyer === false`) requesting unlocked `serve-test?testId=test-net-mock-1`.
18. Valid registered student token (`is_buyer === false`) requesting future `serve-test?testId=test-net-mock-2`.

### E. Scheduled Future Test Gating Attacks (Expected: 403 Forbidden with `{ error: "Opens on [date]" }`)
19. Valid paying buyer token requesting `serve-test?testId=test-net-mock-2` (scheduled 2026-11-06; current date 2026-11-04).
20. Valid paying buyer token requesting `serve-test?testId=test-net-mock-3` (scheduled 2026-11-10).
21. Valid paying buyer token requesting `serve-test?testId=test-future-mock` (scheduled 2026-11-25).
22. Future test response structure validation (`isLocked === true`, error contains release date formatted).

### F. Valid Paying Buyer Access & Normal Flow (Expected: 200 OK)
23. Valid paying buyer token requesting `download-file?fileId=unit-1` (returns signed download URL).
24. Valid paying buyer token requesting unlocked `serve-test?testId=test-net-mock-1` (scheduled 2026-11-01; returns test payload & runner URL).
25. Valid author email token requesting future test (author bypass verification).

### G. Input Boundary & Robustness Attacks
26. Missing `fileId` on `download-file` (Expected: 400 Bad Request).
27. Missing `testId` on `serve-test` (Expected: 400 Bad Request).
28. Non-existent `testId=test-non-existent-999` with buyer token (Expected: 404 Not Found).
29. Path traversal attempt in `fileId` (`../../etc/passwd` or `../private`).

---

## Phase 4: Assessment & Reporting
1. Document every test result, pass/fail state, and response payload.
2. Synthesize findings into `handoff.md` with:
   - Observations (verbatim command outputs, response codes, payloads)
   - Logic Chain
   - Caveats
   - Conclusion (VERDICT: APPROVE or REJECT)
   - Verification Method
3. Update `progress.md` and `BRIEFING.md`.
4. Send final message with verdict to orchestrator.
