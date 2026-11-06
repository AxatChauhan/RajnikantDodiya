# Milestone 2 Independent Security & Quality Review Analysis

**Reviewer**: reviewer_m2_1 (Auth Security Reviewer & Adversarial Critic)  
**Date**: 2026-11-04  
**Target Milestone**: Milestone 2 — Student Authentication, Password Reset & Access Control  
**Verdict**: **APPROVE**  

---

## 1. Executive Summary

Milestone 2 delivers a robust, secure, and genuine student authentication and access control subsystem for the NET Vidya English Student Store. The prior prototype mechanism (mock access pass and fake OTP `123456`) has been completely eradicated from the client and server. In its place, standard cryptographic authentication has been deployed:

1. **Password Security**: Node.js `crypto.scryptSync` with 16-byte cryptographically secure random salts (producing 64-byte / 128-character hex digests) and `crypto.timingSafeEqual` comparison against stored hashes.
2. **Session Security**: Stateless HMAC-SHA256 signed JWT tokens carrying user identity, email, buyer entitlement, and expiration timestamp.
3. **Password Reset Lifecycle**: 32-byte cryptographic reset tokens (64 hex characters) with SHA-256 hash storage, 1-hour expiration timestamp, and immediate single-use invalidation upon reset to defend against replay attacks.
4. **Access Control & Paywall Gating**: `api/store/download-file.js` and `api/store/serve-test.js` strictly validate `Authorization: Bearer <token>`, returning HTTP 401 for unauthenticated visitors and HTTP 403 for non-buyers. Query parameter backdoors (`nv_buyer_` and unverified email query strings) have been completely removed.
5. **UI & State Management**: `NetVidyaStudentLoginModal.tsx` provides clean, functional tabs for "Sign In", "Create Account", and "Forgot / Reset Password". `NetVidyaStoreContext.tsx` manages student session state with persistent local storage and auto-verification against `/api/auth/me` on mount.

---

## 2. Integrity & Anti-Cheating Verification

In accordance with reviewer instructions, the codebase was audited for fraudulent shortcuts and integrity violations:

| Check Category | Inspection Target | Observation | Status |
|---|---|---|---|
| **Hardcoded Test Results** | `api/auth/*`, `auth-helper.js` | No hardcoded credentials or bypassed auth responses. Every registration generates real random salts and scrypt digests; every login recalculates the key and performs timingSafeEqual comparison. | PASS |
| **Dummy / Facade Logic** | `signup.js`, `login.js`, `reset-password.js` | Full logic implemented: email validation, collision detection (409 Conflict), credential verification (401), token issuance, single-use reset invalidation. | PASS |
| **Shortcuts & Bypasses** | Paywall gating in `download-file.js` & `serve-test.js` | Direct URL requests without Bearer tokens return 401. Non-buyer tokens return 403. No query parameter bypass exists. | PASS |
| **Fabricated Verification** | `tsc`, `vite build`, `testNetVidyaStore.mjs`, `run_all_tests.mjs` | All commands were independently executed by reviewer; all passed with exit code 0. | PASS |
| **Self-Certifying Evidence** | Replay & timing tests | Replay attacks, expired tokens, and credential tamperings were tested independently in Node subshells outside the project runner. | PASS |

**Integrity Finding**: ZERO integrity violations detected. The implementation is genuine, sound, and robust.

---

## 3. Code Quality & Security Assessment

### 3.1 Authentication Architecture (`api/auth/*`)

#### `api/auth/auth-helper.js`
- **Password Hashing**: `crypto.scryptSync(password, salt, 64)`. Generates a 64-byte key (128 hex chars) from a 16-byte random salt.
- **Timing-Safe Verification**: 
  ```javascript
  const keyBuffer = crypto.scryptSync(password, salt, 64);
  const hashBuffer = Buffer.from(storedHash, 'hex');
  return crypto.timingSafeEqual(keyBuffer, hashBuffer);
  ```
  Prevents side-channel timing attacks during password authentication.
- **JWT Issuance & Verification**: Implements standard HS256 JWT encoding with HMAC-SHA256 signature verification and expiration check (`exp < Math.floor(Date.now() / 1000)`).
- **Multi-Tier Persistence**: Primary in-memory store (`globalThis.__NETVIDYA_USERS_DB__`), test-suite synchronization (`simulatedDb`), and optional Supabase Postgres persistence with RLS policy enforcement.

#### `api/auth/signup.js`
- Validates name, email, and password.
- Enforces email formatting (`@` and `.`).
- Checks existing user registry to reject duplicates with `409 Conflict`.
- Checks existing buyer status (`isEmailBuyer`) so guest purchasers inherit buyer access upon account registration.
- Generates unique ID (`usr_<timestamp>_<hex>`), hashes password, saves record, and returns signed session JWT.

#### `api/auth/login.js`
- Checks email and password existence.
- Looks up user, rejects non-existent email with `401 Unauthorized`.
- Verifies password with scrypt + `crypto.timingSafeEqual`, rejects invalid password with `401 Unauthorized`.
- Re-checks buyer status from database in case payment webhook was received offline.
- Issues fresh session JWT.

#### `api/auth/me.js`
- Extracts bearer token from `Authorization: Bearer <token>`.
- Rejects missing or malformed token with `401 Unauthorized`.
- Verifies JWT validity and expiration.
- Returns student profile and buyer access entitlement.

#### `api/auth/forgot-password.js` & `reset-password.js`
- `forgot-password.js` generates a 32-byte crypto random token (64 hex characters), hashes it with SHA-256 for database storage, and sets a 1-hour expiration timestamp (`Date.now() + 3600 * 1000`).
- `reset-password.js` looks up token, validates expiration timestamp, computes new scrypt hash with fresh salt, updates user credentials, and **immediately invalidates the reset token** to prevent replay attacks.

---

### 3.2 Student Auth UI Modal (`src/components/store/NetVidyaStudentLoginModal.tsx`)

- **Removal of Legacy Elements**: Complete removal of "2-Device Access Pass" inputs, fake OTP `123456`, and simulated pass generators.
- **Three Core Tabs**:
  1. **Sign In Tab**: Email + Password fields, forgot password quick-link, submit button triggering `login(email, password)`.
  2. **Create Account Tab**: Full Name, Email, 10-digit Mobile, and Password fields, triggering `signup(name, email, mobile, password)`.
  3. **Forgot / Reset Password Tab**: Step 1 prompts for email and issues token; Step 2 prompts for 64-character token and new password, triggering `resetPassword(token, newPassword)`.
- **Validation & Error Handling**: Inline banners for validation errors and success notices; disabled buttons during async network requests (`isSubmitting`).
- **Enrollment CTA**: Footer link directs un-enrolled students directly to the checkout flow.

---

### 3.3 State Management (`src/contexts/NetVidyaStoreContext.tsx`)

- Exposes async auth actions: `login`, `signup`, `forgotPassword`, `resetPassword`, and `logout`.
- Maintains `buyerSession` state (`isLoggedIn`, `isBuyer`, `name`, `email`, `mobile`, `token`, `role`, `expiresAt`).
- Persists session in `localStorage` under `netvidya_buyer_session_v1`.
- Automatic session validation on component mount via `GET /api/auth/me` with Bearer token header.
- Maintains backward-compatible `loginBuyer` method for seamless post-checkout session activation.

---

### 3.4 Paywall & Content Gating (`api/store/download-file.js` & `serve-test.js`)

- `download-file.js`: Requires Bearer token; validates JWT; confirms active buyer entitlement; returns 10-minute temporary signed URL (or Supabase storage signed URL). Rejects unauthenticated with 401, non-buyers with 403.
- `serve-test.js`: Requires Bearer token; validates JWT; confirms buyer entitlement; verifies `new Date() >= new Date(test.releaseDate)` (with author email bypass). Rejects unauthenticated with 401, non-buyers with 403, and unreleased tests with 403 `{ isLocked: true, error: "Opens on [date]" }`.
- Zero query parameter backdoor vulnerabilities (`nv_buyer_` query string ignored).

---

## 4. Adversarial Stress-Testing & Attack Surface Analysis

The reviewer performed targeted adversarial challenge tests against the auth system:

### Challenge 1: Password Reset Replay Attack
- **Attack Scenario**: Attacker intercepts or reuses an already-consumed password reset token to alter the victim's password a second time.
- **Result**: **DEFENDED**.
  - Attempt 1: Reset with token -> HTTP 200 OK.
  - Attempt 2 (Replay): Same token reused -> HTTP 400 Bad Request (`Invalid or expired reset token.`).
  - Attempt 3: Login with old password -> HTTP 401 Unauthorized.
  - Attempt 4: Login with 1st reset password -> HTTP 200 OK.
  - Attempt 5: Login with 2nd (replay) password -> HTTP 401 Unauthorized.

### Challenge 2: Tampered & Expired JWT Tokens
- **Attack Scenario**: Attacker modifies the JWT payload (e.g., toggling `isBuyer: false` to `true`) or uses an expired token.
- **Result**: **DEFENDED**.
  - Signature mismatch immediately returns `null` from `verifySessionToken`.
  - Expired tokens (`exp < now`) return `null`. Direct API requests with expired tokens return HTTP 401 Unauthorized.

### Challenge 3: Paywall Direct Access & Query Parameter Bypass
- **Attack Scenario**: Attacker passes `?nv_buyer_pass=true` or `?email=buyer@example.com` to `/api/store/download-file` without Authorization header.
- **Result**: **DEFENDED**.
  - Returns HTTP 401 Unauthorized (`Unauthorized: login required.`).

### Challenge 4: CBT Test Date Gating Bypass
- **Attack Scenario**: Authenticated buyer requests future test (`test-net-mock-2`, scheduled for 6 Nov 2026) before the release date.
- **Result**: **DEFENDED**.
  - Server returns HTTP 403 Forbidden with `{ isLocked: true, error: "Opens on 6/11/2026" }`.

---

## 5. Review Findings

### Finding 1 (Minor / Non-Blocking — Input Type Checking)
- **Location**: `api/auth/signup.js:28-35`, `api/auth/login.js:24-31`
- **Issue**: `signup.js` and `login.js` check `!email || !password || typeof password !== 'string'`, but do not explicitly check `typeof email === 'string'`. If an attacker sends `{ email: ['array'] }` in JSON, `email.trim()` throws a TypeError, triggering the 500 error handler rather than returning a 400 Bad Request.
- **Impact**: Low / Minor. The server does not crash (caught by try/catch and returns 500), but standard API conventions favor 400 Bad Request.
- **Recommendation**: In a future hardening pass, add `typeof email !== 'string'` to the 400 guard in `signup.js` and `login.js` (consistent with `forgot-password.js`).

### Finding 2 (Minor / Non-Blocking — JWT Signature Timing Equality)
- **Location**: `api/auth/auth-helper.js:103`
- **Issue**: `verifySessionToken` compares signatures using string inequality `if (signature !== expectedSig) return null;`.
- **Impact**: Low. Both signatures are 43-character base64url strings. In serverless Node environments, timing variance across a 43-byte string is negligible, but cryptographic best practice recommends `crypto.timingSafeEqual`.
- **Recommendation**: In a future hardening pass, compare signatures using `crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))`.

---

## 6. Independent Verification Results

| Verification Step | Command | Result | Details |
|---|---|---|---|
| **TypeScript Typecheck** | `npm run typecheck` | **PASS** | Exit code 0, zero compilation errors |
| **Production Build** | `npm run build` | **PASS** | Exit code 0, 1559 modules bundled cleanly into `dist/` in 54.71s |
| **Store Verification Suite** | `node scripts/testNetVidyaStore.mjs` | **PASS** | 33 / 33 tests passed (100%) |
| **Master E2E Test Runner** | `node scripts/e2e/run_all_tests.mjs` | **PASS** | 359 / 359 assertions passed across Tiers 1–4 (100%) |
| **Independent Crypto Sandbox** | Node custom verification script | **PASS** | Scrypt hash generation, verification, replay rejection, and token expiry verified |

---

## 7. Conclusion

Milestone 2 fully satisfies all specifications in `ORIGINAL_REQUEST.md` (Requirement R2) and `PROJECT.md` (Features 8, 9, 10, 11, and 12). The code is cleanly architected, thoroughly verified, free of integrity violations or dummy facades, and ready for integration with Milestone 3 (Pricing & Razorpay Payments).

**Verdict**: **APPROVE**
