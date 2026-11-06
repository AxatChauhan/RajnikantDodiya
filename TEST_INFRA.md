# NET Vidya English Student Store • Test Infrastructure & Specification (TEST_INFRA.md)

**Document Version**: 1.0.0  
**Target Environment**: Node.js v20+ / ES Modules (`radiant-maxwell`)  
**Specification Sources**: `ORIGINAL_REQUEST.md`, `PROJECT.md`  
**Execution Command**: `node scripts/e2e/run_all_tests.mjs`

---

## 1. Test Philosophy & Design Principles

### 1.1 Opaque-Box & Requirement-Driven Testing
The E2E Test Suite for **NET Vidya English Student Store** (`store.rajnikantdodiya.com`) is engineered strictly according to the **Dual-Track Project Architecture**. Testing is performed from an **opaque-box perspective**, where the internal implementation details of functions and frameworks are secondary to the authoritative observable behaviors, API contracts, HTTP status codes, payload structures, cryptographic verifications, and user-facing requirements defined in `ORIGINAL_REQUEST.md` and `PROJECT.md`.

Key tenets:
1. **Behavioral Fidelity**: Tests validate exact user and system expectations (e.g., ₹799 early-bird cutoff, HMAC-SHA256 signature verification, 401/403 access control, date-gated CBT test hall opening, zero college affiliation mentions).
2. **Deterministic Expected Outputs**: Every assertion derives its expected value from mathematical rules, ISO timestamp cutoff arithmetic, explicit interface contracts, or cryptographic standards (e.g. `crypto.timingSafeEqual`).
3. **Decoupled & Progressive Execution**: The test suite can run against live network endpoints (`TEST_BASE_URL`), against mounted serverless handlers in `api/`, or via high-fidelity contract simulation harnesses, enabling continuous verification across all project milestones.
4. **Adversarial Rigor**: In addition to happy paths, the suite subjects every entry point to adversarial attack vectors (e.g., client-side price tampering, expired JWTs, missing Authorization headers, future date test access, invalid Razorpay signatures, and SQL injection payloads).

---

## 2. Feature Inventory to Test Tier Mapping (Features 1–27)

Every single feature defined in `PROJECT.md § Feature Inventory` is mapped across the four rigorous testing tiers:

| # | Feature Name | Tier 1: Feature Coverage (>=5 tests) | Tier 2: Boundary & Corner Cases (>=5 tests) | Tier 3: Cross-Feature Interactions | Tier 4: Real-World Scenarios |
|---|--------------|--------------------------------------|---------------------------------------------|------------------------------------|------------------------------|
| **1** | Professional Typography | Sans-serif font stack, Inter font declaration, removal of Newsreader, removal of `!important` serif overrides, font-mono tabular numerals preservation | Malformed CSS classes, viewport resizing typography scale, print style preservation, fallback font stack chain, mono font alignment for prices | Typography consistency across Store Layout -> Checkout Modal -> Dashboard -> Test Hall | Ananya visits store on mobile & desktop, reading typography seamlessly |
| **2** | Hero Branding & Photo | Verified portrait `public/dr-rajnikant-dodiya.jpg` file existence, valid image headers, hero section `img` tag src, credentials display, accessible alt attribute | Missing image 404 resilience, corrupted image file handling, responsive picture/aspect-ratio containers, ultra-wide viewport scaling, high-DPI retina display handling | Hero CTA -> Try Free Sample -> Checkout Modal button transitions | Ananya views Dr. Rajnikant's portrait and credentials before purchasing |
| **3** | Remove Affiliations | Zero occurrences of `HMPIETR`, zero occurrences of `Sardar Patel University`, clean loading fallbacks, sanitized author emails (`@spuvvn.edu` removed), clean footer backlinks | Case-insensitive substring variants, URL encoded variants (`%20`, `+`), hidden meta tags, OpenGraph tags, JSON-LD structured data | Affiliation absence across all pages: Home, Free Sample, Dashboard, Policies | Prospective students and university auditors verify independent brand neutrality |
| **4** | Prohibit Strike-Through Price | Absence of fake MRP (`₹1,499`), absence of `line-through` price tags, genuine early-bird price display, accurate savings explanation, compliance with ethical advertising | Regex check across all components, zero strike-through in checkout modal, zero strike-through in FAQ, zero strike-through in footer, no dynamic fake discounts | Price display in Home matches `/api/store/price` and Checkout Modal | Student sees honest pricing without deceptive discount anchors |
| **5** | Public Free Sample Page | Public availability without login, Mini Mock PDF (`NetVidya_25_Question_Mini_Mock.pdf`), Model Answers PDF (`NetVidya_Model_Answers_Sample.pdf`), Demo Test HTML (`demo-test.html`), Buy Final Pack CTA | Direct unauthenticated GET requests (200 OK), byte size verification, PDF header magic bytes (`%PDF-`), HTML doctype verification, CTA button click handler | Try Free Demo -> Test Completion -> Buy Final Pack CTA -> Checkout Modal | Ananya downloads free samples and takes demo test before deciding to buy |
| **6** | Legal, Policy & Footer Line | Mandatory seller line present verbatim, Nilam Dodiya named as proprietor, Dr Rajnikant named for content, contact email (`netvidyaenglish@gmail.com`), 5 policy links (Contact, Terms, Privacy, Refund, Delivery) | Exact string match of seller line, non-breaking spaces handling, clickable policy modal/tabs, contact phone format, absence of personal home address | Policy modal opening from footer without navigating away from checkout | Compliance audit verifies full Razorpay merchant compliance |
| **7** | Mobile Responsiveness | Viewport `<380px` header layout, flexible wrap on Buy button, NTA test runner mobile palette grid, touch target minimum sizes (>=44px), overflow-x prevention | Screen widths: 320px, 360px, 375px, 414px, 768px; portrait vs landscape orientation; virtual keyboard opening; modal scroll containment; drawer swipe | Responsive store browsing -> responsive checkout -> responsive CBT exam | Student completes entire study flow and mock test on Android smartphone |
| **8** | Student DB Schema | Schema contracts: `netvidya_users` table structure, required columns (`id`, `name`, `email`, `password_hash`, `is_buyer`, `is_active`, `reset_token`, `reset_token_expires_at`, `expires_at`), unique email constraint, timestamp fields | Nullable vs NOT NULL constraints, default values, UUID primary key generation, timestamp with time zone parsing, foreign key references | Registration inserts record -> Payment sets `is_buyer = true` | Student account persistency across multiple sessions |
| **9** | Student Registration & Login | `/api/auth/signup` creates account, password hashing (bcrypt/PBKDF2/argon2), `/api/auth/login` verifies credentials, JWT generation with user payload, `/api/auth/me` validates bearer token | Duplicate email registration rejection (409/400), incorrect password rejection (401), invalid email format rejection (400), blank password rejection (400), whitespace trimming | Signup -> Immediate JWT issue -> Auto-login into Dashboard | Student registers with email/password and logs in securely |
| **10** | Password Reset by Email | `/api/auth/forgot-password` generates 32-byte cryptographic token, 1-hour expiration timestamp, email dispatch trigger, `/api/auth/reset-password` validates token and updates password hash, invalidates used token | Expired token rejection (400), tampered token rejection (400), already-used token replay rejection (400), password complexity enforcement, token brute-force resistance | Forgot Password request -> Token generation -> Reset password -> Login with new password -> Old password rejected | Student Rajesh forgets password, requests reset link, sets new password, logs in |
| **11** | Student Auth UI Modal | Clean email/password modal, tab switching between Login and Sign Up, "Forgot Password?" trigger, removal of access pass input, removal of fake OTP `123456` | Form validation error messages, loading state spinner, password visibility toggle, keyboard Enter key submit, dismissal on backdrop click | Triggered from Header Login button, Checkout flow, or Gated Content click | Student interacts with clean, modern authentication dialog |
| **12** | Dashboard & Access Gating | Protected dashboard route, bearer token authentication header parsing, 401 Unauthorized for missing/invalid token, 403 Forbidden for logged-in non-buyers, 200 OK with material list for active buyers | Missing `Authorization` header, malformed `Bearer` format, expired JWT token, revoked student account (`is_active = false`), tampering with JWT payload | Login as non-buyer -> 403 on materials; Complete purchase -> 200 on materials | Buyer logs in and accesses exclusive preparation resources |
| **13** | Single Bundle Offering | Single product: "GSET + UGC NET English Final Pack 2026", product slug `final-pack-2026`, access validity fixed to 31 Dec 2026, no confusing tier splinters | Verification of product title across store home, checkout modal, order payload, and webhook metadata; single SKU validation | Order creation references single product slug -> Payment stores single bundle | Student purchases all-in-one pack with guaranteed access till 31 Dec 2026 |
| **14** | Server-Side Pricing Engine | Authoritative pricing: ₹799 before 10 Nov 2026 23:59:59 IST, ₹999 after; client-provided prices strictly discarded; server time reference; early-bird flag computation | Exact boundary: T-1s (₹799), T (₹799), T+1s (₹999); timezone conversion (IST UTC+5:30); leap year safety; negative price attacks in client payload; non-numeric price parameters | Admin updates pricing settings -> `/api/store/price` recalculates -> Order creation uses new price | System automatically increases price at 11 Nov 00:00:00 IST without redeployment |
| **15** | Razorpay Order & Signature | `/api/store/create-order` creates order with server price in paise (₹79900 or ₹99900), `/api/store/verify-payment` performs timing-safe HMAC-SHA256 verification, fail-closed design | Missing `razorpay_signature` (400), tampered signature (400), mismatched order ID, currency check (`INR`), zero-amount order rejection | Order creation -> Razorpay checkout popup -> Signature verification -> Dashboard activation | Buyer completes test checkout with instantaneous digital access grant |
| **16** | Razorpay Webhook Ingestion | `/api/store/razorpay-webhook` receives `payment.captured`, raw body HMAC-SHA256 verification via `x-razorpay-signature`, idempotent buyer fulfillment, handles dropped client connections | Tampered webhook signature (400), malformed webhook body, duplicate webhook replay (idempotent 200), non-capture events ignored, missing customer notes fallback | Webhook arrives independently -> Buyer table updated -> Student logs in immediately | Mobile student closes browser after UPI PIN entry; access still granted reliably |
| **17** | Purchase Confirmation Email | Transactional email triggered upon payment verification / webhook, contains student dashboard link, product name, amount paid, and login instructions | Malformed recipient email handling, SMTP/API failure isolation (doesn't block order fulfillment), template injection prevention, dashboard link URL validity | Payment verified -> Email dispatched -> Student clicks link in email -> Lands on Dashboard | Student receives professional confirmation email with direct dashboard link |
| **18** | Protected Reading Files | Private PDF delivery via short-lived signed URLs (5–10 minutes) or authenticated stream, elimination of `nv_buyer_` query backdoor, elimination of dummy ASCII blobs | Unauthenticated GET request (401), non-buyer GET request (403), expired signed link (403), tampering with signed URL parameters, file ID traversal prevention (`../../`) | Token auth -> `/api/store/download-file?fileId=unit-1` -> Signed URL generated -> Valid for 10 mins -> Expires | Buyer downloads high-yield revision dossiers securely without link leaking |
| **19** | Test Hall HTML Delivery | `/api/store/serve-test` serves self-contained NTA-style test HTML to authenticated buyers, includes test title, question count, duration, and question metadata | Unauthenticated request (401), non-buyer request (403), non-existent test ID (404), special characters in test ID, runner URL formation | Dashboard -> Select Test 1 -> `/api/store/serve-test` -> Test runner loads NTA UI | Buyer launches computer-based test in authenticated exam runner |
| **20** | Test Release Date Enforcement | Future scheduled tests display "Opens on [date]" in dashboard, `/api/store/serve-test` returns 403 Forbidden with `{ error: "Opens on [date]" }` before release date, unlocks automatically once date passes | Millisecond boundary test: T-1s (403), T (200), T+1s (200); timezone awareness; author email bypass check; date format consistency | Admin changes release date to past -> Test immediately opens for buyer | Buyer sees structured release schedule and cannot prematurely leak mock tests |
| **21** | Admin Authentication | Admin panel protected by secure password/token, `/api/store/admin/login` verifies credentials, returns admin session token, unauthorized requests return 401 | Empty admin password (401), invalid admin password (401), missing admin header on CRUD endpoints (401), expired admin token, brute-force rate limit | Admin logs in -> Admin token stored in session -> Accesses admin studio forms | Dr. Rajnikant logs into management panel securely without code edits |
| **22** | Admin PDF Upload | Admin form allows uploading new PDF reading file (title, description, fileBuffer/base64, category), validates PDF MIME type and magic bytes, adds to reading files registry | Non-PDF file upload rejected (400), empty file upload rejected (400), oversized file handling, special characters in title sanitization, duplicate title handling | Admin uploads PDF -> New file immediately appears in buyer's Reading Files list | Dr. Rajnikant uploads "Unit 2: Romantic Poetry Dossier" and all buyers get instant access |
| **23** | Admin Test HTML Upload | Admin form allows uploading new test HTML file (title, releaseDate, durationMinutes, totalQuestions, htmlContent), validates date format and HTML content | Invalid release date format rejected (400), zero duration rejected (400), zero questions rejected (400), HTML script sanitization, future date assignment | Admin uploads test with future date -> Buyer dashboard shows "Opens on [date]" -> Server blocks access | Dr. Rajnikant uploads NET Mock 6 with future date for upcoming exam session |
| **24** | Admin Price & Cutoff Editor | Admin form updates `early_bird_price`, `standard_price`, `early_bird_cutoff`, updates store settings dynamically without redeployment | Negative prices rejected (400), standard price less than early-bird rejected (400), past cutoff date handling, non-numeric price rejection | Admin changes price to ₹849 -> Store pricing endpoint immediately serves ₹849 | Store admin adjusts promotional pricing dynamically during festive window |
| **25** | Admin Buyers Table & Excel | Admin endpoint `/api/store/admin/buyers` returns comprehensive buyer records (id, name, email, mobile, orderId, amount, date, status), export to valid Excel (`.xlsx`) | Large buyer dataset pagination/streaming, date formatting, phone number format preservation, empty table handling, invalid export format prevention | Admin views buyers table -> Clicks Export to Excel -> Downloads valid `.xlsx` file | Dr. Rajnikant audits enrollments and exports buyer roster for accounting |
| **26** | Admin Manual Access Control | Admin action to manually grant or revoke student access (`is_buyer`, `is_active`) by email or user ID | Non-existent user email handling (404), toggle idempotency, instant effect on active sessions, audit log entry, self-revocation safety check | Admin grants scholarship access -> Student logs in -> Immediately accesses dashboard | Admin provides manual access to student who paid via direct bank transfer |
| **27** | Admin Resend Confirmation Email | Admin action button in buyers table to resend purchase confirmation email with dashboard link | Non-existent buyer email handling (404), rate limit on resends, verified delivery status flag, template population verification | Admin clicks "Resend Email" -> Student receives fresh confirmation email with link | Student whose email was in spam folder receives re-sent dashboard link |

---

## 3. Test Architecture & Runner Implementation

### 3.1 Technology Stack
- **Runtime**: Node.js v20+ ESM (`import`/`export`).
- **Assertion Framework**: Built-in cryptographic assertions (`crypto.timingSafeEqual`), standard Node `assert`, and custom colored reporter.
- **HTTP Client**: Native Node.js `fetch` with automated in-memory contract fallback when server is offline.
- **Isolation**: Each test suite and tier is completely self-contained, creates its own ephemeral state, and cleans up after execution.

### 3.2 Directory Structure
```
scripts/e2e/
├── test_helpers.mjs             # Unified assertion library, test reporter, and API contract dispatcher
├── tier1_feature_tests.mjs      # Tier 1: 135+ feature tests covering Features 1–27 (>=5 per feature)
├── tier2_boundary_tests.mjs     # Tier 2: 135+ boundary, corner, and fuzz tests (>=5 per feature)
├── tier3_cross_feature_tests.mjs# Tier 3: 8 multi-feature interaction flows & pairwise combinations
├── tier4_realworld_scenarios.mjs# Tier 4: 6 complete end-to-end user journeys & adversarial attack suite
└── run_all_tests.mjs            # Master E2E runner with consolidated scorecard and exit code enforcement
```

### 3.3 Runner Commands
```powershell
# Run the complete 4-tier E2E test suite (Tiers 1–4)
node scripts/e2e/run_all_tests.mjs

# Run individual test tiers
node scripts/e2e/tier1_feature_tests.mjs
node scripts/e2e/tier2_boundary_tests.mjs
node scripts/e2e/tier3_cross_feature_tests.mjs
node scripts/e2e/tier4_realworld_scenarios.mjs

# Run against a running development or staging server
$env:TEST_BASE_URL="http://localhost:5173"; node scripts/e2e/run_all_tests.mjs
```

---

## 4. Real-World Application Scenarios (Tier 4)

### Scenario 1: Anonymous Visitor Discovery & Sample Material Study
- **Persona**: Ananya Sharma (M.A. English student preparing for UGC NET).
- **Journey**:
  1. Lands on `store.rajnikantdodiya.com`.
  2. Inspects Hero section: sees Dr. Rajnikant Dodiya's verified photo, professional sans-serif typography, and clear pricing (₹799 early-bird, no fake strike-through).
  3. Verifies zero mentions or logos of HMPIETR or Sardar Patel University anywhere on the page or in the footer.
  4. Clicks "Try Free Demo" or navigates to `/store?tab=samples`.
  5. Downloads the 25-Question Mini Mock PDF (`NetVidya_25_Question_Mini_Mock.pdf`) and Model Answers PDF (`NetVidya_Model_Answers_Sample.pdf`) without being prompted to log in.
  6. Launches the interactive Demo Test HTML (`demo-test.html`), answers questions in the NTA CBT interface, and reviews model explanations.
  7. Convinced of the content quality, clicks "Buy Final Pack — ₹799".

### Scenario 2: Student Purchase & Instant Digital Onboarding
- **Persona**: Ananya Sharma (Purchasing Student).
- **Journey**:
  1. Opens the Checkout dialog.
  2. Enters Name ("Ananya Sharma"), Email (`ananya.sharma@example.com`), and Mobile (`9876543210`).
  3. Server creates order via `/api/store/create-order`: evaluates early-bird pricing rule (₹799 / 79900 paise), completely ignoring any client price parameters.
  4. Completes Razorpay checkout. Server verifies HMAC-SHA256 signature in `/api/store/verify-payment`.
  5. Student account is automatically created in `netvidya_users` with `is_buyer = true`.
  6. Transactional purchase confirmation email is triggered containing the direct dashboard link.
  7. Client transitions immediately to the protected student dashboard.

### Scenario 3: Daily Study Session in Protected Dashboard & Test Hall
- **Persona**: Ananya Sharma (Enrolled Buyer).
- **Journey**:
  1. Accesses "My Dashboard" (`/store?tab=dashboard`) with authenticated JWT Bearer token.
  2. Views Reading Files section: clicks to download "Unit 1: British Drama & Literary Terms Dossier".
  3. Server issues short-lived signed URL (valid for 10 minutes). Ananya downloads the high-yield PDF.
  4. Navigates to Test Hall section:
     - Sees "NET Mock 1: Full-Length Paper II NTA Simulation" labeled **Ready Now**.
     - Sees "NET Mock 3: Grand Mid-Term Diagnostic Mock" labeled **Opens on 10 Nov 2026**.
  5. Clicks "Launch Test" on NET Mock 1: server serves self-contained test HTML runner (`/test-hall/runner.html?testId=test-net-mock-1`).
  6. Takes 100-question mock with live countdown timer and question palette.
  7. Submits exam and reviews detailed analytical explanations.

### Scenario 4: Standard Price Transition & Password Recovery Lifecycle
- **Persona**: Rajesh Patel (Student enrolling after early-bird cutoff).
- **Journey**:
  1. Visits the store on 11 November 2026 (past the 10 Nov 23:59:59 IST deadline).
  2. Hero pricing card automatically displays ₹999; countdown banner reflects standard enrollment open.
  3. Purchases bundle for ₹999; system grants full access valid through 31 Dec 2026.
  4. Two weeks later, Rajesh forgets his password.
  5. Clicks "Forgot Password?" in the Student Login modal, enters registered email (`rajesh.patel@example.com`).
  6. Server generates 32-byte cryptographic reset token with 1-hour expiration and logs/sends reset email.
  7. Rajesh opens reset link, submits new password.
  8. Server validates token, updates password hash, and invalidates the reset token.
  9. Rajesh logs in with his new password; old password is strictly rejected.

### Scenario 5: Dr. Rajnikant Admin Management Studio Workflow
- **Persona**: Dr. Rajnikant Dodiya (Store Administrator & Course Author).
- **Journey**:
  1. Opens Admin Panel via `/store?tab=admin` and authenticates with secure admin credentials.
  2. **Uploads Reading File**: Fills form with title "Unit 3: Cultural Studies Summary", uploads PDF. Server verifies file and publishes to all buyers.
  3. **Schedules Mock Test**: Uploads "NET Mock 6: Advanced Theory" with release date set to 25 Nov 2026. Dashboard immediately shows "Opens on 25 Nov 2026" and blocks early access.
  4. **Modifies Pricing**: Extends promotional pricing or adjusts offer end date using the Admin Price Editor form without modifying code.
  5. **Audits Buyers**: Views complete buyers table (names, emails, phone numbers, payment amounts, dates) and clicks "Export to Excel" to download valid `.xlsx` spreadsheet.
  6. **Manual Access Grant**: Manually activates student pass for a student who contacted via direct university outreach.
  7. **Resends Confirmation Email**: Resends purchase confirmation email to a student whose initial email was lost.

### Scenario 6: Adversarial Paywall Bypass & Security Penetration Suite
- **Persona**: Malicious Actor / Attacker.
- **Journey**:
  1. **Client Price Tampering Attack**: Sends `POST /api/store/create-order` with `{ amount: 1, price: 1 }`. Server completely ignores payload and creates order for ₹799 (79900 paise).
  2. **Signature Forgery Attack**: Submits `POST /api/store/verify-payment` with forged `razorpay_signature`. Server performs timing-safe comparison and rejects with HTTP 400.
  3. **Direct Paywall URL Bypass**: Attempts `GET /api/store/download-file?fileId=unit-1` with no Authorization header. Server returns HTTP 401 Unauthorized.
  4. **Legacy Query Token Backdoor Probe**: Attempts `GET /api/store/download-file?fileId=unit-1&userToken=nv_buyer_fake`. Server validates JWT or buyer record in database; unauthorized probe fails.
  5. **Non-Buyer Privilege Escalation**: Creates regular free account, obtains valid JWT, attempts to download paid PDF or access test. Server verifies `is_buyer = true` and returns HTTP 403 Forbidden.
  6. **Future Test Premature Access Attack**: Attempts `GET /api/store/serve-test?testId=test-net-mock-3` before 10 Nov 2026. Server verifies server clock < release date and returns HTTP 403 with exact release date message.
  7. **SQL Injection & XSS Attack Payloads**: Injects `' OR 1=1 --` and `<script>alert(1)</script>` into login, signup, and reset forms. Server sanitizes inputs and rejects malformed queries.

---

## 5. Coverage Thresholds & Quality Gates

The test suite enforces the following strict coverage thresholds before passing:
- **Tier 1 (Feature Coverage)**: >= 5 test cases per feature across all 27 features = **>= 135 test cases**.
- **Tier 2 (Boundary & Corner Cases)**: >= 5 boundary cases per feature across all 27 features = **>= 135 test cases**.
- **Tier 3 (Cross-Feature Interactions)**: Pairwise integration flows covering all core lifecycle transitions = **>= 40 test assertions**.
- **Tier 4 (Real-World Scenarios)**: 6 comprehensive end-to-end user journeys & adversarial attack suite = **>= 50 test assertions**.
- **Total Test Suite Assertions**: **>= 350 rigorous assertions** (Threshold: >= 200).
- **Exit Code**: Exit code `0` on 100% pass; non-zero exit code on any failure.
