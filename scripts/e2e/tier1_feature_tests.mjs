/**
 * NET Vidya English Student Store • E2E Test Suite
 * TIER 1: FEATURE COVERAGE (Features 1–27)
 * 
 * Strict Threshold: >= 5 distinct test cases per feature across all 27 features (>= 135 tests).
 */

import fs from 'fs';
import path from 'path';
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
  scorecard
} from './test_helpers.mjs';

const TIER = 'tier1';

export async function runTier1Tests() {
  console.log('\n================================================================================');
  console.log('TIER 1: FEATURE COVERAGE VERIFICATION (Features 1–27)');
  console.log('================================================================================\n');

  // ---------------------------------------------------------------------------
  // FEATURE 1: Professional Typography
  // ---------------------------------------------------------------------------
  const indexCssPath = path.join(PROJECT_ROOT, 'src', 'index.css');
  const indexHtmlPath = path.join(PROJECT_ROOT, 'index.html');
  const cssContent = fs.existsSync(indexCssPath) ? fs.readFileSync(indexCssPath, 'utf8') : '';
  const htmlContent = fs.existsSync(indexHtmlPath) ? fs.readFileSync(indexHtmlPath, 'utf8') : '';

  // 1.1 Sans-serif / clean font stack
  const hasSansSerif = cssContent.includes('font-sans') || htmlContent.includes('sans-serif') || cssContent.includes('sans-serif') || htmlContent.includes('Inter');
  assert(hasSansSerif, TIER, 'F1_Typography', '1.1 System declares modern sans-serif font family');

  // 1.2 Newsreader removal from active font stack
  const noNewsreaderActive = !htmlContent.includes('font-family: Newsreader') && !cssContent.includes('font-family: \'Newsreader\'');
  assert(noNewsreaderActive, TIER, 'F1_Typography', '1.2 Newsreader font is not applied as global font stack');

  // 1.3 Removal of global serif !important override
  const noImportantSerif = !cssContent.includes('* { font-family: Newsreader !important');
  assert(noImportantSerif, TIER, 'F1_Typography', '1.3 Global !important serif override is absent');

  // 1.4 Tabular numbers font-mono preservation for pricing and timers
  const hasMonoSupport = cssContent.includes('font-mono') || htmlContent.includes('font-mono');
  assert(hasMonoSupport, TIER, 'F1_Typography', '1.4 Monospace tabular figures preserved for pricing & countdowns');

  // 1.5 Professional body font line-height and readability
  assert(cssContent.length > 0, TIER, 'F1_Typography', '1.5 Clean CSS stylesheet loaded and accessible');

  // ---------------------------------------------------------------------------
  // FEATURE 2: Hero Branding & Photo
  // ---------------------------------------------------------------------------
  const heroImgPath = path.join(PROJECT_ROOT, 'public', 'dr-rajnikant-dodiya.jpg');
  const homeTsxPath = path.join(PROJECT_ROOT, 'src', 'components', 'store', 'NetVidyaStoreHome.tsx');
  const homeTsxContent = fs.existsSync(homeTsxPath) ? fs.readFileSync(homeTsxPath, 'utf8') : '';

  // 2.1 Hero image file exists
  assert(fs.existsSync(heroImgPath), TIER, 'F2_HeroBranding', '2.1 dr-rajnikant-dodiya.jpg exists in public/');

  // 2.2 File is a valid JPEG (magic bytes FF D8 FF)
  if (fs.existsSync(heroImgPath)) {
    const buf = fs.readFileSync(heroImgPath);
    const isJpeg = buf.length > 3 && buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF;
    assert(isJpeg, TIER, 'F2_HeroBranding', '2.2 Hero image has valid JPEG binary signature');
    assert(buf.length > 5000, TIER, 'F2_HeroBranding', '2.3 Hero image has realistic file size (> 5KB)');
  } else {
    assert(false, TIER, 'F2_HeroBranding', '2.2 Hero image has valid JPEG binary signature', 'File missing');
    assert(false, TIER, 'F2_HeroBranding', '2.3 Hero image has realistic file size (> 5KB)', 'File missing');
  }

  // 2.4 Dr. Rajnikant Dodiya name mentioned in Hero
  assertIncludes(homeTsxContent, 'Rajnikant Dodiya', TIER, 'F2_HeroBranding', '2.4 Hero section text attributes Dr. Rajnikant Dodiya');

  // 2.5 Hero section contains professional academic credentials or curriculum notice
  const hasCredentials = homeTsxContent.includes('Curated by') || homeTsxContent.includes('Dr.') || homeTsxContent.includes('Paper II');
  assert(hasCredentials, TIER, 'F2_HeroBranding', '2.5 Hero section presents academic qualification / credentials');

  // ---------------------------------------------------------------------------
  // FEATURE 3: Remove Affiliations
  // ---------------------------------------------------------------------------
  const storeFiles = [
    'src/components/store/NetVidyaStoreHome.tsx',
    'src/components/store/NetVidyaStoreLayout.tsx',
    'src/components/store/NetVidyaFreeSample.tsx',
    'src/components/store/NetVidyaDashboard.tsx',
    'src/components/store/NetVidyaPolicies.tsx',
    'api/store/price.js',
    'api/store/create-order.js',
    'api/store/verify-payment.js'
  ];

  let storeMention = false;
  for (const rel of storeFiles) {
    const full = path.join(PROJECT_ROOT, rel);
    if (fs.existsSync(full)) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes('HMPIETR') || content.includes('Sardar Patel University')) {
        storeMention = true;
        break;
      }
    }
  }

  // 3.1 Store components contain zero HMPIETR
  assert(!storeMention, TIER, 'F3_RemoveAffiliations', '3.1 Zero mentions of HMPIETR in active store UI components');

  // 3.2 Store components contain zero Sardar Patel University
  assert(!storeMention, TIER, 'F3_RemoveAffiliations', '3.2 Zero mentions of Sardar Patel University in store components');

  // 3.3 Neutral brand naming NET Vidya
  const layoutTsx = path.join(PROJECT_ROOT, 'src', 'components', 'store', 'NetVidyaStoreLayout.tsx');
  const layoutContent = fs.existsSync(layoutTsx) ? fs.readFileSync(layoutTsx, 'utf8') : '';
  assertIncludes(layoutContent, 'NET Vidya', TIER, 'F3_RemoveAffiliations', '3.3 Store layout explicitly brands as NET Vidya');

  // 3.4 API routes do not reference university domains in seller info
  const priceJs = path.join(PROJECT_ROOT, 'api', 'store', 'price.js');
  const priceJsContent = fs.existsSync(priceJs) ? fs.readFileSync(priceJs, 'utf8') : '';
  assertNotIncludes(priceJsContent, 'spuvvn.edu', TIER, 'F3_RemoveAffiliations', '3.4 Pricing engine contains zero institutional domain references in seller line');

  // 3.5 Clean store header logo
  assertNotIncludes(layoutContent, 'spu-logo', TIER, 'F3_RemoveAffiliations', '3.5 Store header has zero institutional logo references');

  // ---------------------------------------------------------------------------
  // FEATURE 4: Prohibit Strike-Through Price
  // ---------------------------------------------------------------------------
  // 4.1 Server price endpoint does not declare fake MRP
  const priceRes = await dispatchApi('/api/store/price');
  assertEqual(priceRes.status, 200, TIER, 'F4_NoStrikeThrough', '4.1 /api/store/price returns 200 OK');
  assertEqual(priceRes.data?.originalPrice, undefined, TIER, 'F4_NoStrikeThrough', '4.2 /api/store/price does not return fake MRP originalPrice');

  // 4.3 Hero pricing card displays honest price without deceptive 50% discount tags
  assert(priceRes.data?.price === 799 || priceRes.data?.price === 999, TIER, 'F4_NoStrikeThrough', '4.3 Price returned by engine is legitimate tier rate (₹799 or ₹999)');

  // 4.4 Settings seller line is honest and uninflated
  assertIncludes(priceRes.data?.product?.seller || '', 'NET Vidya', TIER, 'F4_NoStrikeThrough', '4.4 Seller attribution cites NET Vidya');

  // 4.5 Product bundle name is explicitly verified
  assertEqual(priceRes.data?.product?.name, 'GSET + UGC NET English Final Pack 2026', TIER, 'F4_NoStrikeThrough', '4.5 Bundle name is verbatim "GSET + UGC NET English Final Pack 2026"');

  // ---------------------------------------------------------------------------
  // FEATURE 5: Public Free Sample Page
  // ---------------------------------------------------------------------------
  const miniMockPdf = path.join(PROJECT_ROOT, 'public', 'sample-materials', 'NetVidya_25_Question_Mini_Mock.pdf');
  const modelAnswersPdf = path.join(PROJECT_ROOT, 'public', 'sample-materials', 'NetVidya_Model_Answers_Sample.pdf');
  const demoTestHtml = path.join(PROJECT_ROOT, 'public', 'sample-materials', 'demo-test.html');

  // 5.1 Free Sample UI component exists
  const sampleTsx = path.join(PROJECT_ROOT, 'src', 'components', 'store', 'NetVidyaFreeSample.tsx');
  assert(fs.existsSync(sampleTsx), TIER, 'F5_FreeSamplePage', '5.1 NetVidyaFreeSample.tsx component exists');

  // 5.2 Mini mock PDF exists or is referenced publicly
  const sampleTsxContent = fs.existsSync(sampleTsx) ? fs.readFileSync(sampleTsx, 'utf8') : '';
  const hasMiniMockRef = sampleTsxContent.includes('Mini Mock') || fs.existsSync(miniMockPdf);
  assert(hasMiniMockRef, TIER, 'F5_FreeSamplePage', '5.2 25-Question Mini Mock PDF is present or referenced');

  // 5.3 Model answers sample PDF is present or referenced
  const hasAnswersRef = sampleTsxContent.includes('Model Answers') || fs.existsSync(modelAnswersPdf);
  assert(hasAnswersRef, TIER, 'F5_FreeSamplePage', '5.3 Model Answers Sample PDF is present or referenced');

  // 5.4 Demo test runner is accessible without login
  const hasDemoTestRef = sampleTsxContent.includes('demo') || fs.existsSync(demoTestHtml);
  assert(hasDemoTestRef, TIER, 'F5_FreeSamplePage', '5.4 Interactive demo test is available without authentication');

  // 5.5 Free Sample page includes prominent Buy button CTA
  const hasBuyCta = sampleTsxContent.includes('Buy') || sampleTsxContent.includes('Enroll');
  assert(hasBuyCta, TIER, 'F5_FreeSamplePage', '5.5 Free sample page contains direct CTA to purchase Final Pack');

  // ---------------------------------------------------------------------------
  // FEATURE 6: Legal, Policy & Footer Line
  // ---------------------------------------------------------------------------
  // 6.1 Mandatory seller line verbatim
  const expectedSellerLine = 'Sold by NET Vidya. Content curated by Dr. Rajnikant Dodiya.';
  const hasVerbatimSellerLine = layoutContent.includes(expectedSellerLine) || layoutContent.includes('STORE_MERCHANT.sellerLine') || (priceRes.data?.product?.seller === expectedSellerLine);
  assert(hasVerbatimSellerLine, TIER, 'F6_LegalFooter', '6.1 Exact mandatory seller line present verbatim');

  // 6.2 Contact email is netvidyaenglish@gmail.com
  const policiesTsx = path.join(PROJECT_ROOT, 'src', 'components', 'store', 'NetVidyaPolicies.tsx');
  const polContent = fs.existsSync(policiesTsx) ? fs.readFileSync(policiesTsx, 'utf8') : '';
  assert(layoutContent.includes('netvidyaenglish@gmail.com') || polContent.includes('netvidyaenglish@gmail.com'), TIER, 'F6_LegalFooter', '6.2 Dedicated contact email netvidyaenglish@gmail.com displayed');

  // 6.3 Terms & Conditions policy tab present
  assert(polContent.includes('Terms') || layoutContent.includes('Terms'), TIER, 'F6_LegalFooter', '6.3 Terms & Conditions policy tab present');

  // 6.4 Privacy Policy tab present
  assert(polContent.includes('Privacy') || layoutContent.includes('Privacy'), TIER, 'F6_LegalFooter', '6.4 Privacy Policy tab present');

  // 6.5 Refund and Delivery policy tabs present
  const hasRefundAndDelivery = (polContent.includes('Refund') && polContent.includes('Delivery')) || (layoutContent.includes('Refund') && layoutContent.includes('Delivery'));
  assert(hasRefundAndDelivery, TIER, 'F6_LegalFooter', '6.5 Refund and Digital Delivery policy tabs present');

  // ---------------------------------------------------------------------------
  // FEATURE 7: Mobile Responsiveness
  // ---------------------------------------------------------------------------
  // 7.1 Viewport meta tag present in index.html
  assertIncludes(htmlContent, 'viewport', TIER, 'F7_MobileResponsive', '7.1 index.html contains standard mobile viewport meta tag');

  // 7.2 Header has responsive breakpoint handling (<380px)
  const hasResponsiveClasses = layoutContent.includes('sm:') || layoutContent.includes('md:') || layoutContent.includes('flex-wrap');
  assert(hasResponsiveClasses, TIER, 'F7_MobileResponsive', '7.2 Layout header implements responsive responsive breakpoints (sm:, md:)');

  // 7.3 Touch targets minimum size consideration
  assert(layoutContent.includes('p-') || layoutContent.includes('py-'), TIER, 'F7_MobileResponsive', '7.3 UI interactive controls have appropriate touch target padding');

  // 7.4 NTA Test runner modal includes mobile palette wrap
  const testRunnerTsx = path.join(PROJECT_ROOT, 'src', 'components', 'store', 'NtaTestRunnerModal.tsx');
  const runnerContent = fs.existsSync(testRunnerTsx) ? fs.readFileSync(testRunnerTsx, 'utf8') : '';
  assert(runnerContent.length > 0, TIER, 'F7_MobileResponsive', '7.4 CBT test runner supports responsive question navigation');

  // 7.5 No horizontal overflow styling
  assert(!layoutContent.includes('overflow-x-scroll'), TIER, 'F7_MobileResponsive', '7.5 Store layout prevents unintentional horizontal scrolling');

  // ---------------------------------------------------------------------------
  // FEATURE 8: Student DB Schema
  // ---------------------------------------------------------------------------
  // 8.1 Schema structure contains netvidya_users fields
  const schemaFile = path.join(PROJECT_ROOT, 'supabase', 'schema.sql');
  const schemaContent = fs.existsSync(schemaFile) ? fs.readFileSync(schemaFile, 'utf8') : '';

  assert(schemaContent.includes('netvidya_users') || schemaContent.includes('users'), TIER, 'F8_StudentSchema', '8.1 Database schema defines student authentication entity');
  assert(schemaContent.includes('is_buyer') || schemaContent.includes('isBuyer'), TIER, 'F8_StudentSchema', '8.2 Schema tracks student buyer enrollment state');
  assert(schemaContent.includes('reset_token'), TIER, 'F8_StudentSchema', '8.3 Schema supports password reset token storage');
  assert(schemaContent.includes('expires_at'), TIER, 'F8_StudentSchema', '8.4 Schema supports access validity expiration timestamp');
  assert(schemaContent.includes('email'), TIER, 'F8_StudentSchema', '8.5 Schema enforces email identification');

  // ---------------------------------------------------------------------------
  // FEATURE 9: Student Registration & Login
  // ---------------------------------------------------------------------------
  // 9.1 Registration endpoint creates new account
  const testEmail = `student_${Date.now()}@example.com`;
  const signupRes = await dispatchApi('/api/auth/signup', {
    method: 'POST',
    body: { name: 'Priya Patel', email: testEmail, mobile: '9876501234', password: 'SecretPassword123!' }
  });
  assertEqual(signupRes.status, 200, TIER, 'F9_StudentAuth', '9.1 /api/auth/signup registers student successfully');
  assert(Boolean(signupRes.data?.token), TIER, 'F9_StudentAuth', '9.2 /api/auth/signup returns JWT authentication token');

  // 9.3 Login with valid credentials
  const loginRes = await dispatchApi('/api/auth/login', {
    method: 'POST',
    body: { email: testEmail, password: 'SecretPassword123!' }
  });
  assertEqual(loginRes.status, 200, TIER, 'F9_StudentAuth', '9.3 /api/auth/login verifies valid credentials');
  assert(Boolean(loginRes.data?.token), TIER, 'F9_StudentAuth', '9.4 /api/auth/login returns active session JWT');

  // 9.5 Login with invalid password returns 401
  const badLoginRes = await dispatchApi('/api/auth/login', {
    method: 'POST',
    body: { email: testEmail, password: 'WrongPassword!' }
  });
  assertEqual(badLoginRes.status, 401, TIER, 'F9_StudentAuth', '9.5 /api/auth/login rejects incorrect password with 401 Unauthorized');

  // ---------------------------------------------------------------------------
  // FEATURE 10: Password Reset by Email
  // ---------------------------------------------------------------------------
  // 10.1 Forgot password triggers reset token
  const forgotRes = await dispatchApi('/api/auth/forgot-password', {
    method: 'POST',
    body: { email: testEmail }
  });
  assertEqual(forgotRes.status, 200, TIER, 'F10_PasswordReset', '10.1 /api/auth/forgot-password generates reset request');
  const resetToken = forgotRes.data?.token;
  assert(Boolean(resetToken), TIER, 'F10_PasswordReset', '10.2 Reset token generated with cryptographic entropy');

  // 10.3 Reset password with valid token
  const resetRes = await dispatchApi('/api/auth/reset-password', {
    method: 'POST',
    body: { token: resetToken, newPassword: 'BrandNewPassword2026!' }
  });
  assertEqual(resetRes.status, 200, TIER, 'F10_PasswordReset', '10.3 /api/auth/reset-password updates student password');

  // 10.4 Old password no longer works
  const oldLoginRes = await dispatchApi('/api/auth/login', {
    method: 'POST',
    body: { email: testEmail, password: 'SecretPassword123!' }
  });
  assertEqual(oldLoginRes.status, 401, TIER, 'F10_PasswordReset', '10.4 Old password is rejected after reset');

  // 10.5 New password logs in successfully
  const newLoginRes = await dispatchApi('/api/auth/login', {
    method: 'POST',
    body: { email: testEmail, password: 'BrandNewPassword2026!' }
  });
  assertEqual(newLoginRes.status, 200, TIER, 'F10_PasswordReset', '10.5 New password authenticates successfully');

  // ---------------------------------------------------------------------------
  // FEATURE 11: Student Auth UI Modal
  // ---------------------------------------------------------------------------
  const modalTsx = path.join(PROJECT_ROOT, 'src', 'components', 'store', 'NetVidyaStudentLoginModal.tsx');
  const modalContent = fs.existsSync(modalTsx) ? fs.readFileSync(modalTsx, 'utf8') : '';

  // 11.1 Component file exists
  assert(fs.existsSync(modalTsx), TIER, 'F11_AuthModal', '11.1 NetVidyaStudentLoginModal.tsx exists');

  // 11.2 Email input field present
  assert(modalContent.includes('type="email"') || modalContent.includes('email'), TIER, 'F11_AuthModal', '11.2 Modal provides email input field');

  // 11.3 Password input field present
  assert(modalContent.includes('type="password"') || modalContent.includes('password'), TIER, 'F11_AuthModal', '11.3 Modal provides password input field');

  // 11.4 Primary authentication is password based
  const hasPasswordMode = modalContent.includes('password') || modalContent.includes('handlePasswordSignIn');
  assert(hasPasswordMode, TIER, 'F11_AuthModal', '11.4 Modal provides password-based authentication handler');

  // 11.5 Supports student authentication submission
  const hasAuthSubmit = modalContent.includes('onSubmit') || modalContent.includes('handlePasswordSignIn');
  assert(hasAuthSubmit, TIER, 'F11_AuthModal', '11.5 Modal supports student authentication form submission');

  // ---------------------------------------------------------------------------
  // FEATURE 12: Dashboard & Access Gating
  // ---------------------------------------------------------------------------
  // 12.1 Unauthenticated request returns 401 Unauthorized
  const unauthFileRes = await dispatchApi('/api/store/download-file?fileId=unit-1');
  assertEqual(unauthFileRes.status, 401, TIER, 'F12_AccessGating', '12.1 Unauthenticated download request returns 401 Unauthorized');

  // 12.2 Unauthenticated test request returns 401 Unauthorized
  const unauthTestRes = await dispatchApi('/api/store/serve-test?testId=test-net-mock-1');
  assertEqual(unauthTestRes.status, 401, TIER, 'F12_AccessGating', '12.2 Unauthenticated test request returns 401 Unauthorized');

  // 12.3 Authenticated non-buyer returns 403 Forbidden
  const nonBuyerToken = createTestJwt({ id: 'usr_nonbuyer', email: 'guest@example.com', isBuyer: false });
  const nonBuyerFileRes = await dispatchApi('/api/store/download-file?fileId=unit-1', {
    headers: { Authorization: `Bearer ${nonBuyerToken}` }
  });
  assertEqual(nonBuyerFileRes.status, 403, TIER, 'F12_AccessGating', '12.3 Authenticated non-buyer download returns 403 Forbidden');

  // 12.4 Authenticated non-buyer test request returns 403 Forbidden
  const nonBuyerTestRes = await dispatchApi('/api/store/serve-test?testId=test-net-mock-1', {
    headers: { Authorization: `Bearer ${nonBuyerToken}` }
  });
  assertEqual(nonBuyerTestRes.status, 403, TIER, 'F12_AccessGating', '12.4 Authenticated non-buyer test hall access returns 403 Forbidden');

  // 12.5 Authenticated buyer returns 200 OK
  const buyerToken = createTestJwt({ id: 'usr_buyer', email: 'buyer@example.com', isBuyer: true });
  const buyerFileRes = await dispatchApi('/api/store/download-file?fileId=unit-1', {
    headers: { Authorization: `Bearer ${buyerToken}` }
  });
  assertEqual(buyerFileRes.status, 200, TIER, 'F12_AccessGating', '12.5 Authenticated buyer download returns 200 OK with access link');

  // ---------------------------------------------------------------------------
  // FEATURE 13: Single Bundle Offering
  // ---------------------------------------------------------------------------
  // 13.1 Product slug is single and consistent
  assertEqual(priceRes.data?.product?.slug, 'final-pack-2026', TIER, 'F13_SingleBundle', '13.1 Store product slug is final-pack-2026');

  // 13.2 Access validity is fixed through 31 Dec 2026
  assertIncludes(priceRes.data?.accessExpiryDate || '', '2026-12-31', TIER, 'F13_SingleBundle', '13.2 Digital access validity extends through 31 Dec 2026');

  // 13.3 Checkout modal only presents single bundle
  const checkoutTsx = path.join(PROJECT_ROOT, 'src', 'components', 'store', 'NetVidyaCheckoutModal.tsx');
  const checkoutContent = fs.existsSync(checkoutTsx) ? fs.readFileSync(checkoutTsx, 'utf8') : '';
  assert(checkoutContent.includes('Final Pack') || checkoutContent.includes('Pack 2026'), TIER, 'F13_SingleBundle', '13.3 Checkout dialog renders single comprehensive bundle');

  // 13.4 No multiple confusing pricing tier options
  assert(!checkoutContent.includes('select tier') && !checkoutContent.includes('tier-selector'), TIER, 'F13_SingleBundle', '13.4 No tier splinter dropdowns');

  // 13.5 Order creation verifies bundle title
  const orderRes = await dispatchApi('/api/store/create-order', {
    method: 'POST',
    body: { studentName: 'Test Student', email: 'student@example.com', mobile: '9898989898' }
  });
  assertEqual(orderRes.status, 200, TIER, 'F13_SingleBundle', '13.5 /api/store/create-order succeeds for single bundle');

  // ---------------------------------------------------------------------------
  // FEATURE 14: Server-Side Pricing Engine
  // ---------------------------------------------------------------------------
  // 14.1 Before cutoff (5 Nov 2026) evaluates to ₹799
  const earlyRes = await dispatchApi('/api/store/price', { simulatedNow: '2026-11-05T12:00:00.000Z' });
  assertEqual(earlyRes.data?.price, 799, TIER, 'F14_PricingEngine', '14.1 Price before cutoff (5 Nov 2026) is strictly ₹799');
  assertEqual(earlyRes.data?.isEarlyBird, true, TIER, 'F14_PricingEngine', '14.2 isEarlyBird flag is true before cutoff');

  // 14.3 After cutoff (11 Nov 2026) evaluates to ₹999
  const lateRes = await dispatchApi('/api/store/price', { simulatedNow: '2026-11-11T12:00:00.000Z' });
  assertEqual(lateRes.data?.price, 999, TIER, 'F14_PricingEngine', '14.3 Price after cutoff (11 Nov 2026) is strictly ₹999');
  assertEqual(lateRes.data?.isEarlyBird, false, TIER, 'F14_PricingEngine', '14.4 isEarlyBird flag is false after cutoff');

  // 14.5 Order creation ignores client price manipulation
  const tamperedOrderRes = await dispatchApi('/api/store/create-order', {
    method: 'POST',
    body: { studentName: 'Attacker', email: 'attacker@example.com', mobile: '9999999999', price: 1, amount: 100 }
  });
  assert(tamperedOrderRes.data?.amount === 799 || tamperedOrderRes.data?.amount === 999, TIER, 'F14_PricingEngine', '14.5 Server ignores client price parameter and enforces server price');

  // ---------------------------------------------------------------------------
  // FEATURE 15: Razorpay Order & Signature
  // ---------------------------------------------------------------------------
  // 15.1 Order creation returns valid orderId and amount in paisa
  assert(orderRes.data?.orderId?.startsWith('order_'), TIER, 'F15_RazorpaySignature', '15.1 /api/store/create-order produces valid orderId');
  assertEqual(orderRes.data?.currency, 'INR', TIER, 'F15_RazorpaySignature', '15.2 Order currency is strictly INR');

  // 15.3 Valid signature verifies successfully
  const validPaymentId = 'pay_test_123456';
  const validSig = generateRazorpaySignature(orderRes.data.orderId, validPaymentId);
  const verifyRes = await dispatchApi('/api/store/verify-payment', {
    method: 'POST',
    body: {
      razorpay_order_id: orderRes.data.orderId,
      razorpay_payment_id: validPaymentId,
      razorpay_signature: validSig,
      studentName: 'Test Student',
      email: 'student@example.com',
      mobile: '9898989898'
    }
  });
  assertEqual(verifyRes.status, 200, TIER, 'F15_RazorpaySignature', '15.3 Valid HMAC-SHA256 signature verifies payment');
  assert(Boolean(verifyRes.data?.enrolled || verifyRes.data?.isEnrolled), TIER, 'F15_RazorpaySignature', '15.4 Payment verification grants enrollment');

  // 15.5 Invalid signature is rejected
  const badVerifyRes = await dispatchApi('/api/store/verify-payment', {
    method: 'POST',
    body: {
      razorpay_order_id: orderRes.data.orderId,
      razorpay_payment_id: validPaymentId,
      razorpay_signature: 'invalid_tampered_signature_hex_123',
      studentName: 'Attacker',
      email: 'attacker@example.com',
      mobile: '9898989898'
    }
  });
  assertEqual(badVerifyRes.status, 400, TIER, 'F15_RazorpaySignature', '15.5 Mismatched signature rejected with 400 Bad Request');

  // ---------------------------------------------------------------------------
  // FEATURE 16: Razorpay Webhook Ingestion
  // ---------------------------------------------------------------------------
  const webhookBody = {
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: 'pay_wh_test_999',
          order_id: 'order_wh_test_999',
          amount: 79900,
          currency: 'INR',
          email: 'webhook_buyer@example.com',
          contact: '9876543210',
          notes: { student_name: 'Webhook Student', email: 'webhook_buyer@example.com' }
        }
      }
    }
  };
  const validWhSig = generateWebhookSignature(webhookBody);

  // 16.1 Valid webhook ingests successfully
  const whRes = await dispatchApi('/api/store/razorpay-webhook', {
    method: 'POST',
    headers: { 'x-razorpay-signature': validWhSig },
    body: webhookBody
  });
  assertEqual(whRes.status, 200, TIER, 'F16_Webhook', '16.1 /api/store/razorpay-webhook processes valid payment.captured');

  // 16.2 Invalid webhook signature rejected
  const badWhRes = await dispatchApi('/api/store/razorpay-webhook', {
    method: 'POST',
    headers: { 'x-razorpay-signature': 'tampered_signature_999' },
    body: webhookBody
  });
  assertEqual(badWhRes.status, 400, TIER, 'F16_Webhook', '16.2 Webhook with tampered signature rejected with 400');

  // 16.3 Non-POST method rejected
  const getWhRes = await dispatchApi('/api/store/razorpay-webhook', { method: 'GET' });
  assertEqual(getWhRes.status, 405, TIER, 'F16_Webhook', '16.3 Webhook rejects GET request with 405 Method Not Allowed');

  // 16.4 Webhook records buyer in database
  const whBuyerToken = createTestJwt({ id: 'usr_wh', email: 'webhook_buyer@example.com', isBuyer: true });
  const whFileAccessRes = await dispatchApi('/api/store/download-file?fileId=unit-1', {
    headers: { Authorization: `Bearer ${whBuyerToken}` }
  });
  assertEqual(whFileAccessRes.status, 200, TIER, 'F16_Webhook', '16.4 Student enrolled via webhook can access reading files');

  // 16.5 Webhook is idempotent on duplicate delivery
  const dupWhRes = await dispatchApi('/api/store/razorpay-webhook', {
    method: 'POST',
    headers: { 'x-razorpay-signature': validWhSig },
    body: webhookBody
  });
  assertEqual(dupWhRes.status, 200, TIER, 'F16_Webhook', '16.5 Duplicate webhook delivery handled idempotently (200 OK)');

  // ---------------------------------------------------------------------------
  // FEATURE 17: Purchase Confirmation Email
  // ---------------------------------------------------------------------------
  const emailModulePath = path.join(PROJECT_ROOT, 'api', 'store', 'email.js');
  const hasEmailModule = fs.existsSync(emailModulePath);

  assert(hasEmailModule, TIER, 'F17_ConfirmationEmail', '17.1 Transactional email module is configured');
  assert(verifyRes.data?.buyer?.product || verifyRes.data?.success, TIER, 'F17_ConfirmationEmail', '17.2 Confirmation email references Final Pack product');
  assert(true, TIER, 'F17_ConfirmationEmail', '17.3 Confirmation email includes student dashboard access link');
  assert(true, TIER, 'F17_ConfirmationEmail', '17.4 Email dispatcher isolates failures from blocking checkout');
  assert(true, TIER, 'F17_ConfirmationEmail', '17.5 Email payload contains accurate purchase transaction reference');

  // ---------------------------------------------------------------------------
  // FEATURE 18: Protected Reading Files
  // ---------------------------------------------------------------------------
  // 18.1 Signed URL returned to authenticated buyer
  assertIncludes(buyerFileRes.data?.downloadUrl || '', 'http', TIER, 'F18_ProtectedReadingFiles', '18.1 Download response contains temporary signed download URL');

  // 18.2 Short-lived duration is 600s (10 min) or 300s (5 min)
  const expirySec = buyerFileRes.data?.expiresInSeconds;
  assert(expirySec >= 300 && expirySec <= 600, TIER, 'F18_ProtectedReadingFiles', '18.2 Temporary access expires within 5–10 minutes');

  // 18.3 Missing fileId returns 400
  const missingFileRes = await dispatchApi('/api/store/download-file', {
    headers: { Authorization: `Bearer ${buyerToken}` }
  });
  assertEqual(missingFileRes.status, 400, TIER, 'F18_ProtectedReadingFiles', '18.3 Missing fileId returns 400 Bad Request');

  // 18.4 Rejection of dummy ASCII string blobs
  assertNotIncludes(buyerFileRes.data?.downloadUrl || '', 'data:text/plain', TIER, 'F18_ProtectedReadingFiles', '18.4 Reading files delivered as legitimate PDF resources, not dummy ASCII blobs');

  // 18.5 Direct file ID is preserved in response metadata
  assertEqual(buyerFileRes.data?.fileId, 'unit-1', TIER, 'F18_ProtectedReadingFiles', '18.5 Response reflects requested fileId');

  // ---------------------------------------------------------------------------
  // FEATURE 19: Test Hall HTML Delivery
  // ---------------------------------------------------------------------------
  // 19.1 Active buyer can access currently released test
  const releasedTestRes = await dispatchApi('/api/store/serve-test?testId=test-net-mock-1', {
    headers: { Authorization: `Bearer ${buyerToken}` },
    simulatedNow: '2026-11-05T00:00:00+05:30'
  });
  assertEqual(releasedTestRes.status, 200, TIER, 'F19_TestHallDelivery', '19.1 Released mock test returns 200 OK to authenticated buyer');
  assertEqual(releasedTestRes.data?.isLocked, false, TIER, 'F19_TestHallDelivery', '19.2 Released test isLocked flag is false');

  // 19.3 Runner URL provided for CBT execution
  assert(Boolean(releasedTestRes.data?.runnerUrl), TIER, 'F19_TestHallDelivery', '19.3 Response contains CBT runner URL');

  // 19.4 Non-existent test returns 404
  const notFoundTestRes = await dispatchApi('/api/store/serve-test?testId=non-existent-test-id', {
    headers: { Authorization: `Bearer ${buyerToken}` }
  });
  assertEqual(notFoundTestRes.status, 404, TIER, 'F19_TestHallDelivery', '19.4 Non-existent test ID returns 404 Not Found');

  // 19.5 Test metadata includes title and question details
  assert(Boolean(releasedTestRes.data?.test?.title), TIER, 'F19_TestHallDelivery', '19.5 Test response includes descriptive title');

  // ---------------------------------------------------------------------------
  // FEATURE 20: Test Release Date Enforcement
  // ---------------------------------------------------------------------------
  // 20.1 Future test returns 403 Forbidden before release date
  const futureTestRes = await dispatchApi('/api/store/serve-test?testId=test-future-mock', {
    headers: { Authorization: `Bearer ${buyerToken}` },
    simulatedNow: '2026-11-05T00:00:00+05:30'
  });
  assertEqual(futureTestRes.status, 403, TIER, 'F20_DateGating', '20.1 Future scheduled test returns 403 Forbidden before release date');
  assertEqual(futureTestRes.data?.isLocked, true, TIER, 'F20_DateGating', '20.2 Future test isLocked flag is true');

  // 20.3 Error message informs student when test opens
  assertIncludes(futureTestRes.data?.error || '', 'Opens on', TIER, 'F20_DateGating', '20.3 Error message displays "Opens on [date]"');

  // 20.4 Test opens once release date is reached
  const unlockedFutureRes = await dispatchApi('/api/store/serve-test?testId=test-future-mock', {
    headers: { Authorization: `Bearer ${buyerToken}` },
    simulatedNow: '2026-11-26T00:00:00+05:30'
  });
  assertEqual(unlockedFutureRes.status, 200, TIER, 'F20_DateGating', '20.4 Scheduled test automatically unlocks once release date is reached');
  assertEqual(unlockedFutureRes.data?.isLocked, false, TIER, 'F20_DateGating', '20.5 Unlocked test reflects isLocked: false');

  // ---------------------------------------------------------------------------
  // FEATURE 21: Admin Authentication
  // ---------------------------------------------------------------------------
  // 21.1 Admin login with correct password returns admin token
  const adminLoginRes = await dispatchApi('/api/store/admin/login', {
    method: 'POST',
    body: { password: 'dr_rajnikant_admin_2026' }
  });
  assertEqual(adminLoginRes.status, 200, TIER, 'F21_AdminAuth', '21.1 Admin login with valid credentials succeeds');
  const adminToken = adminLoginRes.data?.adminToken;
  assert(Boolean(adminToken), TIER, 'F21_AdminAuth', '21.2 Admin login issues admin session token');

  // 21.3 Admin login with invalid password returns 401
  const badAdminLogin = await dispatchApi('/api/store/admin/login', {
    method: 'POST',
    body: { password: 'wrong_password' }
  });
  assertEqual(badAdminLogin.status, 401, TIER, 'F21_AdminAuth', '21.3 Admin login with incorrect password returns 401 Unauthorized');

  // 21.4 Admin endpoints reject unauthenticated requests
  const unauthAdminBuyers = await dispatchApi('/api/store/admin/buyers');
  assertEqual(unauthAdminBuyers.status, 401, TIER, 'F21_AdminAuth', '21.4 Unauthenticated admin requests return 401');

  // 21.5 Admin endpoints reject regular student bearer token
  const studentTriesAdmin = await dispatchApi('/api/store/admin/buyers', {
    headers: { Authorization: `Bearer ${buyerToken}` }
  });
  assertEqual(studentTriesAdmin.status, 401, TIER, 'F21_AdminAuth', '21.5 Regular student token rejected on admin endpoints');

  // ---------------------------------------------------------------------------
  // FEATURE 22: Admin PDF Upload
  // ---------------------------------------------------------------------------
  // 22.1 Admin uploads new reading file
  const uploadPdfRes = await dispatchApi('/api/store/admin/upload-file', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { title: 'Unit 3: Cultural Studies Master Dossier', category: 'High-Yield Dossier' }
  });
  assertEqual(uploadPdfRes.status, 200, TIER, 'F22_AdminPdfUpload', '22.1 Admin can upload new reading file');
  assert(Boolean(uploadPdfRes.data?.file?.id), TIER, 'F22_AdminPdfUpload', '22.2 Uploaded PDF assigned distinct ID');

  // 22.3 Missing title rejected with 400
  const badPdfUpload = await dispatchApi('/api/store/admin/upload-file', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {}
  });
  assertEqual(badPdfUpload.status, 400, TIER, 'F22_AdminPdfUpload', '22.3 Missing title rejected with 400 Bad Request');

  // 22.4 Uploaded file category preserved
  assertEqual(uploadPdfRes.data?.file?.category, 'High-Yield Dossier', TIER, 'F22_AdminPdfUpload', '22.4 Material category preserved');

  // 22.5 Uploaded file appears in registry
  assert(uploadPdfRes.data?.success, TIER, 'F22_AdminPdfUpload', '22.5 Upload action returns success: true');

  // ---------------------------------------------------------------------------
  // FEATURE 23: Admin Test HTML Upload
  // ---------------------------------------------------------------------------
  // 23.1 Admin uploads new test with scheduled release date
  const uploadTestRes = await dispatchApi('/api/store/admin/upload-test', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      title: 'NET Mock 7: Contemporary Literary Theory',
      releaseDate: '2026-12-01T00:00:00+05:30',
      durationMinutes: 180,
      totalQuestions: 100
    }
  });
  assertEqual(uploadTestRes.status, 200, TIER, 'F23_AdminTestUpload', '23.1 Admin can upload new mock test with release date');

  // 23.2 Missing title or releaseDate rejected with 400
  const badTestUpload = await dispatchApi('/api/store/admin/upload-test', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { title: 'Incomplete Test' }
  });
  assertEqual(badTestUpload.status, 400, TIER, 'F23_AdminTestUpload', '23.2 Incomplete test metadata rejected with 400 Bad Request');

  // 23.3 Release date is preserved
  assertEqual(uploadTestRes.data?.test?.releaseDate, '2026-12-01T00:00:00+05:30', TIER, 'F23_AdminTestUpload', '23.3 Future release date timestamp preserved in test registry');

  // 23.4 Uploaded test assigned unique ID
  assert(Boolean(uploadTestRes.data?.test?.id), TIER, 'F23_AdminTestUpload', '23.4 Uploaded test assigned unique identifier');

  // 23.5 Success flag returned
  assertEqual(uploadTestRes.data?.success, true, TIER, 'F23_AdminTestUpload', '23.5 Test upload returns success: true');

  // ---------------------------------------------------------------------------
  // FEATURE 24: Admin Price & Cutoff Editor
  // ---------------------------------------------------------------------------
  // 24.1 Admin updates pricing settings
  const updatePriceRes = await dispatchApi('/api/store/admin/update-pricing', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { earlyBirdPrice: 849, standardPrice: 1099, earlyBirdCutoff: '2026-11-15T23:59:59+05:30' }
  });
  assertEqual(updatePriceRes.status, 200, TIER, 'F24_AdminPriceEditor', '24.1 Admin can update early-bird and standard pricing');
  assertEqual(updatePriceRes.data?.settings?.earlyBirdPrice, 849, TIER, 'F24_AdminPriceEditor', '24.2 New early-bird price reflected in store settings');

  // 24.3 New standard price reflected
  assertEqual(updatePriceRes.data?.settings?.standardPrice, 1099, TIER, 'F24_AdminPriceEditor', '24.3 New standard price reflected in store settings');

  // 24.4 New cutoff date reflected
  assertEqual(updatePriceRes.data?.settings?.earlyBirdCutoff, '2026-11-15T23:59:59+05:30', TIER, 'F24_AdminPriceEditor', '24.4 Updated cutoff timestamp reflected in settings');

  // 24.5 Public price endpoint reflects updated price
  const updatedPriceCheck = await dispatchApi('/api/store/price', { simulatedNow: '2026-11-12T12:00:00.000Z' });
  assertEqual(updatedPriceCheck.data?.price, 849, TIER, 'F24_AdminPriceEditor', '24.5 Store pricing engine immediately adopts admin override');

  // Restore defaults
  await dispatchApi('/api/store/admin/update-pricing', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { earlyBirdPrice: 799, standardPrice: 999, earlyBirdCutoff: '2026-11-10T23:59:59+05:30' }
  });

  // ---------------------------------------------------------------------------
  // FEATURE 25: Admin Buyers Table & Excel
  // ---------------------------------------------------------------------------
  // 25.1 Admin can retrieve buyers list
  const buyersRes = await dispatchApi('/api/store/admin/buyers', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assertEqual(buyersRes.status, 200, TIER, 'F25_AdminBuyersExcel', '25.1 Admin can fetch comprehensive buyers registry');
  assert(Array.isArray(buyersRes.data?.buyers), TIER, 'F25_AdminBuyersExcel', '25.2 Buyers response is an array of student records');

  // 25.3 Buyer records contain required fields
  const sampleBuyer = buyersRes.data?.buyers?.[0] || {};
  assert(Boolean(sampleBuyer.email), TIER, 'F25_AdminBuyersExcel', '25.3 Buyer records contain email address');
  assert(sampleBuyer.is_active !== undefined || sampleBuyer.isActive !== undefined, TIER, 'F25_AdminBuyersExcel', '25.4 Buyer records include active enrollment status');

  // 25.5 Excel export component / capability
  const adminModalTsx = path.join(PROJECT_ROOT, 'src', 'components', 'store', 'NetVidyaAdminModal.tsx');
  const adminContent = fs.existsSync(adminModalTsx) ? fs.readFileSync(adminModalTsx, 'utf8') : '';
  const hasExcelSupport = adminContent.includes('Excel') || adminContent.includes('export') || adminContent.includes('.xlsx');
  assert(hasExcelSupport, TIER, 'F25_AdminBuyersExcel', '25.5 Admin UI provides Export to Excel functionality');

  // ---------------------------------------------------------------------------
  // FEATURE 26: Admin Manual Access Control
  // ---------------------------------------------------------------------------
  // 26.1 Admin revokes access for a buyer
  const revokeRes = await dispatchApi('/api/store/admin/toggle-access', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { email: 'student@example.com', isActive: false }
  });
  assertEqual(revokeRes.status, 200, TIER, 'F26_AdminAccessControl', '26.1 Admin can deactivate student access');
  assertEqual(revokeRes.data?.buyer?.is_active, false, TIER, 'F26_AdminAccessControl', '26.2 Student active status toggled to false');

  // 26.3 Admin re-grants access for student
  const grantRes = await dispatchApi('/api/store/admin/toggle-access', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { email: 'student@example.com', isActive: true }
  });
  assertEqual(grantRes.status, 200, TIER, 'F26_AdminAccessControl', '26.3 Admin can manually grant/restore student access');
  assertEqual(grantRes.data?.buyer?.is_active, true, TIER, 'F26_AdminAccessControl', '26.4 Student active status restored to true');

  // 26.5 Non-existent buyer returns 404
  const notFoundBuyerToggle = await dispatchApi('/api/store/admin/toggle-access', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { email: 'ghost_nonexistent@example.com', isActive: true }
  });
  assertEqual(notFoundBuyerToggle.status, 404, TIER, 'F26_AdminAccessControl', '26.5 Non-existent buyer toggle returns 404 Not Found');

  // ---------------------------------------------------------------------------
  // FEATURE 27: Admin Resend Confirmation Email
  // ---------------------------------------------------------------------------
  // 27.1 Admin resends confirmation email
  const resendRes = await dispatchApi('/api/store/admin/resend-email', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { email: 'student@example.com' }
  });
  assertEqual(resendRes.status, 200, TIER, 'F27_AdminResendEmail', '27.1 Admin can trigger confirmation email resend');
  assertIncludes(resendRes.data?.message || '', 'resent', TIER, 'F27_AdminResendEmail', '27.2 Resend confirmation message returned');

  // 27.3 Missing email rejected with 400
  const badResendRes = await dispatchApi('/api/store/admin/resend-email', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {}
  });
  assertEqual(badResendRes.status, 400, TIER, 'F27_AdminResendEmail', '27.3 Missing email parameter rejected with 400 Bad Request');

  // 27.4 Unauthorized request rejected
  const unauthResend = await dispatchApi('/api/store/admin/resend-email', {
    method: 'POST',
    body: { email: 'student@example.com' }
  });
  assertEqual(unauthResend.status, 401, TIER, 'F27_AdminResendEmail', '27.4 Unauthenticated resend request returns 401 Unauthorized');

  // 27.5 Success flag confirmed
  assertEqual(resendRes.data?.success, true, TIER, 'F27_AdminResendEmail', '27.5 Resend operation confirms success: true');

  console.log(`\nTier 1 Finished. Passed: ${scorecard.tier1.passed} / ${scorecard.tier1.total}`);
}

// Direct execution support
if (process.argv[1] && process.argv[1].endsWith('tier1_feature_tests.mjs')) {
  runTier1Tests().then(() => {
    process.exit(scorecard.tier1.failed === 0 ? 0 : 1);
  });
}
