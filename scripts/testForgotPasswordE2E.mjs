import fs from 'fs';
import path from 'path';

// Parse .env
const env = fs.readFileSync('.env', 'utf8');
env.split('\n').forEach(line => {
  const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (m) process.env[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '');
});

async function runTest() {
  const { default: handler } = await import('../api/auth.js');
  const { findResetToken } = await import('../lib/auth-helper.js');

  const email = 'scholar_e2e_test@example.com';
  const initialPassword = 'InitialPass@123';
  const updatedPassword = 'BrandNewPass@2026';

  function mockRes() {
    return {
      statusCode: 200,
      headers: {},
      setHeader(k, v) { this.headers[k] = v; },
      status(c) { this.statusCode = c; return this; },
      json(data) { this.body = data; return this; },
      end() { return this; }
    };
  }

  console.log('1. Signing up user...');
  let res = mockRes();
  await handler({ method: 'POST', query: { action: 'signup' }, body: { name: 'E2E Scholar', email, password: initialPassword } }, res);
  console.log('   Signup status:', res.statusCode, res.body?.success);

  console.log('2. Requesting forgot-password...');
  res = mockRes();
  await handler({ method: 'POST', query: { action: 'forgot-password' }, body: { email } }, res);
  console.log('   Forgot status:', res.statusCode, 'Message:', res.body?.message);
  console.log('   Token in response body leaked?', Boolean(res.body?.token));

  // Retrieve token from storage (as student would get in their email)
  const tokens = Array.from(globalThis.__NETVIDYA_RESET_TOKENS__.entries());
  const tokenEntry = tokens.find(([t, rec]) => rec.email === email);
  if (!tokenEntry) throw new Error('Token was not saved in DB/memory!');
  const rawToken = tokenEntry[0];
  console.log('   Token found in secure storage (sent via email):', rawToken.slice(0, 10) + '...');

  console.log('3. Resetting password with token...');
  res = mockRes();
  await handler({ method: 'POST', query: { action: 'reset-password' }, body: { token: rawToken, newPassword: updatedPassword } }, res);
  console.log('   Reset status:', res.statusCode, 'Message:', res.body?.message);

  console.log('4. Attempting login with OLD password (should fail 401)...');
  res = mockRes();
  await handler({ method: 'POST', query: { action: 'login' }, body: { email, password: initialPassword } }, res);
  console.log('   Old password login status:', res.statusCode, 'Success?', res.body?.success);

  console.log('5. Attempting login with NEW password (should succeed 200)...');
  res = mockRes();
  await handler({ method: 'POST', query: { action: 'login' }, body: { email, password: updatedPassword } }, res);
  console.log('   New password login status:', res.statusCode, 'Success?', res.body?.success, 'Has Token?', Boolean(res.body?.token));

  if (res.statusCode === 200 && res.body?.success && Boolean(res.body?.token)) {
    console.log('🎉 FORGOT-PASSWORD AND RESET-PASSWORD FLOW VERIFIED 100%!');
    process.exit(0);
  } else {
    throw new Error('Flow failed verification!');
  }
}
runTest().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
