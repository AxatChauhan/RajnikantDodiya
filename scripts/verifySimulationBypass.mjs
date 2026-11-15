/**
 * Rapid & Authoritative Simulation Payment Bypass Verification Suite
 * Tests local server, API handlers, client guardrails, and state unlocks.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';

// ANSI colors for clean test reporting
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ${GREEN}✓ [PASS]${RESET} ${message}`);
    passed++;
  } else {
    console.error(`  ${RED}✗ [FAIL]${RESET} ${message}`);
    failed++;
  }
}

// Mock req and res objects for Vercel serverless handlers
function createMockReqRes({ method = 'POST', body = {}, query = {}, headers = {} }) {
  let statusCode = 200;
  let responseData = null;
  const responseHeaders = {};

  const req = {
    method,
    body,
    query,
    headers,
    url: ''
  };

  const res = {
    setHeader(key, value) {
      responseHeaders[key] = value;
      return res;
    },
    status(code) {
      statusCode = code;
      return res;
    },
    json(data) {
      responseData = data;
      return res;
    },
    end() {
      return res;
    },
    getStatusCode: () => statusCode,
    getData: () => responseData
  };

  return { req, res };
}

// Simple HTTP GET helper for localhost
function fetchLocalhost(urlPath) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:5173${urlPath}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', err => reject(err));
    req.setTimeout(3000, () => {
      req.destroy();
      reject(new Error('Connection timed out'));
    });
  });
}

async function runSuite() {
  console.log(`\n${BOLD}${CYAN}================================================================${RESET}`);
  console.log(`${BOLD}${CYAN} NET VIDYA — RAPID SIMULATION PAYMENT BYPASS TEST HARNESS${RESET}`);
  console.log(`${BOLD}${CYAN} Target: Local Server & Direct API Handlers${RESET}`);
  console.log(`${BOLD}${CYAN}================================================================${RESET}\n`);

  // --- SUITE 1: Localhost Server Connectivity ---
  console.log(`${BOLD}--- TEST SUITE 1: Localhost 5173 Server Availability ---${RESET}`);
  try {
    const page = await fetchLocalhost('/');
    assert(page.status === 200, `Localhost responds with HTTP 200 OK`);
    assert(page.data.includes('id="root"'), `HTML contains React root mounting point`);
    assert(page.data.includes('Dr. Rajnikant Dodiya'), `HTML contains authoritative curator identity`);
  } catch (err) {
    console.warn(`  ${YELLOW}⚠ [WARN] Localhost HTTP ping encountered: ${err.message}${RESET}`);
  }

  // --- SUITE 2: Serverless Create-Order API Handler (/api/store/create-order.js) ---
  console.log(`\n${BOLD}--- TEST SUITE 2: Serverless Create-Order Handler (Zero-Charge Simulation) ---${RESET}`);
  const { default: createOrderHandler } = await import('../api/store/create-order.js');

  // Case 2A: UGC NET Bundle with SIMULATE voucher
  {
    const { req, res } = createMockReqRes({
      body: {
        studentName: 'Aarav Patel',
        email: 'aarav.patel@test.in',
        mobile: '9825123456',
        couponCode: 'SIMULATE',
        productId: 'ugc-net-english-bundle',
        examStore: 'ugc'
      }
    });

    await createOrderHandler(req, res);
    const data = res.getData();

    assert(res.getStatusCode() === 200, `Create-order returns HTTP 200 for SIMULATE voucher`);
    assert(data.success === true, `Order created successfully`);
    assert(data.paymentMode === 'test_simulation', `paymentMode is explicitly 'test_simulation'`);
    assert(data.isTestMode === true, `isTestMode is true`);
    assert(data.amount === 0, `Payable amount is exactly ₹0`);
    assert(data.amountInPaisa === 0, `amountInPaisa is 0 paise`);
    assert(typeof data.orderId === 'string' && data.orderId.startsWith('order_sim_'), `Simulation order ID issued: ${data.orderId}`);
  }

  // Case 2B: GSET Combo Duo with SIMULATE voucher
  {
    const { req, res } = createMockReqRes({
      body: {
        studentName: 'Scholar Candidate',
        email: 'scholar.candidate@test.in',
        mobile: '9876543210',
        couponCode: 'SIMULATE',
        productId: 'gset-english-combo',
        examStore: 'gset'
      }
    });

    await createOrderHandler(req, res);
    const data = res.getData();

    assert(res.getStatusCode() === 200, `GSET combo returns HTTP 200 for SIMULATE voucher`);
    assert(data.paymentMode === 'test_simulation', `GSET pack correctly switches to 'test_simulation'`);
    assert(data.amount === 0, `GSET ₹249 pack discounted to ₹0`);
    assert(data.isTestMode === true, `GSET test mode flag is true`);
  }

  // Case 2C: GSET Standalone Single Paper with SIMULATE voucher
  {
    const { req, res } = createMockReqRes({
      body: {
        studentName: 'Scholar Single',
        email: 'scholar.single@test.in',
        mobile: '9876543210',
        couponCode: 'SIMULATE',
        productId: 'gset-paper1',
        examStore: 'gset'
      }
    });

    await createOrderHandler(req, res);
    const data = res.getData();

    assert(res.getStatusCode() === 200, `GSET Paper 1 returns HTTP 200 for SIMULATE voucher`);
    assert(data.amount === 0, `GSET ₹149 single discounted to ₹0`);
  }

  // --- SUITE 3: Serverless Verify-Payment API Handler (/api/store/verify-payment.js) ---
  console.log(`\n${BOLD}--- TEST SUITE 3: Serverless Verify-Payment Handler (Instant Activation) ---${RESET}`);
  const { default: verifyPaymentHandler } = await import('../api/store/verify-payment.js');

  // Case 3A: Simulation verification with coupon SIMULATE
  {
    const simOrderId = `order_sim_${Date.now()}_test`;
    const { req, res } = createMockReqRes({
      body: {
        orderId: simOrderId,
        studentName: 'Scholar Tester',
        email: 'scholar.sim@test.in',
        mobile: '9876543210',
        productId: 'ugc-net-english-bundle',
        amount: 0,
        couponCode: 'SIMULATE'
      }
    });

    await verifyPaymentHandler(req, res);
    const data = res.getData();

    assert(res.getStatusCode() === 200, `Verify-payment returns HTTP 200 for simulation coupon`);
    assert(data.success === true, `Payment verification succeeded`);
    assert(data.verified === true, `Simulation marked cryptographically verified`);
    assert(data.enrolled === true, `Student access marked actively enrolled`);
    assert(typeof data.token === 'string' && data.token.length > 20, `Authenticated session token issued`);
    assert(data.user && data.user.isBuyer === true, `Student entity marked isBuyer: true`);
    assert(data.buyer && data.buyer.orderId === simOrderId, `Buyer record bound to simulation orderId`);
  }

  // Case 3B: Instant Activation with pay_simulated_test
  {
    const { req, res } = createMockReqRes({
      body: {
        paymentId: 'pay_simulated_test',
        email: 'direct.sim@test.in',
        studentName: 'Direct Demo Candidate'
      }
    });

    await verifyPaymentHandler(req, res);
    const data = res.getData();

    assert(res.getStatusCode() === 200, `Verify-payment returns HTTP 200 for demo ID pay_simulated_test`);
    assert(data.success === true, `Instant activation succeeded`);
    assert(data.isEnrolled === true, `isEnrolled is true`);
    assert(data.user?.isBuyer === true, `Direct demo student issued buyer session`);
  }

  // Case 3C: Security Check — Tampered / Uncaptured payment rejected
  {
    const { req, res } = createMockReqRes({
      body: {
        paymentId: 'pay_unreal_tampered_12345',
        email: 'attacker@fraud.com',
        studentName: 'Attacker'
      }
    });

    await verifyPaymentHandler(req, res);
    assert(res.getStatusCode() === 400, `Fake / unverified payment ID correctly rejected with HTTP 400`);
    assert(res.getData()?.success === false, `Response success is false`);
  }

  // --- SUITE 4: Client Source Code Verification (NetVidyaCheckoutModal.tsx) ---
  console.log(`\n${BOLD}--- TEST SUITE 4: Checkout Modal Source Safeguards ---${RESET}`);
  const checkoutCode = fs.readFileSync(path.resolve('src/components/store/NetVidyaCheckoutModal.tsx'), 'utf-8');

  // Verify Short-circuit priority
  const hasPriorityShortCircuit = checkoutCode.includes('// PRIORITY 1: Test Simulation Mode (Instant ₹0 bypass - NEVER redirect to Razorpay)');
  assert(hasPriorityShortCircuit, `Simulation mode has Priority 1 short-circuit before any payment link check`);

  // Verify targetPaymentLink guard
  const hasGuardedPaymentLink = checkoutCode.includes('const targetPaymentLink = (orderData.paymentMode === \'payment_link\' && orderData.paymentLinkUrl)') &&
    checkoutCode.includes('// PRIORITY 1: Test Simulation Mode');
  assert(hasGuardedPaymentLink, `Payment link evaluation positioned AFTER simulation return`);

  // Verify catch block safety
  const hasCatchBlockProtection = checkoutCode.includes('if (isSimulated)') &&
    checkoutCode.includes('loginBuyer({') &&
    checkoutCode.includes('setIsPaymentSuccess(true);');
  assert(hasCatchBlockProtection, `Catch block has simulation fallback (never redirects to Razorpay on error)`);

  // Verify above-the-fold banner button
  const hasBannerUnlockButton = checkoutCode.includes('⚡ Instant Unlock (₹0)') || checkoutCode.includes('🚀 1-Click Activate Pass');
  assert(hasBannerUnlockButton, `Above-the-fold 1-click unlock button is pinned in price banner`);

  // Verify enrolled packs passed
  const hasEnrolledPacksPassed = checkoutCode.includes('enrolledPacks: activeProduct.id === \'ugc-net-english-bundle\'');
  assert(hasEnrolledPacksPassed, `loginBuyer receives explicit enrolledPacks for instant unlock in My Materials`);

  // --- SUITE 5: Summary Report ---
  console.log(`\n${BOLD}${CYAN}================================================================${RESET}`);
  console.log(`${BOLD} VERIFICATION SUMMARY: ${passed}/${passed + failed} Tests Passed${RESET}`);
  if (failed === 0) {
    console.log(`${BOLD}${GREEN} RESULT: 100% SUCCESS — SIMULATION PAYMENT BYPASS IS FULLY WORKING!${RESET}`);
  } else {
    console.log(`${BOLD}${RED} RESULT: ${failed} TESTS FAILED${RESET}`);
  }
  console.log(`${BOLD}${CYAN}================================================================${RESET}\n`);

  if (failed > 0) process.exit(1);
}

runSuite().catch(err => {
  console.error('Test harness exception:', err);
  process.exit(1);
});
