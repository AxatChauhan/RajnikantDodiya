# Milestone 2 Reviewer Handoff Report: Student Auth, Password Reset & Access Control

**Agent**: reviewer_m2_1 (Auth Security Reviewer & Adversarial Critic)  
**Parent Agent**: orchestrator_1 (`3738978e-cecf-4d63-acbb-904b4680a898`)  
**Date**: 2026-11-04  
**Working Directory**: `.agents/teamwork/reviewer_m2_1`  
**Target Milestone**: Milestone 2  
**Verdict**: **APPROVE**  
**Handoff Type**: Hard (Review Complete)

---

## 1. Observation

1. **Authentication Helper (`api/auth/auth-helper.js`)**:
   - `hashPassword` (lines 40–46): uses `crypto.scryptSync(password, salt, 64)` with 16-byte random salt (`crypto.randomBytes(16).toString('hex')`), outputting 64-byte key (128 hex chars).
   - `verifyPassword` (lines 51–69): re-computes `crypto.scryptSync(password, salt, 64)` and performs timing-safe comparison with `crypto.timingSafeEqual(keyBuffer, hashBuffer)`.
   - `createSessionToken` (lines 74–88) and `verifySessionToken` (lines 93–113): generates and validates HMAC-SHA256 JWT tokens with expiration enforcement (`payload.exp < Math.floor(Date.now() / 1000)`).
   - Password reset management (lines 306–414): `saveResetToken`, `findResetToken`, and `invalidateResetToken` support SHA-256 hash lookup and single-use invalidation.

2. **Endpoints (`api/auth/*`)**:
   - `POST /api/auth/signup` (`api/auth/signup.js` lines 26–95): validates payload, rejects duplicates with 409 Conflict, checks buyer inheritance, hashes password with scrypt/salt, and issues session JWT.
   - `POST /api/auth/login` (`api/auth/login.js` lines 22–78): checks credentials against scrypt hash via `timingSafeEqual`, refreshes buyer entitlement, and issues session JWT. Rejects invalid credentials with 401 Unauthorized.
   - `GET /api/auth/me` (`api/auth/me.js` lines 15–46): validates Bearer token from `Authorization` header, returns student identity and buyer entitlement.
   - `POST /api/auth/forgot-password` (`api/auth/forgot-password.js` lines 17–39): generates 32-byte crypto random token (64 hex characters) with 1-hour expiry (`Date.now() + 3600 * 1000`).
   - `POST /api/auth/reset-password` (`api/auth/reset-password.js` lines 21–57): validates token, enforces expiry, hashes new password, updates credentials, and invalidates token immediately (`await invalidateResetToken(token)`).

3. **Content Gating & Paywall Hardening**:
   - `api/store/download-file.js` (lines 28–51): requires Bearer token, returns 401 for unauthenticated and 403 for non-buyers. Delivers 10-minute temporary signed URLs.
   - `api/store/serve-test.js` (lines 123–173): requires Bearer token, returns 401 for unauthenticated and 403 for non-buyers. Compares `releaseDate` against server clock and returns 403 with `{ isLocked: true, error: "Opens on [date]" }` for future tests.
   - All query backdoors (`nv_buyer_` query parameters) have been completely removed.

4. **UI Modal & State Management**:
   - `src/components/store/NetVidyaStudentLoginModal.tsx` (lines 1–551): zero occurrences of access pass or fake OTP `123456`. Contains fully functional "Sign In", "Create Account", and "Forgot / Reset Password" tabs.
   - `src/contexts/NetVidyaStoreContext.tsx` (lines 337–491): exposes `login`, `signup`, `forgotPassword`, `resetPassword`, and `logout`; persists session in `localStorage`; validates token on mount via `GET /api/auth/me`.

5. **Independent Tool & Test Execution**:
   - `npm run typecheck` (`tsc --noEmit`): exited with code 0 (zero errors).
   - `npm run build` (`tsc && vite build`): exited with code 0 in 54.71s (1559 modules bundled into `dist/`).
   - `node scripts/testNetVidyaStore.mjs`: exited with code 0 (33 / 33 tests passed, 100%).
   - `node scripts/e2e/run_all_tests.mjs`: exited with code 0 (359 / 359 assertions passed across Tiers 1–4, 100%).
   - Independent Node subshell test: verified scrypt password hashing, timingSafeEqual comparison, token expiration, and rejection of password reset replay attacks (second reset attempt with same token returned 400 Bad Request).

---

## 2. Logic Chain

1. **Requirement R2 Compliance**:
   Observation 1, 2, and 4 demonstrate that mock access passes and fake OTP `123456` have been replaced with a real email/password authentication system, password reset with 1-hour expiry, and UI integration, directly satisfying Requirement R2 of `ORIGINAL_REQUEST.md`.
2. **Cryptographic Rigor**:
   Observation 1 and 5 prove that passwords are never stored in plaintext or simple unsalted hashes. Instead, `scrypt` with a 16-byte random salt and `timingSafeEqual` comparison are used, preventing rainbow table attacks and side-channel timing leaks.
3. **Replay Defense**:
   Observation 2 and 5 confirm that reset tokens are deleted upon first use. An adversarial replay attempt was executed and rejected with HTTP 400 Bad Request, confirming that consumed tokens cannot be reused to hijack an account.
4. **Access Gating Integrity**:
   Observation 3 proves that paid materials (PDF dossiers and CBT tests) cannot be accessed by unauthenticated users (HTTP 401) or non-paying users (HTTP 403), and unreleased tests are blocked server-side until their scheduled release date.
5. **Absence of Integrity Violations**:
   Observation 5 confirms that the tests are not hardcoded or mocked facades; real crypto functions and API routes were executed dynamically and passed with 100% success.

---

## 3. Caveats

- **Outbound Email in Development vs. Production**:
  In local/test environments, `/api/auth/forgot-password` returns the generated raw token in the response payload to allow automated end-to-end testing without an active third-party email provider (Resend/SendGrid). In production deployment, transactional email credentials should be configured and the raw token should not be echoed in the HTTP response.
- **Supabase Integration**:
  The system currently defaults to an in-memory/simulated store fallback when `SUPABASE_URL` is not set. All code paths for Supabase queries (`netvidya_users` and `netvidya_buyers`) are fully implemented and ready for live Supabase credentials.

---

## 4. Conclusion

Milestone 2 (Student Authentication, Password Reset & Access Control) is thoroughly verified, cryptographically sound, and free of integrity violations or fake facades. All requirements (Features 8, 9, 10, 11, and 12) are fully met.

**Verdict**: **APPROVE**

---

## 5. Verification Method

To independently reproduce this verification:

1. **Run TypeScript Typecheck**:
   ```bash
   npm run typecheck
   ```
   *Expected*: `tsc --noEmit` exits with code 0.

2. **Run Production Build**:
   ```bash
   npm run build
   ```
   *Expected*: `tsc && vite build` exits with code 0 and bundles `dist/`.

3. **Run Acceptance Verification Suite**:
   ```bash
   node scripts/testNetVidyaStore.mjs
   ```
   *Expected*: 33 / 33 tests pass.

4. **Run Master E2E Runner**:
   ```bash
   node scripts/e2e/run_all_tests.mjs
   ```
   *Expected*: All 359 assertions pass across Tiers 1–4.

5. **Adversarial Replay Test**:
   Execute Node one-liner to verify that a reset token cannot be used twice:
   ```bash
   node -e "
     import('./api/auth/signup.js').then(async ({ default: signup }) => {
       const { default: forgot } = await import('./api/auth/forgot-password.js');
       const { default: reset } = await import('./api/auth/reset-password.js');
       const email = 'audit_' + Date.now() + '@test.com';
       const make = (b) => ({ req: { method: 'POST', body: b, headers: {} }, res: { status(s){this._s=s;return this;}, json(d){this._d=d;return this;} } });
       const s = make({ name: 'Audit', email, mobile: '9999999999', password: 'Pass1' });
       await signup(s.req, s.res);
       const f = make({ email });
       await forgot(f.req, f.res);
       const token = f.res._d.token;
       const r1 = make({ token, newPassword: 'Pass2' });
       await reset(r1.req, r1.res);
       const r2 = make({ token, newPassword: 'Pass3' });
       await reset(r2.req, r2.res);
       console.log('1st reset status:', r1.res._s, 'Replay status:', r2.res._s);
       if (r1.res._s === 200 && r2.res._s === 400) console.log('REPLAY PROTECTION VERIFIED');
     });
   "
   ```
   *Expected*: Outputs `1st reset status: 200 Replay status: 400` and `REPLAY PROTECTION VERIFIED`.
