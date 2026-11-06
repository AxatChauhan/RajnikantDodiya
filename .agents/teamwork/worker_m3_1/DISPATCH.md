## 2026-11-04T09:57:37Z

You are Worker 3: Payments and Pricing Worker (worker_m3_1).
Your Working Directory is: c:\Users\DELL\Documents\antigravity\radiant-maxwell\.agents\teamwork\worker_m3_1
Your original request path is: c:\Users\DELL\Documents\antigravity\radiant-maxwell\.agents\teamwork\ORIGINAL_REQUEST.md
Your master project specification is: c:\Users\DELL\Documents\antigravity\radiant-maxwell\.agents\teamwork\orchestrator_1\PROJECT.md
Your milestone scope and explorer findings are at: c:\Users\DELL\Documents\antigravity\radiant-maxwell\.agents\teamwork\explorer_survey_3\handoff.md and TEST_READY.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

You MUST read ORIGINAL_REQUEST.md, PROJECT.md, explorer_survey_3/handoff.md, and TEST_READY.md before making any changes.

Your assigned Milestone is Milestone 3: Server-Side Pricing, Razorpay Integration & Purchase Confirmation Email (Features #13 to #17).

CRITICAL BUG TO FIX:
Fix `BUG-01-FAIL-OPEN-SIGNATURE` in `api/store/verify-payment.js`: Payment verification must strictly FAIL CLOSED. If `razorpay_signature` or `razorpay_payment_id` is omitted or invalid, return HTTP 400 Bad Request with `{ success: false, error: 'Payment signature parameters required' }`.

Files exclusively owned by you:
- `api/store/price.js`
- `api/store/create-order.js`
- `api/store/verify-payment.js`
- `api/store/razorpay-webhook.js`
- `api/store/email.js`
- `src/components/store/NetVidyaCheckoutModal.tsx`

Detailed requirements:
1. Server-Side Pricing (R3):
   - In `api/store/price.js` and `api/store/create-order.js`, enforce: ₹799 early-bird before 10 Nov 2026, 11:59 pm IST (`2026-11-10T23:59:59+05:30`), then automatically ₹999. Access lasts until 31 Dec 2026 (`2026-12-31T23:59:59+05:30`).
   - Price must be decided exclusively on the server, never accepted from the browser.
2. Razorpay Order Creation (`api/store/create-order.js`):
   - Server-side order creation charging the exact server price in paise.
   - Clean merchant descriptor under Nilam Dodiya (NET Vidya).
3. Razorpay Signature Verification (`api/store/verify-payment.js`):
   - Enforce fail-closed HMAC-SHA256 signature verification with `crypto.timingSafeEqual`.
   - On successful payment, grant buyer access in `netvidya_users` (`is_buyer: true, is_active: true, expires_at: '2026-12-31T23:59:59+05:30'`) and record transaction in `netvidya_buyers`.
   - Issue authenticated session token so the student is immediately logged in as an active buyer.
4. Webhook Handler (`api/store/razorpay-webhook.js`):
   - Handle `payment.captured` with raw body HMAC verification.
   - Reliably grant buyer access in `netvidya_users` and `netvidya_buyers`.
5. Purchase Confirmation Email (`api/store/email.js`):
   - Implement transactional email module sending purchase confirmation email containing student dashboard link (`/#dashboard`).
   - Trigger confirmation email dispatch from `verify-payment.js` and `razorpay-webhook.js`.
   - Provide simulation logger fallback when external API keys are not present.
6. Checkout Modal (`src/components/store/NetVidyaCheckoutModal.tsx`):
   - Wire up Razorpay checkout flow, connecting to `/api/store/create-order` and `/api/store/verify-payment`.
   - Ensure smooth transition to dashboard upon successful payment.

Verification requirements:
- `npm run typecheck` (`tsc --noEmit`)
- `npm run build`
- `node scripts/testNetVidyaStore.mjs`
- `node scripts/e2e/run_all_tests.mjs` (All 359 assertions must PASS)
