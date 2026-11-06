# Project: NET Vidya English Student Store (store.rajnikantdodiya.com)

## Architecture
- **Frontend**: Vite 5.1.4 + React 18.2.0 + TypeScript 5.3.3 + Tailwind CSS 3.4.1. Commercial store mounted at `/store` (or `store.*` host) rendering `<NetVidyaStoreLayout />`.
- **Backend / Serverless**: Node.js Vercel serverless functions in `api/store/` and `api/auth/` handling authentication, server-side pricing, Razorpay checkout, webhook ingestion, protected file streaming, and administrative operations.
- **Database & Storage**: Supabase Postgres (`public.netvidya_users`, `public.netvidya_buyers`, `public.netvidya_store_settings`, `public.netvidya_reading_files`, `public.netvidya_tests`) and private asset storage.
- **Email Dispatch**: Transactional email module (`api/store/email.js`) supporting purchase confirmation and password reset links with local/dev fallback logging.

## Feature Inventory
Every feature from the Survey phase and Developer Brief is inventoried and assigned to a milestone:

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Professional Typography | Replace `Newsreader` and global `!important` serif overrides with clean `Inter` sans-serif font stack; restore `.font-mono` tabular numbers | M1 | Brief R1 |
| 2 | Hero Branding & Photo | Display Dr. Rajnikant Dodiya's verified portrait (`public/dr-rajnikant-dodiya.jpg`) prominently in the hero section alongside credentials | M1 | Brief R1 |
| 3 | Remove Affiliations | Eliminate all occurrences/logos of HMPIETR and Sardar Patel University (loading fallback, meta tags, API author emails, footer backlinks) | M1 | Brief R1 |
| 4 | Prohibit Strike-Through Price | Remove fake MRP / strike-through price (`₹1,499`) from hero pricing card and all pages | M1 | Brief R6 |
| 5 | Public Free Sample Page | Public page accessible without login offering real downloadable PDFs (Mini Mock & Answers) and standalone NTA demo test HTML with Buy CTA | M1 | Brief R4 |
| 6 | Legal, Policy & Footer Line | Mandatory footer line: "Sold by NET Vidya (proprietor: Nilam Dodiya). Content by Dr Rajnikant Dodiya.", NET Vidya contact info, 5 policy tabs | M1 | Brief R6 |
| 7 | Mobile Responsiveness | Responsively format top header Buy button on `<380px` viewports and optimize NTA test palette layout | M1 | Brief AC |
| 8 | Student DB Schema | Create `public.netvidya_users` with password hashing, buyer status, activation flag, reset tokens, and expiration timestamp | M2 | Brief R2 |
| 9 | Student Registration & Login | Email and password authentication endpoints (`/api/auth/signup`, `/api/auth/login`, `/api/auth/me`) using cryptographic hashing and JWT session tokens | M2 | Brief R2 |
| 10 | Password Reset by Email | Endpoints `/api/auth/forgot-password` and `/api/auth/reset-password` with 32-byte cryptographic token, 1-hour expiry, and UI reset flow | M2 | Brief R2 |
| 11 | Student Auth UI Modal | Replace access passes and fake OTP `123456` in `NetVidyaStudentLoginModal.tsx` and `NetVidyaStoreContext.tsx` with email/password auth | M2 | Brief R2 |
| 12 | Dashboard & Access Gating | Server-side bearer token validation in API routes returning 401 for unauthenticated and 403 for non-buyers; restrict "My Dashboard" to buyers | M2 | Brief R2 |
| 13 | Single Bundle Offering | Exclusively sell "GSET + UGC NET English Final Pack 2026" with access until 31 Dec 2026 | M3 | Brief R3 |
| 14 | Server-Side Pricing Engine | Enforce ₹799 before 10 Nov 2026 23:59:59 IST and ₹999 afterward on server; reject client-supplied prices; sync order creation with settings | M3 | Brief R3 |
| 15 | Razorpay Order & Signature | Cryptographic Razorpay order creation, fail-closed signature verification, and test mode fallback under merchant Nilam Dodiya (NET Vidya) | M3 | Brief R3 |
| 16 | Razorpay Webhook Ingestion | Ingest `payment.captured` webhook in `api/store/razorpay-webhook.js` with raw body HMAC verification to reliably grant buyer access | M3 | Brief R3 |
| 17 | Purchase Confirmation Email | Dispatch confirmation email containing direct student dashboard link upon successful payment verification or webhook | M3 | Brief R3 |
| 18 | Protected Reading Files | Private PDF storage with 5–10 minute temporary signed download links; eliminate dummy ASCII string blobs and `nv_buyer_` query backdoor | M4 | Brief R4 |
| 19 | Test Hall HTML Delivery | Deliver ready-made, self-contained NTA-style test HTML files through authenticated server endpoint `api/store/serve-test.js` | M4 | Brief R4 |
| 20 | Test Release Date Enforcement | Enforce test release dates: show "Opens on [date]" in dashboard and return HTTP 403 before scheduled release date | M4 | Brief R4 |
| 21 | Admin Authentication | Protect admin studio with secure credential authentication (no public open navbar button) | M5 | Brief R5 |
| 22 | Admin PDF Upload | Form in admin studio allowing Dr. Rajnikant to upload new PDF reading files that appear in every buyer's Reading Files | M5 | Brief R5 |
| 23 | Admin Test HTML Upload | Form to upload new test HTML files with title and future release date, appearing in buyer Test Hall | M5 | Brief R5 |
| 24 | Admin Price & Cutoff Editor | Form to modify product pricing and offer end date dynamically | M5 | Brief R5 |
| 25 | Admin Buyers Table & Excel | View buyers list (name, email, phone, date, amount, status) and export to valid Excel (`.xlsx`) format | M5 | Brief R5 |
| 26 | Admin Manual Access Control | Admin action to manually grant or revoke student access (`is_buyer`, `is_active`) | M5 | Brief R5 |
| 27 | Admin Resend Confirmation Email | Action button in buyers registry to resend purchase confirmation email with dashboard link | M5 | Brief R5 |
| 28 | E2E Testing Suite (Tiers 1-4) | Comprehensive opaque-box test suite verifying all 27 features (>=11xN test cases) covering happy paths, boundaries, combinations, and user scenarios | M6 / E2E Track | Brief AC |
| 29 | Adversarial Coverage Hardening | Tier 5 adversarial stress testing, paywall bypass probing, and security audit verification | M6 | Brief AC |

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Branding, Typography & Public Deliverables | Features #1, #2, #3, #4, #5, #6, #7 | none | DONE |
| M2 | Student Auth, Password Reset & Access Control | Features #8, #9, #10, #11, #12 | none | DONE |
| M3 | Server-Side Pricing, Razorpay & Purchase Email | Features #13, #14, #15, #16, #17 | M2 | DONE |
| M4 | Protected Reading Files & Date-Gated Test Hall | Features #18, #19, #20 | M2, M3 | DONE |
| M5 | Admin Management Panel | Features #21, #22, #23, #24, #25, #26, #27 | M2, M3, M4 | DONE |
| M6 | Final Milestone: 100% E2E Test Pass & Hardening | Features #28, #29 | M1, M2, M3, M4, M5, E2E Track | DONE |

## Parallel Track: E2E Testing Track
- **Scope**: Requirement-driven opaque-box test runner and test suites (Tiers 1-4) covering all 27 inventoried features.
- **Deliverables**: `TEST_INFRA.md`, executable test scripts (`scripts/e2e/`), and `TEST_READY.md`.

## Interface Contracts

### 1. Auth Contract (`api/auth/` ↔ Client / Dashboard)
- `POST /api/auth/signup`: Body: `{ name, email, mobile, password }` $\rightarrow$ `{ success: true, token, user: { id, name, email, mobile, isBuyer, expiresAt } }`
- `POST /api/auth/login`: Body: `{ email, password }` $\rightarrow$ `{ success: true, token, user: { id, name, email, mobile, isBuyer, expiresAt } }`
- `GET /api/auth/me`: Header: `Authorization: Bearer <token>` $\rightarrow$ `{ success: true, user: { id, name, email, mobile, isBuyer, expiresAt } }`
- `POST /api/auth/forgot-password`: Body: `{ email }` $\rightarrow$ `{ success: true, message: 'Password reset link sent to your email.' }`
- `POST /api/auth/reset-password`: Body: `{ token, newPassword }` $\rightarrow$ `{ success: true, message: 'Password reset successful.' }`

### 2. Pricing & Payment Contract (`api/store/` ↔ Razorpay & Client)
- `GET /api/store/price`: Returns `{ success: true, productSlug, productName, price, originalPrice: null, isEarlyBird, earlyBirdCutoff, accessExpiryDate, sellerLine }`
- `POST /api/store/create-order`: Body: `{ studentName, email, mobile }` (client price ignored) $\rightarrow$ `{ success: true, orderId, amount, currency: 'INR', keyId }`
- `POST /api/store/verify-payment`: Body: `{ razorpay_payment_id, razorpay_order_id, razorpay_signature, studentName, email, mobile }` (fail-closed HMAC verification) $\rightarrow$ `{ success: true, isEnrolled: true, token, user }`
- `POST /api/store/razorpay-webhook`: Header: `x-razorpay-signature` $\rightarrow$ verifies raw body HMAC $\rightarrow$ grants buyer access in `netvidya_users` and `netvidya_buyers`.

### 3. Protected Content Contract (`api/store/` ↔ Buyer Dashboard)
- `GET /api/store/download-file?fileId=<id>`: Header: `Authorization: Bearer <token>` $\rightarrow$
  - 401: Unauthorized (missing or invalid token)
  - 403: Forbidden (authenticated user is not an active buyer)
  - 200: Temporary signed download link `{ success: true, downloadUrl, expiresInSeconds: 600 }` or direct file stream.
- `GET /api/store/serve-test?testId=<id>`: Header: `Authorization: Bearer <token>` $\rightarrow$
  - 401: Unauthorized
  - 403: Forbidden (not a buyer, OR `now < releaseDate` with `{ error: "Opens on [releaseDate]" }`)
  - 200: Self-contained test HTML payload or runner stream.

### 4. Admin Management Contract (`api/store/admin/` ↔ Admin Studio)
- `POST /api/store/admin/login`: Body: `{ password }` $\rightarrow$ `{ success: true, adminToken }`
- `POST /api/store/admin/upload-file`: Body: multipart or base64 PDF `{ title, description, fileBuffer, category }`
- `POST /api/store/admin/upload-test`: Body: `{ title, releaseDate, htmlContent, durationMinutes, totalQuestions }`
- `POST /api/store/admin/update-pricing`: Body: `{ earlyBirdPrice, standardPrice, earlyBirdCutoff }`
- `GET /api/store/admin/buyers`: Returns `[ { id, name, email, mobile, orderId, amount, enrolledAt, isActive } ]`
- `POST /api/store/admin/toggle-access`: Body: `{ email, isActive }`
- `POST /api/store/admin/resend-email`: Body: `{ email }`

## Code Layout
```
radiant-maxwell/
├── api/
│   ├── auth/
│   │   ├── signup.js
│   │   ├── login.js
│   │   ├── me.js
│   │   ├── forgot-password.js
│   │   └── reset-password.js
│   └── store/
│       ├── create-order.js
│       ├── download-file.js
│       ├── email.js
│       ├── price.js
│       ├── razorpay-webhook.js
│       ├── serve-test.js
│       ├── verify-payment.js
│       └── admin.js
├── public/
│   ├── dr-rajnikant-dodiya.jpg
│   ├── sample-materials/
│   │   ├── NetVidya_25_Question_Mini_Mock.pdf
│   │   ├── NetVidya_Model_Answers_Sample.pdf
│   │   └── demo-test.html
│   └── test-hall/
│       └── runner.html
├── src/
│   ├── components/
│   │   └── store/
│   │       ├── NetVidyaStoreLayout.tsx
│   │       ├── NetVidyaStoreHome.tsx
│   │       ├── NetVidyaFreeSample.tsx
│   │       ├── NetVidyaDashboard.tsx
│   │       ├── NetVidyaCheckoutModal.tsx
│   │       ├── NetVidyaStudentLoginModal.tsx
│   │       ├── NetVidyaPolicies.tsx
│   │       ├── NetVidyaAdminModal.tsx
│   │       └── NtaTestRunnerModal.tsx
│   ├── contexts/
│   │   └── NetVidyaStoreContext.tsx
│   ├── index.css
│   └── App.tsx
└── scripts/
    ├── e2e/
    └── testNetVidyaStore.mjs
```
