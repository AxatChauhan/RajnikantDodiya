# Handoff Report: Authentication, Database, Access Control & Dashboard Survey

**Author**: Explorer 2 (Auth and Access Control Explorer)  
**Date**: 2026-11-04  
**Working Directory**: `.agents/teamwork/explorer_survey_2`  
**Reference Document**: `.agents/teamwork/ORIGINAL_REQUEST.md`  
**Handoff Type**: Hard (Investigation complete)  

---

## 1. Observation

Direct observations from the repository:

1. **Framework & Dependencies** (`package.json`):
   - React 18.2.0, Vite 5.1.4, TypeScript 5.3.3.
   - `@supabase/supabase-js: ^2.118.0`.
   - No ORM installed (no Prisma, no Drizzle).
   - Serverless functions run on Node.js in `api/` and `api/store/` routed via `vercel.json` rewrites (`/api/(.*)` -> `/api/$1`).

2. **Existing Access Pass Implementation**:
   - In `src/lib/credentialAuth.ts` (lines 40–178, 183–274) and `src/components/library-store/ScholarAuthModal.tsx`:
     The Atheneum academic site has a "2-Device Scholar Pass" system that computes a password hash in the browser via `crypto.subtle.digest('SHA-256')` with a static salt `SPU_HMPIETR_ATHENEUM_CREDENTIAL_SALT_2026` and stores session state in `localStorage` (`atheneum_scholar_session`).
   - In `src/contexts/NetVidyaStoreContext.tsx` (lines 330–348):
     The commercial store implements a mock session `loginBuyer`:
     ```ts
     const session: NetVidyaBuyerSession = {
       isLoggedIn: true,
       isBuyer: true,
       name: data.name,
       email: data.email.toLowerCase().trim(),
       mobile: data.mobile,
       orderId: data.orderId || `NV_${Date.now()}`,
       enrolledAt: new Date().toISOString(),
       token: `nv_buyer_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
       role: 'student'
     };
     ```
   - In `src/components/store/NetVidyaStudentLoginModal.tsx` (lines 58–82, 99, 107):
     Password mode does not verify passwords (accepts any $\ge 4$ characters) and logs anyone in as `isBuyer: true`. OTP mode uses a fixed hardcoded code `123456`:
     ```ts
     if (otpCode.trim() !== '123456' && otpCode.trim().length !== 6)
     ```

3. **Backend Access Gate Loopholes**:
   - In `api/store/download-file.js` (lines 55–57):
     ```js
     if (!isAuthorized && userToken && userToken.startsWith('nv_buyer_')) {
       isAuthorized = true;
     }
     ```
     Any request with query parameter `userToken=nv_buyer_xyz` bypasses authorization.
   - In `api/store/serve-test.js` (lines 115–118):
     ```js
     if (!isAuthorized && (userToken?.startsWith('nv_buyer_') || cleanEmail)) {
       isAuthorized = true;
     }
     ```
     Any request with a non-empty `email` parameter (`cleanEmail`) immediately sets `isAuthorized = true`.

4. **Existing Database Schemas**:
   - In `supabase/netvidya_store_schema.sql` (lines 24–37):
     Table `netvidya_buyers` has fields: `id`, `student_name`, `email`, `mobile`, `order_id`, `razorpay_payment_id`, `razorpay_order_id`, `amount_paid`, `payment_method`, `is_active`, `enrolled_at`, `expires_at`.
     It has **no** `password_hash`, `password_salt`, `reset_token_hash`, or `reset_token_expires_at`.
   - In `supabase/author_cms_schema.sql` and `supabase/schema.sql`:
     Legacy tables `students`, `orders`, `student_licenses`, `device_sessions`, `site_content`, `author_security`.

5. **Test Commands & Current Status**:
   - `npm run test:security` (`node scripts/securityAuditTests.mjs`) -> 61/61 PASSED (100%).
   - `node scripts/testNetVidyaStore.mjs` -> 33/33 PASSED (100%).
   - `npm run typecheck` (`tsc --noEmit`) -> 0 errors (clean exit).

---

## 2. Logic Chain

1. **Premise 1**: Requirement R2 explicitly requires:
   "Implement a student login and sign-up system using email and password, with password reset by email, replacing any access pass flow. Restrict 'My Dashboard' (Reading Files and Test Hall) to authenticated paying buyers only. Non-buyers and logged-out visitors must be blocked from accessing paid files or tests." (From Observation 1 & `ORIGINAL_REQUEST.md`).
2. **Premise 2**: Current store authentication in `NetVidyaStudentLoginModal.tsx` and `NetVidyaStoreContext.tsx` is completely mock-based (fake OTP `123456`, unvalidated passwords, synthetic `nv_buyer_` tokens in `localStorage`) (From Observation 2).
3. **Premise 3**: Current backend endpoints `api/store/download-file.js` and `api/store/serve-test.js` do not authenticate callers; they blindly accept query parameters `email` and `userToken` starting with `nv_buyer_`, allowing unauthorized visitors to access paid materials (From Observation 3).
4. **Premise 4**: The database schema `netvidya_buyers` tracks orders and entitlements (`amount_paid`, `is_active`, `enrolled_at`, `expires_at`), but lacks credentials and reset tokens. Furthermore, visitors who sign up before purchasing cannot be represented without adding an `is_buyer` flag and credential storage (From Observation 4).
5. **Deduction / Conclusion**:
   - An enhanced user model (`public.netvidya_users`) must be created with `password_hash`, `password_salt`, `is_buyer`, `is_active`, `enrolled_at`, `expires_at`, `reset_token_hash`, and `reset_token_expires_at`.
   - Real serverless auth endpoints (`/api/auth/signup`, `/api/auth/login`, `/api/auth/me`, `/api/auth/forgot-password`, `/api/auth/reset-password`) using Node.js built-in `crypto.scrypt` (or `crypto.pbkdf2` / pure JS `bcryptjs`) and HMAC-SHA256 signed JWTs must be introduced.
   - `download-file.js` and `serve-test.js` must be hardened to require a valid session bearer token, verifying that the authenticated user is an active buyer (`is_buyer = true`, `is_active = true`, `now <= expires_at`), returning **HTTP 401** for unauthenticated users and **HTTP 403** for non-buyers or scheduled tests before their release date.

---

## 3. Caveats

1. **Transactional Email Service**:
   The Vercel serverless environment needs an outbound email provider (e.g. Resend API, Brevo, SendGrid, or SMTP) to deliver password reset emails and purchase confirmations. In local/development testing environments without live API credentials, the endpoints must gracefully log reset URLs and return simulation responses so that testing is never blocked.
2. **Backward Compatibility**:
   The existing `public.netvidya_buyers` table is referenced in `api/store/verify-payment.js` and `api/store/razorpay-webhook.js`. To ensure zero regressions in existing tests and webhooks, payment handlers should synchronize both `netvidya_buyers` and `netvidya_users`.
3. **Academic Site vs NET Vidya Store Separation**:
   The Atheneum academic site (`/`, `Navbar.tsx`, `ScholarAuthModal.tsx`) contains research monograph passes with HMPIETR/SPU branding. As requested in R1/R2, all student store traffic (`store.rajnikantdodiya.com`, `/store`) must exclusively use the new NET Vidya email/password auth and brand, with zero college affiliations.

---

## 4. Conclusion

The architecture for Requirement R2 is well-defined, feasible, and directly supported by the existing stack:
1. **Database**: Introduce `public.netvidya_users` in Supabase to track student credentials, buyer status (`is_buyer`), access expiration (`expires_at = '2026-12-31T23:59:59+05:30'`), manual access flag (`is_active`), and password reset tokens (`reset_token_hash`, `reset_token_expires_at`).
2. **Authentication Engine**: Implement serverless auth endpoints in `api/store/auth.js` (or `/api/auth/`) using Node `crypto.scrypt` for password hashing and signed JWT bearer tokens.
3. **Password Reset by Email**: Implement `forgot-password` (32-byte cryptographic token, 1-hour expiry) and `reset-password` endpoints, paired with a student reset form in the frontend.
4. **Access Control Enforcement**: Overhaul `api/store/download-file.js` and `api/store/serve-test.js` to strictly enforce session bearer tokens, returning **401 Unauthorized** for unauthenticated requests, **403 Forbidden** for non-buyers, and **403 Forbidden** with `Opens on [date]` for scheduled future tests.
5. **Dashboard Experience**: Update `NetVidyaDashboard.tsx` and `NetVidyaStudentLoginModal.tsx` to display real login/signup tabs, gate content by server session, and allow 1-click enrollment for logged-in non-buyers.

---

## 5. Verification Method

To independently verify the architecture and subsequent implementation:

1. **Automated Store Verification**:
   ```bash
   node scripts/testNetVidyaStore.mjs
   ```
   *Expected*: All test suites pass. Update the test suite with new assertions for student signup, login, password reset token expiry, and 401/403 access control.

2. **Security Audit Suite**:
   ```bash
   npm run test:security
   ```
   *Expected*: 61/61 tests pass with 0 failures.

3. **TypeScript Typecheck**:
   ```bash
   npm run typecheck
   ```
   *Expected*: `tsc --noEmit` exits with 0 errors.

4. **HTTP Endpoint Verification**:
   - `GET /api/store/download-file?fileId=rf-theory-master` without token $\rightarrow$ HTTP 401 (`Unauthorized`).
   - `GET /api/store/download-file?fileId=rf-theory-master` with non-buyer token $\rightarrow$ HTTP 403 (`Forbidden`).
   - `GET /api/store/serve-test?testId=test-net-mock-2` with buyer token before release date $\rightarrow$ HTTP 403 (`Opens on 6 Nov 2026`).
   - `GET /api/store/serve-test?testId=test-net-mock-1` with buyer token $\rightarrow$ HTTP 200 with test payload.

5. **Invalidation Conditions**:
   - Any commit that reintroduces hardcoded OTPs (`123456`) or query-parameter email trusts invalidates access security.
   - Any endpoint permitting file downloads without verifying payment status invalidates R2.
