# Comprehensive Architecture & Survey Report: Authentication, Database, Access Control, and Student Dashboard

**Agent**: Explorer 2 (Auth and Access Control Explorer)  
**Date**: 2026-11-04  
**Working Directory**: `.agents/teamwork/explorer_survey_2`  
**Reference Document**: `.agents/teamwork/ORIGINAL_REQUEST.md`  

---

## Executive Summary

The repository `radiant-maxwell` is a high-performance **Vite + React 18 + TypeScript + Tailwind CSS** application, deployed on **Vercel** with Node.js Serverless Functions (`api/` and `api/store/`) and backed by **Supabase PostgreSQL**.

Our investigation identified two distinct authentication subsystems currently present in the codebase:
1. **The Academic / Atheneum "Scholar Pass" system** (`src/lib/credentialAuth.ts`, `src/lib/supabaseAuth.ts`, `useScholarSession.ts`, `ScholarAuthModal.tsx`), which implements a multi-device desktop/phone pass model with Web Crypto client-side hashing for Dr. Rajnikant Dodiya's personal research monographs and tests.
2. **The Commercial NET Vidya English Student Store** (`src/contexts/NetVidyaStoreContext.tsx`, `NetVidyaStoreLayout.tsx`, `NetVidyaStudentLoginModal.tsx`, `NetVidyaDashboard.tsx`, `api/store/*.js`), which currently uses an **in-memory/localStorage mock session** (`netvidya_buyer_session_v1`) with a fake OTP (`123456`) and unauthenticated password sign-in. Furthermore, backend endpoints `api/store/download-file.js` and `api/store/serve-test.js` contain critical security loopholes that permit unauthenticated query parameters and arbitrary `nv_buyer_` tokens to access paid materials.

To fulfill Requirement **R2** (and support **R3**, **R4**, **R5**) of `ORIGINAL_REQUEST.md`, the mock access pass system must be completely replaced with a **production-grade Student Authentication & Access Control Architecture**: email and password sign-up, secure password hashing (Node `crypto.scrypt` / `crypto.pbkdf2` or pure JS `bcryptjs`), JWT or secure bearer session management, cryptographic password reset by email, strict server-side 401/403 access control for "My Dashboard" (Reading Files and Test Hall), and user model enhancements tracking buyer status, purchase dates, 31 Dec 2026 access expiration, and admin grant/revoke flags.

---

## 1. Current Authentication & Access Pass Implementation Audit

### 1.1 Existing Atheneum Academic Scholar Pass System
- **Locations**:
  - `src/lib/credentialAuth.ts` (Lines 40–178, 183–274)
  - `src/lib/supabaseAuth.ts` (Lines 68–161)
  - `src/hooks/useScholarSession.ts` (Lines 23–67, 107–224)
  - `src/components/library-store/ScholarAuthModal.tsx`
  - `supabase/schema.sql` (Lines 8–52, 236–325)
- **Mechanism**:
  - Built for Dr. Rajnikant Dodiya's institutional academic portfolio at Sardar Patel University / HMPIETR.
  - Implements a "2-Device Scholar Pass" policy (1 Mobile Phone + 1 Laptop slot) stored in `localStorage` under `atheneum_scholar_session`.
  - Passwords are hash-computed on the client using the browser Web Crypto API with a hardcoded static salt: `SPU_HMPIETR_ATHENEUM_CREDENTIAL_SALT_2026`.
  - RPC stored procedures `register_scholar_credential` and `authenticate_scholar_credential` in `schema.sql` interface with the `public.students` table.
  - Hardcoded author bypass grants full monograph and test access to author emails (`rajnikantdodiya2@gmail.com`, `rajnikantdodiya@hmpenglish.com`, `rajnikant.dodiya@spuvvn.edu`).
- **Verdict for NET Vidya Store**:
  - The Atheneum pass system is tied to academic branding (HMPIETR/SPU) and monograph products, and its client-side salt hashing does not integrate with server-side API authorization. It must remain isolated to the academic CV/portfolio section or be completely decoupled from the commercial NET Vidya store.

### 1.2 NET Vidya Store Mock Pass Implementation
- **Locations**:
  - `src/contexts/NetVidyaStoreContext.tsx` (Lines 270–284, 330–362)
  - `src/components/store/NetVidyaStudentLoginModal.tsx` (Lines 40–124)
  - `src/components/store/NetVidyaDashboard.tsx` (Lines 37–60, 63–94)
  - `src/components/store/NetVidyaStoreLayout.tsx` (Lines 119–137)
- **Mechanism**:
  - Manages a client-side session state in `NetVidyaStoreContext.tsx`:
    ```ts
    export interface NetVidyaBuyerSession {
      isLoggedIn: boolean;
      isBuyer: boolean;
      name: string;
      email: string;
      mobile: string;
      orderId?: string;
      enrolledAt?: string;
      token?: string;
      role?: 'student' | 'author_admin';
    }
    ```
  - Stored in browser `localStorage` under `netvidya_buyer_session_v1`.
  - In `NetVidyaStudentLoginModal.tsx`:
    - **Password Mode** (Lines 40–83): Any email and password $\ge 4$ characters is accepted without any cryptographic verification. If the email is not in `buyersRegistry`, it still logs the user in with a synthetic order ID (`NV_SCHOLAR_...`) and sets `isBuyer: true`!
    - **OTP Mode** (Lines 85–124): Generates a fake on-screen code:
      ```ts
      if (otpCode.trim() !== '123456' && otpCode.trim().length !== 6)
      ```
      Entering `123456` authenticates any visitor as a verified buyer.
  - In `NetVidyaDashboard.tsx`:
    - Gating relies solely on client state: `if (!buyerSession.isLoggedIn)`.
    - Once logged in, the UI issues fetch requests to download files:
      `/api/store/download-file?fileId=${file.id}&email=${encodeURIComponent(buyerSession.email)}&userToken=${buyerSession.token || ''}`

### 1.3 Critical Vulnerabilities in Existing Backend APIs
- **`api/store/download-file.js`**:
  - Line 12: Accepts `email` and `userToken` directly from `req.query`.
  - Line 55–57:
    ```js
    // If still in dev / test mode without database connection, allow session with userToken
    if (!isAuthorized && userToken && userToken.startsWith('nv_buyer_')) {
      isAuthorized = true;
    }
    ```
    Any malicious actor passing `?userToken=nv_buyer_bypass` is immediately granted download authorization!
  - Lines 32–48: Checks `netvidya_buyers` using `cleanEmail` from query parameters without verifying whether the caller actually owns or has authenticated as that email. Any stranger who inputs a known buyer's email can download proprietary PDFs.
- **`api/store/serve-test.js`**:
  - Lines 115–118:
    ```js
    if (!isAuthorized && (userToken?.startsWith('nv_buyer_') || cleanEmail)) {
      isAuthorized = true;
    }
    ```
    Because `cleanEmail` is truthy for any non-empty email string, **every single visitor who provides any email string is authorized as a buyer!**

### 1.4 What Needs Replacement
1. **Remove mock password/OTP sign-in** in `NetVidyaStudentLoginModal.tsx`.
2. **Replace client-side session fabrication** in `NetVidyaStoreContext.tsx` with authentic server-verified session state.
3. **Eliminate query-parameter email trust and `nv_buyer_` token backdoors** in `download-file.js` and `serve-test.js`.
4. **Deploy real registration and login endpoints** with secure password hashing and verifiable authentication tokens.
5. **Implement an automated password reset flow by email** with time-limited cryptographic tokens.

---

## 2. Database and ORM Architecture

### 2.1 Database Infrastructure
- **Engine**: Supabase PostgreSQL (`https://ztqmrikjwmlawifjekdy.supabase.co`).
- **ORM / Query Builder**:
  - The repository does **NOT** use Prisma, Drizzle, or TypeORM. `package.json` contains no ORM dependencies.
  - Queries are executed using `@supabase/supabase-js` (`^2.118.0`).
  - Serverless functions in `api/store/` connect directly to Supabase via environment variables:
    - `VITE_SUPABASE_URL` / `SUPABASE_URL`
    - `SUPABASE_SERVICE_ROLE_KEY` (admin bypass for secure fulfillment)
    - `VITE_SUPABASE_ANON_KEY` / `SUPABASE_ANON_KEY`

### 2.2 Existing SQL Schemas
1. **`supabase/netvidya_store_schema.sql`**:
   - `public.netvidya_store_settings`: Controls product slug, product name, early bird price (₹799), standard price (₹999), cutoff date (`2026-11-10T23:59:59+05:30`), access expiry (`2026-12-31T23:59:59+05:30`), and support contacts.
   - `public.netvidya_buyers`:
     ```sql
     CREATE TABLE IF NOT EXISTS public.netvidya_buyers (
         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
         student_name TEXT NOT NULL,
         email TEXT NOT NULL UNIQUE,
         mobile TEXT NOT NULL,
         order_id TEXT NOT NULL UNIQUE,
         razorpay_payment_id TEXT,
         razorpay_order_id TEXT,
         amount_paid NUMERIC NOT NULL,
         payment_method TEXT DEFAULT 'razorpay', -- 'razorpay' | 'manual_upi' | 'admin_grant'
         is_active BOOLEAN DEFAULT true,
         enrolled_at TIMESTAMPTZ DEFAULT now(),
         expires_at TIMESTAMPTZ DEFAULT '2026-12-31 23:59:59+05:30'
     );
     ```
   - `public.netvidya_reading_files`: Catalog of private PDF revision dossiers.
   - `public.netvidya_tests`: Catalog of NTA test modules with scheduled `release_date`.
   - Row-Level Security (RLS) is enabled on all tables; raw public SELECT on `netvidya_buyers` is explicitly denied (`TO anon USING (false)`).
2. **`supabase/schema.sql`**:
   - Legacy Atheneum tables: `students`, `orders`, `student_licenses`, `device_sessions`.
   - `students` contains `password_hash`, but is keyed on `mobile TEXT UNIQUE`, not email-first, and contains SPU institutional logic.

### 2.3 Identified Database Gaps
- `netvidya_buyers` stores purchase and enrollment records, but has **no user authentication fields**:
  - No `password_hash`
  - No `password_salt`
  - No `reset_token_hash`
  - No `reset_token_expires_at`
  - No concept of a student who has signed up but has not yet purchased the pack (`is_buyer = false`).
- A student needs to be able to sign up with email and password *before* or *after* paying.

---

## 3. Student Login & Sign-Up System Design

### 3.1 Design Principles & Requirements
1. **Email & Password Authentication**:
   - Standard student credentials: `email` (primary unique identifier, case-insensitive), `password` ($\ge 8$ characters), `full_name`, and `mobile` (10-digit Indian mobile number).
2. **Password Hashing Standard**:
   - Must execute reliably within Vercel Serverless Functions (Node.js runtime) without native binary compilation failures (common with native C++ `bcrypt` or `argon2` node-gyp builds on serverless).
   - **Recommended Choice**: Node.js built-in `crypto.scrypt` or `crypto.pbkdf2` with cryptographically secure salts (`crypto.randomBytes(16)`), OR pure-JavaScript `bcryptjs`.
   - **Hashing Specification**:
     ```js
     import crypto from 'crypto';

     export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
       const derivedKey = crypto.scryptSync(password, salt, 64);
       return {
         salt,
         hash: derivedKey.toString('hex')
       };
     }

     export function verifyPassword(password, salt, storedHash) {
       const keyBuffer = crypto.scryptSync(password, salt, 64);
       const hashBuffer = Buffer.from(storedHash, 'hex');
       return crypto.timingSafeEqual(keyBuffer, hashBuffer);
     }
     ```
3. **Session & Token Management**:
   - Stateless **Signed JWT (JSON Web Token)** or cryptographically secure bearer token generated on login/sign-up:
     - Header: `{"alg": "HS256", "typ": "JWT"}`
     - Payload:
       ```json
       {
         "userId": "uuid",
         "email": "student@example.com",
         "name": "Aarav Patel",
         "isBuyer": true,
         "expiresAt": "2026-12-31T23:59:59+05:30",
         "iat": 1792350000,
         "exp": 1794942000
       }
       ```
     - Signature: `HMAC-SHA256(header + "." + payload, JWT_SECRET)`
   - Tokens can be transmitted via `Authorization: Bearer <token>` header or an `HttpOnly`, `SameSite=Strict` secure cookie.
   - Client stores token in `localStorage` or memory, restoring session on app mount by calling `GET /api/auth/me`.

### 3.2 Proposed API Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/signup` | Creates student account, checks if email already purchased, issues session token. |
| `POST` | `/api/auth/login` | Verifies email and password, checks active buyer status, issues session token. |
| `GET` | `/api/auth/me` | Validates session token, returns current student profile and buyer entitlement. |
| `POST` | `/api/auth/forgot-password` | Generates secure reset token, dispatches reset link via email. |
| `POST` | `/api/auth/reset-password` | Validates reset token and sets new password. |

---

## 4. Password Reset Flow by Email

```
[Student clicks "Forgot Password?"] 
               │
               ▼
   Enters Registered Email
               │
               ▼
[POST /api/auth/forgot-password]
               │
               ├── 1. Lookup user in `netvidya_users`
               ├── 2. Generate raw token: `crypto.randomBytes(32).toString('hex')`
               ├── 3. Compute token hash: `crypto.createHash('sha256').update(rawToken).digest('hex')`
               ├── 4. Set `reset_token_expires_at = NOW() + INTERVAL '1 hour'`
               └── 5. Dispatch email with reset link:
                      `https://store.rajnikantdodiya.com/?view=reset-password&token=<rawToken>&email=<email>`
               │
               ▼
[Student receives email & opens link]
               │
               ▼
Renders Reset Password Form (New Password + Confirm Password)
               │
               ▼
[POST /api/auth/reset-password]
               │
               ├── 1. Recompute SHA-256 of submitted `token`
               ├── 2. Verify token matches `reset_token_hash` and `NOW() < reset_token_expires_at`
               ├── 3. Hash new password via `scrypt` / `pbkdf2`
               ├── 4. Clear `reset_token_hash` and `reset_token_expires_at`
               └── 5. Return success and auto-login or redirect to sign-in modal
```

### 4.1 Email Dispatch Infrastructure
- **Production Integration**:
  - Transactional email delivery using HTTP API (e.g. **Resend API** via `https://api.resend.com/emails` or **SendGrid/Brevo**). Uses native Node `fetch` without heavy native dependencies.
  - Environment variables: `RESEND_API_KEY` or `SMTP_URL`.
- **Development / Test Fallback**:
  - When email service credentials are not configured in local development, the endpoint generates and logs the reset URL, returning a preview payload so that testing is never obstructed.

---

## 5. "My Dashboard" Access Restrictions: Reading Files & Test Hall

### 5.1 Enforcement Architecture
Content protection must be enforced **server-side**; client-side hiding is insufficient.

```
Incoming Request: GET /api/store/download-file?fileId=rf-theory-master
Headers: Authorization: Bearer <sessionToken>
                               │
                               ▼
               [Extract & Verify Session Token]
                               │
               ┌───────────────┴───────────────┐
            Invalid / Missing               Valid Token
               │                               │
               ▼                               ▼
       Return HTTP 401                 Fetch Student Record
       { error: "Unauthorized" }               │
                                       ┌───────┴───────┐
                                 Not a Buyer       Is Buyer
                                 (is_buyer=false)  (is_buyer=true)
                                       │               │
                                       ▼               ▼
                               Return HTTP 403   Check `is_active`
                               { error:          & Expiration
                                 "Forbidden" }         │
                                               ┌───────┴───────┐
                                           Revoked /       Active &
                                           Expired         Within Date
                                               │               │
                                               ▼               ▼
                                       Return HTTP 403   Issue 10-Min
                                                         Signed URL
                                                         (HTTP 200)
```

### 5.2 Serverless Endpoint Specifications

#### 1. Protected Reading Files (`api/store/download-file.js`)
- Requires valid `Authorization: Bearer <token>`.
- Decodes token, verifies student identity.
- Queries `netvidya_users` / `netvidya_buyers`:
  - `is_buyer === true`
  - `is_active === true` (not revoked by admin)
  - `new Date() <= new Date(expires_at)` (not expired)
- If checks fail: returns **HTTP 401** (unauthenticated) or **HTTP 403** (unauthorized non-buyer).
- If checks pass: generates a private storage signed download link valid for **10 minutes (600 seconds)**.

#### 2. Protected Test Hall (`api/store/serve-test.js`)
- Requires valid `Authorization: Bearer <token>`.
- Validates buyer status: returns **HTTP 401** or **HTTP 403** if non-buyer.
- Validates **Test Release Date**:
  - Compares server time against `test.release_date`.
  - If `now < test.release_date`: returns **HTTP 403 Forbidden** with `{ isLocked: true, error: "Test Scheduled: Opens on [formattedDate]" }`.
  - If `now >= test.release_date`: returns **HTTP 200 OK** with test payload and runner configuration.

#### 3. Public Free Sample Isolation (`NetVidyaFreeSample.tsx`)
- The Free Sample page and its assets (`free_demo_test`, `free_model_answers_pdf`, `free_mini_mock_pdf`) remain **100% public without login**.
- Direct API requests for sample files bypass auth checks and return sample data immediately.

---

## 6. User Model Enhancements

To support both pre-purchase student accounts and post-purchase entitlements, we propose establishing a dedicated `public.netvidya_users` table while maintaining backward compatibility with `public.netvidya_buyers`.

### 6.1 Proposed Enhanced Schema: `public.netvidya_users`
```sql
CREATE TABLE IF NOT EXISTS public.netvidya_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    
    -- Buyer Entitlement Fields
    is_buyer BOOLEAN DEFAULT false,
    order_id TEXT UNIQUE,
    razorpay_payment_id TEXT,
    razorpay_order_id TEXT,
    amount_paid NUMERIC DEFAULT 0,
    payment_method TEXT DEFAULT 'none', -- 'razorpay' | 'manual_upi' | 'admin_grant'
    enrolled_at TIMESTAMPTZ, -- Purchase date
    expires_at TIMESTAMPTZ DEFAULT '2026-12-31 23:59:59+05:30', -- Access expiration
    is_active BOOLEAN DEFAULT true, -- Manual access grant / revoke flag
    
    -- Password Reset Fields
    reset_token_hash TEXT,
    reset_token_expires_at TIMESTAMPTZ,
    
    -- Metadata
    role TEXT DEFAULT 'student', -- 'student' | 'admin'
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexing for high-throughput lookup
CREATE INDEX IF NOT EXISTS idx_netvidya_users_email ON public.netvidya_users (lower(email));
CREATE INDEX IF NOT EXISTS idx_netvidya_users_buyer ON public.netvidya_users (is_buyer, is_active);
CREATE INDEX IF NOT EXISTS idx_netvidya_users_reset ON public.netvidya_users (reset_token_hash);
```

### 6.2 Data Synchronization with Razorpay Payments & Admin Studio
1. **Razorpay Verification (`api/store/verify-payment.js`)**:
   - When signature is verified, upserts `netvidya_buyers` and updates `netvidya_users`:
     ```sql
     UPDATE public.netvidya_users
     SET is_buyer = true,
         order_id = $order_id,
         razorpay_payment_id = $payment_id,
         razorpay_order_id = $razorpay_order_id,
         amount_paid = $amount,
         payment_method = 'razorpay',
         is_active = true,
         enrolled_at = now(),
         expires_at = '2026-12-31 23:59:59+05:30'
     WHERE lower(email) = lower($email);
     ```
   - If the user does not exist yet (guest checkout), a placeholder user or buyer record is stored so that when they sign up with that email, their account is instantly activated as a paid buyer.
2. **Razorpay Webhook (`api/store/razorpay-webhook.js`)**:
   - Processes `payment.captured` event and activates buyer entitlements asynchronously.
3. **Dr. Rajnikant Admin Panel (`NetVidyaAdminModal.tsx`)**:
   - **Manual Access Grant**: Inserts or updates user with `is_buyer = true`, `is_active = true`, `payment_method = 'manual_upi'`.
   - **Revoke Access**: Toggles `is_active = false`. Immediately invalidates access to download files and tests.
   - **Restore Access**: Toggles `is_active = true`.
   - **Resend Confirmation Email**: Triggers purchase confirmation email with dashboard link.

---

## 7. Implementation Roadmap & File Impact Matrix

| File Path | Role | Action Required |
|---|---|---|
| `supabase/netvidya_store_schema.sql` | DB Schema | Add `netvidya_users` table with password hash, salt, reset token, and buyer entitlement tracking. |
| `api/store/auth.js` (or `/api/auth/*.js`) | Backend Auth | Implement `signup`, `login`, `me`, `forgot-password`, `reset-password` endpoints using Node `crypto`. |
| `api/store/download-file.js` | Content Delivery | Replace query-param email check and `nv_buyer_` backdoor with JWT bearer token verification, returning 401/403. |
| `api/store/serve-test.js` | CBT Test Delivery | Require JWT bearer token, verify buyer status, enforce date gating against server clock, returning 401/403. |
| `src/contexts/NetVidyaStoreContext.tsx` | Client State | Replace local mock session with real session state connected to `/api/auth/me`, login, signup, logout. |
| `src/components/store/NetVidyaStudentLoginModal.tsx` | UI Modal | Add tabbed Sign In / Sign Up form, remove fake OTP `123456`, add "Forgot Password?" trigger. |
| `src/components/store/NetVidyaResetPasswordModal.tsx` (or view) | UI Modal | Create dedicated reset password interface handling URL token and new password submission. |
| `src/components/store/NetVidyaDashboard.tsx` | UI Dashboard | Differentiate logged-out visitor (Login CTA) vs logged-in non-buyer (Buy CTA) vs active buyer (content unlocked). |
| `src/components/store/NetVidyaAdminModal.tsx` | Admin Panel | Wire manual grant/revoke and resend confirmation email actions to persistent database. |

---

## 8. Verification Strategy

1. **Unit & API Testing**:
   - Extend `scripts/testNetVidyaStore.mjs` with comprehensive test suites for:
     - Student signup with password hashing.
     - Student login with correct vs incorrect credentials.
     - Forgot password token generation and expiry validation.
     - Server-side 401 response for unauthenticated requests to `/api/store/download-file` and `/api/store/serve-test`.
     - Server-side 403 response for logged-in non-buyers.
     - Server-side 403 response for tests scheduled in the future.
     - Full 200 response for authorized buyers on released content.
2. **Type Safety & Build**:
   - Run `npm run typecheck` (`tsc --noEmit`) to verify 0 type errors.
   - Run `npm run build` (`vite build`) to verify clean bundle generation.
