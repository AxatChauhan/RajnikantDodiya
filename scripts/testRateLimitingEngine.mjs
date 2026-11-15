/**
 * Automated Verification Suite: Serverless API Rate-Limiting Engine
 * Tests sliding-window enforcement, HTTP 429 responses, Retry-After headers, and IP isolation.
 */

import {
  checkRateLimit,
  enforceRateLimit,
  getClientIp,
  clearRateLimits,
  RATE_LIMIT_RULES
} from '../lib/rate-limiter.js';
import authHandler from '../api/auth.js';
import createOrderHandler from '../api/store/create-order.js';
import priceHandler from '../api/store/price.js';

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

function mockReqRes({ method = 'POST', headers = {}, body = {}, query = {}, url = '' }) {
  const req = {
    method,
    headers,
    body,
    query,
    url: url || `/api/auth?action=${query.action || ''}`
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
      resHeaders[key.toLowerCase()] = val;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
    send(data) {
      responseData = data;
      return this;
    },
    end() {
      return this;
    }
  };

  return {
    req,
    res,
    getResult: () => ({ status: statusCode, body: responseData, headers: resHeaders })
  };
}

async function runRateLimitingTests() {
  console.log('================================================================');
  console.log('🛡️  STARTING SERVERLESS RATE LIMITING ENGINE VERIFICATION');
  console.log('================================================================\n');

  clearRateLimits();

  // Test 1: IP Extraction Accuracy
  console.log('--- TEST 1: IP Extraction ---');
  {
    const req1 = { headers: { 'x-forwarded-for': '203.0.113.195, 70.41.3.18' } };
    assert(getClientIp(req1) === '203.0.113.195', 'Extracts primary client IP from x-forwarded-for list');

    const req2 = { headers: { 'x-real-ip': '198.51.100.42' } };
    assert(getClientIp(req2) === '198.51.100.42', 'Extracts client IP from x-real-ip');

    const req3 = { socket: { remoteAddress: '::ffff:192.0.2.1' } };
    assert(getClientIp(req3) === '192.0.2.1', 'Normalizes IPv4-mapped IPv6 address correctly');
  }

  // Test 2: Core checkRateLimit sliding window mechanism
  console.log('\n--- TEST 2: Core Sliding-Window Counter ---');
  {
    clearRateLimits();
    const testKey = 'test_ip_1';
    for (let i = 1; i <= 5; i++) {
      const res = checkRateLimit({ key: testKey, limit: 5, windowMs: 1000 });
      assert(res.allowed === true, `Request ${i} of 5 allowed`);
      assert(res.remaining === 5 - i, `Remaining count accurately decremented to ${5 - i}`);
    }

    const blocked = checkRateLimit({ key: testKey, limit: 5, windowMs: 1000 });
    assert(blocked.allowed === false, '6th request within window successfully blocked');
    assert(blocked.remaining === 0, 'Remaining is 0 when blocked');
    assert(blocked.retryAfter >= 1, `retryAfter indicates positive wait time (${blocked.retryAfter}s)`);
  }

  // Test 3: Multiple IP Isolation
  console.log('\n--- TEST 3: IP Address Isolation ---');
  {
    clearRateLimits();
    const ipA = '10.0.0.1';
    const ipB = '10.0.0.2';

    // Exhaust quota for IP A
    for (let i = 0; i < 5; i++) {
      checkRateLimit({ key: `${ipA}:action`, limit: 5, windowMs: 10000 });
    }
    const blockedA = checkRateLimit({ key: `${ipA}:action`, limit: 5, windowMs: 10000 });
    assert(blockedA.allowed === false, 'IP A is blocked after 5 requests');

    // IP B should still be completely unhindered
    const allowedB = checkRateLimit({ key: `${ipB}:action`, limit: 5, windowMs: 10000 });
    assert(allowedB.allowed === true, 'IP B remains allowed and unhindered despite IP A being blocked');
  }

  // Test 4: End-to-End POST /api/auth/login Throttling (Limit: 10 req/min)
  console.log('\n--- TEST 4: Login Endpoint Throttling (10 req/min) ---');
  {
    clearRateLimits();
    const attackerIp = '198.51.100.99';

    // Send 10 rapid login attempts from attacker IP
    for (let i = 1; i <= 10; i++) {
      const { req, res, getResult } = mockReqRes({
        method: 'POST',
        query: { action: 'login' },
        headers: { 'x-forwarded-for': attackerIp },
        body: { email: 'victim@example.com', password: `badpass_${i}` }
      });
      await authHandler(req, res);
      const result = getResult();
      assert(result.status === 401 || result.status === 404, `Login attempt ${i} reaches auth logic (Status ${result.status} Account Not Found / Invalid credentials)`);
    }

    // 11th attempt MUST be blocked by rate limiter with 429
    const { req, res, getResult } = mockReqRes({
      method: 'POST',
      query: { action: 'login' },
      headers: { 'x-forwarded-for': attackerIp },
      body: { email: 'victim@example.com', password: 'badpass_11' }
    });
    await authHandler(req, res);
    const result = getResult();

    assert(result.status === 429, `11th login attempt blocked with HTTP 429 (Got ${result.status})`);
    assert(result.body?.success === false, 'Response has success: false');
    assert(result.body?.error?.includes('Too many login attempts'), 'Returns informative rate-limit message');
    assert(Boolean(result.headers['retry-after']), `Sets standard Retry-After header (${result.headers['retry-after']}s)`);
    assert(result.headers['x-ratelimit-remaining'] === '0', 'Sets X-RateLimit-Remaining to 0');
  }

  // Test 5: End-to-End POST /api/auth/signup Throttling (Limit: 5 req/min)
  console.log('\n--- TEST 5: Signup Endpoint Throttling (5 req/min) ---');
  {
    clearRateLimits();
    const spammerIp = '198.51.100.77';

    for (let i = 1; i <= 5; i++) {
      const { req, res, getResult } = mockReqRes({
        method: 'POST',
        query: { action: 'signup' },
        headers: { 'x-forwarded-for': spammerIp },
        body: { name: 'Bot', email: `bot_${i}@spam.com`, password: 'Password123!', mobile: '9876543210' }
      });
      await authHandler(req, res);
      const result = getResult();
      assert(result.status === 200, `Signup attempt ${i} allowed (Status 200)`);
    }

    // 6th attempt MUST be blocked
    const { req, res, getResult } = mockReqRes({
      method: 'POST',
      query: { action: 'signup' },
      headers: { 'x-forwarded-for': spammerIp },
      body: { name: 'Bot', email: 'bot_6@spam.com', password: 'Password123!', mobile: '9876543210' }
    });
    await authHandler(req, res);
    const result = getResult();

    assert(result.status === 429, `6th signup attempt blocked with HTTP 429 (Got ${result.status})`);
    assert(result.body?.error?.includes('Too many account creation attempts'), 'Returns signup rate-limit notice');
  }

  // Test 6: End-to-End POST /api/auth/forgot-password Throttling (Limit: 3 req/min)
  console.log('\n--- TEST 6: Password Reset Request Throttling (3 req/min) ---');
  {
    clearRateLimits();
    const resetBomberIp = '198.51.100.55';

    for (let i = 1; i <= 3; i++) {
      const { req, res, getResult } = mockReqRes({
        method: 'POST',
        query: { action: 'forgot-password' },
        headers: { 'x-forwarded-for': resetBomberIp },
        body: { email: 'target_candidate@example.com' }
      });
      await authHandler(req, res);
      const result = getResult();
      assert(result.status === 200, `Password reset request ${i} processed`);
    }

    // 4th request MUST be blocked
    const { req, res, getResult } = mockReqRes({
      method: 'POST',
      query: { action: 'forgot-password' },
      headers: { 'x-forwarded-for': resetBomberIp },
      body: { email: 'target_candidate@example.com' }
    });
    await authHandler(req, res);
    const result = getResult();

    assert(result.status === 429, `4th forgot-password attempt blocked with HTTP 429 (Got ${result.status})`);
    assert(result.body?.error?.includes('Too many password reset requests'), 'Returns password reset rate-limit error');
  }

  // Test 7: End-to-End Order Creation Throttling (Limit: 6 req/min)
  console.log('\n--- TEST 7: Order Creation Throttling (6 req/min) ---');
  {
    clearRateLimits();
    const cardTesterIp = '198.51.100.33';

    for (let i = 1; i <= 6; i++) {
      const { req, res, getResult } = mockReqRes({
        method: 'POST',
        headers: { 'x-forwarded-for': cardTesterIp },
        body: {
          studentName: 'Candidate',
          email: 'student@example.com',
          mobile: '9876543210',
          productId: 'ugc-net-bundle'
        }
      });
      await createOrderHandler(req, res);
      const result = getResult();
      assert(result.status === 200, `Order creation request ${i} allowed`);
    }

    // 7th order attempt blocked
    const { req, res, getResult } = mockReqRes({
      method: 'POST',
      headers: { 'x-forwarded-for': cardTesterIp },
      body: {
        studentName: 'Candidate',
        email: 'student@example.com',
        mobile: '9876543210',
        productId: 'ugc-net-bundle'
      }
    });
    await createOrderHandler(req, res);
    const result = getResult();

    assert(result.status === 429, `7th order attempt blocked with HTTP 429 (Got ${result.status})`);
    assert(result.body?.error?.includes('Order creation rate limit reached'), 'Returns order rate-limit error');
  }

  // Test 8: End-to-End Pricing Engine Throttling (Limit: 20 req/min)
  console.log('\n--- TEST 8: Pricing Engine Throttling (20 req/min) ---');
  {
    clearRateLimits();
    const priceScraperIp = '198.51.100.22';

    for (let i = 1; i <= 20; i++) {
      const { req, res, getResult } = mockReqRes({
        method: 'GET',
        headers: { 'x-forwarded-for': priceScraperIp }
      });
      await priceHandler(req, res);
      const result = getResult();
      assert(result.status === 200, `Price lookup ${i} served`);
    }

    // 21st request blocked
    const { req, res, getResult } = mockReqRes({
      method: 'GET',
      headers: { 'x-forwarded-for': priceScraperIp }
    });
    await priceHandler(req, res);
    const result = getResult();

    assert(result.status === 429, `21st price lookup blocked with HTTP 429 (Got ${result.status})`);
    assert(result.body?.error?.includes('Too many pricing requests'), 'Returns pricing rate-limit error');
  }

  // Clean up store after tests
  clearRateLimits();

  console.log('\n================================================================');
  console.log(`📊 RATE LIMITING TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  if (failed === 0) {
    console.log('✅ ALL RATE LIMITING TESTS PASSED PERFECTLY!');
  } else {
    console.error('❌ SOME TESTS FAILED.');
    process.exit(1);
  }
  console.log('================================================================');
}

runRateLimitingTests().catch(err => {
  console.error('Test Suite Exception:', err);
  process.exit(1);
});
