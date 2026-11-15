/**
 * End-to-End Test Suite: 1st-Time Email OTP Verification Gate
 * Verifies that:
 * 1. New account registration triggers 6-digit OTP verification email.
 * 2. Unverified email blocks direct session issuance.
 * 3. Incorrect OTP is safely rejected.
 * 4. Resend OTP enforces 30s rate-limiting cooldown.
 * 5. Valid OTP verification marks account as email_verified: true and issues JWT session.
 * 6. Subsequent logins with verified email are instant with password only (NO OTP prompt!).
 * 7. Seed/pre-existing verified accounts log in directly without OTP.
 * 8. Password reset via 6-digit OTP updates password and maintains verified status.
 */

import handler from '../api/auth.js';
import {
  findUserByEmail,
  verifyPassword
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

async function runTests() {
  console.log('================================================================');
  console.log('🧪 Starting NET Vidya Email OTP Verification E2E Test Suite');
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

  const testEmail = `candidate_otp_${Date.now()}@testdomain.com`;
  const testPassword = 'SecureStudentPass@2026';
  const testName = 'Candidate Priya Test';

  // -------------------------------------------------------------
  // Test 1: Signup requires email verification OTP
  // -------------------------------------------------------------
  console.log('Test 1: Candidate Account Signup');
  {
    const { req, res, getResult } = mockReqRes({
      method: 'POST',
      query: { action: 'signup' },
      body: {
        name: testName,
        email: testEmail,
        mobile: '9876543210',
        password: testPassword
      }
    });

    await handler(req, res);
    const result = getResult();

    assert(result.status === 200, `Signup returns HTTP 200 (Got ${result.status})`);
    assert(result.body?.success === true, 'Signup returns success: true');
    assert(result.body?.requiresOtp === true, 'Signup flags requiresOtp: true');
    assert(result.body?.purpose === 'signup', 'Signup OTP purpose is "signup"');
    assert(!result.body?.token, 'JWT session token is NOT issued prior to email verification');
  }

  // -------------------------------------------------------------
  // Test 2: Unverified user login prompts for OTP
  // -------------------------------------------------------------
  console.log('\nTest 2: Unverified Account Login Gate');
  {
    const { req, res, getResult } = mockReqRes({
      method: 'POST',
      query: { action: 'login' },
      body: {
        email: testEmail,
        password: testPassword
      }
    });

    await handler(req, res);
    const result = getResult();

    assert(result.status === 200, `Login returns HTTP 200 (Got ${result.status})`);
    assert(result.body?.requiresOtp === true, 'Login requires OTP for unverified account');
    assert(result.body?.purpose === 'first_login', 'Purpose is "first_login"');
    assert(!result.body?.token, 'No session token issued before OTP verification');
  }

  // -------------------------------------------------------------
  // Test 3: Incorrect OTP is rejected
  // -------------------------------------------------------------
  console.log('\nTest 3: Incorrect OTP Rejection');
  {
    const { req, res, getResult } = mockReqRes({
      method: 'POST',
      query: { action: 'verify-otp' },
      body: {
        email: testEmail,
        otp: '000000',
        purpose: 'first_login'
      }
    });

    await handler(req, res);
    const result = getResult();

    assert(result.status === 400, `Incorrect OTP returns HTTP 400 (Got ${result.status})`);
    assert(result.body?.success === false, 'Incorrect OTP returns success: false');
    assert(result.body?.error?.includes('Incorrect verification code'), 'Error message informs candidate of incorrect code');
  }

  // -------------------------------------------------------------
  // Test 4: Rate limit cooldown on resend OTP
  // -------------------------------------------------------------
  console.log('\nTest 4: Resend OTP Rate Limit Cooldown');
  {
    const { req, res, getResult } = mockReqRes({
      method: 'POST',
      query: { action: 'resend-otp' },
      body: {
        email: testEmail,
        purpose: 'first_login'
      }
    });

    await handler(req, res);
    const result = getResult();

    assert(result.status === 429, `Rapid resend returns HTTP 429 Rate Limit (Got ${result.status})`);
    assert(result.body?.error?.includes('seconds before requesting a new code'), 'Resend returns cooldown countdown error');
  }

  // -------------------------------------------------------------
  // Test 5: Valid OTP verification completes registration & issues session
  // -------------------------------------------------------------
  console.log('\nTest 5: Valid OTP Verification');
  let sessionToken = '';
  {
    // Retrieve the active stored OTP hash from store
    const otpStoreEntry = globalThis.__NETVIDYA_OTP_STORE__?.get(testEmail);
    assert(Boolean(otpStoreEntry), 'OTP store entry exists in memory');

    // To test verification, let's generate a known OTP and verify it
    const testOtp = '839201';
    await (await import('../lib/auth-helper.js')).storeEmailOtp(testEmail, testOtp, 'signup');

    const { req, res, getResult } = mockReqRes({
      method: 'POST',
      query: { action: 'verify-otp' },
      body: {
        email: testEmail,
        otp: testOtp,
        purpose: 'signup'
      }
    });

    await handler(req, res);
    const result = getResult();

    assert(result.status === 200, `Valid OTP returns HTTP 200 (Got ${result.status})`);
    assert(result.body?.success === true, 'Verification returns success: true');
    assert(Boolean(result.body?.token), 'Session JWT token issued upon successful verification');
    assert(result.body?.user?.email === testEmail, 'Returned user object matches candidate email');
    sessionToken = result.body?.token;

    // Verify stored user in DB is marked email_verified: true
    const userInDb = await findUserByEmail(testEmail);
    assert(userInDb?.email_verified === true, 'User record in DB has email_verified === true');
    assert(Boolean(userInDb?.email_verified_at), 'User record has email_verified_at timestamp');
  }

  // -------------------------------------------------------------
  // Test 6: Subsequent login with verified email is INSTANT (NO OTP!)
  // -------------------------------------------------------------
  console.log('\nTest 6: Verified Student Instant Subsequent Login (Zero OTP)');
  {
    const { req, res, getResult } = mockReqRes({
      method: 'POST',
      query: { action: 'login' },
      body: {
        email: testEmail,
        password: testPassword
      }
    });

    await handler(req, res);
    const result = getResult();

    assert(result.status === 200, `Login returns HTTP 200 (Got ${result.status})`);
    assert(result.body?.success === true, 'Login returns success: true');
    assert(!result.body?.requiresOtp, 'Subsequent login DOES NOT require OTP (requiresOtp is falsy)');
    assert(Boolean(result.body?.token), 'Direct JWT session token returned immediately');
    assert(result.body?.user?.email === testEmail, 'User profile returned directly');
  }

  // -------------------------------------------------------------
  // Test 7: Seed accounts (student@example.com) log in directly without OTP
  // -------------------------------------------------------------
  console.log('\nTest 7: Seed Accounts Verified Status Check');
  {
    const { req, res, getResult } = mockReqRes({
      method: 'POST',
      query: { action: 'login' },
      body: {
        email: 'student@example.com',
        password: 'password123'
      }
    });

    await handler(req, res);
    const result = getResult();

    assert(result.status === 200, `Seed user login returns HTTP 200 (Got ${result.status})`);
    assert(result.body?.success === true, 'Seed user login returns success: true');
    assert(!result.body?.requiresOtp, 'Seed user DOES NOT require OTP');
    assert(Boolean(result.body?.token), 'Seed user receives JWT token directly');
  }

  // -------------------------------------------------------------
  // Test 8: Password reset with 6-digit OTP
  // -------------------------------------------------------------
  console.log('\nTest 8: Password Reset via 6-Digit OTP');
  {
    const { req, res, getResult } = mockReqRes({
      method: 'POST',
      query: { action: 'forgot-password' },
      body: { email: testEmail }
    });

    await handler(req, res);
    const result = getResult();

    assert(result.status === 200, 'Forgot password returns HTTP 200');
    assert(result.body?.success === true, 'Forgot password returns success: true');

    // Generate known reset OTP for test verification
    const resetOtp = '654321';
    await (await import('../lib/auth-helper.js')).storeEmailOtp(testEmail, resetOtp, 'reset_password');

    const newPass = 'UpdatedPassword@2026';
    const { req: resetReq, res: resetRes, getResult: getResetResult } = mockReqRes({
      method: 'POST',
      query: { action: 'reset-password' },
      body: {
        email: testEmail,
        otp: resetOtp,
        newPassword: newPass
      }
    });

    await handler(resetReq, resetRes);
    const resetResult = getResetResult();

    assert(resetResult.status === 200, `Reset password with OTP returns HTTP 200 (Got ${resetResult.status})`);
    assert(resetResult.body?.success === true, 'Password reset reports success');

    // Verify login with new password
    const { req: loginReq, res: loginRes, getResult: getLoginResult } = mockReqRes({
      method: 'POST',
      query: { action: 'login' },
      body: {
        email: testEmail,
        password: newPass
      }
    });

    await handler(loginReq, loginRes);
    const loginResult = getLoginResult();

    assert(loginResult.status === 200, 'Login with updated password succeeds with HTTP 200');
    assert(loginResult.body?.success === true, 'Login with new password succeeds');
    assert(!loginResult.body?.requiresOtp, 'Login with new password is direct without OTP');
  }

  console.log('\n================================================================');
  console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
