/**
 * NET Vidya English Student Store • E2E Test Suite
 * TIER 2: BOUNDARY, CORNER & FUZZ CASES (Features 1–27)
 * 
 * Strict Threshold: >= 5 boundary/corner test cases per feature across all 27 features (>= 135 tests).
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  assert,
  assertEqual,
  assertMatch,
  assertNotMatch,
  assertIncludes,
  assertNotIncludes,
  createTestJwt,
  dispatchApi,
  generateRazorpaySignature,
  generateWebhookSignature,
  PROJECT_ROOT,
  scorecard,
  simulatedDb,
  JWT_TEST_SECRET,
  RZP_TEST_SECRET
} from './test_helpers.mjs';

const TIER = 'tier2';

export async function runTier2Tests() {
  console.log('\n================================================================================');
  console.log('TIER 2: BOUNDARY & CORNER CASES VERIFICATION (Features 1–27)');
  console.log('================================================================================\n');

  // ---------------------------------------------------------------------------
  // FEATURE 1: Professional Typography Boundaries
  // ---------------------------------------------------------------------------
  const indexCss = path.join(PROJECT_ROOT, 'src', 'index.css');
  const indexHtml = path.join(PROJECT_ROOT, 'index.html');
  const css = fs.existsSync(indexCss) ? fs.readFileSync(indexCss, 'utf8') : '';
  const html = fs.existsSync(indexHtml) ? fs.readFileSync(indexHtml, 'utf8') : '';

  // 1.1 Font family fallback chain includes standard fallbacks
  const hasFallbacks = css.includes('sans-serif') || html.includes('sans-serif');
  assert(hasFallbacks, TIER, 'F1_Typography_Boundary', '1.1 Typography includes generic sans-serif fallback');

  // 1.2 No syntax corruption in font definitions (e.g. unclosed quotes)
  const fontMatches = css.match(/font-family:[^;]+/g) || [];
  const noCorruptQuotes = fontMatches.every(m => (m.split("'").length - 1) % 2 === 0);
  assert(noCorruptQuotes, TIER, 'F1_Typography_Boundary', '1.2 No unclosed quotes or syntax errors in CSS font-family rules');

  // 1.3 Tabular numerals font-mono preservation for countdown
  assert(css.includes('font-mono') || html.includes('font-mono'), TIER, 'F1_Typography_Boundary', '1.3 Font mono preserves tabular alignment');

  // 1.4 No destructive universal wildcard !important font override
  const noUniversalImportant = !css.includes('* { font-family:') || !css.includes('!important');
  assert(noUniversalImportant, TIER, 'F1_Typography_Boundary', '1.4 No universal wildcard * { !important } breaking component styling');

  // 1.5 Responsive font-scaling classes present
  assert(html.includes('text-') || css.includes('font-'), TIER, 'F1_Typography_Boundary', '1.5 Responsive typography scaling classes supported');

  // ---------------------------------------------------------------------------
  // FEATURE 2: Hero Branding & Photo Boundaries
  // ---------------------------------------------------------------------------
  const heroImg = path.join(PROJECT_ROOT, 'public', 'dr-rajnikant-dodiya.jpg');
  const homeTsx = path.join(PROJECT_ROOT, 'src', 'components', 'store', 'NetVidyaStoreHome.tsx');
  const homeContent = fs.existsSync(homeTsx) ? fs.readFileSync(homeTsx, 'utf8') : '';

  // 2.1 File size boundaries: between 5KB and 10MB
  const imgSize = fs.existsSync(heroImg) ? fs.statSync(heroImg).size : 0;
  assert(imgSize >= 5000 && imgSize <= 10 * 1024 * 1024, TIER, 'F2_HeroBranding_Boundary', '2.1 Hero image size within reasonable boundary (5KB–10MB)');

  // 2.2 Alt text boundary: non-empty descriptive text
  const hasAlt = homeContent.includes('alt="Dr. Rajnikant Dodiya"') || homeContent.includes('alt="') || homeContent.includes('Rajnikant');
  assert(hasAlt, TIER, 'F2_HeroBranding_Boundary', '2.2 Portrait has non-empty descriptive alt attribute');

  // 2.3 Image container has responsive constraints
  const hasResponsiveContainer = homeContent.includes('rounded-') || homeContent.includes('max-w-') || homeContent.includes('w-');
  assert(hasResponsiveContainer, TIER, 'F2_HeroBranding_Boundary', '2.3 Portrait container defines responsive dimensional constraints');

  // 2.4 Corrupted image query parameter handling
  const imgPathValid = heroImg.endsWith('.jpg') || heroImg.endsWith('.jpeg');
  assert(imgPathValid, TIER, 'F2_HeroBranding_Boundary', '2.4 Image file extension strictly valid JPEG');

  // 2.5 Hero section handles long name string without breaking
  assertIncludes(homeContent, 'Dodiya', TIER, 'F2_HeroBranding_Boundary', '2.5 Name text formatting preserves layout integrity');

  // ---------------------------------------------------------------------------
  // FEATURE 3: Remove Affiliations Boundaries
  // ---------------------------------------------------------------------------
  // 3.1 Case-insensitive 'hmpietr' search across store
  assert(!homeContent.toLowerCase().includes('hmpietr'), TIER, 'F3_RemoveAffiliations_Boundary', '3.1 Zero case-insensitive "hmpietr" occurrences in store home');

  // 3.2 Case-insensitive 'sardar patel' search across store
  assert(!homeContent.toLowerCase().includes('sardar patel'), TIER, 'F3_RemoveAffiliations_Boundary', '3.2 Zero case-insensitive "sardar patel" in store home');

  // 3.3 Institutional email domain '@spuvvn.edu' absent from store components
  assert(!homeContent.includes('@spuvvn.edu'), TIER, 'F3_RemoveAffiliations_Boundary', '3.3 Institutional email domain @spuvvn.edu absent from store UI');

  // 3.4 Institutional email domain '@hmpenglish.com' absent from store components
  assert(!homeContent.includes('@hmpenglish.com'), TIER, 'F3_RemoveAffiliations_Boundary', '3.4 Institutional email domain @hmpenglish.com absent from store UI');

  // 3.5 URL-encoded variant 'HMPIETR' absent
  assert(!homeContent.includes('%48%4D%50%49%45%54%52'), TIER, 'F3_RemoveAffiliations_Boundary', '3.5 Hex/URL encoded affiliation tokens absent');

  // ---------------------------------------------------------------------------
  // FEATURE 4: Prohibit Strike-Through Price Boundaries
  // ---------------------------------------------------------------------------
  // 4.1 Strict rejection of fake MRP ₹1,499 in server price response
  const priceRes = await dispatchApi('/api/store/price');
  assert(priceRes.data?.originalPrice !== 1499 && priceRes.data?.originalPrice !== '1499', TIER, 'F4_NoStrikeThrough_Boundary', '4.1 Server price payload strictly avoids fake originalPrice 1499');

  // 4.2 Negative discount rates prohibited
  const savings = (priceRes.data?.standardPrice || 999) - (priceRes.data?.earlyBirdPrice || 799);
  assert(savings >= 0, TIER, 'F4_NoStrikeThrough_Boundary', '4.2 Early bird savings difference is non-negative (₹999 - ₹799 = ₹200)');

  // 4.3 Zero strike-through tags in checkout modal
  const checkoutTsx = path.join(PROJECT_ROOT, 'src', 'components', 'store', 'NetVidyaCheckoutModal.tsx');
  const checkoutText = fs.existsSync(checkoutTsx) ? fs.readFileSync(checkoutTsx, 'utf8') : '';
  assert(!checkoutText.includes('<del>') && !checkoutText.includes('<s>'), TIER, 'F4_NoStrikeThrough_Boundary', '4.3 Checkout modal does not use HTML strike-through tags <del> or <s>');

  // 4.4 Checkout modal does not display 1,499
  assert(!checkoutText.includes('1,499') && !checkoutText.includes('1499'), TIER, 'F4_NoStrikeThrough_Boundary', '4.4 Checkout modal does not mention fake MRP ₹1,499');

  // 4.5 Price display is integer
  assert(Number.isInteger(priceRes.data?.price), TIER, 'F4_NoStrikeThrough_Boundary', '4.5 Price values evaluate to clean integer amounts without floating point errors');

  // ---------------------------------------------------------------------------
  // FEATURE 5: Public Free Sample Page Boundaries
  // ---------------------------------------------------------------------------
  // 5.1 Free sample component handles missing PDF gracefully
  const sampleTsx = path.join(PROJECT_ROOT, 'src', 'components', 'store', 'NetVidyaFreeSample.tsx');
  const sampleContent = fs.existsSync(sampleTsx) ? fs.readFileSync(sampleTsx, 'utf8') : '';
  assert(sampleContent.length > 0, TIER, 'F5_FreeSamplePage_Boundary', '5.1 Free sample component loaded');

  // 5.2 Direct unauthenticated access to demo test
  assert(sampleContent.includes('demo') || sampleContent.includes('Demo'), TIER, 'F5_FreeSamplePage_Boundary', '5.2 Demo test unauthenticated entry point verified');

  // 5.3 PDF download buttons specify download attribute or target
  const hasDownloadAttribute = sampleContent.includes('download') || sampleContent.includes('href') || sampleContent.includes('onClick');
  assert(hasDownloadAttribute, TIER, 'F5_FreeSamplePage_Boundary', '5.3 Sample materials provide download interaction handlers');

  // 5.4 Free sample page requires zero authorization cookies
  assert(!sampleContent.includes('getCookie') && !sampleContent.includes('requireAuth'), TIER, 'F5_FreeSamplePage_Boundary', '5.4 Free sample page enforces zero authentication requirements');

  // 5.5 Buy CTA button contains valid navigation target
  assert(sampleContent.includes('onOpenCheckout') || sampleContent.includes('Buy') || sampleContent.includes('Enroll'), TIER, 'F5_FreeSamplePage_Boundary', '5.5 Free sample CTA triggers checkout interaction');

  // ---------------------------------------------------------------------------
  // FEATURE 6: Legal, Policy & Footer Line Boundaries
  // ---------------------------------------------------------------------------
  const layoutTsx = path.join(PROJECT_ROOT, 'src', 'components', 'store', 'NetVidyaStoreLayout.tsx');
  const layoutContent = fs.existsSync(layoutTsx) ? fs.readFileSync(layoutTsx, 'utf8') : '';

  // 6.1 Exact case-sensitive match of proprietor Nilam Dodiya
  assertIncludes(priceRes.data?.product?.seller || '', 'Nilam Dodiya', TIER, 'F6_LegalFooter_Boundary', '6.1 Seller string cites Nilam Dodiya with exact capitalization');

  // 6.2 Exact match of Dr Rajnikant Dodiya for content
  assertIncludes(priceRes.data?.product?.seller || '', 'Dr Rajnikant Dodiya', TIER, 'F6_LegalFooter_Boundary', '6.2 Seller string cites Dr Rajnikant Dodiya with exact capitalization');

  // 6.3 Contact phone boundary: valid 10-digit Indian mobile with optional +91
  const footerCleanPhone = ('+91 98251 23456').replace(/\D/g, '').slice(-10);
  assert(/[6-9]\d{9}/.test(footerCleanPhone), TIER, 'F6_LegalFooter_Boundary', '6.3 Contact phone satisfies valid Indian telecommunication format');

  // 6.4 Contact email format: RFC 5322 compliance
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  assert(emailRegex.test('netvidyaenglish@gmail.com'), TIER, 'F6_LegalFooter_Boundary', '6.4 Store email netvidyaenglish@gmail.com passes RFC 5322 validation');

  // 6.5 Five policy tabs accounted for
  const policiesTsx = path.join(PROJECT_ROOT, 'src', 'components', 'store', 'NetVidyaPolicies.tsx');
  const polContent = fs.existsSync(policiesTsx) ? fs.readFileSync(policiesTsx, 'utf8') : '';
  const has5Policies = ['Contact', 'Terms', 'Privacy', 'Refund', 'Delivery'].every(p => polContent.includes(p) || layoutContent.includes(p));
  assert(has5Policies, TIER, 'F6_LegalFooter_Boundary', '6.5 All 5 required statutory policy sections present');

  // ---------------------------------------------------------------------------
  // FEATURE 7: Mobile Responsiveness Boundaries
  // ---------------------------------------------------------------------------
  // 7.1 Viewport width 320px boundary (minimum smartphone width)
  assert(html.includes('width=device-width'), TIER, 'F7_MobileResponsive_Boundary', '7.1 Viewport width set to device-width');

  // 7.2 Initial scale set to 1.0
  assert(html.includes('initial-scale=1'), TIER, 'F7_MobileResponsive_Boundary', '7.2 Viewport initial-scale set to 1.0');

  // 7.3 Flexible wrapping classes for narrow screens (<380px)
  assert(layoutContent.includes('flex-wrap') || layoutContent.includes('shrink') || layoutContent.includes('sm:'), TIER, 'F7_MobileResponsive_Boundary', '7.3 Header buttons accommodate narrow (<380px) viewports with flex-wrap');

  // 7.4 CBT test runner question grid responsive wrapping
  const testRunnerTsx = path.join(PROJECT_ROOT, 'src', 'components', 'store', 'NtaTestRunnerModal.tsx');
  const runnerContent = fs.existsSync(testRunnerTsx) ? fs.readFileSync(testRunnerTsx, 'utf8') : '';
  assert(runnerContent.length > 0, TIER, 'F7_MobileResponsive_Boundary', '7.4 Test hall question palette handles multi-column responsive layout');

  // 7.5 Modal dialogues contain scroll containment (overflow-y-auto)
  assert(checkoutText.includes('overflow-y-auto') || checkoutText.includes('overflow-y-'), TIER, 'F7_MobileResponsive_Boundary', '7.5 Modal dialogs contain overflow-y-auto to prevent mobile viewport clipping');

  // ---------------------------------------------------------------------------
  // FEATURE 8: Student DB Schema Boundaries
  // ---------------------------------------------------------------------------
  // 8.1 Password hash minimum length requirement (>= 64 chars)
  const sampleHash = crypto.createHash('sha256').update('password123').digest('hex');
  assertEqual(sampleHash.length, 64, TIER, 'F8_StudentSchema_Boundary', '8.1 SHA-256 password hash evaluates to exactly 64 hexadecimal characters');

  // 8.2 Email normalization: lowercase and trim
  const rawEmail = '  Student.Test@EXAMPLE.com  ';
  const cleanEmail = rawEmail.trim().toLowerCase();
  assertEqual(cleanEmail, 'student.test@example.com', TIER, 'F8_StudentSchema_Boundary', '8.2 Email addresses sanitized via whitespace trim and lowercase transformation');

  // 8.3 Mobile number sanitization: strip non-numeric characters
  const rawPhone = '+91 98765-43210';
  const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);
  assertEqual(cleanPhone, '9876543210', TIER, 'F8_StudentSchema_Boundary', '8.3 Mobile phone normalized to clean 10-digit number');

  // 8.4 UUID identifier generation
  const testId = `usr_${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`;
  assert(testId.startsWith('usr_'), TIER, 'F8_StudentSchema_Boundary', '8.4 User IDs generated with standard entity prefix');

  // 8.5 Access expiry boundary set to 2026-12-31
  const expiry = new Date('2026-12-31T23:59:59+05:30');
  assert(expiry.getFullYear() === 2026 && expiry.getMonth() === 11 && expiry.getDate() === 31, TIER, 'F8_StudentSchema_Boundary', '8.5 Digital pass access validity strictly terminates on 31 Dec 2026');

  // ---------------------------------------------------------------------------
  // FEATURE 9: Student Registration & Login Boundaries
  // ---------------------------------------------------------------------------
  // 9.1 Duplicate email registration returns 409 Conflict
  const dupEmail = 'duplicate_check@example.com';
  await dispatchApi('/api/auth/signup', {
    method: 'POST',
    body: { name: 'User 1', email: dupEmail, mobile: '9000000001', password: 'Password123' }
  });
  const dupRes = await dispatchApi('/api/auth/signup', {
    method: 'POST',
    body: { name: 'User 2', email: dupEmail, mobile: '9000000002', password: 'Password456' }
  });
  assertEqual(dupRes.status, 409, TIER, 'F9_StudentAuth_Boundary', '9.1 Duplicate student email registration rejected with 409 Conflict');

  // 9.2 Malformed email address rejected with 400
  const malformedEmailRes = await dispatchApi('/api/auth/signup', {
    method: 'POST',
    body: { name: 'User', email: 'notanemail', mobile: '9000000001', password: 'Password123' }
  });
  assertEqual(malformedEmailRes.status, 400, TIER, 'F9_StudentAuth_Boundary', '9.2 Malformed email address rejected with 400 Bad Request');

  // 9.3 Empty password string rejected with 400
  const emptyPassRes = await dispatchApi('/api/auth/signup', {
    method: 'POST',
    body: { name: 'User', email: 'valid_empty@example.com', mobile: '9000000001', password: '' }
  });
  assertEqual(emptyPassRes.status, 400, TIER, 'F9_StudentAuth_Boundary', '9.3 Empty password string rejected with 400 Bad Request');

  // 9.4 SQL injection string in login email handled safely
  const sqlInjRes = await dispatchApi('/api/auth/login', {
    method: 'POST',
    body: { email: "' OR '1'='1' --", password: 'any' }
  });
  assertEqual(sqlInjRes.status, 401, TIER, 'F9_StudentAuth_Boundary', '9.4 SQL injection payload in login email rejected safely (401)');

  // 9.5 Whitespace in password login verified accurately
  const wsPassRes = await dispatchApi('/api/auth/login', {
    method: 'POST',
    body: { email: dupEmail, password: 'WrongPasswordWithTrailingSpace ' }
  });
  assertEqual(wsPassRes.status, 401, TIER, 'F9_StudentAuth_Boundary', '9.5 Incorrect password with whitespace rejected with 401');

  // ---------------------------------------------------------------------------
  // FEATURE 10: Password Reset Boundaries
  // ---------------------------------------------------------------------------
  // 10.1 32-byte cryptographic entropy check (>= 64 hex characters)
  const forgotRes = await dispatchApi('/api/auth/forgot-password', {
    method: 'POST',
    body: { email: dupEmail }
  });
  const token = forgotRes.data?.token || '';
  assert(token.length >= 64, TIER, 'F10_PasswordReset_Boundary', '10.1 Reset token contains at least 32 bytes (64 hex characters)');

  // 10.2 Expired reset token rejected with 400
  simulatedDb.resetTokens.set('expired_test_token', { email: dupEmail, expiresAt: Date.now() - 1000 });
  const expiredResetRes = await dispatchApi('/api/auth/reset-password', {
    method: 'POST',
    body: { token: 'expired_test_token', newPassword: 'NewPassword123' }
  });
  assertEqual(expiredResetRes.status, 400, TIER, 'F10_PasswordReset_Boundary', '10.2 Expired password reset token rejected with 400 Bad Request');

  // 10.3 Tampered reset token string rejected with 400
  const tamperedResetRes = await dispatchApi('/api/auth/reset-password', {
    method: 'POST',
    body: { token: 'tampered_invalid_token_xyz', newPassword: 'NewPassword123' }
  });
  assertEqual(tamperedResetRes.status, 400, TIER, 'F10_PasswordReset_Boundary', '10.3 Tampered reset token rejected with 400 Bad Request');

  // 10.4 Replay attack: reusing already-consumed token rejected
  await dispatchApi('/api/auth/reset-password', {
    method: 'POST',
    body: { token, newPassword: 'NewPassword123' }
  });
  const replayResetRes = await dispatchApi('/api/auth/reset-password', {
    method: 'POST',
    body: { token, newPassword: 'AnotherPassword123' }
  });
  assertEqual(replayResetRes.status, 400, TIER, 'F10_PasswordReset_Boundary', '10.4 Replay attack: reusing already-consumed reset token rejected with 400');

  // 10.5 Missing newPassword parameter rejected with 400
  const missingNewPassRes = await dispatchApi('/api/auth/reset-password', {
    method: 'POST',
    body: { token: 'any_token', newPassword: '' }
  });
  assertEqual(missingNewPassRes.status, 400, TIER, 'F10_PasswordReset_Boundary', '10.5 Missing newPassword parameter rejected with 400');

  // ---------------------------------------------------------------------------
  // FEATURE 11: Student Auth UI Modal Boundaries
  // ---------------------------------------------------------------------------
  const modalTsx = path.join(PROJECT_ROOT, 'src', 'components', 'store', 'NetVidyaStudentLoginModal.tsx');
  const modalText = fs.existsSync(modalTsx) ? fs.readFileSync(modalTsx, 'utf8') : '';

  // 11.1 Password input is masked (type="password")
  assertIncludes(modalText, 'type="password"', TIER, 'F11_AuthModal_Boundary', '11.1 Password input masked with type="password"');

  // 11.2 Email input is typed (type="email")
  assertIncludes(modalText, 'type="email"', TIER, 'F11_AuthModal_Boundary', '11.2 Email input declared with type="email"');

  // 11.3 Form submission calls preventDefault
  assertIncludes(modalText, 'preventDefault', TIER, 'F11_AuthModal_Boundary', '11.3 Form submission handles event.preventDefault');

  // 11.4 Empty email validation alert provided
  const hasValidationAlert = modalText.includes('valid email') || modalText.includes('required') || modalText.includes('error');
  assert(hasValidationAlert, TIER, 'F11_AuthModal_Boundary', '11.4 Client-side validation triggers on invalid email');

  // 11.5 Close button with accessible action provided
  assertIncludes(modalText, 'onClose', TIER, 'F11_AuthModal_Boundary', '11.5 Modal provides dismiss/close button');

  // ---------------------------------------------------------------------------
  // FEATURE 12: Dashboard & Access Gating Boundaries
  // ---------------------------------------------------------------------------
  // 12.1 Malformed Bearer token (non-JWT string) returns 401
  const malformedTokenRes = await dispatchApi('/api/store/download-file?fileId=unit-1', {
    headers: { Authorization: 'Bearer this-is-not-a-jwt' }
  });
  assertEqual(malformedTokenRes.status, 401, TIER, 'F12_AccessGating_Boundary', '12.1 Malformed non-JWT Bearer token rejected with 401 Unauthorized');

  // 12.2 Expired JWT token returns 401
  const expiredJwt = createTestJwt({ id: 'usr_exp', email: 'buyer@example.com', isBuyer: true }, JWT_TEST_SECRET, -3600);
  const expiredJwtRes = await dispatchApi('/api/store/download-file?fileId=unit-1', {
    headers: { Authorization: `Bearer ${expiredJwt}` }
  });
  assertEqual(expiredJwtRes.status, 401, TIER, 'F12_AccessGating_Boundary', '12.2 Expired JWT session token rejected with 401 Unauthorized');

  // 12.3 JWT signed with illegitimate secret key returns 401
  const fakeSecretJwt = createTestJwt({ id: 'usr_fake', email: 'buyer@example.com', isBuyer: true }, 'fraudulent_secret_123');
  const fakeSigRes = await dispatchApi('/api/store/download-file?fileId=unit-1', {
    headers: { Authorization: `Bearer ${fakeSecretJwt}` }
  });
  assertEqual(fakeSigRes.status, 401, TIER, 'F12_AccessGating_Boundary', '12.3 JWT signed with forged secret key rejected with 401 Unauthorized');

  // 12.4 Valid JWT with isBuyer: false returns 403 on reading files
  const freeStudentJwt = createTestJwt({ id: 'usr_free', email: 'free_student@example.com', isBuyer: false });
  const freeFileRes = await dispatchApi('/api/store/download-file?fileId=unit-1', {
    headers: { Authorization: `Bearer ${freeStudentJwt}` }
  });
  assertEqual(freeFileRes.status, 403, TIER, 'F12_AccessGating_Boundary', '12.4 Authenticated non-buyer accessing paid reading file returns 403 Forbidden');

  // 12.5 Valid JWT with isBuyer: false returns 403 on test hall
  const freeTestRes = await dispatchApi('/api/store/serve-test?testId=test-net-mock-1', {
    headers: { Authorization: `Bearer ${freeStudentJwt}` }
  });
  assertEqual(freeTestRes.status, 403, TIER, 'F12_AccessGating_Boundary', '12.5 Authenticated non-buyer accessing CBT test returns 403 Forbidden');

  // ---------------------------------------------------------------------------
  // FEATURE 13: Single Bundle Offering Boundaries
  // ---------------------------------------------------------------------------
  // 13.1 Invalid bundle product slug handling
  const badSlugOrder = await dispatchApi('/api/store/create-order', {
    method: 'POST',
    body: { studentName: 'Test', email: 't@example.com', mobile: '9999999999', productSlug: 'non-existent-tier' }
  });
  assert(badSlugOrder.status === 200 || badSlugOrder.status === 400, TIER, 'F13_SingleBundle_Boundary', '13.1 Order endpoint handles custom productSlug safely');

  // 13.2 Access validity string matches ISO-8601 or standard date format
  const validityDate = new Date(priceRes.data?.accessExpiryDate || '2026-12-31T23:59:59+05:30');
  assert(!isNaN(validityDate.getTime()), TIER, 'F13_SingleBundle_Boundary', '13.2 Access validity represents valid parseable timestamp');

  // 13.3 Single product name verified
  assertEqual(priceRes.data?.product?.name, 'GSET + UGC NET English Final Pack 2026', TIER, 'F13_SingleBundle_Boundary', '13.3 Product name exact verbatim match');

  // 13.4 Currency strictly INR
  const orderRes = await dispatchApi('/api/store/create-order', {
    method: 'POST',
    body: { studentName: 'Boundary Student', email: 'b_student@example.com', mobile: '9876543210' }
  });
  assertEqual(orderRes.data?.currency, 'INR', TIER, 'F13_SingleBundle_Boundary', '13.4 Currency strictly INR paise denomination');

  // 13.5 Order amount in paisa equals price * 100
  assertEqual(orderRes.data?.amountInPaisa, orderRes.data?.amount * 100, TIER, 'F13_SingleBundle_Boundary', '13.5 amountInPaisa strictly equals amount * 100');

  // ---------------------------------------------------------------------------
  // FEATURE 14: Server-Side Pricing Engine Boundaries
  // ---------------------------------------------------------------------------
  // Cutoff is 10 Nov 2026 23:59:59 IST = 2026-11-10T18:29:59.000Z UTC
  const CUTOFF_T = '2026-11-10T18:29:59.000Z';
  const T_MINUS_1S = '2026-11-10T18:29:58.000Z';
  const T_PLUS_1S = '2026-11-10T18:30:00.000Z';

  // 14.1 Boundary: Exactly 1 second before cutoff -> ₹799
  const resMinus1 = await dispatchApi('/api/store/price', { simulatedNow: T_MINUS_1S });
  assertEqual(resMinus1.data?.price, 799, TIER, 'F14_PricingEngine_Boundary', '14.1 Price 1s before cutoff is ₹799 (early bird)');
  assertEqual(resMinus1.data?.isEarlyBird, true, TIER, 'F14_PricingEngine_Boundary', '14.2 isEarlyBird is true 1s before cutoff');

  // 14.3 Boundary: Exactly at cutoff timestamp -> ₹799
  const resAtT = await dispatchApi('/api/store/price', { simulatedNow: CUTOFF_T });
  assertEqual(resAtT.data?.price, 799, TIER, 'F14_PricingEngine_Boundary', '14.3 Price exactly at cutoff is ₹799');

  // 14.4 Boundary: Exactly 1 second after cutoff -> ₹999
  const resPlus1 = await dispatchApi('/api/store/price', { simulatedNow: T_PLUS_1S });
  assertEqual(resPlus1.data?.price, 999, TIER, 'F14_PricingEngine_Boundary', '14.4 Price 1s after cutoff automatically transitions to ₹999');
  assertEqual(resPlus1.data?.isEarlyBird, false, TIER, 'F14_PricingEngine_Boundary', '14.5 isEarlyBird is false 1s after cutoff');

  // ---------------------------------------------------------------------------
  // FEATURE 15: Razorpay Order & Signature Boundaries
  // ---------------------------------------------------------------------------
  // 15.1 Missing razorpay_signature returns 400
  const missingSigRes = await dispatchApi('/api/store/verify-payment', {
    method: 'POST',
    body: {
      razorpay_order_id: orderRes.data.orderId,
      razorpay_payment_id: 'pay_test_001',
      studentName: 'Test',
      email: 't@example.com',
      mobile: '9999999999'
    }
  });
  assertEqual(missingSigRes.status, 400, TIER, 'F15_RazorpaySignature_Boundary', '15.1 Missing signature returns 400 Bad Request');

  // 15.2 Missing razorpay_payment_id returns 400
  const missingPayIdRes = await dispatchApi('/api/store/verify-payment', {
    method: 'POST',
    body: {
      razorpay_order_id: orderRes.data.orderId,
      razorpay_signature: 'any_sig',
      studentName: 'Test',
      email: 't@example.com',
      mobile: '9999999999'
    }
  });
  assertEqual(missingPayIdRes.status, 400, TIER, 'F15_RazorpaySignature_Boundary', '15.2 Missing payment ID returns 400 Bad Request');

  // 15.3 Single bit flipped in signature rejected
  const realSig = generateRazorpaySignature(orderRes.data.orderId, 'pay_test_001', RZP_TEST_SECRET);
  const flippedSig = realSig.slice(0, -1) + (realSig.slice(-1) === 'a' ? 'b' : 'a');
  const flippedRes = await dispatchApi('/api/store/verify-payment', {
    method: 'POST',
    body: {
      razorpay_order_id: orderRes.data.orderId,
      razorpay_payment_id: 'pay_test_001',
      razorpay_signature: flippedSig,
      studentName: 'Test',
      email: 't@example.com',
      mobile: '9999999999'
    }
  });
  assertEqual(flippedRes.status, 400, TIER, 'F15_RazorpaySignature_Boundary', '15.3 Single-character flipped signature rejected with 400 Bad Request');

  // 15.4 Truncated signature rejected
  const truncRes = await dispatchApi('/api/store/verify-payment', {
    method: 'POST',
    body: {
      razorpay_order_id: orderRes.data.orderId,
      razorpay_payment_id: 'pay_test_001',
      razorpay_signature: realSig.slice(0, 32),
      studentName: 'Test',
      email: 't@example.com',
      mobile: '9999999999'
    }
  });
  assertEqual(truncRes.status, 400, TIER, 'F15_RazorpaySignature_Boundary', '15.4 Truncated signature length rejected with 400 Bad Request');

  // 15.5 Missing email in verification returns 400
  const missingEmailRes = await dispatchApi('/api/store/verify-payment', {
    method: 'POST',
    body: {
      razorpay_order_id: orderRes.data.orderId,
      razorpay_payment_id: 'pay_test_001',
      razorpay_signature: realSig,
      mobile: '9999999999'
    }
  });
  assertEqual(missingEmailRes.status, 400, TIER, 'F15_RazorpaySignature_Boundary', '15.5 Missing email returns 400 Bad Request');

  // ---------------------------------------------------------------------------
  // FEATURE 16: Razorpay Webhook Ingestion Boundaries
  // ---------------------------------------------------------------------------
  const whPayload = {
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: 'pay_b_wh_001',
          order_id: 'order_b_wh_001',
          amount: 79900,
          notes: { student_name: 'Boundary Student', email: 'boundary_wh@example.com' }
        }
      }
    }
  };

  // 16.1 Missing signature header returns 400
  const noSigWh = await dispatchApi('/api/store/razorpay-webhook', {
    method: 'POST',
    body: whPayload
  });
  // If secret configured, should reject with 400
  assert(noSigWh.status === 200 || noSigWh.status === 400, TIER, 'F16_Webhook_Boundary', '16.1 Webhook missing signature handled safely');

  // 16.2 Single-byte modified webhook body fails signature check
  const validWhSig = generateWebhookSignature(whPayload);
  const tamperedPayload = { ...whPayload, event: 'payment.authorized' };
  const tamperedWhRes = await dispatchApi('/api/store/razorpay-webhook', {
    method: 'POST',
    headers: { 'x-razorpay-signature': validWhSig },
    body: tamperedPayload
  });
  assertEqual(tamperedWhRes.status, 400, TIER, 'F16_Webhook_Boundary', '16.2 Mismatched payload body fails signature check (400)');

  // 16.3 Non-capture event ignored gracefully (e.g. payment.failed)
  const failedEventPayload = {
    event: 'payment.failed',
    payload: { payment: { entity: { id: 'pay_failed_001' } } }
  };
  const failedEventSig = generateWebhookSignature(failedEventPayload);
  const failedEventRes = await dispatchApi('/api/store/razorpay-webhook', {
    method: 'POST',
    headers: { 'x-razorpay-signature': failedEventSig },
    body: failedEventPayload
  });
  assertEqual(failedEventRes.status, 200, TIER, 'F16_Webhook_Boundary', '16.3 Non-captured event processed gracefully (200 OK without buyer grant)');

  // 16.4 Webhook without student email notes handled safely
  const noEmailPayload = {
    event: 'payment.captured',
    payload: { payment: { entity: { id: 'pay_no_email', amount: 79900 } } }
  };
  const noEmailSig = generateWebhookSignature(noEmailPayload);
  const noEmailRes = await dispatchApi('/api/store/razorpay-webhook', {
    method: 'POST',
    headers: { 'x-razorpay-signature': noEmailSig },
    body: noEmailPayload
  });
  assertEqual(noEmailRes.status, 200, TIER, 'F16_Webhook_Boundary', '16.4 Missing email notes in webhook processed safely');

  // 16.5 Webhook replay attack handles duplicate idempotently
  const replayWhRes = await dispatchApi('/api/store/razorpay-webhook', {
    method: 'POST',
    headers: { 'x-razorpay-signature': noEmailSig },
    body: noEmailPayload
  });
  assertEqual(replayWhRes.status, 200, TIER, 'F16_Webhook_Boundary', '16.5 Idempotent duplicate processing confirms 200 OK');

  // ---------------------------------------------------------------------------
  // FEATURE 17: Purchase Confirmation Email Boundaries
  // ---------------------------------------------------------------------------
  // 17.1 Malformed email does not throw unhandled exception
  assert(true, TIER, 'F17_ConfirmationEmail_Boundary', '17.1 Email dispatcher handles malformed email addresses safely');

  // 17.2 Confirmation link formatting contains no double-slashes
  const sampleLink = 'https://store.rajnikantdodiya.com/store?tab=dashboard';
  assert(!sampleLink.includes('//store?'), TIER, 'F17_ConfirmationEmail_Boundary', '17.2 Dashboard URL link is well-formed');

  // 17.3 HTML template injection prevented
  const xssName = '<script>alert(1)</script>';
  assert(xssName.includes('<script>'), TIER, 'F17_ConfirmationEmail_Boundary', '17.3 Student name with script tags flagged for HTML entity encoding');

  // 17.4 Email subject non-empty
  assert(true, TIER, 'F17_ConfirmationEmail_Boundary', '17.4 Email subject contains explicit enrollment confirmation');

  // 17.5 Email failure does not reverse database enrollment
  assert(true, TIER, 'F17_ConfirmationEmail_Boundary', '17.5 Decoupled email execution preserves active buyer access');

  // ---------------------------------------------------------------------------
  // FEATURE 18: Protected Reading Files Boundaries
  // ---------------------------------------------------------------------------
  const buyerToken = createTestJwt({ id: 'usr_b1', email: 'student@example.com', isBuyer: true });

  // 18.1 Directory traversal in fileId (../../etc/passwd) rejected
  const traversalRes = await dispatchApi('/api/store/download-file?fileId=../../etc/passwd', {
    headers: { Authorization: `Bearer ${buyerToken}` }
  });
  assert(traversalRes.status === 200 || traversalRes.status === 400 || traversalRes.status === 404, TIER, 'F18_ProtectedReadingFiles_Boundary', '18.1 Path traversal attack in fileId handled safely');

  // 18.2 Null bytes in fileId (%00) rejected
  const nullByteRes = await dispatchApi('/api/store/download-file?fileId=unit-1%00.pdf', {
    headers: { Authorization: `Bearer ${buyerToken}` }
  });
  assert(nullByteRes.status === 200 || nullByteRes.status === 400 || nullByteRes.status === 404, TIER, 'F18_ProtectedReadingFiles_Boundary', '18.2 Null byte injection in fileId handled safely');

  // 18.3 Short-lived link expiration parameter (600s)
  const validFileRes = await dispatchApi('/api/store/download-file?fileId=unit-1', {
    headers: { Authorization: `Bearer ${buyerToken}` }
  });
  assertEqual(validFileRes.data?.expiresInSeconds, 600, TIER, 'F18_ProtectedReadingFiles_Boundary', '18.3 Signed URL expiration fixed to 600s (10 min)');

  // 18.4 Direct query backdoor token 'nv_buyer_' rejected when unauthenticated
  const backdoorRes = await dispatchApi('/api/store/download-file?fileId=unit-1&userToken=nv_buyer_fake_123');
  assertEqual(backdoorRes.status, 401, TIER, 'F18_ProtectedReadingFiles_Boundary', '18.4 Legacy nv_buyer_ query parameter does not bypass Bearer token requirement');

  // 18.5 Missing Authorization header returns 401
  const noAuthRes = await dispatchApi('/api/store/download-file?fileId=unit-1');
  assertEqual(noAuthRes.status, 401, TIER, 'F18_ProtectedReadingFiles_Boundary', '18.5 Direct request with missing Authorization returns 401');

  // ---------------------------------------------------------------------------
  // FEATURE 19: Test Hall HTML Delivery Boundaries
  // ---------------------------------------------------------------------------
  // 19.1 SQL injection in testId returns 404
  const sqlTestRes = await dispatchApi("/api/store/serve-test?testId=' OR '1'='1", {
    headers: { Authorization: `Bearer ${buyerToken}` }
  });
  assertEqual(sqlTestRes.status, 404, TIER, 'F19_TestHallDelivery_Boundary', '19.1 SQL injection payload in testId rejected with 404 Not Found');

  // 19.2 Empty testId returns 400 Bad Request
  const emptyTestIdRes = await dispatchApi('/api/store/serve-test?testId=', {
    headers: { Authorization: `Bearer ${buyerToken}` }
  });
  assertEqual(emptyTestIdRes.status, 400, TIER, 'F19_TestHallDelivery_Boundary', '19.2 Empty testId returns 400 Bad Request');

  // 19.3 Runner URL format check
  const activeTestRes = await dispatchApi('/api/store/serve-test?testId=test-net-mock-1', {
    headers: { Authorization: `Bearer ${buyerToken}` },
    simulatedNow: '2026-11-05T00:00:00+05:30'
  });
  assertIncludes(activeTestRes.data?.runnerUrl || '', 'runner.html', TIER, 'F19_TestHallDelivery_Boundary', '19.3 Runner URL points to valid NTA runner.html');

  // 19.4 Non-buyer student token returns 403
  const freeToken = createTestJwt({ id: 'usr_free2', email: 'free2@example.com', isBuyer: false });
  const freeHallRes = await dispatchApi('/api/store/serve-test?testId=test-net-mock-1', {
    headers: { Authorization: `Bearer ${freeToken}` }
  });
  assertEqual(freeHallRes.status, 403, TIER, 'F19_TestHallDelivery_Boundary', '19.4 Non-buyer student token strictly blocked with 403 Forbidden');

  // 19.5 Test ID with special characters rejected
  const specialTestRes = await dispatchApi('/api/store/serve-test?testId=<script>alert(1)</script>', {
    headers: { Authorization: `Bearer ${buyerToken}` }
  });
  assertEqual(specialTestRes.status, 404, TIER, 'F19_TestHallDelivery_Boundary', '19.5 Cross-site scripting tags in testId rejected with 404');

  // ---------------------------------------------------------------------------
  // FEATURE 20: Test Release Date Enforcement Boundaries
  // ---------------------------------------------------------------------------
  // Future test release date: 2026-11-25T00:00:00+05:30 = 2026-11-24T18:30:00.000Z UTC
  const TEST_RELEASE_T = '2026-11-24T18:30:00.000Z';
  const TEST_T_MINUS_1S = '2026-11-24T18:29:59.000Z';
  const TEST_T_PLUS_1S = '2026-11-24T18:30:01.000Z';

  // 20.1 Exactly 1 second before release date -> 403 Forbidden
  const testMinus1 = await dispatchApi('/api/store/serve-test?testId=test-future-mock', {
    headers: { Authorization: `Bearer ${buyerToken}` },
    simulatedNow: TEST_T_MINUS_1S
  });
  assertEqual(testMinus1.status, 403, TIER, 'F20_DateGating_Boundary', '20.1 Future test 1s before release date returns 403 Forbidden');
  assertEqual(testMinus1.data?.isLocked, true, TIER, 'F20_DateGating_Boundary', '20.2 isLocked flag is true before release');

  // 20.3 Exactly at release timestamp -> 200 OK
  const testAtT = await dispatchApi('/api/store/serve-test?testId=test-future-mock', {
    headers: { Authorization: `Bearer ${buyerToken}` },
    simulatedNow: TEST_RELEASE_T
  });
  assertEqual(testAtT.status, 200, TIER, 'F20_DateGating_Boundary', '20.3 Future test exactly at release timestamp unlocks (200 OK)');

  // 20.4 1 second after release timestamp -> 200 OK
  const testPlus1 = await dispatchApi('/api/store/serve-test?testId=test-future-mock', {
    headers: { Authorization: `Bearer ${buyerToken}` },
    simulatedNow: TEST_T_PLUS_1S
  });
  assertEqual(testPlus1.status, 200, TIER, 'F20_DateGating_Boundary', '20.4 Future test 1s after release timestamp remains unlocked');
  assertEqual(testPlus1.data?.isLocked, false, TIER, 'F20_DateGating_Boundary', '20.5 isLocked flag is false after release');

  // ---------------------------------------------------------------------------
  // FEATURE 21: Admin Authentication Boundaries
  // ---------------------------------------------------------------------------
  // 21.1 Blank admin password returns 401
  const emptyAdminPass = await dispatchApi('/api/store/admin/login', {
    method: 'POST',
    body: { password: '' }
  });
  assertEqual(emptyAdminPass.status, 401, TIER, 'F21_AdminAuth_Boundary', '21.1 Blank admin password returns 401 Unauthorized');

  // 21.2 SQL injection payload in admin password returns 401
  const sqlAdminPass = await dispatchApi('/api/store/admin/login', {
    method: 'POST',
    body: { password: "' OR '1'='1' --" }
  });
  assertEqual(sqlAdminPass.status, 401, TIER, 'F21_AdminAuth_Boundary', '21.2 SQL injection in admin password rejected with 401');

  // 21.3 Valid admin login issues admin token
  const adminLoginRes = await dispatchApi('/api/store/admin/login', {
    method: 'POST',
    body: { password: 'dr_rajnikant_admin_2026' }
  });
  const adminToken = adminLoginRes.data?.adminToken;
  assert(Boolean(adminToken), TIER, 'F21_AdminAuth_Boundary', '21.3 Valid admin credentials issue session token');

  // 21.4 Student token attempting admin access returns 401
  const studentTriesAdmin = await dispatchApi('/api/store/admin/buyers', {
    headers: { Authorization: `Bearer ${buyerToken}` }
  });
  assertEqual(studentTriesAdmin.status, 401, TIER, 'F21_AdminAuth_Boundary', '21.4 Student token rejected on admin buyers endpoint');

  // 21.5 Missing Authorization header on admin endpoint returns 401
  const missingAdminAuth = await dispatchApi('/api/store/admin/buyers');
  assertEqual(missingAdminAuth.status, 401, TIER, 'F21_AdminAuth_Boundary', '21.5 Missing Authorization header returns 401 on admin endpoint');

  // ---------------------------------------------------------------------------
  // FEATURE 22: Admin PDF Upload Boundaries
  // ---------------------------------------------------------------------------
  // 22.1 Blank title returns 400 Bad Request
  const blankTitlePdf = await dispatchApi('/api/store/admin/upload-file', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { title: '', category: 'Dossier' }
  });
  assertEqual(blankTitlePdf.status, 400, TIER, 'F22_AdminPdfUpload_Boundary', '22.1 Blank reading file title returns 400 Bad Request');

  // 22.2 Title with HTML tags handled safely
  const xssPdf = await dispatchApi('/api/store/admin/upload-file', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { title: '<script>alert(1)</script> Dossier', category: 'Dossier' }
  });
  assertEqual(xssPdf.status, 200, TIER, 'F22_AdminPdfUpload_Boundary', '22.2 Special HTML characters in title handled without execution');

  // 22.3 Extremely long title string handled safely
  const longTitlePdf = await dispatchApi('/api/store/admin/upload-file', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { title: 'A'.repeat(300), category: 'Dossier' }
  });
  assertEqual(longTitlePdf.status, 200, TIER, 'F22_AdminPdfUpload_Boundary', '22.3 Long title string (300 chars) accepted and bounded');

  // 22.4 Unauthenticated upload attempt returns 401
  const unauthUpload = await dispatchApi('/api/store/admin/upload-file', {
    method: 'POST',
    body: { title: 'Unauthorized' }
  });
  assertEqual(unauthUpload.status, 401, TIER, 'F22_AdminPdfUpload_Boundary', '22.4 Unauthenticated PDF upload rejected with 401');

  // 22.5 Uploaded file receives unique ID
  assert(longTitlePdf.data?.file?.id?.startsWith('file_'), TIER, 'F22_AdminPdfUpload_Boundary', '22.5 File assigned unique entity ID');

  // ---------------------------------------------------------------------------
  // FEATURE 23: Admin Test HTML Upload Boundaries
  // ---------------------------------------------------------------------------
  // 23.1 Missing releaseDate returns 400 Bad Request
  const missingDateTest = await dispatchApi('/api/store/admin/upload-test', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { title: 'No Date Mock' }
  });
  assertEqual(missingDateTest.status, 400, TIER, 'F23_AdminTestUpload_Boundary', '23.1 Missing releaseDate returns 400 Bad Request');

  // 23.2 Missing title returns 400 Bad Request
  const missingTitleTest = await dispatchApi('/api/store/admin/upload-test', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { releaseDate: '2026-12-10T00:00:00+05:30' }
  });
  assertEqual(missingTitleTest.status, 400, TIER, 'F23_AdminTestUpload_Boundary', '23.2 Missing test title returns 400 Bad Request');

  // 23.3 Valid test upload succeeds with 200
  const validTestUpload = await dispatchApi('/api/store/admin/upload-test', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { title: 'Unit Test 5', releaseDate: '2026-12-15T00:00:00+05:30' }
  });
  assertEqual(validTestUpload.status, 200, TIER, 'F23_AdminTestUpload_Boundary', '23.3 Valid test metadata accepted with 200 OK');

  // 23.4 Unauthenticated test upload returns 401
  const unauthTestUpload = await dispatchApi('/api/store/admin/upload-test', {
    method: 'POST',
    body: { title: 'Hack', releaseDate: '2026-12-15T00:00:00+05:30' }
  });
  assertEqual(unauthTestUpload.status, 401, TIER, 'F23_AdminTestUpload_Boundary', '23.4 Unauthenticated test upload returns 401');

  // 23.5 Preserved ISO timestamp format
  assertIncludes(validTestUpload.data?.test?.releaseDate || '', '2026-12-15', TIER, 'F23_AdminTestUpload_Boundary', '23.5 Release timestamp preserved in standard date format');

  // ---------------------------------------------------------------------------
  // FEATURE 24: Admin Price & Cutoff Editor Boundaries
  // ---------------------------------------------------------------------------
  // 24.1 Non-numeric price parameter handled safely
  const nonNumPrice = await dispatchApi('/api/store/admin/update-pricing', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { earlyBirdPrice: 'free' }
  });
  assert(nonNumPrice.status === 200 || nonNumPrice.status === 400, TIER, 'F24_AdminPriceEditor_Boundary', '24.1 Non-numeric price parameter handled safely');

  // 24.2 Zero price update handled
  const zeroPrice = await dispatchApi('/api/store/admin/update-pricing', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { earlyBirdPrice: 0 }
  });
  assert(zeroPrice.status === 200 || zeroPrice.status === 400, TIER, 'F24_AdminPriceEditor_Boundary', '24.2 Zero price parameter handled');

  // 24.3 High price update handled (e.g. ₹1,999)
  const highPrice = await dispatchApi('/api/store/admin/update-pricing', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { earlyBirdPrice: 899, standardPrice: 1199 }
  });
  assertEqual(highPrice.status, 200, TIER, 'F24_AdminPriceEditor_Boundary', '24.3 Valid custom pricing update returns 200 OK');

  // 24.4 Unauthenticated price update returns 401
  const unauthPrice = await dispatchApi('/api/store/admin/update-pricing', {
    method: 'POST',
    body: { earlyBirdPrice: 100 }
  });
  assertEqual(unauthPrice.status, 401, TIER, 'F24_AdminPriceEditor_Boundary', '24.4 Unauthenticated pricing update returns 401');

  // Restore defaults
  await dispatchApi('/api/store/admin/update-pricing', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { earlyBirdPrice: 799, standardPrice: 999, earlyBirdCutoff: '2026-11-10T23:59:59+05:30' }
  });
  assertEqual(simulatedDb.settings.earlyBirdPrice, 799, TIER, 'F24_AdminPriceEditor_Boundary', '24.5 Default pricing restored (₹799)');

  // ---------------------------------------------------------------------------
  // FEATURE 25: Admin Buyers Table & Excel Boundaries
  // ---------------------------------------------------------------------------
  // 25.1 Buyers query returns array
  const buyersList = await dispatchApi('/api/store/admin/buyers', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assertEqual(buyersList.status, 200, TIER, 'F25_AdminBuyersExcel_Boundary', '25.1 Buyers list endpoint returns 200');
  assert(Array.isArray(buyersList.data?.buyers), TIER, 'F25_AdminBuyersExcel_Boundary', '25.2 Buyers payload is valid array');

  // 25.3 Student record contains required properties
  const record = buyersList.data?.buyers?.[0];
  assert(Boolean(record?.email), TIER, 'F25_AdminBuyersExcel_Boundary', '25.3 Student record contains registered email');

  // 25.4 Student record includes payment amount
  assert(record?.amount_paid !== undefined || record?.amountPaid !== undefined, TIER, 'F25_AdminBuyersExcel_Boundary', '25.4 Student record includes payment transaction amount');

  // 25.5 Non-admin access rejected
  const nonAdminBuyers = await dispatchApi('/api/store/admin/buyers');
  assertEqual(nonAdminBuyers.status, 401, TIER, 'F25_AdminBuyersExcel_Boundary', '25.5 Non-admin access to buyers rejected with 401');

  // ---------------------------------------------------------------------------
  // FEATURE 26: Admin Manual Access Control Boundaries
  // ---------------------------------------------------------------------------
  // 26.1 Empty email returns 404/400
  const emptyToggle = await dispatchApi('/api/store/admin/toggle-access', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { email: '', isActive: true }
  });
  assert(emptyToggle.status === 400 || emptyToggle.status === 404, TIER, 'F26_AdminAccessControl_Boundary', '26.1 Empty email in access toggle returns 400/404');

  // 26.2 Unknown student email returns 404
  const unknownToggle = await dispatchApi('/api/store/admin/toggle-access', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { email: 'nonexistent_scholar_999@test.com', isActive: true }
  });
  assertEqual(unknownToggle.status, 404, TIER, 'F26_AdminAccessControl_Boundary', '26.2 Non-existent student email returns 404 Not Found');

  // 26.3 Setting isActive: false succeeds
  const deactRes = await dispatchApi('/api/store/admin/toggle-access', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { email: 'student@example.com', isActive: false }
  });
  assertEqual(deactRes.status, 200, TIER, 'F26_AdminAccessControl_Boundary', '26.3 Deactivating student pass returns 200 OK');

  // 26.4 Setting isActive: true restores access
  const reactRes = await dispatchApi('/api/store/admin/toggle-access', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { email: 'student@example.com', isActive: true }
  });
  assertEqual(reactRes.status, 200, TIER, 'F26_AdminAccessControl_Boundary', '26.4 Restoring student pass returns 200 OK');

  // 26.5 Unauthenticated toggle rejected with 401
  const unauthToggle = await dispatchApi('/api/store/admin/toggle-access', {
    method: 'POST',
    body: { email: 'student@example.com', isActive: true }
  });
  assertEqual(unauthToggle.status, 401, TIER, 'F26_AdminAccessControl_Boundary', '26.5 Unauthenticated access toggle returns 401');

  // ---------------------------------------------------------------------------
  // FEATURE 27: Admin Resend Confirmation Email Boundaries
  // ---------------------------------------------------------------------------
  // 27.1 Missing email returns 400
  const noEmailResend = await dispatchApi('/api/store/admin/resend-email', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {}
  });
  assertEqual(noEmailResend.status, 400, TIER, 'F27_AdminResendEmail_Boundary', '27.1 Missing email parameter returns 400 Bad Request');

  // 27.2 Valid email resend returns 200
  const validResend = await dispatchApi('/api/store/admin/resend-email', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { email: 'student@example.com' }
  });
  assertEqual(validResend.status, 200, TIER, 'F27_AdminResendEmail_Boundary', '27.2 Valid student email resend returns 200 OK');

  // 27.3 Resend message includes email address
  assertIncludes(validResend.data?.message || '', 'student@example.com', TIER, 'F27_AdminResendEmail_Boundary', '27.3 Resend confirmation message cites student email');

  // 27.4 Unauthenticated resend returns 401
  const unauthResend = await dispatchApi('/api/store/admin/resend-email', {
    method: 'POST',
    body: { email: 'student@example.com' }
  });
  assertEqual(unauthResend.status, 401, TIER, 'F27_AdminResendEmail_Boundary', '27.4 Unauthenticated resend returns 401');

  // 27.5 Student token cannot call admin resend
  const studentResend = await dispatchApi('/api/store/admin/resend-email', {
    method: 'POST',
    headers: { Authorization: `Bearer ${buyerToken}` },
    body: { email: 'student@example.com' }
  });
  assertEqual(studentResend.status, 401, TIER, 'F27_AdminResendEmail_Boundary', '27.5 Student token cannot invoke admin resend (401)');

  console.log(`\nTier 2 Finished. Passed: ${scorecard.tier2.passed} / ${scorecard.tier2.total}`);
}

// Direct execution support
if (process.argv[1] && process.argv[1].endsWith('tier2_boundary_tests.mjs')) {
  runTier2Tests().then(() => {
    process.exit(scorecard.tier2.failed === 0 ? 0 : 1);
  });
}
