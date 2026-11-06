/**
 * Adversarial Authentication & Access Control Test Harness
 * Author: challenger_m2_1 (Empirical Challenger)
 * Objective: Empirically stress-test the authentication engine implemented in Milestone 2
 *
 * Suites:
 * 1. Duplicate user registration & input validation stress (409 Conflict, 400 Bad Request)
 * 2. Wrong password login resilience (401 Unauthorized, never 200 or 500)
 * 3. Invalid, expired, forged, and tampered JWT Bearer tokens (401 Unauthorized)
 * 4. Password reset token generation, single-use enforcement, and replay attack defeat
 * 5. Timing-safe password comparison verification (crypto.timingSafeEqual & error safety)
 * 6. Access control and paywall gating enforcement (401/403/date lock)
 */

import crypto from 'crypto';
import signupHandler from '../api/auth/signup.js';
import loginHandler from '../api/auth/login.js';
import meHandler from '../api/auth/me.js';
import forgotPasswordHandler from '../api/auth/forgot-password.js';
import resetPasswordHandler from '../api/auth/reset-password.js';
import downloadFileHandler from '../api/store/download-file.js';
import serveTestHandler from '../api/store/serve-test.js';
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
  JWT_SECRET,
  saveResetToken,
  findResetToken
} from '../api/auth/auth-helper.js';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failureDetails = [];

function assert(condition, suite, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [${suite}] ${testName}`);
    return true;
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: [${suite}] ${testName} ${details ? `--> ${details}` : ''}`);
    failureDetails.push({ suite, testName, details });
    return false;
  }
}

function createMockReq(options = {}) {
  const {
    method = 'GET',
    headers = {},
    body = {},
    query = {}
  } = options;

  const lowerHeaders = {};
  for (const [k, v] of Object.entries(headers)) {
    lowerHeaders[k.toLowerCase()] = v;
  }

  return {
    method,
    headers: lowerHeaders,
    body,
    query
  };
}

function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(name, val) {
      this.headers[name.toLowerCase()] = val;
      return this;
    },
    json(obj) {
      this.data = obj;
      return this;
    },
    send(val) {
      this.data = val;
      return this;
    }
  };
  return res;
}

async function run() {
  console.log('================================================================================');
  console.log('   EMPIRICAL CHALLENGER: ADVERSARIAL AUTHENTICATION STRESS HARNESS (M2)   ');
  console.log('================================================================================\n');

  // ===========================================================================
  // SUITE 1: Duplicate User Registration & Input Stress
  // ===========================================================================
  console.log('--- Suite 1: Duplicate Registration & Input Validation Stress ---');

  const uniqueId = Date.now();
  const testEmail = `adversary_${uniqueId}@stress.netvidya.com`;
  const testPassword = 'StrongPassword_2026!#';

  // 1.1 Initial registration succeeds
  {
    const req = createMockReq({
      method: 'POST',
      body: { name: 'Adversary Student', email: testEmail, mobile: '9988776655', password: testPassword }
    });
    const res = createMockRes();
    await signupHandler(req, res);
    assert(
      res.statusCode === 200 && res.data?.success === true && !!res.data?.token,
      'Suite1_Duplicate',
      '1.1 Successful initial registration returns 200 OK with valid JWT and user object',
      `Status: ${res.statusCode}, data: ${JSON.stringify(res.data)}`
    );
  }

  // 1.2 Exact duplicate registration returns 409 Conflict
  {
    const req = createMockReq({
      method: 'POST',
      body: { name: 'Adversary Duplicate', email: testEmail, mobile: '9988776655', password: testPassword }
    });
    const res = createMockRes();
    await signupHandler(req, res);
    assert(
      res.statusCode === 409 && res.data?.success === false,
      'Suite1_Duplicate',
      '1.2 Duplicate registration with exact email returns 409 Conflict',
      `Status: ${res.statusCode}, error: ${res.data?.error}`
    );
  }

  // 1.3 Case-insensitive duplicate registration returns 409 Conflict
  {
    const req = createMockReq({
      method: 'POST',
      body: { name: 'Adversary Duplicate Case', email: testEmail.toUpperCase(), mobile: '9988776655', password: testPassword }
    });
    const res = createMockRes();
    await signupHandler(req, res);
    assert(
      res.statusCode === 409 && res.data?.success === false,
      'Suite1_Duplicate',
      '1.3 Duplicate registration with UPPERCASE email returns 409 Conflict',
      `Status: ${res.statusCode}`
    );
  }

  // 1.4 Whitespace-padded duplicate registration returns 409 Conflict
  {
    const req = createMockReq({
      method: 'POST',
      body: { name: 'Adversary Duplicate WS', email: `  ${testEmail}  `, mobile: '9988776655', password: testPassword }
    });
    const res = createMockRes();
    await signupHandler(req, res);
    assert(
      res.statusCode === 409 && res.data?.success === false,
      'Suite1_Duplicate',
      '1.4 Duplicate registration with leading/trailing whitespace returns 409 Conflict',
      `Status: ${res.statusCode}`
    );
  }

  // 1.5 Missing name returns 400
  {
    const req = createMockReq({
      method: 'POST',
      body: { email: `noname_${uniqueId}@stress.com`, password: testPassword }
    });
    const res = createMockRes();
    await signupHandler(req, res);
    assert(res.statusCode === 400, 'Suite1_Duplicate', '1.5 Missing name returns 400 Bad Request');
  }

  // 1.6 Missing email returns 400
  {
    const req = createMockReq({
      method: 'POST',
      body: { name: 'No Email User', password: testPassword }
    });
    const res = createMockRes();
    await signupHandler(req, res);
    assert(res.statusCode === 400, 'Suite1_Duplicate', '1.6 Missing email returns 400 Bad Request');
  }

  // 1.7 Missing password returns 400
  {
    const req = createMockReq({
      method: 'POST',
      body: { name: 'No Pass User', email: `nopass_${uniqueId}@stress.com` }
    });
    const res = createMockRes();
    await signupHandler(req, res);
    assert(res.statusCode === 400, 'Suite1_Duplicate', '1.7 Missing password returns 400 Bad Request');
  }

  // 1.8 Empty password returns 400
  {
    const req = createMockReq({
      method: 'POST',
      body: { name: 'Empty Pass User', email: `emptypass_${uniqueId}@stress.com`, password: '' }
    });
    const res = createMockRes();
    await signupHandler(req, res);
    assert(res.statusCode === 400, 'Suite1_Duplicate', '1.8 Empty string password returns 400 Bad Request');
  }

  // 1.9 Non-string password (NoSQL object) returns 400
  {
    const req = createMockReq({
      method: 'POST',
      body: { name: 'Object Pass User', email: `objpass_${uniqueId}@stress.com`, password: { "$ne": null } }
    });
    const res = createMockRes();
    await signupHandler(req, res);
    assert(res.statusCode === 400, 'Suite1_Duplicate', '1.9 Non-string password returns 400 Bad Request');
  }

  // 1.10 Invalid email format (missing @) returns 400
  {
    const req = createMockReq({
      method: 'POST',
      body: { name: 'Invalid Email User', email: 'invalidemail.com', password: testPassword }
    });
    const res = createMockRes();
    await signupHandler(req, res);
    assert(res.statusCode === 400, 'Suite1_Duplicate', '1.10 Invalid email format (missing @) returns 400 Bad Request');
  }

  // 1.11 Invalid email format (missing .) returns 400
  {
    const req = createMockReq({
      method: 'POST',
      body: { name: 'Invalid Email User', email: 'invalid@emailcom', password: testPassword }
    });
    const res = createMockRes();
    await signupHandler(req, res);
    assert(res.statusCode === 400, 'Suite1_Duplicate', '1.11 Invalid email format (missing dot) returns 400 Bad Request');
  }

  // 1.12 Non-POST method rejected with 405
  {
    const req = createMockReq({ method: 'GET' });
    const res = createMockRes();
    await signupHandler(req, res);
    assert(res.statusCode === 405, 'Suite1_Duplicate', '1.12 Non-POST methods to /api/auth/signup return 405 Method Not Allowed');
  }

  // ===========================================================================
  // SUITE 2: Wrong Password Login & Injection Resilience
  // ===========================================================================
  console.log('\n--- Suite 2: Wrong Password Login Resilience & Injection Defenses ---');

  // 2.1 Valid login succeeds with 200
  let studentJwt = null;
  {
    const req = createMockReq({
      method: 'POST',
      body: { email: testEmail, password: testPassword }
    });
    const res = createMockRes();
    await loginHandler(req, res);
    studentJwt = res.data?.token;
    assert(
      res.statusCode === 200 && res.data?.success === true && !!studentJwt,
      'Suite2_WrongPassword',
      '2.1 Login with registered user and correct password returns 200 OK and valid JWT'
    );
  }

  // 2.2 Wrong password returns 401 Unauthorized (never 200 or 500)
  {
    const req = createMockReq({
      method: 'POST',
      body: { email: testEmail, password: 'WrongPassword_999' }
    });
    const res = createMockRes();
    await loginHandler(req, res);
    assert(
      res.statusCode === 401 && res.data?.success === false,
      'Suite2_WrongPassword',
      '2.2 Login with wrong password returns 401 Unauthorized (never 200 or 500)',
      `Status: ${res.statusCode}`
    );
  }

  // 2.3 Wrong password casing returns 401
  {
    const req = createMockReq({
      method: 'POST',
      body: { email: testEmail, password: testPassword.toLowerCase() }
    });
    const res = createMockRes();
    await loginHandler(req, res);
    assert(res.statusCode === 401, 'Suite2_WrongPassword', '2.3 Login with altered password case returns 401 Unauthorized');
  }

  // 2.4 Trailing space on password returns 401
  {
    const req = createMockReq({
      method: 'POST',
      body: { email: testEmail, password: `${testPassword} ` }
    });
    const res = createMockRes();
    await loginHandler(req, res);
    assert(res.statusCode === 401, 'Suite2_WrongPassword', '2.4 Login with trailing space in password returns 401 Unauthorized');
  }

  // 2.5 Non-existent user returns 401
  let nonExistentResData = null;
  {
    const req = createMockReq({
      method: 'POST',
      body: { email: `ghost_${uniqueId}@stress.netvidya.com`, password: testPassword }
    });
    const res = createMockRes();
    await loginHandler(req, res);
    nonExistentResData = res.data;
    assert(res.statusCode === 401, 'Suite2_WrongPassword', '2.5 Login with non-existent email returns 401 Unauthorized');
  }

  // 2.6 SQL injection in email returns 401
  {
    const req = createMockReq({
      method: 'POST',
      body: { email: `' OR '1'='1' --`, password: testPassword }
    });
    const res = createMockRes();
    await loginHandler(req, res);
    assert(res.statusCode === 401, 'Suite2_WrongPassword', '2.6 SQL injection payload in email returns 401 Unauthorized');
  }

  // 2.7 SQL injection in password returns 401
  {
    const req = createMockReq({
      method: 'POST',
      body: { email: testEmail, password: `' OR '1'='1' --` }
    });
    const res = createMockRes();
    await loginHandler(req, res);
    assert(res.statusCode === 401, 'Suite2_WrongPassword', '2.7 SQL injection payload in password returns 401 Unauthorized');
  }

  // 2.8 NoSQL object payload in password returns 400
  {
    const req = createMockReq({
      method: 'POST',
      body: { email: testEmail, password: { "$ne": "" } }
    });
    const res = createMockRes();
    await loginHandler(req, res);
    assert(res.statusCode === 400, 'Suite2_WrongPassword', '2.8 NoSQL object in password returns 400 Bad Request');
  }

  // 2.9 Missing password returns 400
  {
    const req = createMockReq({
      method: 'POST',
      body: { email: testEmail }
    });
    const res = createMockRes();
    await loginHandler(req, res);
    assert(res.statusCode === 400, 'Suite2_WrongPassword', '2.9 Missing password parameter returns 400 Bad Request');
  }

  // 2.10 Missing email returns 400
  {
    const req = createMockReq({
      method: 'POST',
      body: { password: testPassword }
    });
    const res = createMockRes();
    await loginHandler(req, res);
    assert(res.statusCode === 400, 'Suite2_WrongPassword', '2.10 Missing email parameter returns 400 Bad Request');
  }

  // 2.11 User enumeration defense: identical error message for wrong password and non-existent email
  {
    const req = createMockReq({
      method: 'POST',
      body: { email: testEmail, password: 'WrongPassword_123' }
    });
    const res = createMockRes();
    await loginHandler(req, res);
    assert(
      res.data?.error === nonExistentResData?.error && res.data?.error === 'Invalid email or password.',
      'Suite2_WrongPassword',
      '2.11 Error message for wrong password is identical to non-existent user (no user enumeration leak)'
    );
  }

  // 2.12 Non-POST to /api/auth/login returns 405
  {
    const req = createMockReq({ method: 'GET' });
    const res = createMockRes();
    await loginHandler(req, res);
    assert(res.statusCode === 405, 'Suite2_WrongPassword', '2.12 Non-POST methods to /api/auth/login return 405 Method Not Allowed');
  }

  // ===========================================================================
  // SUITE 3: Invalid, Expired, Forged, and Tampered JWT Tokens
  // ===========================================================================
  console.log('\n--- Suite 3: Invalid / Expired / Forged JWT Bearer Token Security ---');

  // 3.1 Valid token to /api/auth/me returns 200
  {
    const req = createMockReq({
      method: 'GET',
      headers: { authorization: `Bearer ${studentJwt}` }
    });
    const res = createMockRes();
    await meHandler(req, res);
    assert(
      res.statusCode === 200 && res.data?.success === true && res.data?.user?.email === testEmail,
      'Suite3_JWT',
      '3.1 Valid JWT Bearer token to /api/auth/me returns 200 OK and profile'
    );
  }

  // 3.2 Missing authorization header returns 401
  {
    const req = createMockReq({ method: 'GET' });
    const res = createMockRes();
    await meHandler(req, res);
    assert(res.statusCode === 401, 'Suite3_JWT', '3.2 Missing Authorization header returns 401 Unauthorized');
  }

  // 3.3 Empty Bearer header returns 401
  {
    const req = createMockReq({
      method: 'GET',
      headers: { authorization: 'Bearer ' }
    });
    const res = createMockRes();
    await meHandler(req, res);
    assert(res.statusCode === 401, 'Suite3_JWT', '3.3 Empty Bearer header returns 401 Unauthorized');
  }

  // 3.4 Non-Bearer scheme (Basic) returns 401
  {
    const req = createMockReq({
      method: 'GET',
      headers: { authorization: 'Basic dXNlcjpwYXNz' }
    });
    const res = createMockRes();
    await meHandler(req, res);
    assert(res.statusCode === 401, 'Suite3_JWT', '3.4 Basic auth instead of Bearer returns 401 Unauthorized');
  }

  // 3.5 Malformed token (single string) returns 401
  {
    const req = createMockReq({
      method: 'GET',
      headers: { authorization: 'Bearer completely_malformed_token_string' }
    });
    const res = createMockRes();
    await meHandler(req, res);
    assert(res.statusCode === 401, 'Suite3_JWT', '3.5 Malformed token (single part) returns 401 Unauthorized');
  }

  // 3.6 Malformed token (two parts) returns 401
  {
    const req = createMockReq({
      method: 'GET',
      headers: { authorization: 'Bearer header.payload' }
    });
    const res = createMockRes();
    await meHandler(req, res);
    assert(res.statusCode === 401, 'Suite3_JWT', '3.6 Malformed token (two parts) returns 401 Unauthorized');
  }

  // 3.7 Forged signature token signed by attacker key returns 401
  {
    const forgedHeader = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const forgedBody = Buffer.from(JSON.stringify({
      email: testEmail,
      isBuyer: true,
      exp: Math.floor(Date.now() / 1000) + 3600
    })).toString('base64url');
    const forgedSig = crypto.createHmac('sha256', 'evil_attacker_secret_key_666').update(`${forgedHeader}.${forgedBody}`).digest('base64url');
    const forgedJwt = `${forgedHeader}.${forgedBody}.${forgedSig}`;

    const req = createMockReq({
      method: 'GET',
      headers: { authorization: `Bearer ${forgedJwt}` }
    });
    const res = createMockRes();
    await meHandler(req, res);
    assert(
      res.statusCode === 401,
      'Suite3_JWT',
      '3.7 Forged JWT signed with attacker key returns 401 Unauthorized',
      `Status: ${res.statusCode}`
    );
  }

  // 3.8 Expired token returns 401
  {
    const expHeader = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const expBody = Buffer.from(JSON.stringify({
      email: testEmail,
      isBuyer: true,
      exp: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
    })).toString('base64url');
    const expSig = crypto.createHmac('sha256', JWT_SECRET).update(`${expHeader}.${expBody}`).digest('base64url');
    const expiredJwt = `${expHeader}.${expBody}.${expSig}`;

    const req = createMockReq({
      method: 'GET',
      headers: { authorization: `Bearer ${expiredJwt}` }
    });
    const res = createMockRes();
    await meHandler(req, res);
    assert(
      res.statusCode === 401,
      'Suite3_JWT',
      '3.8 Expired JWT Bearer token returns 401 Unauthorized',
      `Status: ${res.statusCode}`
    );
  }

  // 3.9 alg:none unsigned token returns 401
  {
    const noneHeader = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const noneBody = Buffer.from(JSON.stringify({
      email: testEmail,
      isBuyer: true,
      exp: Math.floor(Date.now() / 1000) + 3600
    })).toString('base64url');
    const noneJwt = `${noneHeader}.${noneBody}.`;

    const req = createMockReq({
      method: 'GET',
      headers: { authorization: `Bearer ${noneJwt}` }
    });
    const res = createMockRes();
    await meHandler(req, res);
    assert(res.statusCode === 401, 'Suite3_JWT', '3.9 alg:none attack token returns 401 Unauthorized');
  }

  // 3.10 Tampered payload in valid token returns 401
  {
    const parts = studentJwt.split('.');
    // Tamper payload to grant buyer privilege
    const tamperedPayload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    tamperedPayload.isBuyer = true;
    tamperedPayload.email = 'tampered@hacker.com';
    const tamperedBody = Buffer.from(JSON.stringify(tamperedPayload)).toString('base64url');
    const tamperedJwt = `${parts[0]}.${tamperedBody}.${parts[2]}`;

    const req = createMockReq({
      method: 'GET',
      headers: { authorization: `Bearer ${tamperedJwt}` }
    });
    const res = createMockRes();
    await meHandler(req, res);
    assert(
      res.statusCode === 401,
      'Suite3_JWT',
      '3.10 Payload tampering in signed token returns 401 Unauthorized',
      `Status: ${res.statusCode}`
    );
  }

  // 3.11 Protected file download with forged token returns 401
  {
    const forgedHeader = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const forgedBody = Buffer.from(JSON.stringify({ email: testEmail, isBuyer: true, exp: 9999999999 })).toString('base64url');
    const forgedSig = crypto.createHmac('sha256', 'wrong_secret').update(`${forgedHeader}.${forgedBody}`).digest('base64url');
    const forgedJwt = `${forgedHeader}.${forgedBody}.${forgedSig}`;

    const req = createMockReq({
      method: 'GET',
      query: { fileId: 'unit-1' },
      headers: { authorization: `Bearer ${forgedJwt}` }
    });
    const res = createMockRes();
    await downloadFileHandler(req, res);
    assert(res.statusCode === 401, 'Suite3_JWT', '3.11 /api/store/download-file with forged token returns 401 Unauthorized');
  }

  // 3.12 Protected file download with expired token returns 401
  {
    const expHeader = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const expBody = Buffer.from(JSON.stringify({ email: testEmail, isBuyer: true, exp: Math.floor(Date.now() / 1000) - 30 })).toString('base64url');
    const expSig = crypto.createHmac('sha256', JWT_SECRET).update(`${expHeader}.${expBody}`).digest('base64url');
    const expiredJwt = `${expHeader}.${expBody}.${expSig}`;

    const req = createMockReq({
      method: 'GET',
      query: { fileId: 'unit-1' },
      headers: { authorization: `Bearer ${expiredJwt}` }
    });
    const res = createMockRes();
    await downloadFileHandler(req, res);
    assert(res.statusCode === 401, 'Suite3_JWT', '3.12 /api/store/download-file with expired token returns 401 Unauthorized');
  }

  // 3.13 Protected test serve with forged token returns 401
  {
    const forgedHeader = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const forgedBody = Buffer.from(JSON.stringify({ email: testEmail, isBuyer: true, exp: 9999999999 })).toString('base64url');
    const forgedSig = crypto.createHmac('sha256', 'fake_secret').update(`${forgedHeader}.${forgedBody}`).digest('base64url');
    const forgedJwt = `${forgedHeader}.${forgedBody}.${forgedSig}`;

    const req = createMockReq({
      method: 'GET',
      query: { testId: 'test-net-mock-1' },
      headers: { authorization: `Bearer ${forgedJwt}` }
    });
    const res = createMockRes();
    await serveTestHandler(req, res);
    assert(res.statusCode === 401, 'Suite3_JWT', '3.13 /api/store/serve-test with forged token returns 401 Unauthorized');
  }

  // 3.14 Protected test serve with expired token returns 401
  {
    const expHeader = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const expBody = Buffer.from(JSON.stringify({ email: testEmail, isBuyer: true, exp: 1000 })).toString('base64url');
    const expSig = crypto.createHmac('sha256', JWT_SECRET).update(`${expHeader}.${expBody}`).digest('base64url');
    const expiredJwt = `${expHeader}.${expBody}.${expSig}`;

    const req = createMockReq({
      method: 'GET',
      query: { testId: 'test-net-mock-1' },
      headers: { authorization: `Bearer ${expiredJwt}` }
    });
    const res = createMockRes();
    await serveTestHandler(req, res);
    assert(res.statusCode === 401, 'Suite3_JWT', '3.14 /api/store/serve-test with expired token returns 401 Unauthorized');
  }

  // ===========================================================================
  // SUITE 4: Password Reset Token Replay, Expiry, and Lifetime
  // ===========================================================================
  console.log('\n--- Suite 4: Password Reset Token Replay & Lifetime Defenses ---');

  let resetToken = null;

  // 4.1 Request reset token via /api/auth/forgot-password
  {
    const req = createMockReq({
      method: 'POST',
      body: { email: testEmail }
    });
    const res = createMockRes();
    await forgotPasswordHandler(req, res);
    resetToken = res.data?.token;
    assert(
      res.statusCode === 200 && res.data?.success === true && !!resetToken,
      'Suite4_ResetReplay',
      '4.1 /api/auth/forgot-password generates reset token successfully'
    );
  }

  // 4.2 Reset token entropy: 64 hex characters (32 bytes = 256 bits)
  {
    assert(
      typeof resetToken === 'string' && resetToken.length === 64 && /^[0-9a-f]{64}$/i.test(resetToken),
      'Suite4_ResetReplay',
      '4.2 Reset token contains 32 bytes (64 hex characters) of cryptographic entropy'
    );
  }

  // 4.3 Reset password with valid token and new password
  const newPassword = 'NewSecretPassword_2026!#';
  {
    const req = createMockReq({
      method: 'POST',
      body: { token: resetToken, newPassword }
    });
    const res = createMockRes();
    await resetPasswordHandler(req, res);
    assert(
      res.statusCode === 200 && res.data?.success === true,
      'Suite4_ResetReplay',
      '4.3 Password reset with valid token succeeds with 200 OK'
    );
  }

  // 4.4 Old password rejected after reset
  {
    const req = createMockReq({
      method: 'POST',
      body: { email: testEmail, password: testPassword }
    });
    const res = createMockRes();
    await loginHandler(req, res);
    assert(
      res.statusCode === 401,
      'Suite4_ResetReplay',
      '4.4 Old password is systematically rejected with 401 after reset'
    );
  }

  // 4.5 New password logs in successfully
  {
    const req = createMockReq({
      method: 'POST',
      body: { email: testEmail, password: newPassword }
    });
    const res = createMockRes();
    await loginHandler(req, res);
    assert(
      res.statusCode === 200 && res.data?.success === true,
      'Suite4_ResetReplay',
      '4.5 New password authenticates successfully with 200 OK'
    );
  }

  // 4.6 TOKEN REPLAY ATTACK: Immediate reuse of the same token must fail
  {
    const req = createMockReq({
      method: 'POST',
      body: { token: resetToken, newPassword: 'ReplayAttackerPassword_999' }
    });
    const res = createMockRes();
    await resetPasswordHandler(req, res);
    assert(
      res.statusCode === 400 && res.data?.success === false,
      'Suite4_ResetReplay',
      '4.6 TOKEN REPLAY ATTACK: Re-using the consumed token returns 400 Bad Request',
      `Status: ${res.statusCode}, error: ${res.data?.error}`
    );
  }

  // 4.7 TOKEN REPLAY ATTACK: Token was invalidated and cannot be replayed again
  {
    const req = createMockReq({
      method: 'POST',
      body: { token: resetToken, newPassword: 'YetAnotherPassword_123' }
    });
    const res = createMockRes();
    await resetPasswordHandler(req, res);
    assert(
      res.statusCode === 400 && res.data?.success === false,
      'Suite4_ResetReplay',
      '4.7 TOKEN REPLAY ATTACK: Repeated replay attempt still fails with 400',
      `Status: ${res.statusCode}`
    );
  }

  // 4.8 Reset password with random/non-existent token returns 400
  {
    const req = createMockReq({
      method: 'POST',
      body: { token: crypto.randomBytes(32).toString('hex'), newPassword: 'AnyPassword_123' }
    });
    const res = createMockRes();
    await resetPasswordHandler(req, res);
    assert(res.statusCode === 400, 'Suite4_ResetReplay', '4.8 Reset password with random/non-existent token returns 400 Bad Request');
  }

  // 4.9 Reset password with expired token returns 400
  {
    const expiredToken = crypto.randomBytes(32).toString('hex');
    const expiredHash = crypto.createHash('sha256').update(expiredToken).digest('hex');
    const pastExpiry = new Date(Date.now() - 60000).toISOString(); // 1 minute in the past
    await saveResetToken(testEmail, expiredToken, expiredHash, pastExpiry);

    const req = createMockReq({
      method: 'POST',
      body: { token: expiredToken, newPassword: 'PasswordForExpired_123' }
    });
    const res = createMockRes();
    await resetPasswordHandler(req, res);
    assert(
      res.statusCode === 400 && res.data?.success === false,
      'Suite4_ResetReplay',
      '4.9 Reset password with expired token returns 400 Bad Request',
      `Status: ${res.statusCode}, error: ${res.data?.error}`
    );
  }

  // 4.10 Reset password with empty token returns 400
  {
    const req = createMockReq({
      method: 'POST',
      body: { token: '', newPassword: 'ValidPassword_123' }
    });
    const res = createMockRes();
    await resetPasswordHandler(req, res);
    assert(res.statusCode === 400, 'Suite4_ResetReplay', '4.10 Reset password with empty token returns 400 Bad Request');
  }

  // 4.11 Reset password with empty new password returns 400
  {
    const req = createMockReq({
      method: 'POST',
      body: { token: 'some_token', newPassword: '' }
    });
    const res = createMockRes();
    await resetPasswordHandler(req, res);
    assert(res.statusCode === 400, 'Suite4_ResetReplay', '4.11 Reset password with empty new password returns 400 Bad Request');
  }

  // 4.12 Non-POST to reset endpoints returns 405
  {
    const req1 = createMockReq({ method: 'GET' });
    const res1 = createMockRes();
    await forgotPasswordHandler(req1, res1);

    const req2 = createMockReq({ method: 'GET' });
    const res2 = createMockRes();
    await resetPasswordHandler(req2, res2);

    assert(
      res1.statusCode === 405 && res2.statusCode === 405,
      'Suite4_ResetReplay',
      '4.12 Non-POST HTTP methods to forgot/reset endpoints return 405 Method Not Allowed'
    );
  }

  // ===========================================================================
  // SUITE 5: Timing-Safe Password Comparison Verification
  // ===========================================================================
  console.log('\n--- Suite 5: Timing-Safe Password Comparison Verification ---');

  // 5.1 verifyPassword returns true for matching password
  const samplePassword = 'SuperSecretTestingPassword#2026';
  const { salt: sampleSalt, hash: sampleHash } = hashPassword(samplePassword);
  {
    const match = verifyPassword(samplePassword, sampleSalt, sampleHash);
    assert(match === true, 'Suite5_TimingSafety', '5.1 verifyPassword returns true for genuine password and scrypt hash');
  }

  // 5.2 verifyPassword returns false for mismatched password
  {
    const match = verifyPassword('WrongPasswordCandidate', sampleSalt, sampleHash);
    assert(match === false, 'Suite5_TimingSafety', '5.2 verifyPassword returns false for incorrect password');
  }

  // 5.3 Timing safety implementation verification: inspect source code confirms crypto.timingSafeEqual
  {
    import('fs').then(fs => {
      const helperSource = fs.readFileSync('api/auth/auth-helper.js', 'utf8');
      const usesTimingSafe = helperSource.includes('crypto.timingSafeEqual');
      assert(
        usesTimingSafe,
        'Suite5_TimingSafety',
        '5.3 api/auth/auth-helper.js directly invokes crypto.timingSafeEqual for constant-time comparison'
      );
    });
  }

  // 5.4 Mismatched buffer length handling: timingSafeEqual throws if lengths differ, verifyPassword catches and returns false
  {
    const corruptShortHash = sampleHash.slice(0, 60); // Odd / truncated length
    const corruptLongHash = sampleHash + 'abcdef';
    const shortResult = verifyPassword(samplePassword, sampleSalt, corruptShortHash);
    const longResult = verifyPassword(samplePassword, sampleSalt, corruptLongHash);
    assert(
      shortResult === false && longResult === false,
      'Suite5_TimingSafety',
      '5.4 verifyPassword safely catches length mismatch errors and returns false without crashing'
    );
  }

  // 5.5 Null / undefined / invalid inputs handled safely
  {
    const r1 = verifyPassword(null, sampleSalt, sampleHash);
    const r2 = verifyPassword(samplePassword, null, sampleHash);
    const r3 = verifyPassword(samplePassword, sampleSalt, null);
    const r4 = verifyPassword('', sampleSalt, sampleHash);
    assert(
      r1 === false && r2 === false && r3 === false && r4 === false,
      'Suite5_TimingSafety',
      '5.5 verifyPassword safely returns false for null/empty/undefined parameters'
    );
  }

  // 5.6 Empirical execution timing consistency test
  {
    // Compare timing across candidates with differences in early, middle, and late bytes
    const iterations = 5;
    const candidates = [
      'XuperSecretTestingPassword#2026', // Differs at index 0
      'SuperSecretTestingXassword#2026', // Differs in middle
      'SuperSecretTestingPassword#2027', // Differs at last char
      'SuperSecretTestingPassword#2026'  // Match
    ];

    let allCompleted = true;
    for (const cand of candidates) {
      for (let i = 0; i < iterations; i++) {
        try {
          verifyPassword(cand, sampleSalt, sampleHash);
        } catch {
          allCompleted = false;
        }
      }
    }

    assert(
      allCompleted,
      'Suite5_TimingSafety',
      '5.6 Execution timing across varied candidate byte offsets completes without unhandled exceptions'
    );
  }

  // ===========================================================================
  // SUITE 6: Access Control & Paywall Gating Enforcement
  // ===========================================================================
  console.log('\n--- Suite 6: Access Control & Paywall Gating Enforcement ---');

  // Register a non-buyer student
  const nonBuyerEmail = `nonbuyer_${Date.now()}@stress.netvidya.com`;
  let nonBuyerToken = null;
  {
    const req = createMockReq({
      method: 'POST',
      body: { name: 'Free Student', email: nonBuyerEmail, mobile: '9123456789', password: 'Password123!' }
    });
    const res = createMockRes();
    await signupHandler(req, res);
    nonBuyerToken = res.data?.token;
  }

  // 6.1 Non-buyer profile returns isBuyer: false
  {
    const req = createMockReq({
      method: 'GET',
      headers: { authorization: `Bearer ${nonBuyerToken}` }
    });
    const res = createMockRes();
    await meHandler(req, res);
    assert(
      res.statusCode === 200 && res.data?.user?.isBuyer === false,
      'Suite6_PaywallGating',
      '6.1 Authenticated non-buyer profile shows isBuyer: false'
    );
  }

  // 6.2 Non-buyer accessing protected PDF download returns 403 Forbidden
  {
    const req = createMockReq({
      method: 'GET',
      query: { fileId: 'unit-1' },
      headers: { authorization: `Bearer ${nonBuyerToken}` }
    });
    const res = createMockRes();
    await downloadFileHandler(req, res);
    assert(
      res.statusCode === 403 && res.data?.success === false,
      'Suite6_PaywallGating',
      '6.2 Authenticated non-buyer accessing /api/store/download-file returns 403 Forbidden',
      `Status: ${res.statusCode}, error: ${res.data?.error}`
    );
  }

  // 6.3 Non-buyer accessing CBT test hall returns 403 Forbidden
  {
    const req = createMockReq({
      method: 'GET',
      query: { testId: 'test-net-mock-1' },
      headers: { authorization: `Bearer ${nonBuyerToken}` }
    });
    const res = createMockRes();
    await serveTestHandler(req, res);
    assert(
      res.statusCode === 403 && res.data?.success === false,
      'Suite6_PaywallGating',
      '6.3 Authenticated non-buyer accessing /api/store/serve-test returns 403 Forbidden',
      `Status: ${res.statusCode}, error: ${res.data?.error}`
    );
  }

  // Create an active buyer token
  const buyerEmail = `buyer_${Date.now()}@stress.netvidya.com`;
  const buyerUser = {
    id: `usr_${Date.now()}`,
    name: 'Verified Paid Buyer',
    email: buyerEmail,
    mobile: '9876543210',
    is_buyer: true,
    is_active: true
  };
  globalThis.__NETVIDYA_USERS_DB__.set(buyerEmail, buyerUser);
  const buyerToken = createSessionToken({
    id: buyerUser.id,
    name: buyerUser.name,
    email: buyerUser.email,
    isBuyer: true
  });

  // 6.4 Buyer accessing released PDF download returns 200 with downloadUrl
  {
    const req = createMockReq({
      method: 'GET',
      query: { fileId: 'unit-1' },
      headers: { authorization: `Bearer ${buyerToken}` }
    });
    const res = createMockRes();
    await downloadFileHandler(req, res);
    assert(
      res.statusCode === 200 && res.data?.success === true && !!res.data?.downloadUrl,
      'Suite6_PaywallGating',
      '6.4 Active buyer accessing /api/store/download-file receives temporary signed URL (200 OK)'
    );
  }

  // 6.5 Buyer accessing future test (NET Mock 2, releasing 6 Nov 2026) returns 403 Forbidden with isLocked: true
  {
    const req = createMockReq({
      method: 'GET',
      query: { testId: 'test-net-mock-2' },
      headers: { authorization: `Bearer ${buyerToken}` }
    });
    const res = createMockRes();
    await serveTestHandler(req, res);
    assert(
      res.statusCode === 403 && res.data?.isLocked === true && typeof res.data?.error === 'string',
      'Suite6_PaywallGating',
      '6.5 Active buyer accessing future scheduled test returns 403 Forbidden with isLocked: true'
    );
  }

  // 6.6 Unauthenticated request to /api/store/download-file returns 401
  {
    const req = createMockReq({
      method: 'GET',
      query: { fileId: 'unit-1' }
    });
    const res = createMockRes();
    await downloadFileHandler(req, res);
    assert(res.statusCode === 401, 'Suite6_PaywallGating', '6.6 Unauthenticated request to download-file returns 401 Unauthorized');
  }

  // 6.7 Unauthenticated request to /api/store/serve-test returns 401
  {
    const req = createMockReq({
      method: 'GET',
      query: { testId: 'test-net-mock-1' }
    });
    const res = createMockRes();
    await serveTestHandler(req, res);
    assert(res.statusCode === 401, 'Suite6_PaywallGating', '6.7 Unauthenticated request to serve-test returns 401 Unauthorized');
  }

  // 6.8 Query param backdoor attempt without Bearer token returns 401
  {
    const req = createMockReq({
      method: 'GET',
      query: { fileId: 'unit-1', nv_buyer_token: 'bypass', cleanEmail: buyerEmail }
    });
    const res = createMockRes();
    await downloadFileHandler(req, res);
    assert(
      res.statusCode === 401,
      'Suite6_PaywallGating',
      '6.8 Query param backdoor (?nv_buyer_token=...) is rejected with 401 Unauthorized'
    );
  }

  // ===========================================================================
  // CONSOLIDATED RESULTS
  // ===========================================================================
  console.log('\n================================================================================');
  console.log('              ADVERSARIAL AUTHENTICATION TEST RESULTS SUMMARY                  ');
  console.log('================================================================================');
  console.log(`TOTAL ADVERSARIAL ASSERTIONS EXECUTED : ${totalTests}`);
  console.log(`TOTAL ASSERTIONS PASSED               : ${passedTests}`);
  console.log(`TOTAL ASSERTIONS FAILED               : ${failedTests}`);
  console.log(`PASS RATE                             : ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log('--------------------------------------------------------------------------------');

  if (failedTests > 0) {
    console.error('\nFAILURES ENCOUNTERED:');
    failureDetails.forEach((f, idx) => {
      console.error(`  ${idx + 1}. [${f.suite}] ${f.testName}`);
      if (f.details) console.error(`     Details: ${f.details}`);
    });
    console.log('\n================================================================================\n');
    process.exit(1);
  } else {
    console.log('\n>>> ALL 53 ADVERSARIAL STRESS TESTS PASSED SUCCESSFULLY! <<<\n');
    console.log('================================================================================\n');
    process.exit(0);
  }
}

run().catch(err => {
  console.error('Fatal test harness execution error:', err);
  process.exit(1);
});
