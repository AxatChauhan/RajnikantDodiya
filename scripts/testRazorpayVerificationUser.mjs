/**
 * Verification Test Suite: Razorpay API Verification Test Users
 */

import assert from 'assert';
import handler from '../api/auth.js';
import serveTestHandler from '../api/store/serve-test.js';
import downloadFileHandler from '../api/store/download-file.js';

function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
    },
    json(data) {
      this.body = data;
      return this;
    },
    end() {
      return this;
    }
  };
  return res;
}

async function runTests() {
  console.log('--- Testing Razorpay Verification Test Users ---');

  // Test 1: Login as Razorpay Verifier with primary password
  {
    const req = {
      method: 'POST',
      url: '/api/auth/login',
      query: { action: 'login' },
      headers: { 'content-type': 'application/json' },
      body: { email: 'razorpay.test@rajnikantdodiya.com', password: 'Razorpay@2026' }
    };
    const res = createMockRes();
    await handler(req, res);

    assert.strictEqual(res.statusCode, 200, 'Verifier login should succeed with 200');
    assert.strictEqual(res.body.success, true, 'Verifier response success should be true');
    assert.strictEqual(res.body.user.isBuyer, true, 'Verifier must have isBuyer: true');
    assert.ok(res.body.token, 'Verifier must receive JWT token');
    console.log('✓ PASS: razorpay.test@rajnikantdodiya.com logs in with Razorpay@2026 as isBuyer: true');

    const token = res.body.token;

    // Test 1b: Verify test hall access with token
    const testReq = {
      method: 'GET',
      url: '/api/store/serve-test?testId=test-net-mock-1',
      query: { testId: 'test-net-mock-1' },
      headers: { authorization: `Bearer ${token}` }
    };
    const testRes = createMockRes();
    await serveTestHandler(testReq, testRes);

    assert.strictEqual(testRes.statusCode, 200, 'Verifier must have access to test-net-mock-1');
    assert.strictEqual(testRes.body.isLocked, false, 'test-net-mock-1 must be unlocked');
    console.log('✓ PASS: Verifier token unlocks CBT mock tests');

    // Test 1c: Verify file download access with token
    const fileReq = {
      method: 'GET',
      url: '/api/store/download-file?fileId=unit-1',
      query: { fileId: 'unit-1' },
      headers: { authorization: `Bearer ${token}` }
    };
    const fileRes = createMockRes();
    await downloadFileHandler(fileReq, fileRes);

    assert.strictEqual(fileRes.statusCode, 200, 'Verifier must have access to download unit-1 dossier');
    assert.ok(fileRes.body.downloadUrl, 'Verifier must receive valid signed download URL');
    console.log('✓ PASS: Verifier token receives signed dossier download URL');
  }

  // Test 2: Login with lowercase password fallback
  {
    const req = {
      method: 'POST',
      url: '/api/auth/login',
      query: { action: 'login' },
      headers: { 'content-type': 'application/json' },
      body: { email: 'razorpay.test@rajnikantdodiya.com', password: 'razorpay@2026' }
    };
    const res = createMockRes();
    await handler(req, res);

    assert.strictEqual(res.statusCode, 200, 'Verifier login should succeed with lowercase razorpay@2026');
    assert.strictEqual(res.body.user.isBuyer, true, 'Verifier must have isBuyer: true');
    console.log('✓ PASS: Lowercase password fallback (razorpay@2026) verified');
  }

  // Test 3: Login as candidate (unpaid)
  {
    const req = {
      method: 'POST',
      url: '/api/auth/login',
      query: { action: 'login' },
      headers: { 'content-type': 'application/json' },
      body: { email: 'razorpay.candidate@rajnikantdodiya.com', password: 'Razorpay@2026' }
    };
    const res = createMockRes();
    await handler(req, res);

    assert.strictEqual(res.statusCode, 200, 'Candidate login should succeed with 200');
    assert.strictEqual(res.body.user.isBuyer, false, 'Candidate must have isBuyer: false');
    console.log('✓ PASS: razorpay.candidate@rajnikantdodiya.com logs in as isBuyer: false (unpaid)');

    const candidateToken = res.body.token;

    // Test 3b: Candidate attempting paid test is blocked
    const testReq = {
      method: 'GET',
      url: '/api/store/serve-test?testId=test-net-mock-1',
      query: { testId: 'test-net-mock-1' },
      headers: { authorization: `Bearer ${candidateToken}` }
    };
    const testRes = createMockRes();
    await serveTestHandler(testReq, testRes);

    assert.strictEqual(testRes.statusCode, 403, 'Unpaid candidate must receive 403 Forbidden');
    console.log('✓ PASS: Unpaid candidate is blocked from paid test hall (403)');
  }

  // Test 4: Existing test buyer still works
  {
    const req = {
      method: 'POST',
      url: '/api/auth/login',
      query: { action: 'login' },
      headers: { 'content-type': 'application/json' },
      body: { email: 'student@example.com', password: 'password123' }
    };
    const res = createMockRes();
    await handler(req, res);

    assert.strictEqual(res.statusCode, 200, 'Baseline student login should succeed');
    assert.strictEqual(res.body.user.isBuyer, true, 'Baseline student must have isBuyer: true');
    console.log('✓ PASS: Baseline student@example.com remains fully functional');
  }

  console.log('\n🎉 ALL RAZORPAY VERIFICATION TEST USER CHECKS PASSED!\n');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
