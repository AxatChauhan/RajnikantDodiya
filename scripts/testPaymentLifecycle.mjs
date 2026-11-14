import crypto from 'crypto';

async function testAllPaymentFlows() {
  console.log('================================================================');
  console.log('NET VIDYA PAYMENT SUCCESS & FAILURE VALIDATION VERIFICATION');
  console.log('================================================================\n');

  const testSecret = 'netvidya_rzp_test_secret_key_2026';
  const testWhSecret = 'netvidya_wh_test_secret_key_2026';

  // -------------------------------------------------------------
  // TEST 1: verify-payment with TAMPERED / INVALID signature
  // -------------------------------------------------------------
  const { default: verifyPaymentHandler } = await import('../api/store/verify-payment.js');

  let tamperedStatus = 0;
  let tamperedJson = null;
  const tamperedReq = {
    method: 'POST',
    body: {
      razorpay_order_id: 'order_123',
      razorpay_payment_id: 'pay_123',
      razorpay_signature: 'fake_tampered_signature_hex_000',
      studentName: 'Test Student',
      email: 'test_tampered@example.com',
      mobile: '9876543210',
      productId: 'gset-english-combo'
    }
  };
  const tamperedRes = {
    status(c) { tamperedStatus = c; return this; },
    json(d) { tamperedJson = d; return this; }
  };
  await verifyPaymentHandler(tamperedReq, tamperedRes);
  console.log('1. Tampered / Failed Signature Test:');
  console.log('   Status Code:', tamperedStatus, '(Expected: 400)');
  console.log('   Success Field:', tamperedJson?.success, '(Expected: false)');
  console.log('   Error Message:', tamperedJson?.error);
  const test1Passed = tamperedStatus === 400 && tamperedJson?.success === false;
  console.log('   Result:', test1Passed ? '✓ PASS: Fraudulent / failed payments rejected' : '✗ FAIL');
  console.log();

  // -------------------------------------------------------------
  // TEST 2: verify-payment with AUTHENTIC / VALID signature
  // -------------------------------------------------------------
  const validOrderId = 'order_valid_789';
  const validPaymentId = 'pay_valid_789';
  const validSignature = crypto
    .createHmac('sha256', testSecret)
    .update(validOrderId + '|' + validPaymentId)
    .digest('hex');

  let validStatus = 0;
  let validJson = null;
  const validReq = {
    method: 'POST',
    body: {
      razorpay_order_id: validOrderId,
      razorpay_payment_id: validPaymentId,
      razorpay_signature: validSignature,
      studentName: 'Priyal Dave',
      email: 'priyal.dave@example.com',
      mobile: '9876543210',
      productId: 'gset-english-combo',
      amount: 249
    }
  };
  const validRes = {
    status(c) { validStatus = c; return this; },
    json(d) { validJson = d; return this; }
  };
  await verifyPaymentHandler(validReq, validRes);
  console.log('2. Valid Payment Signature Verification Test:');
  console.log('   Status Code:', validStatus, '(Expected: 200)');
  console.log('   Verified:', validJson?.verified, '(Expected: true)');
  console.log('   Enrolled:', validJson?.isEnrolled, '(Expected: true)');
  console.log('   Product Enrolled:', validJson?.buyer?.product);
  console.log('   Amount Verified: ₹' + validJson?.buyer?.amountPaid);
  console.log('   Auth Token Issued:', Boolean(validJson?.token));
  const test2Passed = validStatus === 200 && validJson?.verified === true && validJson?.isEnrolled === true;
  console.log('   Result:', test2Passed ? '✓ PASS: Successful payment verified & candidate unlocked' : '✗ FAIL');
  console.log();

  // -------------------------------------------------------------
  // TEST 3: razorpay-webhook with AUTHENTIC webhook signature
  // -------------------------------------------------------------
  const { default: webhookHandler } = await import('../api/store/razorpay-webhook.js');
  const webhookPayload = JSON.stringify({
    event: 'payment_link.paid',
    payload: {
      payment_link: {
        entity: {
          id: 'plink_test_999',
          amount_paid: 14900,
          currency: 'INR',
          status: 'paid',
          customer: {
            name: 'Kavita Joshi',
            email: 'kavita.joshi@example.com',
            contact: '9898989898'
          },
          notes: {
            product_id: 'gset-paper1',
            product_name: 'GSET Paper 1: General Aptitude Foundation Pack'
          }
        }
      }
    }
  });

  const whSignature = crypto
    .createHmac('sha256', testWhSecret)
    .update(webhookPayload)
    .digest('hex');

  let whStatus = 0;
  let whJson = null;
  const whReq = {
    method: 'POST',
    rawBody: webhookPayload,
    body: JSON.parse(webhookPayload),
    headers: {
      'x-razorpay-signature': whSignature
    }
  };
  const whRes = {
    status(c) { whStatus = c; return this; },
    json(d) { whJson = d; return this; }
  };
  await webhookHandler(whReq, whRes);
  console.log('3. Razorpay Webhook Payment Link Capture Test:');
  console.log('   Status Code:', whStatus, '(Expected: 200)');
  console.log('   Processed:', whJson?.processed, '(Expected: true)');
  const test3Passed = whStatus === 200 && whJson?.processed === true;
  console.log('   Result:', test3Passed ? '✓ PASS: Webhook processed payment & granted access' : '✗ FAIL');
  console.log();

  // -------------------------------------------------------------
  // TEST 4: razorpay-webhook with INVALID webhook signature
  // -------------------------------------------------------------
  let badWhStatus = 0;
  let badWhJson = null;
  const badWhReq = {
    method: 'POST',
    rawBody: webhookPayload,
    body: JSON.parse(webhookPayload),
    headers: {
      'x-razorpay-signature': 'forged_fake_signature_999'
    }
  };
  const badWhRes = {
    status(c) { badWhStatus = c; return this; },
    json(d) { badWhJson = d; return this; }
  };
  await webhookHandler(badWhReq, badWhRes);
  console.log('4. Razorpay Webhook Forged Signature Security Test:');
  console.log('   Status Code:', badWhStatus, '(Expected: 400)');
  console.log('   Error Message:', badWhJson?.error);
  const test4Passed = badWhStatus === 400;
  console.log('   Result:', test4Passed ? '✓ PASS: Forged webhook signature rejected' : '✗ FAIL');
  console.log();

  // -------------------------------------------------------------
  // TEST 5: Confirmation Email Dispatch Test
  // -------------------------------------------------------------
  const { sendPurchaseConfirmationEmail } = await import('../api/store/email.js');
  const emailRes = await sendPurchaseConfirmationEmail({
    to: 'kavita.joshi@example.com',
    studentName: 'Kavita Joshi',
    orderId: 'ORD_TEST_999',
    amount: 149,
    paymentId: 'pay_test_999'
  });
  console.log('5. Confirmation Email Dispatch Test:');
  console.log('   Success:', emailRes.success);
  console.log('   Message ID:', emailRes.messageId);
  console.log('   Simulated / Real Mode:', emailRes.simulated ? 'Simulated' : 'Real');
  const test5Passed = emailRes.success === true;
  console.log('   Result:', test5Passed ? '✓ PASS: Email dispatched with student dashboard link' : '✗ FAIL');
  console.log();

  // -------------------------------------------------------------
  // TEST 6: User Authentication & Login Verification
  // -------------------------------------------------------------
  const { findUserByEmail, saveUser } = await import('../lib/auth-helper.js');
  const testUser = await findUserByEmail('priyal.dave@example.com');
  console.log('6. User Access State Verification:');
  console.log('   User Found:', Boolean(testUser));
  console.log('   Is Buyer:', testUser?.is_buyer);
  console.log('   Access Active:', testUser?.is_active);
  console.log('   Expires At:', testUser?.expires_at);
  const test6Passed = testUser?.is_buyer === true && testUser?.is_active === true;
  console.log('   Result:', test6Passed ? '✓ PASS: Candidate immediately unlocked with buyer access' : '✗ FAIL');
  console.log();

  const allPassed = test1Passed && test2Passed && test3Passed && test4Passed && test5Passed && test6Passed;
  console.log('================================================================');
  console.log(`FINAL RESULT: ${allPassed ? 'ALL 6 TESTS PASSED ✓' : 'SOME TESTS FAILED ✗'}`);
  console.log('================================================================');
}

testAllPaymentFlows();
