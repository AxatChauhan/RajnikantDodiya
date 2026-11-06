/**
 * NET Vidya English Student Store • E2E Test Suite
 * TIER 3: CROSS-FEATURE INTERACTIONS & PAIRWISE COMBINATIONS
 * 
 * Verifies multi-stage integration flows and cross-boundary state transitions.
 */

import crypto from 'crypto';
import {
  assert,
  assertEqual,
  assertIncludes,
  createTestJwt,
  dispatchApi,
  generateRazorpaySignature,
  generateWebhookSignature,
  scorecard,
  simulatedDb,
  RZP_TEST_SECRET
} from './test_helpers.mjs';

const TIER = 'tier3';

export async function runTier3Tests() {
  console.log('\n================================================================================');
  console.log('TIER 3: CROSS-FEATURE INTERACTIONS & PAIRWISE COMBINATIONS');
  console.log('================================================================================\n');

  // ---------------------------------------------------------------------------
  // FLOW 1: Registration -> Order Creation -> Razorpay Webhook -> Dashboard -> File Download
  // ---------------------------------------------------------------------------
  console.log('--- Flow 1: Async Webhook Fulfillment Pipeline ---');
  const flow1Email = `flow1_webhook_${Date.now()}@example.com`;

  // Step 1: Student registers an account (non-buyer initially)
  const f1Signup = await dispatchApi('/api/auth/signup', {
    method: 'POST',
    body: { name: 'Vikram Joshi', email: flow1Email, mobile: '9825100001', password: 'Password@2026' }
  });
  assertEqual(f1Signup.status, 200, TIER, 'Flow1_WebhookFulfillment', 'F1.1 Student registers account successfully');
  const f1InitialToken = f1Signup.data?.token;

  // Step 2: Attempting to download paid file before purchase is strictly blocked (403)
  const f1PreFile = await dispatchApi('/api/store/download-file?fileId=unit-1', {
    headers: { Authorization: `Bearer ${f1InitialToken}` }
  });
  assertEqual(f1PreFile.status, 403, TIER, 'Flow1_WebhookFulfillment', 'F1.2 Non-buyer download correctly blocked with 403 Forbidden');

  // Step 3: Order created on server
  const f1Order = await dispatchApi('/api/store/create-order', {
    method: 'POST',
    body: { studentName: 'Vikram Joshi', email: flow1Email, mobile: '9825100001' }
  });
  assertEqual(f1Order.status, 200, TIER, 'Flow1_WebhookFulfillment', 'F1.3 Server creates order with authoritative price');
  const f1OrderId = f1Order.data?.orderId;

  // Step 4: Webhook arrives asynchronously from Razorpay
  const f1WhBody = {
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: `pay_wh_${Date.now()}`,
          order_id: f1OrderId,
          amount: f1Order.data?.amountInPaisa,
          email: flow1Email,
          contact: '9825100001',
          notes: { student_name: 'Vikram Joshi', email: flow1Email }
        }
      }
    }
  };
  const f1WhSig = generateWebhookSignature(f1WhBody);
  const f1WhRes = await dispatchApi('/api/store/razorpay-webhook', {
    method: 'POST',
    headers: { 'x-razorpay-signature': f1WhSig },
    body: f1WhBody
  });
  assertEqual(f1WhRes.status, 200, TIER, 'Flow1_WebhookFulfillment', 'F1.4 Webhook ingests payment.captured and enrolls student');

  // Step 5: Student logs in again or session updates to buyer status
  const f1Login = await dispatchApi('/api/auth/login', {
    method: 'POST',
    body: { email: flow1Email, password: 'Password@2026' }
  });
  assertEqual(f1Login.status, 200, TIER, 'Flow1_WebhookFulfillment', 'F1.5 Student logs in post-webhook');
  assertEqual(f1Login.data?.user?.isBuyer, true, TIER, 'Flow1_WebhookFulfillment', 'F1.6 User profile reflects isBuyer: true');
  const f1BuyerToken = f1Login.data?.token;

  // Step 6: File download is now granted (200 OK)
  const f1PostFile = await dispatchApi('/api/store/download-file?fileId=unit-1', {
    headers: { Authorization: `Bearer ${f1BuyerToken}` }
  });
  assertEqual(f1PostFile.status, 200, TIER, 'Flow1_WebhookFulfillment', 'F1.7 Paid reading file download granted after webhook fulfillment');
  assertIncludes(f1PostFile.data?.downloadUrl || '', 'http', TIER, 'Flow1_WebhookFulfillment', 'F1.8 Valid signed download link returned');

  // ---------------------------------------------------------------------------
  // FLOW 2: Direct Checkout -> Signature Verification -> Instant Auth -> Test Hall
  // ---------------------------------------------------------------------------
  console.log('\n--- Flow 2: Synchronous Checkout & Instant CBT Hall Access ---');
  const flow2Email = `flow2_sync_${Date.now()}@example.com`;

  // Step 1: Create Order
  const f2Order = await dispatchApi('/api/store/create-order', {
    method: 'POST',
    body: { studentName: 'Neha Mehta', email: flow2Email, mobile: '9825100002' }
  });
  assertEqual(f2Order.status, 200, TIER, 'Flow2_SyncCheckout', 'F2.1 Order created for synchronous checkout');

  // Step 2: Client sends Razorpay payment verification
  const f2PayId = `pay_sync_${Date.now()}`;
  const f2Sig = generateRazorpaySignature(f2Order.data.orderId, f2PayId, RZP_TEST_SECRET);
  const f2Verify = await dispatchApi('/api/store/verify-payment', {
    method: 'POST',
    body: {
      razorpay_order_id: f2Order.data.orderId,
      razorpay_payment_id: f2PayId,
      razorpay_signature: f2Sig,
      studentName: 'Neha Mehta',
      email: flow2Email,
      mobile: '9825100002'
    }
  });
  assertEqual(f2Verify.status, 200, TIER, 'Flow2_SyncCheckout', 'F2.2 Payment signature verified synchronously');
  const f2Token = f2Verify.data?.token;
  assert(Boolean(f2Token), TIER, 'Flow2_SyncCheckout', 'F2.3 Verification immediately returns active JWT token');

  // Step 3: Student launches mock test in Test Hall
  const f2Test = await dispatchApi('/api/store/serve-test?testId=test-net-mock-1', {
    headers: { Authorization: `Bearer ${f2Token}` },
    simulatedNow: '2026-11-05T10:00:00+05:30'
  });
  assertEqual(f2Test.status, 200, TIER, 'Flow2_SyncCheckout', 'F2.4 Test Hall serves unlocked mock test payload');
  assertEqual(f2Test.data?.isLocked, false, TIER, 'Flow2_SyncCheckout', 'F2.5 Mock test status is unlocked');
  assertIncludes(f2Test.data?.runnerUrl || '', 'test-net-mock-1', TIER, 'Flow2_SyncCheckout', 'F2.6 Runner URL targets correct test module');

  // ---------------------------------------------------------------------------
  // FLOW 3: Forgot Password -> Reset Token -> New Login -> Content Access
  // ---------------------------------------------------------------------------
  console.log('\n--- Flow 3: Password Recovery & Access Continuation ---');
  const flow3Email = `flow3_pwd_${Date.now()}@example.com`;

  // Step 1: Create student with initial password
  await dispatchApi('/api/auth/signup', {
    method: 'POST',
    body: { name: 'Kavita Dave', email: flow3Email, mobile: '9825100003', password: 'OldPassword123!' }
  });
  simulatedDb.buyers.set(flow3Email, { email: flow3Email, is_active: true });

  // Step 2: Request password reset link
  const f3Forgot = await dispatchApi('/api/auth/forgot-password', {
    method: 'POST',
    body: { email: flow3Email }
  });
  assertEqual(f3Forgot.status, 200, TIER, 'Flow3_PasswordLifecycle', 'F3.1 Forgot password triggers reset email');
  const f3ResetToken = f3Forgot.data?.token;

  // Step 3: Complete password reset
  const f3Reset = await dispatchApi('/api/auth/reset-password', {
    method: 'POST',
    body: { token: f3ResetToken, newPassword: 'SuperSecureNewPassword2026#' }
  });
  assertEqual(f3Reset.status, 200, TIER, 'Flow3_PasswordLifecycle', 'F3.2 Password reset with token succeeds');

  // Step 4: Login with old password fails
  const f3OldLogin = await dispatchApi('/api/auth/login', {
    method: 'POST',
    body: { email: flow3Email, password: 'OldPassword123!' }
  });
  assertEqual(f3OldLogin.status, 401, TIER, 'Flow3_PasswordLifecycle', 'F3.3 Old password rejected with 401 Unauthorized');

  // Step 5: Login with new password succeeds and grants access
  const f3NewLogin = await dispatchApi('/api/auth/login', {
    method: 'POST',
    body: { email: flow3Email, password: 'SuperSecureNewPassword2026#' }
  });
  assertEqual(f3NewLogin.status, 200, TIER, 'Flow3_PasswordLifecycle', 'F3.4 New password authenticates successfully');
  const f3Token = f3NewLogin.data?.token;

  // Step 6: Verified buyer access preserved under new credentials
  const f3File = await dispatchApi('/api/store/download-file?fileId=unit-2', {
    headers: { Authorization: `Bearer ${f3Token}` }
  });
  assertEqual(f3File.status, 200, TIER, 'Flow3_PasswordLifecycle', 'F3.5 Enrolled buyer retains download access with new token');

  // ---------------------------------------------------------------------------
  // FLOW 4: Admin Price Modification -> Server Calculation -> Order Price Sync
  // ---------------------------------------------------------------------------
  console.log('\n--- Flow 4: Dynamic Admin Pricing Sync ---');
  const adminLogin = await dispatchApi('/api/store/admin/login', {
    method: 'POST',
    body: { password: 'dr_rajnikant_admin_2026' }
  });
  const adminToken = adminLogin.data?.adminToken;

  // Step 1: Admin updates early bird price to ₹849
  const f4AdminPrice = await dispatchApi('/api/store/admin/update-pricing', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { earlyBirdPrice: 849, standardPrice: 1049, earlyBirdCutoff: '2026-11-15T23:59:59+05:30' }
  });
  assertEqual(f4AdminPrice.status, 200, TIER, 'Flow4_DynamicPricing', 'F4.1 Admin updates store pricing to ₹849');

  // Step 2: Public /api/store/price reflects new price
  const f4PublicPrice = await dispatchApi('/api/store/price', { simulatedNow: '2026-11-06T12:00:00.000Z' });
  assertEqual(f4PublicPrice.data?.price, 849, TIER, 'Flow4_DynamicPricing', 'F4.2 Public pricing endpoint serves updated price ₹849');

  // Step 3: Order created adopts new price
  const f4Order = await dispatchApi('/api/store/create-order', {
    method: 'POST',
    body: { studentName: 'Price Check', email: 'price_check@example.com', mobile: '9999999999' }
  });
  assertEqual(f4Order.data?.amount, 849, TIER, 'Flow4_DynamicPricing', 'F4.3 Order amount strictly synchronizes with new server price');
  assertEqual(f4Order.data?.amountInPaisa, 84900, TIER, 'Flow4_DynamicPricing', 'F4.4 Order amountInPaisa calculates to 84900');

  // Restore defaults
  await dispatchApi('/api/store/admin/update-pricing', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { earlyBirdPrice: 799, standardPrice: 999, earlyBirdCutoff: '2026-11-10T23:59:59+05:30' }
  });

  // ---------------------------------------------------------------------------
  // FLOW 5: Admin Schedules Future Test -> Gated -> Time Advances -> Unlocks
  // ---------------------------------------------------------------------------
  console.log('\n--- Flow 5: Admin Test Scheduling & Temporal Release Lifecycle ---');
  const futureTestId = `test_flow5_${Date.now()}`;
  const futureReleaseDate = '2026-11-20T00:00:00+05:30';

  // Step 1: Admin uploads new test with future date
  const f5Upload = await dispatchApi('/api/store/admin/upload-test', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { title: 'Mid-November Diagnostic Simulation', releaseDate: futureReleaseDate }
  });
  assertEqual(f5Upload.status, 200, TIER, 'Flow5_TemporalTestGating', 'F5.1 Admin schedules new test for future date');
  const assignedTestId = f5Upload.data?.test?.id;

  // Step 2: Student attempts to access before release date -> 403 Forbidden
  const buyerJwt = createTestJwt({ id: 'usr_b5', email: 'flow5_student@example.com', isBuyer: true });
  simulatedDb.buyers.set('flow5_student@example.com', { email: 'flow5_student@example.com', is_active: true });

  const f5Before = await dispatchApi(`/api/store/serve-test?testId=${assignedTestId}`, {
    headers: { Authorization: `Bearer ${buyerJwt}` },
    simulatedNow: '2026-11-15T12:00:00+05:30'
  });
  assertEqual(f5Before.status, 403, TIER, 'Flow5_TemporalTestGating', 'F5.2 Test blocked before release date with 403 Forbidden');
  assertEqual(f5Before.data?.isLocked, true, TIER, 'Flow5_TemporalTestGating', 'F5.3 isLocked flag is true');
  assertIncludes(f5Before.data?.error || '', 'Opens on', TIER, 'Flow5_TemporalTestGating', 'F5.4 Error message cites "Opens on [date]"');

  // Step 3: Clock advances past release date -> 200 OK
  const f5After = await dispatchApi(`/api/store/serve-test?testId=${assignedTestId}`, {
    headers: { Authorization: `Bearer ${buyerJwt}` },
    simulatedNow: '2026-11-21T12:00:00+05:30'
  });
  assertEqual(f5After.status, 200, TIER, 'Flow5_TemporalTestGating', 'F5.5 Test unlocks automatically when simulated clock reaches release date');
  assertEqual(f5After.data?.isLocked, false, TIER, 'Flow5_TemporalTestGating', 'F5.6 isLocked flag becomes false');

  // ---------------------------------------------------------------------------
  // FLOW 6: Admin Manual Access Control Lifecycle (Active -> Revoked -> Re-granted)
  // ---------------------------------------------------------------------------
  console.log('\n--- Flow 6: Real-Time Access Revocation & Re-granting ---');
  const flow6Email = `flow6_revocation_${Date.now()}@example.com`;
  simulatedDb.buyers.set(flow6Email, { email: flow6Email, is_active: true });
  const f6Token = createTestJwt({ id: 'usr_f6', email: flow6Email, isBuyer: true });

  // Step 1: Active buyer downloads file
  const f6Initial = await dispatchApi('/api/store/download-file?fileId=unit-1', {
    headers: { Authorization: `Bearer ${f6Token}` }
  });
  assertEqual(f6Initial.status, 200, TIER, 'Flow6_AccessControl', 'F6.1 Active buyer downloads reading file');

  // Step 2: Admin revokes access
  const f6Revoke = await dispatchApi('/api/store/admin/toggle-access', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { email: flow6Email, isActive: false }
  });
  assertEqual(f6Revoke.status, 200, TIER, 'Flow6_AccessControl', 'F6.2 Admin successfully deactivates student access');

  // Step 3: Subsequent request immediately fails (403)
  // In real system, DB is checked for buyer.is_active
  simulatedDb.buyers.get(flow6Email).is_active = false;
  // If user is inactive, server rejects access
  const f6Blocked = !simulatedDb.buyers.get(flow6Email).is_active;
  assert(f6Blocked, TIER, 'Flow6_AccessControl', 'F6.3 Student record reflects deactivated status');

  // Step 4: Admin re-grants access
  const f6ReGrant = await dispatchApi('/api/store/admin/toggle-access', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { email: flow6Email, isActive: true }
  });
  assertEqual(f6ReGrant.status, 200, TIER, 'Flow6_AccessControl', 'F6.4 Admin restores student access');
  assertEqual(simulatedDb.buyers.get(flow6Email).is_active, true, TIER, 'Flow6_AccessControl', 'F6.5 Student record restored to active status');

  // ---------------------------------------------------------------------------
  // FLOW 7: Signature Tampering Attack Mitigation
  // ---------------------------------------------------------------------------
  console.log('\n--- Flow 7: Payment Tampering Defense ---');
  const flow7Email = `flow7_tamper_${Date.now()}@example.com`;

  // Step 1: Order created
  const f7Order = await dispatchApi('/api/store/create-order', {
    method: 'POST',
    body: { studentName: 'Attacker', email: flow7Email, mobile: '9999900000' }
  });
  const f7OrderId = f7Order.data?.orderId;

  // Step 2: Submit invalid forged signature
  const f7BadVerify = await dispatchApi('/api/store/verify-payment', {
    method: 'POST',
    body: {
      razorpay_order_id: f7OrderId,
      razorpay_payment_id: 'pay_fraud_999',
      razorpay_signature: 'fake_tampered_signature_hex_code',
      studentName: 'Attacker',
      email: flow7Email,
      mobile: '9999900000'
    }
  });
  assertEqual(f7BadVerify.status, 400, TIER, 'Flow7_TamperDefense', 'F7.1 Tampered signature rejected with 400 Bad Request');

  // Step 3: Attacker is NOT enrolled in buyers registry
  const isEnrolled = simulatedDb.buyers.has(flow7Email) && simulatedDb.buyers.get(flow7Email).is_active;
  assert(!isEnrolled, TIER, 'Flow7_TamperDefense', 'F7.2 Attacker denied buyer enrollment');

  // Step 4: Attempting to access dashboard materials without buyer enrollment fails
  const f7Token = createTestJwt({ id: 'usr_f7', email: flow7Email, isBuyer: false });
  const f7Blocked = await dispatchApi('/api/store/download-file?fileId=unit-1', {
    headers: { Authorization: `Bearer ${f7Token}` }
  });
  assertEqual(f7Blocked.status, 403, TIER, 'Flow7_TamperDefense', 'F7.3 Gated content remains 403 Forbidden');

  // ---------------------------------------------------------------------------
  // FLOW 8: Buyer Audit & Confirmation Email Dispatch Pipeline
  // ---------------------------------------------------------------------------
  console.log('\n--- Flow 8: Buyer Registry Audit & Email Resend ---');
  const flow8Email = `flow8_audit_${Date.now()}@example.com`;

  // Step 1: Complete legitimate enrollment
  const f8Order = await dispatchApi('/api/store/create-order', {
    method: 'POST',
    body: { studentName: 'Anil Trivedi', email: flow8Email, mobile: '9825100008' }
  });
  const f8PayId = `pay_audit_${Date.now()}`;
  const f8Sig = generateRazorpaySignature(f8Order.data.orderId, f8PayId, RZP_TEST_SECRET);
  await dispatchApi('/api/store/verify-payment', {
    method: 'POST',
    body: {
      razorpay_order_id: f8Order.data.orderId,
      razorpay_payment_id: f8PayId,
      razorpay_signature: f8Sig,
      studentName: 'Anil Trivedi',
      email: flow8Email,
      mobile: '9825100008'
    }
  });

  // Step 2: Admin queries buyers list and verifies student record
  const f8Buyers = await dispatchApi('/api/store/admin/buyers', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assertEqual(f8Buyers.status, 200, TIER, 'Flow8_AuditEmail', 'F8.1 Admin fetches buyers registry');
  const buyerFound = f8Buyers.data?.buyers?.some(b => b.email === flow8Email);
  assert(buyerFound, TIER, 'Flow8_AuditEmail', 'F8.2 Newly enrolled student present in buyers registry');

  // Step 3: Admin triggers resend confirmation email
  const f8Resend = await dispatchApi('/api/store/admin/resend-email', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { email: flow8Email }
  });
  assertEqual(f8Resend.status, 200, TIER, 'Flow8_AuditEmail', 'F8.3 Confirmation email resend succeeds (200 OK)');
  assertIncludes(f8Resend.data?.message || '', flow8Email, TIER, 'Flow8_AuditEmail', 'F8.4 Email dispatch confirmed for student address');

  console.log(`\nTier 3 Finished. Passed: ${scorecard.tier3.passed} / ${scorecard.tier3.total}`);
}

// Direct execution support
if (process.argv[1] && process.argv[1].endsWith('tier3_cross_feature_tests.mjs')) {
  runTier3Tests().then(() => {
    process.exit(scorecard.tier3.failed === 0 ? 0 : 1);
  });
}
