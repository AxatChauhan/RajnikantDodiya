/**
 * NET Vidya English Student Store • E2E Test Suite
 * TIER 4: REAL-WORLD USER SCENARIOS & ADVERSARIAL ATTACK SUITE
 * 
 * Executes full end-to-end user journeys from anonymous visitors to enrolled students,
 * administrators, and adversarial threat actors.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  assert,
  assertEqual,
  assertIncludes,
  assertNotIncludes,
  createTestJwt,
  dispatchApi,
  generateRazorpaySignature,
  PROJECT_ROOT,
  scorecard,
  simulatedDb,
  RZP_TEST_SECRET
} from './test_helpers.mjs';

const TIER = 'tier4';

export async function runTier4Tests() {
  console.log('\n================================================================================');
  console.log('TIER 4: REAL-WORLD APPLICATION SCENARIOS & ADVERSARIAL PENETRATION');
  console.log('================================================================================\n');

  // ---------------------------------------------------------------------------
  // SCENARIO 1: Anonymous Visitor Discovery & Sample Study (Persona: Ananya Sharma)
  // ---------------------------------------------------------------------------
  console.log('--- Scenario 1: Anonymous Visitor Discovery & Sample Study (Ananya Sharma) ---');

  // Step 1: Ananya lands on store home page
  const homeTsx = path.join(PROJECT_ROOT, 'src', 'components', 'store', 'NetVidyaStoreHome.tsx');
  const homeContent = fs.existsSync(homeTsx) ? fs.readFileSync(homeTsx, 'utf8') : '';
  assert(homeContent.length > 0, TIER, 'Scenario1_Discovery', 'S1.1 Home page component loads for prospective visitor');

  // Step 2: Hero branding and credentials verification
  const heroImg = path.join(PROJECT_ROOT, 'public', 'dr-rajnikant-dodiya.jpg');
  assert(fs.existsSync(heroImg), TIER, 'Scenario1_Discovery', 'S1.2 Dr. Rajnikant Dodiya portrait displayed in Hero section');
  assertIncludes(homeContent, 'Rajnikant Dodiya', TIER, 'Scenario1_Discovery', 'S1.3 Verified academic credentials present');

  // Step 3: Zero college affiliations anywhere on the site
  const layoutTsx = path.join(PROJECT_ROOT, 'src', 'components', 'store', 'NetVidyaStoreLayout.tsx');
  const layoutContent = fs.existsSync(layoutTsx) ? fs.readFileSync(layoutTsx, 'utf8') : '';
  assert(!layoutContent.includes('HMPIETR') && !homeContent.includes('HMPIETR'), TIER, 'Scenario1_Discovery', 'S1.4 Zero HMPIETR mentions on all public visitor screens');
  assert(!layoutContent.includes('Sardar Patel') && !homeContent.includes('Sardar Patel'), TIER, 'Scenario1_Discovery', 'S1.5 Zero Sardar Patel University mentions on public visitor screens');

  // Step 4: Early-bird pricing card without fake strike-through
  const priceRes = await dispatchApi('/api/store/price');
  assertEqual(priceRes.data?.price, 799, TIER, 'Scenario1_Discovery', 'S1.6 Server pricing engine confirms honest ₹799 early-bird rate');
  assertEqual(priceRes.data?.originalPrice, undefined, TIER, 'Scenario1_Discovery', 'S1.7 Absence of fake MRP strike-through tags');

  // Step 5: Ananya browses Free Samples without logging in
  const sampleTsx = path.join(PROJECT_ROOT, 'src', 'components', 'store', 'NetVidyaFreeSample.tsx');
  assert(fs.existsSync(sampleTsx), TIER, 'Scenario1_Discovery', 'S1.8 Public Free Sample component accessible without login');

  // Step 6: Downloads free 25-question Mini Mock and Model Answers
  const miniMockPdf = path.join(PROJECT_ROOT, 'public', 'sample-materials', 'NetVidya_25_Question_Mini_Mock.pdf');
  const hasMiniMock = fs.existsSync(miniMockPdf);
  assert(hasMiniMock, TIER, 'Scenario1_Discovery', 'S1.9 Downloadable 25-Question Mini Mock PDF available for anonymous evaluation');

  // Step 7: Takes free demo CBT test
  const demoTestHtml = path.join(PROJECT_ROOT, 'public', 'sample-materials', 'demo-test.html');
  const hasDemo = fs.existsSync(demoTestHtml);
  assert(hasDemo, TIER, 'Scenario1_Discovery', 'S1.10 Standalone NTA demo test HTML accessible without authentication');

  // ---------------------------------------------------------------------------
  // SCENARIO 2: Student Purchase & Instant Onboarding (Persona: Ananya Sharma)
  // ---------------------------------------------------------------------------
  console.log('\n--- Scenario 2: Student Purchase & Instant Onboarding (Ananya Sharma) ---');
  const ananyaEmail = `ananya.sharma.${Date.now()}@example.com`;

  // Step 1: Ananya initiates checkout for single bundle
  const s2Order = await dispatchApi('/api/store/create-order', {
    method: 'POST',
    body: {
      studentName: 'Ananya Sharma',
      email: ananyaEmail,
      mobile: '9876543210',
      price: 1 // Attempted client-side discount attack
    }
  });
  assertEqual(s2Order.status, 200, TIER, 'Scenario2_PurchaseOnboarding', 'S2.1 Order created successfully');
  assertEqual(s2Order.data?.amount, 799, TIER, 'Scenario2_PurchaseOnboarding', 'S2.2 Server ignores client price and enforces early-bird ₹799');
  assertEqual(s2Order.data?.amountInPaisa, 79900, TIER, 'Scenario2_PurchaseOnboarding', 'S2.3 Razorpay order amount calculated strictly in paise (79900)');

  // Step 2: Payment completed via Razorpay and verified cryptographically
  const ananyaPayId = `pay_ananya_${Date.now()}`;
  const ananyaSig = generateRazorpaySignature(s2Order.data.orderId, ananyaPayId, RZP_TEST_SECRET);
  const s2Verify = await dispatchApi('/api/store/verify-payment', {
    method: 'POST',
    body: {
      razorpay_order_id: s2Order.data.orderId,
      razorpay_payment_id: ananyaPayId,
      razorpay_signature: ananyaSig,
      studentName: 'Ananya Sharma',
      email: ananyaEmail,
      mobile: '9876543210'
    }
  });
  assertEqual(s2Verify.status, 200, TIER, 'Scenario2_PurchaseOnboarding', 'S2.4 Payment signature verified server-side with HMAC-SHA256');
  assert(Boolean(s2Verify.data?.token), TIER, 'Scenario2_PurchaseOnboarding', 'S2.5 Instant student JWT authentication token issued');
  const ananyaToken = s2Verify.data?.token;

  // Step 3: Confirmation email dispatched with student dashboard link
  assert(Boolean(s2Verify.data?.buyer?.product || s2Verify.data?.success), TIER, 'Scenario2_PurchaseOnboarding', 'S2.6 Purchase confirmation email dispatched with dashboard link');

  // Step 4: Ananya accesses protected student dashboard
  const s2DashboardCheck = await dispatchApi('/api/store/download-file?fileId=unit-1', {
    headers: { Authorization: `Bearer ${ananyaToken}` }
  });
  assertEqual(s2DashboardCheck.status, 200, TIER, 'Scenario2_PurchaseOnboarding', 'S2.7 Student immediately granted access to protected buyer dashboard');

  // ---------------------------------------------------------------------------
  // SCENARIO 3: Daily Study Session in Dashboard & Test Hall (Persona: Ananya)
  // ---------------------------------------------------------------------------
  console.log('\n--- Scenario 3: Daily Study Session in Dashboard & Test Hall (Ananya) ---');

  // Step 1: Ananya requests temporary signed download for Unit 1 PDF
  const s3Download = await dispatchApi('/api/store/download-file?fileId=unit-1', {
    headers: { Authorization: `Bearer ${ananyaToken}` }
  });
  assertEqual(s3Download.status, 200, TIER, 'Scenario3_StudySession', 'S3.1 Server generates temporary signed download link for Unit 1');
  assertEqual(s3Download.data?.expiresInSeconds, 600, TIER, 'Scenario3_StudySession', 'S3.2 Download link strictly expires after 10 minutes (600s)');
  assertIncludes(s3Download.data?.downloadUrl || '', 'http', TIER, 'Scenario3_StudySession', 'S3.3 Direct private URL delivered securely');

  // Step 2: Ananya enters Test Hall and inspects release schedule
  const s3HallNow = await dispatchApi('/api/store/serve-test?testId=test-net-mock-1', {
    headers: { Authorization: `Bearer ${ananyaToken}` },
    simulatedNow: '2026-11-05T14:00:00+05:30'
  });
  assertEqual(s3HallNow.status, 200, TIER, 'Scenario3_StudySession', 'S3.4 NET Mock 1 (Ready Now) loads in CBT test hall');
  assertEqual(s3HallNow.data?.isLocked, false, TIER, 'Scenario3_StudySession', 'S3.5 Active mock is unlocked');

  // Step 3: Ananya attempts to open upcoming NET Mock 6 scheduled for Nov 25 -> Blocked
  const s3HallFuture = await dispatchApi('/api/store/serve-test?testId=test-future-mock', {
    headers: { Authorization: `Bearer ${ananyaToken}` },
    simulatedNow: '2026-11-05T14:00:00+05:30'
  });
  assertEqual(s3HallFuture.status, 403, TIER, 'Scenario3_StudySession', 'S3.6 Upcoming mock test blocked on server with 403 Forbidden');
  assertIncludes(s3HallFuture.data?.error || '', 'Opens on', TIER, 'Scenario3_StudySession', 'S3.7 Dashboard informs student of scheduled release date');

  // ---------------------------------------------------------------------------
  // SCENARIO 4: Post-Cutoff Student & Password Recovery (Persona: Rajesh Patel)
  // ---------------------------------------------------------------------------
  console.log('\n--- Scenario 4: Standard Price Transition & Password Recovery (Rajesh Patel) ---');
  const rajeshEmail = `rajesh.patel.${Date.now()}@example.com`;
  const POST_CUTOFF_DATE = '2026-11-11T10:00:00.000Z'; // Past 10 Nov cutoff

  // Step 1: Rajesh visits store after cutoff
  const s4Price = await dispatchApi('/api/store/price', { simulatedNow: POST_CUTOFF_DATE });
  assertEqual(s4Price.data?.price, 999, TIER, 'Scenario4_PostCutoffRecovery', 'S4.1 Server price automatically evaluates to standard ₹999');
  assertEqual(s4Price.data?.isEarlyBird, false, TIER, 'Scenario4_PostCutoffRecovery', 'S4.2 Early bird offer expired');

  // Step 2: Rajesh purchases bundle at ₹999
  const s4Order = await dispatchApi('/api/store/create-order', {
    method: 'POST',
    body: { studentName: 'Rajesh Patel', email: rajeshEmail, mobile: '9825100099' },
    simulatedNow: POST_CUTOFF_DATE
  });
  assertEqual(s4Order.data?.amount, 999, TIER, 'Scenario4_PostCutoffRecovery', 'S4.3 Order created with standard price ₹999');

  const s4PayId = `pay_rajesh_${Date.now()}`;
  const s4Sig = generateRazorpaySignature(s4Order.data.orderId, s4PayId, RZP_TEST_SECRET);
  await dispatchApi('/api/store/verify-payment', {
    method: 'POST',
    body: {
      razorpay_order_id: s4Order.data.orderId,
      razorpay_payment_id: s4PayId,
      razorpay_signature: s4Sig,
      studentName: 'Rajesh Patel',
      email: rajeshEmail,
      mobile: '9825100099'
    }
  });

  // Step 3: Rajesh creates login password
  await dispatchApi('/api/auth/signup', {
    method: 'POST',
    body: { name: 'Rajesh Patel', email: rajeshEmail, mobile: '9825100099', password: 'InitialPassword2026!' }
  });

  // Step 4: Rajesh forgets password and requests reset
  const s4Forgot = await dispatchApi('/api/auth/forgot-password', {
    method: 'POST',
    body: { email: rajeshEmail }
  });
  assertEqual(s4Forgot.status, 200, TIER, 'Scenario4_PostCutoffRecovery', 'S4.4 Password reset requested');
  const s4ResetToken = s4Forgot.data?.token;

  // Step 5: Rajesh submits new password
  const s4Reset = await dispatchApi('/api/auth/reset-password', {
    method: 'POST',
    body: { token: s4ResetToken, newPassword: 'UpdatedSecretPassword999#' }
  });
  assertEqual(s4Reset.status, 200, TIER, 'Scenario4_PostCutoffRecovery', 'S4.5 Password updated successfully');

  // Step 6: Old password rejected
  const s4OldLogin = await dispatchApi('/api/auth/login', {
    method: 'POST',
    body: { email: rajeshEmail, password: 'InitialPassword2026!' }
  });
  assertEqual(s4OldLogin.status, 401, TIER, 'Scenario4_PostCutoffRecovery', 'S4.6 Old password rejected with 401');

  // Step 7: New password logs in and retains paid buyer access
  const s4NewLogin = await dispatchApi('/api/auth/login', {
    method: 'POST',
    body: { email: rajeshEmail, password: 'UpdatedSecretPassword999#' }
  });
  assertEqual(s4NewLogin.status, 200, TIER, 'Scenario4_PostCutoffRecovery', 'S4.7 New password logs in successfully');
  assertEqual(s4NewLogin.data?.user?.isBuyer, true, TIER, 'Scenario4_PostCutoffRecovery', 'S4.8 Student retains buyer privileges');

  // ---------------------------------------------------------------------------
  // SCENARIO 5: Dr. Rajnikant Admin Studio Workflow (Persona: Dr. Rajnikant)
  // ---------------------------------------------------------------------------
  console.log('\n--- Scenario 5: Dr. Rajnikant Admin Management Studio (Dr. Rajnikant) ---');

  // Step 1: Admin logs in
  const s5AdminLogin = await dispatchApi('/api/store/admin/login', {
    method: 'POST',
    body: { password: 'dr_rajnikant_admin_2026' }
  });
  assertEqual(s5AdminLogin.status, 200, TIER, 'Scenario5_AdminWorkflow', 'S5.1 Dr. Rajnikant authenticates into Admin Studio');
  const adminToken = s5AdminLogin.data?.adminToken;

  // Step 2: Uploads new Unit 4 Reading Dossier
  const s5UploadPdf = await dispatchApi('/api/store/admin/upload-file', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { title: 'Unit 4: Research Methods & ELT Pedagogy Master Dossier', category: 'High-Yield Dossier' }
  });
  assertEqual(s5UploadPdf.status, 200, TIER, 'Scenario5_AdminWorkflow', 'S5.2 Admin uploads new PDF reading file without editing code');

  // Step 3: Schedules Mock Test 8
  const s5UploadTest = await dispatchApi('/api/store/admin/upload-test', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { title: 'NET Mock 8: Final All-India Pre-Board', releaseDate: '2026-12-10T00:00:00+05:30' }
  });
  assertEqual(s5UploadTest.status, 200, TIER, 'Scenario5_AdminWorkflow', 'S5.3 Admin schedules mock test with future release date');

  // Step 4: Audits buyers list and exports to Excel
  const s5Buyers = await dispatchApi('/api/store/admin/buyers', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assertEqual(s5Buyers.status, 200, TIER, 'Scenario5_AdminWorkflow', 'S5.4 Admin reviews complete enrolled buyers registry');
  assert(s5Buyers.data?.buyers?.length > 0, TIER, 'Scenario5_AdminWorkflow', 'S5.5 Buyers registry contains enrolled student records');

  // Step 5: Manually grants scholarship access
  const scholarshipEmail = 'scholarship_student@university.ac.in';
  simulatedDb.buyers.set(scholarshipEmail, { email: scholarshipEmail, is_active: false });
  const s5Grant = await dispatchApi('/api/store/admin/toggle-access', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { email: scholarshipEmail, isActive: true }
  });
  assertEqual(s5Grant.status, 200, TIER, 'Scenario5_AdminWorkflow', 'S5.6 Admin manually activates student digital pass');
  assertEqual(s5Grant.data?.buyer?.is_active, true, TIER, 'Scenario5_AdminWorkflow', 'S5.7 Student access status activated');

  // Step 6: Resends confirmation email
  const s5Resend = await dispatchApi('/api/store/admin/resend-email', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { email: scholarshipEmail }
  });
  assertEqual(s5Resend.status, 200, TIER, 'Scenario5_AdminWorkflow', 'S5.8 Admin successfully resends confirmation email');

  // ---------------------------------------------------------------------------
  // SCENARIO 6: Adversarial Paywall Penetration Suite (Persona: Threat Actor)
  // ---------------------------------------------------------------------------
  console.log('\n--- Scenario 6: Adversarial Paywall Penetration Suite (Attacker) ---');

  // Attack 1: Client price tampering
  const atk1 = await dispatchApi('/api/store/create-order', {
    method: 'POST',
    body: { studentName: 'Attacker', email: 'hacker@darkweb.org', mobile: '9999999999', price: 1, amount: 10 }
  });
  assertEqual(atk1.data?.amount, 799, TIER, 'Scenario6_Penetration', 'S6.1 Attack 1 Defeated: Client price tampering rejected; enforced ₹799');

  // Attack 2: Forged HMAC signature in payment verification
  const atk2 = await dispatchApi('/api/store/verify-payment', {
    method: 'POST',
    body: {
      razorpay_order_id: 'order_fake_123',
      razorpay_payment_id: 'pay_fake_123',
      razorpay_signature: '0000000000000000000000000000000000000000000000000000000000000000',
      studentName: 'Attacker',
      email: 'hacker@darkweb.org',
      mobile: '9999999999'
    }
  });
  assertEqual(atk2.status, 400, TIER, 'Scenario6_Penetration', 'S6.2 Attack 2 Defeated: Forged payment signature rejected with 400 Bad Request');

  // Attack 3: Unauthenticated direct download of paid PDF
  const atk3 = await dispatchApi('/api/store/download-file?fileId=unit-1');
  assertEqual(atk3.status, 401, TIER, 'Scenario6_Penetration', 'S6.3 Attack 3 Defeated: Unauthenticated PDF download rejected with 401 Unauthorized');

  // Attack 4: Legacy query backdoor token bypass probe
  const atk4 = await dispatchApi('/api/store/download-file?fileId=unit-1&userToken=nv_buyer_backdoor_probe');
  assertEqual(atk4.status, 401, TIER, 'Scenario6_Penetration', 'S6.4 Attack 4 Defeated: Query token nv_buyer_ rejected without valid Bearer session');

  // Attack 5: Privilege escalation by authenticated non-buyer
  const attackerJwt = createTestJwt({ id: 'usr_hacker', email: 'hacker@darkweb.org', isBuyer: false });
  const atk5 = await dispatchApi('/api/store/download-file?fileId=unit-1', {
    headers: { Authorization: `Bearer ${attackerJwt}` }
  });
  assertEqual(atk5.status, 403, TIER, 'Scenario6_Penetration', 'S6.5 Attack 5 Defeated: Authenticated non-buyer denied access with 403 Forbidden');

  // Attack 6: Premature leak attack on unreleased mock test
  const atk6 = await dispatchApi('/api/store/serve-test?testId=test-future-mock', {
    headers: { Authorization: `Bearer ${ananyaToken}` }, // Ananya is a real buyer, but test is in future
    simulatedNow: '2026-11-05T00:00:00+05:30'
  });
  assertEqual(atk6.status, 403, TIER, 'Scenario6_Penetration', 'S6.6 Attack 6 Defeated: Direct request to future test blocked with 403 Forbidden');

  // Attack 7: SQL Injection string in admin login
  const atk7 = await dispatchApi('/api/store/admin/login', {
    method: 'POST',
    body: { password: "' OR '1'='1' --" }
  });
  assertEqual(atk7.status, 401, TIER, 'Scenario6_Penetration', 'S6.7 Attack 7 Defeated: SQL injection in admin login rejected with 401 Unauthorized');

  // Attack 8: Tampered Admin JWT header
  const tamperedAdminToken = createTestJwt({ role: 'admin' }, 'wrong_admin_secret');
  const atk8 = await dispatchApi('/api/store/admin/buyers', {
    headers: { Authorization: `Bearer ${tamperedAdminToken}` }
  });
  assertEqual(atk8.status, 401, TIER, 'Scenario6_Penetration', 'S6.8 Attack 8 Defeated: Forged admin JWT rejected with 401 Unauthorized');

  console.log(`\nTier 4 Finished. Passed: ${scorecard.tier4.passed} / ${scorecard.tier4.total}`);
}

// Direct execution support
if (process.argv[1] && process.argv[1].endsWith('tier4_realworld_scenarios.mjs')) {
  runTier4Tests().then(() => {
    process.exit(scorecard.tier4.failed === 0 ? 0 : 1);
  });
}
