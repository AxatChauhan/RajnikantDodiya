# Changes: Milestone 3 (Payments & Pricing)

**Worker Folder:** `.agents/teamwork/worker_m3_1`  
**Milestone:** Milestone 3 (Features #13 to #17)  
**Date:** 2026-11-04  

---

## 1. Summary of Changes

### 1.1 `api/store/price.js`
- Exported `fetchStoreSettings()` helper to dynamically load settings from Supabase `netvidya_store_settings` or fall back to `DEFAULT_STORE_SETTINGS`.
- Updated `computeCurrentServerPrice(settings, simulatedNow)` to accept an optional `simulatedNow` parameter (from `req.query.now` or headers) for seamless testing across boundary dates.
- Verified and enforced authoritative server pricing: ₹799 early-bird before 10 Nov 2026 23:59:59 IST (`2026-11-10T23:59:59+05:30`), then automatically ₹999. Access lasts until 31 Dec 2026 (`2026-12-31T23:59:59+05:30`).
- Removed `originalPrice` from JSON response to strictly prohibit fake MRP / strike-through prices.
- Included comprehensive contract fields (`productSlug`, `productName`, `price`, `isEarlyBird`, `earlyBirdCutoff`, `accessExpiryDate`, `sellerLine`, `product`).

### 1.2 `api/store/create-order.js`
- Integrated `fetchStoreSettings()` to ensure order creation price matches the database or default settings.
- Strictly ignored any client-supplied `price` or `amount` parameters, computing charges exclusively on the server in paise (`amountInPaisa = price * 100`).
- Included clean merchant descriptor: `'Nilam Dodiya (NET Vidya)'` with mandatory seller line `'Sold by NET Vidya (proprietor: Nilam Dodiya). Content by Dr Rajnikant Dodiya.'`.
- Generated valid order IDs starting with `order_` (`order_${Date.now()}_...`) in both live and fallback test modes.
- Enforced currency strictly as `'INR'`.

### 1.3 `api/store/verify-payment.js`
- **Fixed `BUG-01-FAIL-OPEN-SIGNATURE`**: Enforced strict fail-closed parameter validation. If `razorpay_signature` or `razorpay_payment_id` is missing or falsy, immediately returns HTTP 400 Bad Request with `{ success: false, verified: false, error: 'Payment signature parameters required' }`.
- Implemented cryptographic HMAC-SHA256 signature verification using `crypto.timingSafeEqual` against the computed HMAC buffer.
- Synchronized buyer enrollment with `netvidya_users` via `findUserByEmail` and `saveUser` from `api/auth/auth-helper.js` (`is_buyer: true, is_active: true, expires_at: '2026-12-31T23:59:59+05:30'`).
- Upserted transaction record into Supabase `netvidya_buyers`.
- Generated and issued HMAC-SHA256 signed session token (`createSessionToken`) in the response so the student is immediately auto-logged in as an active buyer upon successful payment.
- Integrated purchase confirmation email dispatch via `sendPurchaseConfirmationEmail` from `api/store/email.js`.
- Maintained safe error isolation so email dispatch failures never block or invalidate payment verification.

### 1.4 `api/store/razorpay-webhook.js`
- Implemented robust `payment.captured` event ingestion with raw body HMAC verification using `crypto.timingSafeEqual`.
- Successfully granted buyer access in `netvidya_users` and recorded transaction in `netvidya_buyers`.
- Triggered purchase confirmation email dispatch upon webhook receipt.
- Provided safe handling of non-captured events (e.g. `payment.failed`) with HTTP 200 OK without granting access.
- Handled duplicate deliveries idempotently with HTTP 200 OK.

### 1.5 `api/store/email.js` (New File)
- Implemented transactional email module supporting purchase confirmation emails.
- Included direct student dashboard link (`/#dashboard` or full URL), order reference, payment ID, amount, and seller line.
- Provided fallback simulation logger (`[NET VIDYA EMAIL SIMULATOR]`) when external delivery credentials (such as `RESEND_API_KEY`) are not present.
- Wrapped dispatch in defensive try/catch to isolate external transport failures from blocking transactions.

### 1.6 `src/components/store/NetVidyaCheckoutModal.tsx`
- Added on-demand Razorpay SDK script injection (`https://checkout.razorpay.com/v1/checkout.js`).
- Wired Razorpay checkout popup with server-provided order ID and prefill candidate details.
- On successful payment completion, called `/api/store/verify-payment`.
- Stored session token in `localStorage` (`netvidya_auth_token_v1`) and invoked `loginBuyer` with active token.
- Seamlessly navigated student to Dashboard (`onSuccess`).
- Preserved strict compliance: zero fake strike-through prices, zero mentions of ₹1,499, and zero `<del>` / `<s>` tags.

---

## 2. Verification Summary
- `npm run typecheck`: Passed (exit code 0).
- `npm run build`: Passed (exit code 0 in 19.78s).
- `node scripts/testNetVidyaStore.mjs`: Passed (33 / 33 tests passed, 0 failures).
- `node scripts/e2e/run_all_tests.mjs`: Passed (359 / 359 assertions passed with 100% success).
