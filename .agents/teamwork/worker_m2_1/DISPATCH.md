## 2026-11-04T07:47:51Z
You are Worker 2: Auth and Access Control Worker (worker_m2_1).
Your Working Directory is: c:\Users\DELL\Documents\antigravity\radiant-maxwell\.agents\teamwork\worker_m2_1
Your original request path is: c:\Users\DELL\Documents\antigravity\radiant-maxwell\.agents\teamwork\ORIGINAL_REQUEST.md
Your master project specification is: c:\Users\DELL\Documents\antigravity\radiant-maxwell\.agents\teamwork\orchestrator_1\PROJECT.md
Your milestone scope and explorer findings are at: c:\Users\DELL\Documents\antigravity\radiant-maxwell\.agents\teamwork\explorer_survey_2\handoff.md and analysis.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

You MUST read ORIGINAL_REQUEST.md, PROJECT.md, and explorer_survey_2/handoff.md before making any changes.

Your assigned Milestone is Milestone 2: Student Authentication, Password Reset & Access Control (Features #8 to #12).

Files exclusively owned by you:
- `api/auth/*` (`signup.js`, `login.js`, `me.js`, `forgot-password.js`, `reset-password.js`)
- `api/store/download-file.js` (gating & authorization logic)
- `api/store/serve-test.js` (gating & authorization logic)
- `src/components/store/NetVidyaStudentLoginModal.tsx`
- `src/components/store/NetVidyaDashboard.tsx`
- `src/contexts/NetVidyaStoreContext.tsx`
- `supabase/netvidya_store_schema.sql` (schema updates for `netvidya_users`)

Detailed implementation requirements:
1. Student DB Schema (`public.netvidya_users`):
   - Update schema SQL and ensure serverless handlers support `netvidya_users` with fields: `id`, `name`, `email`, `mobile`, `password_hash`, `password_salt`, `is_buyer`, `is_active`, `enrolled_at`, `expires_at`, `reset_token_hash`, `reset_token_expires_at`, `created_at`, `updated_at`.
   - Provide robust fallback persistence (e.g. data store in `api/auth/` or shared memory/file) so the endpoints work reliably both locally in CI/test runs and against Supabase.
2. Serverless Auth Endpoints (`api/auth/`):
   - Implement `POST /api/auth/signup`: validates email, name, password; uses Node `crypto.scrypt` (or PBKDF2) to hash passwords; generates HMAC-SHA256 signed session token/JWT; returns user profile.
   - Implement `POST /api/auth/login`: validates credentials against hash; returns signed token and user profile.
   - Implement `GET /api/auth/me`: validates `Authorization: Bearer <token>`; returns authenticated user profile.
   - Implement `POST /api/auth/forgot-password`: generates 32-byte secure random reset token (1-hour expiry); stores hash; logs/dispatches reset URL.
   - Implement `POST /api/auth/reset-password`: validates token; checks expiry; hashes new password; updates record.
3. Replace Mock Access Pass Flow:
   - In `NetVidyaStudentLoginModal.tsx`, completely remove the "2-Device Access Pass" and fake OTP `123456`.
   - Implement real UI tabs: "Login", "Sign Up", and "Forgot Password" (and password reset form).
   - In `NetVidyaStoreContext.tsx`, update auth methods (`login`, `signup`, `forgotPassword`, `resetPassword`, `logout`) to call the real API endpoints and persist the authenticated user session in storage.
4. Content Gating & Paywall Hardening:
   - In `api/store/download-file.js` and `api/store/serve-test.js`:
     * Strictly validate session token from `Authorization: Bearer <token>` (or cookie/header).
     * Return HTTP 401 Unauthorized if missing or invalid token.
     * Return HTTP 403 Forbidden if user is not an active paying buyer (`is_buyer !== true` or `is_active !== true`).
     * In `serve-test.js`: Check test release date. If `now < releaseDate`, return HTTP 403 Forbidden with `{ error: "Opens on [releaseDate]" }`.
     * Completely remove query backdoors: delete `userToken.startsWith('nv_buyer_')` and `cleanEmail` parameter checks!
5. Dashboard Gating:
   - In `NetVidyaDashboard.tsx`: Restrict Reading Files and Test Hall to authenticated paying buyers.
   - Unauthenticated visitors see a login prompt.
   - Authenticated non-buyers see a friendly locked view explaining that dashboard access is reserved for enrolled candidates of "GSET + UGC NET English Final Pack 2026", with a 1-click "Enroll Now" button.
   - Direct file downloads and CBT test launching must pass the bearer token in headers.

Verification requirements:
- Run `npm run typecheck` (`tsc --noEmit`)
- Run `npm run build`
- Run `node scripts/testNetVidyaStore.mjs`
- Run `node scripts/e2e/run_all_tests.mjs` (All 359 assertions must PASS)


## 2026-11-04T09:40:27Z
**Context**: Resuming Milestone 2 Implementation after system restart
**Content**: The dev server was restarted and local server is active on http://localhost:5173. Please resume your work on Milestone 2:
1. Finish gating and non-buyer barrier in `NetVidyaDashboard.tsx`
2. Run your verification tests: `npm run typecheck`, `npm run build`, `node scripts/testNetVidyaStore.mjs`, and `node scripts/e2e/run_all_tests.mjs`
3. Generate `changes.md` and `handoff.md` in your working directory and send a completion message with your results.
**Action**: Resume execution and deliver handoff when done.
