# Milestone 2: Detailed Changes Record

**Worker**: worker_m2_1 (Auth & Access Control Worker)  
**Date**: 2026-11-04  
**Scope**: Features #8 to #12 (Milestone 2)

---

## 1. Database Schema (`supabase/netvidya_store_schema.sql`)
- Added table `public.netvidya_users` with fields:
  - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `name TEXT NOT NULL`
  - `email TEXT NOT NULL UNIQUE`
  - `mobile TEXT NOT NULL`
  - `password_hash TEXT NOT NULL`
  - `password_salt TEXT NOT NULL`
  - `is_buyer BOOLEAN DEFAULT false`
  - `order_id TEXT UNIQUE`
  - `razorpay_payment_id TEXT`
  - `razorpay_order_id TEXT`
  - `amount_paid NUMERIC DEFAULT 0`
  - `payment_method TEXT DEFAULT 'none'`
  - `is_active BOOLEAN DEFAULT true`
  - `enrolled_at TIMESTAMPTZ`
  - `expires_at TIMESTAMPTZ DEFAULT '2026-12-31 23:59:59+05:30'`
  - `reset_token_hash TEXT`
  - `reset_token_expires_at TIMESTAMPTZ`
  - `role TEXT DEFAULT 'student'`
  - `created_at TIMESTAMPTZ DEFAULT now()`
  - `updated_at TIMESTAMPTZ DEFAULT now()`
- Added indices:
  - `idx_netvidya_users_email` ON `lower(email)`
  - `idx_netvidya_users_buyer` ON `(is_buyer, is_active)`
  - `idx_netvidya_users_reset` ON `(reset_token_hash)`
- Enabled Row-Level Security (RLS) on `public.netvidya_users` with policy "Deny Public Read NetVidya Users" to protect credentials from anonymous access.

---

## 2. Authentication Helper (`api/auth/auth-helper.js`)
- Created unified auth engine:
  - `hashPassword`: Node `crypto.scryptSync` with 16-byte random salt.
  - `verifyPassword`: `crypto.timingSafeEqual` with scrypt and SHA-256 fallback.
  - `createSessionToken`: HMAC-SHA256 signed JWT (`HS256`) with standard claims (`id`, `name`, `email`, `mobile`, `isBuyer`, `expiresAt`, `iat`, `exp`).
  - `verifySessionToken`: verifies signature and expiration.
  - `extractBearerToken`: extracts Bearer token from `Authorization` header.
  - `findUserByEmail`, `saveUser`, `isEmailBuyer`: dual persistence across Supabase Postgres and in-memory/simulated database.
  - `saveResetToken`, `findResetToken`, `invalidateResetToken`: 32-byte secure random reset tokens with 1-hour expiration and replay attack prevention.

---

## 3. Serverless Auth Endpoints (`api/auth/*`)
- **`POST /api/auth/signup` (`api/auth/signup.js`)**:
  - Validates `name`, `email`, `password`, and email syntax.
  - Checks if account exists; returns 409 Conflict if duplicate.
  - Hashes password using scrypt; detects pre-existing buyer enrollment.
  - Returns 200 OK with signed JWT token and student profile.
- **`POST /api/auth/login` (`api/auth/login.js`)**:
  - Validates credentials using `verifyPassword` with timing-safe comparison.
  - Returns 401 Unauthorized for invalid email or password.
  - Refreshes buyer status and returns 200 OK with signed JWT token.
- **`GET /api/auth/me` (`api/auth/me.js`)**:
  - Validates `Authorization: Bearer <token>` header.
  - Returns 401 Unauthorized if missing, malformed, or expired.
  - Returns 200 OK with authenticated user profile and buyer entitlement.
- **`POST /api/auth/forgot-password` (`api/auth/forgot-password.js`)**:
  - Generates 32-byte secure random token (64 hex characters) with 1-hour expiry.
  - Stores hash and returns 200 OK with confirmation message and token.
- **`POST /api/auth/reset-password` (`api/auth/reset-password.js`)**:
  - Validates token against storage; checks expiry timestamp.
  - Hashes new password; updates user record; invalidates token immediately to prevent replay attacks.
  - Returns 200 OK.

---

## 4. Protected Content Gating (`api/store/download-file.js` & `api/store/serve-test.js`)
- **`api/store/download-file.js`**:
  - Enforces `Authorization: Bearer <token>` header (returns 401 Unauthorized if missing/invalid).
  - Verifies buyer status (returns 403 Forbidden if user is not an active paying buyer).
  - Issues 10-minute temporary signed download link for authorized buyers.
  - **Completely removed backdoors**: deleted `cleanEmail` query trust and `userToken.startsWith('nv_buyer_')`.
- **`api/store/serve-test.js`**:
  - Enforces `Authorization: Bearer <token>` header (returns 401 Unauthorized if missing/invalid).
  - Verifies buyer status (returns 403 Forbidden if not an active buyer).
  - Enforces test release date against server clock: returns 403 Forbidden with `{ isLocked: true, error: "Opens on [formattedDate]" }` if accessed before release.
  - **Completely removed backdoors**: deleted `(userToken?.startsWith('nv_buyer_') || cleanEmail)` parameter checks.

---

## 5. Store Context (`src/contexts/NetVidyaStoreContext.tsx`)
- Added real authentication methods:
  - `login(email, password)`
  - `signup(name, email, mobile, password)`
  - `forgotPassword(email)`
  - `resetPassword(token, newPassword)`
  - `logout()`
- Maintained backward-compatible `loginBuyer` with support for server-issued tokens.
- Added session refresh effect on mount calling `/api/auth/me` with bearer token.
- Replaced institutional email address in sample registry.

---

## 6. Student Login UI Modal (`src/components/store/NetVidyaStudentLoginModal.tsx`)
- Completely removed "2-Device Access Pass" and mock OTP `123456`.
- Implemented three distinct tabs:
  1. **Sign In**: Email & Password fields with error handling, loading state, and link to forgot password.
  2. **Create Account**: Full Name, Email, 10-digit Mobile, and Password fields with validation.
  3. **Forgot / Reset Password**: Email input for reset token dispatch, and token + new password input with instant feedback.
- Clean responsive layout with zero university logos or affiliations.

---

## 7. Dashboard Gating & Barrier (`src/components/store/NetVidyaDashboard.tsx`)
- Three-tier access control:
  1. **Unauthenticated visitor**: Friendly lock screen explaining access restrictions with "Sign In" and "Enroll Now" buttons.
  2. **Authenticated non-buyer**: Profile passport bar with "Registered Candidate • Free Tier", clear explanation that dashboard is reserved for enrolled candidates of "GSET + UGC NET English Final Pack 2026", and 1-click "Enroll Now" CTA.
  3. **Authenticated paying buyer**: Full access to Reading Files and Test Hall.
- File downloads send `Authorization: Bearer <token>` in request headers.
- Test launches verify release date and send Bearer token.
