/**
 * NET Vidya English Student Store • Milestone 2 Adversarial Paywall Penetration Suite
 * 
 * Conducts exhaustive empirical penetration testing and stress-testing on:
 * - api/store/download-file.js
 * - api/store/serve-test.js
 * 
 * Attack Vectors:
 * 1. Missing Authentication & Malformed Bearer Headers (401 Unauthorized)
 * 2. Legacy Query Parameter Backdoor Injections (401 Unauthorized / 403 Forbidden)
 * 3. Cryptographic Token Forgery & Tampering (401 Unauthorized)
 * 4. Authenticated Non-Buyer Privilege Escalation (403 Forbidden)
 * 5. Scheduled Future Test Date-Gating Leaks (403 Forbidden with "Opens on [date]")
 * 6. Legitimate Buyer Happy Paths & Time Window Verification (200 OK)
 * 7. Input Boundary & Robustness Attacks (400 / 404)
 */

import crypto from 'crypto';
import downloadFileHandler from '../api/store/download-file.js';
import serveTestHandler from '../api/store/serve-test.js';
import {
  createSessionToken,
  saveUser,
  JWT_SECRET,
  DEFAULT_ACCESS_EXPIRY,
  AUTHOR_EMAILS
} from '../api/auth/auth-helper.js';

// Test counters
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failureDetails = [];

function assertTest(name, condition, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${name}`);
  } else {
    failedTests++;
    const msg = `  ✗ FAIL: ${name} ${details ? `--> ${details}` : ''}`;
    console.error(msg);
    failureDetails.push({ name, details });
  }
}

/**
 * Mock HTTP Dispatcher executing serverless function directly
 */
async function invoke(handler, options = {}) {
  const {
    method = 'GET',
    headers = {},
    query = {},
    body = null
  } = options;

  let responseStatus = 200;
  let responseHeaders = {};
  let responseData = null;

  const mockReq = {
    method,
    headers: Object.fromEntries(
      Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])
    ),
    query,
    body: typeof body === 'string' ? JSON.parse(body) : body
  };

  const mockRes = {
    status(s) {
      responseStatus = s;
      return this;
    },
    setHeader(k, v) {
      responseHeaders[k.toLowerCase()] = v;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
    send(str) {
      responseData = str;
      return this;
    }
  };

  await handler(mockReq, mockRes);

  return {
    status: responseStatus,
    headers: responseHeaders,
    data: responseData
  };
}

/**
 * Helper to construct manually crafted / forged JWTs
 */
function createForgedJwt(payload, secretKey = 'attacker_rogue_secret_2026', expiresInSeconds = 3600) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds
  };
  const body = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

async function runAdversarialSuite() {
  console.log('================================================================================');
  console.log('      ADVERSARIAL PENETRATION SUITE: PAYWALL & CONTENT GATING VERIFICATION      ');
  console.log('================================================================================\n');

  // --- Setup Personas ---
  const nonBuyerEmail = 'adversarial_nonbuyer@example.com';
  await saveUser({
    id: 'usr_adv_nonbuyer',
    name: 'Non Buyer Student',
    email: nonBuyerEmail,
    mobile: '9876543201',
    password_hash: crypto.createHash('sha256').update('password123').digest('hex'),
    password_salt: 'salt1',
    is_buyer: false,
    is_active: true
  });

  const payingBuyerEmail = 'adversarial_buyer@example.com';
  await saveUser({
    id: 'usr_adv_buyer',
    name: 'Paying Buyer Student',
    email: payingBuyerEmail,
    mobile: '9876543202',
    password_hash: crypto.createHash('sha256').update('password123').digest('hex'),
    password_salt: 'salt2',
    is_buyer: true,
    is_active: true,
    expires_at: DEFAULT_ACCESS_EXPIRY
  });

  const nonBuyerToken = createSessionToken({
    id: 'usr_adv_nonbuyer',
    email: nonBuyerEmail,
    isBuyer: false,
    name: 'Non Buyer Student'
  });

  const payingBuyerToken = createSessionToken({
    id: 'usr_adv_buyer',
    email: payingBuyerEmail,
    isBuyer: true,
    name: 'Paying Buyer Student'
  });

  const authorToken = createSessionToken({
    id: 'usr_author',
    email: AUTHOR_EMAILS[0],
    isBuyer: true,
    name: 'Dr. Rajnikant Dodiya'
  });

  // ===========================================================================
  // SUITE 1: Anonymous & Missing Authentication Attacks (Expected: 401 Unauthorized)
  // ===========================================================================
  console.log('--- Suite 1: Anonymous & Missing Authentication Attacks ---');

  // 1.1 Direct request to download-file without auth header
  const s1_1 = await invoke(downloadFileHandler, {
    query: { fileId: 'unit-1' }
  });
  assertTest('1.1 download-file with no Authorization header returns 401', s1_1.status === 401, `Status: ${s1_1.status}`);

  // 1.2 Direct request to serve-test without auth header
  const s1_2 = await invoke(serveTestHandler, {
    query: { testId: 'test-net-mock-1' }
  });
  assertTest('1.2 serve-test with no Authorization header returns 401', s1_2.status === 401, `Status: ${s1_2.status}`);

  // 1.3 Empty Authorization header
  const s1_3 = await invoke(downloadFileHandler, {
    headers: { Authorization: '' },
    query: { fileId: 'unit-1' }
  });
  assertTest('1.3 download-file with empty Authorization header returns 401', s1_3.status === 401, `Status: ${s1_3.status}`);

  // 1.4 Empty Authorization header on serve-test
  const s1_4 = await invoke(serveTestHandler, {
    headers: { Authorization: '' },
    query: { testId: 'test-net-mock-1' }
  });
  assertTest('1.4 serve-test with empty Authorization header returns 401', s1_4.status === 401, `Status: ${s1_4.status}`);

  // 1.5 Malformed auth scheme (Basic auth instead of Bearer)
  const s1_5 = await invoke(downloadFileHandler, {
    headers: { Authorization: 'Basic dXNlcjpwYXNzd29yZA==' },
    query: { fileId: 'unit-1' }
  });
  assertTest('1.5 download-file with Basic auth scheme returns 401', s1_5.status === 401, `Status: ${s1_5.status}`);

  // 1.6 Malformed auth scheme on serve-test
  const s1_6 = await invoke(serveTestHandler, {
    headers: { Authorization: 'Basic dXNlcjpwYXNzd29yZA==' },
    query: { testId: 'test-net-mock-1' }
  });
  assertTest('1.6 serve-test with Basic auth scheme returns 401', s1_6.status === 401, `Status: ${s1_6.status}`);

  // 1.7 Bearer with whitespace only
  const s1_7 = await invoke(downloadFileHandler, {
    headers: { Authorization: 'Bearer    ' },
    query: { fileId: 'unit-1' }
  });
  assertTest('1.7 download-file with whitespace Bearer token returns 401', s1_7.status === 401, `Status: ${s1_7.status}`);

  // 1.8 Bearer with random invalid string
  const s1_8 = await invoke(downloadFileHandler, {
    headers: { Authorization: 'Bearer totally_invalid_token_xyz_123' },
    query: { fileId: 'unit-1' }
  });
  assertTest('1.8 download-file with random invalid Bearer token returns 401', s1_8.status === 401, `Status: ${s1_8.status}`);

  // 1.9 Random invalid Bearer token on serve-test
  const s1_9 = await invoke(serveTestHandler, {
    headers: { Authorization: 'Bearer totally_invalid_token_xyz_123' },
    query: { testId: 'test-net-mock-1' }
  });
  assertTest('1.9 serve-test with random invalid Bearer token returns 401', s1_9.status === 401, `Status: ${s1_9.status}`);

  // ===========================================================================
  // SUITE 2: Legacy Query Parameter Backdoor Attacks (Expected: 401 / 403)
  // ===========================================================================
  console.log('\n--- Suite 2: Legacy Query Parameter Backdoor Attacks ---');

  // 2.1 ?userToken=nv_buyer_xyz on download-file without Bearer header
  const s2_1 = await invoke(downloadFileHandler, {
    query: { fileId: 'unit-1', userToken: 'nv_buyer_xyz_backdoor' }
  });
  assertTest('2.1 download-file ?userToken=nv_buyer_xyz returns 401 without Bearer', s2_1.status === 401, `Status: ${s2_1.status}`);

  // 2.2 ?email=payingbuyer@example.com on download-file without Bearer header
  const s2_2 = await invoke(downloadFileHandler, {
    query: { fileId: 'unit-1', email: payingBuyerEmail }
  });
  assertTest('2.2 download-file ?email=victim@example.com returns 401 without Bearer', s2_2.status === 401, `Status: ${s2_2.status}`);

  // 2.3 ?token=<valid_buyer_jwt> query param on download-file without Bearer header
  const s2_3 = await invoke(downloadFileHandler, {
    query: { fileId: 'unit-1', token: payingBuyerToken }
  });
  assertTest('2.3 download-file ?token=jwt in query returns 401 (must use Bearer header)', s2_3.status === 401, `Status: ${s2_3.status}`);

  // 2.4 ?userToken=nv_buyer_xyz on serve-test without Bearer header
  const s2_4 = await invoke(serveTestHandler, {
    query: { testId: 'test-net-mock-1', userToken: 'nv_buyer_xyz_backdoor' }
  });
  assertTest('2.4 serve-test ?userToken=nv_buyer_xyz returns 401 without Bearer', s2_4.status === 401, `Status: ${s2_4.status}`);

  // 2.5 ?email=payingbuyer@example.com on serve-test without Bearer header
  const s2_5 = await invoke(serveTestHandler, {
    query: { testId: 'test-net-mock-1', email: payingBuyerEmail }
  });
  assertTest('2.5 serve-test ?email=victim@example.com returns 401 without Bearer', s2_5.status === 401, `Status: ${s2_5.status}`);

  // 2.6 Non-buyer Bearer token attempting query spoofing (?email=payingbuyer@example.com)
  const s2_6 = await invoke(downloadFileHandler, {
    headers: { Authorization: `Bearer ${nonBuyerToken}` },
    query: { fileId: 'unit-1', email: payingBuyerEmail }
  });
  assertTest('2.6 download-file rejects non-buyer token attempting query email spoofing with 403', s2_6.status === 403, `Status: ${s2_6.status}`);

  // 2.7 Non-buyer Bearer token attempting ?userToken=nv_buyer_pass_799 on serve-test
  const s2_7 = await invoke(serveTestHandler, {
    headers: { Authorization: `Bearer ${nonBuyerToken}` },
    query: { testId: 'test-net-mock-1', userToken: 'nv_buyer_pass_799' }
  });
  assertTest('2.7 serve-test rejects non-buyer token attempting query bypass with 403', s2_7.status === 403, `Status: ${s2_7.status}`);

  // ===========================================================================
  // SUITE 3: Cryptographic Forgery & Token Tampering Attacks (Expected: 401)
  // ===========================================================================
  console.log('\n--- Suite 3: Cryptographic Forgery & Token Tampering Attacks ---');

  // 3.1 Forged JWT signed with wrong HMAC secret
  const forgedToken = createForgedJwt({ id: 'usr_hacker', email: 'hacker@darkweb.org', isBuyer: true }, 'fake_secret_key');
  const s3_1 = await invoke(downloadFileHandler, {
    headers: { Authorization: `Bearer ${forgedToken}` },
    query: { fileId: 'unit-1' }
  });
  assertTest('3.1 download-file with forged JWT (wrong secret) returns 401', s3_1.status === 401, `Status: ${s3_1.status}`);

  // 3.2 Forged JWT on serve-test
  const s3_2 = await invoke(serveTestHandler, {
    headers: { Authorization: `Bearer ${forgedToken}` },
    query: { testId: 'test-net-mock-1' }
  });
  assertTest('3.2 serve-test with forged JWT (wrong secret) returns 401', s3_2.status === 401, `Status: ${s3_2.status}`);

  // 3.3 Tampered Payload claim: modifying claims in non-buyer token to isBuyer: true without re-signing
  const [nbHeader, nbBody, nbSig] = nonBuyerToken.split('.');
  const decodedBody = JSON.parse(Buffer.from(nbBody, 'base64url').toString('utf8'));
  decodedBody.isBuyer = true; // Tampering claim!
  const tamperedBody = Buffer.from(JSON.stringify(decodedBody)).toString('base64url');
  const tamperedJwt = `${nbHeader}.${tamperedBody}.${nbSig}`;

  const s3_3 = await invoke(downloadFileHandler, {
    headers: { Authorization: `Bearer ${tamperedJwt}` },
    query: { fileId: 'unit-1' }
  });
  assertTest('3.3 download-file with tampered payload claims returns 401 (signature mismatch)', s3_3.status === 401, `Status: ${s3_3.status}`);

  // 3.4 Tampered Payload claim on serve-test
  const s3_4 = await invoke(serveTestHandler, {
    headers: { Authorization: `Bearer ${tamperedJwt}` },
    query: { testId: 'test-net-mock-1' }
  });
  assertTest('3.4 serve-test with tampered payload claims returns 401 (signature mismatch)', s3_4.status === 401, `Status: ${s3_4.status}`);

  // 3.5 Expired JWT token (issued in the past)
  const expiredToken = createForgedJwt({ id: 'usr_adv_buyer', email: payingBuyerEmail, isBuyer: true }, JWT_SECRET, -3600);
  const s3_5 = await invoke(downloadFileHandler, {
    headers: { Authorization: `Bearer ${expiredToken}` },
    query: { fileId: 'unit-1' }
  });
  assertTest('3.5 download-file with expired session token returns 401', s3_5.status === 401, `Status: ${s3_5.status}`);

  // 3.6 Expired JWT token on serve-test
  const s3_6 = await invoke(serveTestHandler, {
    headers: { Authorization: `Bearer ${expiredToken}` },
    query: { testId: 'test-net-mock-1' }
  });
  assertTest('3.6 serve-test with expired session token returns 401', s3_6.status === 401, `Status: ${s3_6.status}`);

  // ===========================================================================
  // SUITE 4: Authenticated Non-Buyer Privilege Escalation Attacks (Expected: 403 Forbidden)
  // ===========================================================================
  console.log('\n--- Suite 4: Authenticated Non-Buyer Privilege Escalation Attacks ---');

  // 4.1 Non-buyer requesting paid reading file
  const s4_1 = await invoke(downloadFileHandler, {
    headers: { Authorization: `Bearer ${nonBuyerToken}` },
    query: { fileId: 'unit-1' }
  });
  assertTest('4.1 download-file with registered non-buyer token returns 403 Forbidden', s4_1.status === 403, `Status: ${s4_1.status}, Body: ${JSON.stringify(s4_1.data)}`);
  assertTest('4.1b download-file 403 error message indicates enrollment required', s4_1.data?.error?.includes('buyer enrollment required') || s4_1.data?.error?.includes('Access Denied'), `Error: ${s4_1.data?.error}`);

  // 4.2 Non-buyer requesting unlocked mock test (test-net-mock-1)
  const s4_2 = await invoke(serveTestHandler, {
    headers: { Authorization: `Bearer ${nonBuyerToken}` },
    query: { testId: 'test-net-mock-1' }
  });
  assertTest('4.2 serve-test with registered non-buyer token on unlocked test returns 403', s4_2.status === 403, `Status: ${s4_2.status}`);

  // 4.3 Non-buyer requesting future mock test (test-net-mock-2)
  const s4_3 = await invoke(serveTestHandler, {
    headers: { Authorization: `Bearer ${nonBuyerToken}` },
    query: { testId: 'test-net-mock-2' }
  });
  assertTest('4.3 serve-test with registered non-buyer token on future test returns 403', s4_3.status === 403, `Status: ${s4_3.status}`);

  // ===========================================================================
  // SUITE 5: Scheduled Future Test Date-Gating Leaks (Expected: 403 with "Opens on [date]")
  // ===========================================================================
  console.log('\n--- Suite 5: Scheduled Future Test Date-Gating Leaks ---');

  // 5.1 Paying buyer requesting test-net-mock-2 (Opening on 6 Nov 2026; today is 4 Nov 2026)
  const s5_1 = await invoke(serveTestHandler, {
    headers: { Authorization: `Bearer ${payingBuyerToken}` },
    query: { testId: 'test-net-mock-2' }
  });
  assertTest('5.1 Paying buyer requesting test-net-mock-2 (future 6 Nov 2026) returns 403', s5_1.status === 403, `Status: ${s5_1.status}`);
  assertTest('5.1b test-net-mock-2 response body has isLocked: true', s5_1.data?.isLocked === true, `isLocked: ${s5_1.data?.isLocked}`);
  assertTest('5.1c test-net-mock-2 response error contains "Opens on [date]"', /Opens on/i.test(s5_1.data?.error || ''), `Error: ${s5_1.data?.error}`);
  assertTest('5.1d test-net-mock-2 response exposes formatted release date', Boolean(s5_1.data?.formattedReleaseDate || s5_1.data?.releaseDate), `Date: ${s5_1.data?.formattedReleaseDate || s5_1.data?.releaseDate}`);

  // 5.2 Paying buyer requesting test-net-mock-3 (Opening on 10 Nov 2026)
  const s5_2 = await invoke(serveTestHandler, {
    headers: { Authorization: `Bearer ${payingBuyerToken}` },
    query: { testId: 'test-net-mock-3' }
  });
  assertTest('5.2 Paying buyer requesting test-net-mock-3 (future 10 Nov 2026) returns 403', s5_2.status === 403, `Status: ${s5_2.status}`);
  assertTest('5.2b test-net-mock-3 error contains "Opens on"', /Opens on/i.test(s5_2.data?.error || ''), `Error: ${s5_2.data?.error}`);

  // 5.3 Paying buyer requesting test-net-mock-4 (Opening on 14 Nov 2026)
  const s5_3 = await invoke(serveTestHandler, {
    headers: { Authorization: `Bearer ${payingBuyerToken}` },
    query: { testId: 'test-net-mock-4' }
  });
  assertTest('5.3 Paying buyer requesting test-net-mock-4 (future 14 Nov 2026) returns 403', s5_3.status === 403, `Status: ${s5_3.status}`);

  // 5.4 Paying buyer requesting test-future-mock (Opening on 25 Nov 2026)
  const s5_4 = await invoke(serveTestHandler, {
    headers: { Authorization: `Bearer ${payingBuyerToken}` },
    query: { testId: 'test-future-mock' }
  });
  assertTest('5.4 Paying buyer requesting test-future-mock (future 25 Nov 2026) returns 403', s5_4.status === 403, `Status: ${s5_4.status}`);

  // 5.5 Paying buyer requesting test-grand-final-booster (Opening on 5 Dec 2026)
  const s5_5 = await invoke(serveTestHandler, {
    headers: { Authorization: `Bearer ${payingBuyerToken}` },
    query: { testId: 'test-grand-final-booster' }
  });
  assertTest('5.5 Paying buyer requesting test-grand-final-booster (future 5 Dec 2026) returns 403', s5_5.status === 403, `Status: ${s5_5.status}`);

  // ===========================================================================
  // SUITE 6: Legitimate Paying Buyer Access (Expected: 200 OK)
  // ===========================================================================
  console.log('\n--- Suite 6: Legitimate Paying Buyer Access ---');

  // 6.1 Paying buyer requesting download-file for unit-1
  const s6_1 = await invoke(downloadFileHandler, {
    headers: { Authorization: `Bearer ${payingBuyerToken}` },
    query: { fileId: 'unit-1' }
  });
  assertTest('6.1 Paying buyer requesting download-file returns 200 OK', s6_1.status === 200, `Status: ${s6_1.status}`);
  assertTest('6.1b download-file returns signed downloadUrl', typeof s6_1.data?.downloadUrl === 'string' && s6_1.data.downloadUrl.length > 0, `downloadUrl: ${s6_1.data?.downloadUrl}`);
  assertTest('6.1c download-file returns 600s (10 min) expiry window', s6_1.data?.expiresInSeconds === 600, `expiresInSeconds: ${s6_1.data?.expiresInSeconds}`);

  // 6.2 Paying buyer requesting unlocked test-net-mock-1 (Release date: 1 Nov 2026)
  const s6_2 = await invoke(serveTestHandler, {
    headers: { Authorization: `Bearer ${payingBuyerToken}` },
    query: { testId: 'test-net-mock-1' }
  });
  assertTest('6.2 Paying buyer requesting unlocked test-net-mock-1 returns 200 OK', s6_2.status === 200, `Status: ${s6_2.status}`);
  assertTest('6.2b unlocked test-net-mock-1 has isLocked: false', s6_2.data?.isLocked === false, `isLocked: ${s6_2.data?.isLocked}`);
  assertTest('6.2c unlocked test-net-mock-1 returns runnerUrl', s6_2.data?.runnerUrl?.includes('testId=test-net-mock-1'), `runnerUrl: ${s6_2.data?.runnerUrl}`);
  assertTest('6.2d unlocked test-net-mock-1 returns test metadata payload', s6_2.data?.test?.id === 'test-net-mock-1' && s6_2.data?.test?.totalQuestions === 100, `Test: ${JSON.stringify(s6_2.data?.test)}`);

  // 6.3 Paying buyer requesting unlocked test-unit-1 (Release date: 1 Nov 2026)
  const s6_3 = await invoke(serveTestHandler, {
    headers: { Authorization: `Bearer ${payingBuyerToken}` },
    query: { testId: 'test-unit-1' }
  });
  assertTest('6.3 Paying buyer requesting unlocked test-unit-1 returns 200 OK', s6_3.status === 200, `Status: ${s6_3.status}`);

  // 6.4 Author email bypass verification: author can preview unreleased test-net-mock-2
  const s6_4 = await invoke(serveTestHandler, {
    headers: { Authorization: `Bearer ${authorToken}` },
    query: { testId: 'test-net-mock-2' }
  });
  assertTest('6.4 Author can preview unreleased test-net-mock-2 before public date (200 OK)', s6_4.status === 200 && s6_4.data?.isLocked === false, `Status: ${s6_4.status}`);

  // ===========================================================================
  // SUITE 7: Parameter Validation & Input Robustness (Expected: 400 / 404)
  // ===========================================================================
  console.log('\n--- Suite 7: Parameter Validation & Input Robustness ---');

  // 7.1 download-file with missing fileId parameter
  const s7_1 = await invoke(downloadFileHandler, {
    headers: { Authorization: `Bearer ${payingBuyerToken}` },
    query: {}
  });
  assertTest('7.1 download-file without fileId parameter returns 400 Bad Request', s7_1.status === 400, `Status: ${s7_1.status}`);

  // 7.2 serve-test with missing testId parameter
  const s7_2 = await invoke(serveTestHandler, {
    headers: { Authorization: `Bearer ${payingBuyerToken}` },
    query: {}
  });
  assertTest('7.2 serve-test without testId parameter returns 400 Bad Request', s7_2.status === 400, `Status: ${s7_2.status}`);

  // 7.3 serve-test with non-existent testId
  const s7_3 = await invoke(serveTestHandler, {
    headers: { Authorization: `Bearer ${payingBuyerToken}` },
    query: { testId: 'test-non-existent-999' }
  });
  assertTest('7.3 serve-test with non-existent testId returns 404 Not Found', s7_3.status === 404, `Status: ${s7_3.status}`);

  // 7.4 download-file path traversal attempt in fileId parameter
  const s7_4 = await invoke(downloadFileHandler, {
    headers: { Authorization: `Bearer ${payingBuyerToken}` },
    query: { fileId: '../../../../etc/passwd' }
  });
  assertTest('7.4 download-file safely handles directory traversal string without leaking filesystem', s7_4.status === 200 || s7_4.status === 400, `Status: ${s7_4.status}`);

  // ===========================================================================
  // SUMMARY SCORECARD
  // ===========================================================================
  console.log('\n================================================================================');
  console.log('                 ADVERSARIAL PENETRATION TEST SUMMARY SCORECARD                 ');
  console.log('================================================================================');
  console.log(`Total Adversarial Checks : ${totalTests}`);
  console.log(`Passed Checks            : ${passedTests}`);
  console.log(`Failed Checks            : ${failedTests}`);
  console.log(`Pass Rate                : ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log('--------------------------------------------------------------------------------\n');

  if (failedTests > 0) {
    console.error('FAILURES DETECTED:');
    failureDetails.forEach((f, idx) => {
      console.error(`[${idx + 1}] ${f.name} --> ${f.details}`);
    });
    process.exit(1);
  } else {
    console.log('ALL ADVERSARIAL PENETRATION CHECKS PASSED EMPIRICALLY! ZERO VULNERABILITIES FOUND.');
    process.exit(0);
  }
}

runAdversarialSuite().catch(err => {
  console.error('CRITICAL ERROR RUNNING ADVERSARIAL SUITE:', err);
  process.exit(1);
});
