import assert from 'assert';
import fs from 'fs';
import path from 'path';

// Load .env into process.env for standalone node execution
try {
  const envContent = fs.readFileSync(path.resolve('.env'), 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [k, ...rest] = trimmed.split('=');
    if (k && !process.env[k.trim()]) {
      process.env[k.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '');
    }
  }
} catch {}

function mockReqRes(method = 'POST', body = {}, headers = {}) {
  let statusCode = 200;
  let responseData = null;
  const req = { method, body, headers, query: {}, url: '' };
  const res = {
    status(code) { statusCode = code; return this; },
    json(data) { responseData = data; return this; },
    setHeader() { return this; },
    end() { return this; },
    getStatusCode: () => statusCode,
    getData: () => responseData
  };
  return { req, res };
}

async function runSecurityPatchesTest() {
  console.log('=== VERIFYING RECENT SECURITY PATCHES ===\n');

  // 1. Test forgot-password token leak fix
  const { default: authHandler } = await import('../api/auth.js');
  {
    const { req, res } = mockReqRes('POST', { email: 'student@example.com' });
    req.query = { action: 'forgot-password' };
    await authHandler(req, res);
    const data = res.getData();
    assert.strictEqual(res.getStatusCode(), 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.token, undefined, 'CRITICAL: forgot-password MUST NOT expose raw reset token in JSON!');
    console.log('✓ PASS: forgot-password token leak remediated (no token in response)');
  }

  // 2. Test login password check for buyers
  {
    const { req, res } = mockReqRes('POST', { email: 'student@example.com', password: 'wrongpassword' });
    req.query = { action: 'login' };
    await authHandler(req, res);
    assert.strictEqual(res.getStatusCode(), 401, 'CRITICAL: Login must return 401 on wrong password even for buyers!');
    console.log('✓ PASS: Buyer password bypass remediated (wrong password rejected with 401)');
  }

  // 3. Test Admin Login with new Master Password
  const { default: adminHandler } = await import('../api/store/admin.js');
  {
    // Rejected old default password '2026'
    const { req, res } = mockReqRes('POST', { password: '2026' });
    req.query = { action: 'login' };
    await adminHandler(req, res);
    assert.strictEqual(res.getStatusCode(), 401, 'Old default password 2026 must be rejected');
    console.log('✓ PASS: Old default admin PIN "2026" rejected');

    // Rejected old default password 'admin123'
    const { req: req2, res: res2 } = mockReqRes('POST', { password: 'admin123' });
    req2.query = { action: 'login' };
    await adminHandler(req2, res2);
    assert.strictEqual(res2.getStatusCode(), 401, 'Old default password admin123 must be rejected');
    console.log('✓ PASS: Old default admin password "admin123" rejected');

    // Accepted new master password
    const { req: req3, res: res3 } = mockReqRes('POST', { password: 'superSecretRajnikantDodiyaPassword' });
    req3.query = { action: 'login' };
    await adminHandler(req3, res3);
    assert.strictEqual(res3.getStatusCode(), 200, 'Configured master password must be accepted');
    assert.ok(res3.getData()?.adminToken, 'Admin token issued upon valid master password');
    console.log('✓ PASS: Master admin password authenticated successfully');
  }

  // 4. Test Content CMS Auth Bypass Fixes
  const { default: contentHandler } = await import('../api/content.js');
  {
    // Arbitrary 10-char password rejected
    const { req, res } = mockReqRes('POST', { password: 'arbitrary10chars' });
    await contentHandler(req, res);
    assert.strictEqual(res.getStatusCode(), 401, 'Arbitrary 10-character password must be rejected');
    console.log('✓ PASS: Arbitrary 10-char password CMS bypass remediated');

    // Email-only payload rejected
    const { req: req2, res: res2 } = mockReqRes('POST', { authorEmail: 'rajnikantdodiya2@gmail.com' });
    await contentHandler(req2, res2);
    assert.strictEqual(res2.getStatusCode(), 401, 'authorEmail body without password must be rejected');
    console.log('✓ PASS: Author email body bypass remediated');

    // Valid master password accepted
    const { req: req3, res: res3 } = mockReqRes('POST', { password: 'superSecretRajnikantDodiyaPassword' });
    await contentHandler(req3, res3);
    assert.strictEqual(res3.getStatusCode(), 200, 'Valid master password must be accepted by CMS');
    console.log('✓ PASS: Content CMS authenticated with master password');
  }

  // 5. Test Coupon Overflow / Minimum Order Value
  const { default: createOrderHandler } = await import('../api/store/create-order.js');
  {
    // SCHOLAR150 on 149 pack must be rejected
    const { req, res } = mockReqRes('POST', {
      studentName: 'Test Student',
      email: 'test@student.in',
      mobile: '9876543210',
      productId: 'gset-paper1',
      couponCode: 'SCHOLAR150'
    });
    await createOrderHandler(req, res);
    assert.strictEqual(res.getStatusCode(), 400, 'SCHOLAR150 on ₹149 pack must fail minimum order value check');
    console.log('✓ PASS: Coupon overflow prevented (SCHOLAR150 rejected on ₹149 pack)');
  }

  // 6. Test Production Simulation Lockout
  {
    process.env.VERCEL = '1'; // Simulate production Vercel runtime
    const { default: verifyPaymentHandler } = await import('../api/store/verify-payment.js');

    const { req, res } = mockReqRes('POST', {
      couponCode: 'SIMULATE',
      email: 'attacker@evil.com'
    });
    await verifyPaymentHandler(req, res);
    assert.strictEqual(res.getStatusCode(), 403, 'SIMULATE in production must return 403 Forbidden');
    console.log('✓ PASS: SIMULATE voucher rejected with 403 in production environment');

    // Reusing someone else's captured payment ID must be rejected
    const { req: req2, res: res2 } = mockReqRes('POST', {
      paymentId: 'pay_U01dCsc7irC6LP',
      email: 'attacker@evil.com'
    });
    await verifyPaymentHandler(req2, res2);
    assert.strictEqual(res2.getStatusCode() === 403 || res2.getStatusCode() === 400, true, 'Reusing someone else paymentId must be rejected with 400/403');
    console.log('✓ PASS: Payment hijacking prevented (cannot claim another user\'s payment ID)');

    delete process.env.VERCEL;
  }

  console.log('\n=== ALL 6 PATCH VERIFICATION SUITES PASSED (100%) ===');
}

runSecurityPatchesTest().catch(err => {
  console.error('\n✗ TEST FAILED:', err);
  process.exit(1);
});
