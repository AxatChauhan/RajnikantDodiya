/**
 * Multi-Container Stateless Authentication & Resilience Test Suite
 * 
 * Demonstrates that across ephemeral Vercel serverless containers:
 * 1. Account signup on Container A produces an HMAC verification ticket.
 * 2. Total container cold-start / memory wipe occurs (RAM cleared).
 * 3. Container B verifies the OTP statelessly using verificationTicket and expiresAt.
 * 4. Password reset on Container A produces an HMAC verification ticket.
 * 5. Total container cold-start / memory wipe occurs.
 * 6. Container B processes password reset statelessly without shared memory.
 * 7. Tampered or expired tickets are rejected cryptographically.
 * 8. Non-existent account returns 404 ACCOUNT_NOT_FOUND.
 * 9. Incorrect password returns 401 INCORRECT_PASSWORD.
 */

import handler from '../api/auth.js';
import {
  findUserByEmail,
  storeEmailOtp,
  verifyOtpVerificationTicket,
  createOtpVerificationTicket
} from '../lib/auth-helper.js';

function mockReqRes({ method = 'POST', query = {}, body = {}, headers = {} }) {
  const req = {
    method,
    query,
    body,
    headers,
    url: `/api/auth?action=${query.action || ''}`
  };

  let statusCode = 200;
  let responseData = null;
  const resHeaders = {};

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    setHeader(key, val) {
      resHeaders[key] = val;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
    end() {
      return this;
    }
  };

  return { req, res, getResult: () => ({ status: statusCode, body: responseData, headers: resHeaders }) };
}

async function runStatelessMultiContainerSuite() {
  console.log('================================================================');
  console.log('🌐 RUNNING STATELESS MULTI-CONTAINER SERVERLESS AUTH SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  const testEmail = `stateless_candidate_${Date.now()}@netvidya.ac.in`;
  const testPassword = 'StatelessPassword@2026';
  const testName = 'Prof. Stateless Scholar';

  // =========================================================================
  // SCENARIO 1: Multi-Container OTP Verification across Cold Starts
  // =========================================================================
  console.log('--- SCENARIO 1: Signup on Container A -> Verify on Container B (Wiped RAM) ---');

  let containerATicket = null;
  let containerAExpiresAt = null;
  const knownCandidateOtp = '748291';

  // Step 1.1: Signup on Container A
  {
    const { req, res, getResult } = mockReqRes({
      method: 'POST',
      query: { action: 'signup' },
      body: {
        name: testName,
        email: testEmail,
        password: testPassword,
        mobile: '9876543210'
      }
    });

    await handler(req, res);
    const result = getResult();

    assert(result.status === 200, `Container A signup succeeds (Status 200)`);
    assert(result.body?.requiresOtp === true, 'Container A flags requiresOtp: true');
    assert(Boolean(result.body?.verificationTicket), 'Container A returns cryptographic verificationTicket');
    assert(Boolean(result.body?.expiresAt), 'Container A returns ticket expiresAt timestamp');

    // To test candidate entering their email OTP, store a known OTP for Container A
    const otpRecord = await storeEmailOtp(testEmail, knownCandidateOtp, 'signup');
    containerATicket = otpRecord.verificationTicket;
    containerAExpiresAt = otpRecord.expiresAt;
    assert(Boolean(containerATicket), 'Container A generated cryptographic HMAC verificationTicket');
  }

  // Step 1.2: SIMULATE CONTAINER DESTRUCTION / COLD START
  console.log('\n[SIMULATING CONTAINER A TERMINATION & RAM WIPEOUT...]');
  if (globalThis.__NETVIDYA_OTP_STORE__) {
    globalThis.__NETVIDYA_OTP_STORE__.clear();
  }
  assert(globalThis.__NETVIDYA_OTP_STORE__?.size === 0, 'Container B RAM is 100% cold (OTP store is empty)');

  // Step 1.3: Verification on Container B with verificationTicket
  {
    const { req, res, getResult } = mockReqRes({
      method: 'POST',
      query: { action: 'verify-otp' },
      body: {
        email: testEmail,
        otp: knownCandidateOtp,
        purpose: 'signup',
        verificationTicket: containerATicket,
        expiresAt: containerAExpiresAt
      }
    });

    await handler(req, res);
    const result = getResult();

    assert(result.status === 200, `Container B verifies OTP with HTTP 200 despite empty RAM`);
    assert(result.body?.success === true, 'Container B returns success: true');
    assert(Boolean(result.body?.token), 'Container B issues valid candidate JWT session');
    assert(result.body?.user?.email === testEmail, 'Container B returns verified candidate profile');

    const user = await findUserByEmail(testEmail);
    assert(user?.email_verified === true, 'Candidate persisted with email_verified: true');
  }

  // =========================================================================
  // SCENARIO 2: Cryptographic Tamper-Resistance of Verification Ticket
  // =========================================================================
  console.log('\n--- SCENARIO 2: Cryptographic Tamper-Resistance ---');

  // Step 2.1: Tampered OTP with valid ticket
  {
    const { req, res, getResult } = mockReqRes({
      method: 'POST',
      query: { action: 'verify-otp' },
      body: {
        email: testEmail,
        otp: '000000', // Tampered OTP
        purpose: 'signup',
        verificationTicket: containerATicket,
        expiresAt: containerAExpiresAt
      }
    });

    await handler(req, res);
    const result = getResult();

    assert(result.status === 400, 'Tampered OTP rejected with HTTP 400');
    assert(result.body?.error?.includes('Incorrect verification code'), 'Error explains incorrect code');
  }

  // Step 2.2: Tampered Ticket Signature
  {
    const tamperedTicket = containerATicket.slice(0, -6) + 'abcdef';
    const { req, res, getResult } = mockReqRes({
      method: 'POST',
      query: { action: 'verify-otp' },
      body: {
        email: testEmail,
        otp: knownCandidateOtp,
        purpose: 'signup',
        verificationTicket: tamperedTicket,
        expiresAt: containerAExpiresAt
      }
    });

    await handler(req, res);
    const result = getResult();

    assert(result.status === 400, 'Tampered ticket signature rejected with HTTP 400');
  }

  // Step 2.3: Expired Ticket
  {
    const expiredTimestamp = Date.now() - 5000;
    const expiredTicket = createOtpVerificationTicket(testEmail, '123456', 'signup', expiredTimestamp);
    const isValid = verifyOtpVerificationTicket(testEmail, '123456', 'signup', expiredTimestamp, expiredTicket);
    assert(isValid === false, 'Expired verification ticket cryptographically invalid');
  }

  // =========================================================================
  // SCENARIO 3: Multi-Container Password Reset Flow
  // =========================================================================
  console.log('\n--- SCENARIO 3: Forgot Password on Container A -> Reset on Container B ---');

  let resetTicket = null;
  let resetExpiresAt = null;
  const knownResetOtp = '918234';

  // Step 3.1: Forgot Password on Container A
  {
    const { req, res, getResult } = mockReqRes({
      method: 'POST',
      query: { action: 'forgot-password' },
      body: { email: testEmail }
    });

    await handler(req, res);
    const result = getResult();

    assert(result.status === 200, 'Container A forgot-password returns HTTP 200');
    assert(Boolean(result.body?.verificationTicket), 'Container A returns reset verificationTicket');
    assert(Boolean(result.body?.expiresAt), 'Container A returns reset expiresAt');

    const otpRecord = await storeEmailOtp(testEmail, knownResetOtp, 'reset_password');
    resetTicket = otpRecord.verificationTicket;
    resetExpiresAt = otpRecord.expiresAt;
    assert(Boolean(resetTicket), 'Container A generated reset OTP verificationTicket');
  }

  // Step 3.2: Wipe memory (Container cold-start)
  console.log('\n[SIMULATING CONTAINER COLD START & RAM WIPEOUT...]');
  if (globalThis.__NETVIDYA_OTP_STORE__) {
    globalThis.__NETVIDYA_OTP_STORE__.clear();
  }
  if (globalThis.__NETVIDYA_RESET_TOKENS__) {
    globalThis.__NETVIDYA_RESET_TOKENS__.clear();
  }
  assert(globalThis.__NETVIDYA_OTP_STORE__?.size === 0, 'Container B RAM is completely empty');

  // Step 3.3: Reset Password on Container B with ticket
  const updatedPassword = 'NewStatelessSecurePassword@2026';
  {
    const { req, res, getResult } = mockReqRes({
      method: 'POST',
      query: { action: 'reset-password' },
      body: {
        email: testEmail,
        otp: knownResetOtp,
        newPassword: updatedPassword,
        verificationTicket: resetTicket,
        expiresAt: resetExpiresAt
      }
    });

    await handler(req, res);
    const result = getResult();

    assert(result.status === 200, 'Container B resets password with HTTP 200 without RAM state');
    assert(result.body?.success === true, 'Container B returns success: true');
  }

  // Step 3.4: Candidate logs in on Container C with new password
  {
    const { req, res, getResult } = mockReqRes({
      method: 'POST',
      query: { action: 'login' },
      body: {
        email: testEmail,
        password: updatedPassword
      }
    });

    await handler(req, res);
    const result = getResult();

    assert(result.status === 200, 'Container C logs in candidate with new password');
    assert(result.body?.success === true, 'Login succeeds');
    assert(Boolean(result.body?.token), 'New session token issued');
  }

  // =========================================================================
  // SCENARIO 4: Actionable Error Differentiation (404 vs 401)
  // =========================================================================
  console.log('\n--- SCENARIO 4: Actionable Login Error Differentiation ---');

  // Step 4.1: Non-existent email -> 404 ACCOUNT_NOT_FOUND
  {
    const ghostEmail = `nonexistent_${Date.now()}@domain.org`;
    const { req, res, getResult } = mockReqRes({
      method: 'POST',
      query: { action: 'login' },
      body: {
        email: ghostEmail,
        password: 'SomePassword123!'
      }
    });

    await handler(req, res);
    const result = getResult();

    assert(result.status === 404, `Non-existent user returns HTTP 404 (Got ${result.status})`);
    assert(result.body?.errorType === 'ACCOUNT_NOT_FOUND', 'Response flags errorType: ACCOUNT_NOT_FOUND');
    assert(result.body?.error?.includes('No account found'), 'Helpful error prompt directing user to sign up');
  }

  // Step 4.2: Existing email with wrong password -> 401 INCORRECT_PASSWORD
  {
    const { req, res, getResult } = mockReqRes({
      method: 'POST',
      query: { action: 'login' },
      body: {
        email: testEmail,
        password: 'WrongPasswordTotally'
      }
    });

    await handler(req, res);
    const result = getResult();

    assert(result.status === 401, `Wrong password returns HTTP 401 (Got ${result.status})`);
    assert(result.body?.errorType === 'INCORRECT_PASSWORD', 'Response flags errorType: INCORRECT_PASSWORD');
    assert(result.body?.error?.includes('Incorrect password'), 'Helpful error prompt directing user to forgot password');
  }

  console.log('\n================================================================');
  console.log(`📊 STATELESS MULTI-CONTAINER RESULTS: ${passed} Passed, ${failed} Failed`);
  if (failed === 0) {
    console.log('✅ ALL MULTI-CONTAINER STATELESS RESILIENCE CHECKS PASSED PERFECTLY!');
  } else {
    console.log('❌ SOME STATELESS CHECKS FAILED.');
    process.exit(1);
  }
  console.log('================================================================\n');
}

runStatelessMultiContainerSuite().catch((err) => {
  console.error('Unhandled test failure:', err);
  process.exit(1);
});
