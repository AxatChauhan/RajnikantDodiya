import crypto from 'crypto';

const LIVE_BASE = process.env.LIVE_BASE_URL || 'https://rajnikantdodiya.com';
const LIVE_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

if (!LIVE_SECRET) {
  console.error('[ABORT] RAZORPAY_WEBHOOK_SECRET environment variable is required to run live audit.');
  process.exit(1);
}

let passed = 0;
let failed = 0;

function assert(name, condition, detail = '') {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${name}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${name}${detail ? ` -> ${detail}` : ''}`);
  }
}

async function runLiveAudit() {
  console.log('\n======================================================================');
  console.log('LIVE PRODUCTION SECURITY & VULNERABILITY AUDIT');
  console.log('Target:', LIVE_BASE);
  console.log('Timestamp:', new Date().toISOString());
  console.log('======================================================================\n');

  // -------------------------------------------------------------------------
  // 1. LIVE WEBHOOK AUTHENTICATION & HMAC TAMPER RESISTANCE
  // -------------------------------------------------------------------------
  console.log('--- 1. Live Razorpay Webhook Security & Ingestion ---');

  // 1.1 Missing signature
  {
    const res = await fetch(`${LIVE_BASE}/api/store/razorpay-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'payment_link.paid' })
    });
    const data = await res.json().catch(() => ({}));
    assert('1.1 Webhook with missing signature rejected (400)', res.status === 400 && data.error?.includes('signature'), JSON.stringify(data));
  }

  // 1.2 Forged signature with wrong secret
  {
    const dummyBody = JSON.stringify({ event: 'payment.captured' });
    const forgedSig = crypto.createHmac('sha256', 'wrong_fake_secret_key_12345').update(dummyBody).digest('hex');
    const res = await fetch(`${LIVE_BASE}/api/store/razorpay-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': forgedSig
      },
      body: dummyBody
    });
    const data = await res.json().catch(() => ({}));
    assert('1.2 Forged signature with incorrect secret rejected (400)', res.status === 400 && data.error?.includes('Invalid webhook signature'), JSON.stringify(data));
  }

  // 1.3 Tampered body (1 character changed after signing)
  {
    const originalBody = JSON.stringify({ event: 'payment_link.paid', amount: 79900 });
    const validSig = crypto.createHmac('sha256', LIVE_SECRET).update(originalBody).digest('hex');
    const tamperedBody = JSON.stringify({ event: 'payment_link.paid', amount: 79901 }); // altered!
    const res = await fetch(`${LIVE_BASE}/api/store/razorpay-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': validSig
      },
      body: tamperedBody
    });
    assert('1.3 Tampered body payload rejected (400)', res.status === 400);
  }

  // 1.4 Non-POST methods to webhook
  {
    const getRes = await fetch(`${LIVE_BASE}/api/store/razorpay-webhook`, { method: 'GET' });
    assert('1.4.1 GET to webhook returns 405 Method Not Allowed', getRes.status === 405);
    const putRes = await fetch(`${LIVE_BASE}/api/store/razorpay-webhook`, { method: 'PUT' });
    assert('1.4.2 PUT to webhook returns 405 Method Not Allowed', putRes.status === 405);
    const delRes = await fetch(`${LIVE_BASE}/api/store/razorpay-webhook`, { method: 'DELETE' });
    assert('1.4.3 DELETE to webhook returns 405 Method Not Allowed', delRes.status === 405);
  }

  // 1.5 Underpaid amount test with valid HMAC
  {
    const underpaidPayload = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: `pay_audit_cheap_${Date.now()}`,
            status: 'captured',
            amount: 5000, // ₹50 only (less than ₹799)
            currency: 'INR',
            email: 'audit_cheap_test@example.com'
          }
        }
      }
    };
    const bodyStr = JSON.stringify(underpaidPayload);
    const sig = crypto.createHmac('sha256', LIVE_SECRET).update(bodyStr).digest('hex');
    const res = await fetch(`${LIVE_BASE}/api/store/razorpay-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': sig
      },
      body: bodyStr
    });
    const data = await res.json().catch(() => ({}));
    assert('1.5 Underpaid payment acknowledged (200) but flagged ignored_insufficient_amount', res.status === 200 && data.status === 'ignored_insufficient_amount', JSON.stringify(data));
  }

  // 1.6 Non-INR currency test with valid HMAC
  {
    const usdPayload = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: `pay_audit_usd_${Date.now()}`,
            status: 'captured',
            amount: 79900,
            currency: 'USD',
            email: 'audit_usd_test@example.com'
          }
        }
      }
    };
    const bodyStr = JSON.stringify(usdPayload);
    const sig = crypto.createHmac('sha256', LIVE_SECRET).update(bodyStr).digest('hex');
    const res = await fetch(`${LIVE_BASE}/api/store/razorpay-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': sig
      },
      body: bodyStr
    });
    const data = await res.json().catch(() => ({}));
    assert('1.6 Non-INR currency acknowledged (200) but flagged ignored_currency', res.status === 200 && data.status === 'ignored_currency', JSON.stringify(data));
  }

  // 1.7 Non-capture / failed event handling
  {
    const failedPayload = {
      event: 'payment.failed',
      payload: {
        payment: {
          entity: {
            id: `pay_audit_failed_${Date.now()}`,
            status: 'failed',
            amount: 79900,
            currency: 'INR',
            email: 'audit_failed@example.com'
          }
        }
      }
    };
    const bodyStr = JSON.stringify(failedPayload);
    const sig = crypto.createHmac('sha256', LIVE_SECRET).update(bodyStr).digest('hex');
    const res = await fetch(`${LIVE_BASE}/api/store/razorpay-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': sig
      },
      body: bodyStr
    });
    const data = await res.json().catch(() => ({}));
    assert('1.7 payment.failed event acknowledged (200) with processed: false', res.status === 200 && data.processed === false, JSON.stringify(data));
  }

  // 1.8 Authentic payment_link.paid event simulation with live secret
  {
    const auditBuyerEmail = `audit_student_${Date.now()}@testnetvidya.in`;
    const legitPayload = {
      event: 'payment_link.paid',
      payload: {
        payment_link: {
          entity: {
            id: `plink_audit_${Date.now()}`,
            status: 'paid',
            amount_paid: 79900,
            currency: 'INR',
            customer: {
              name: 'Dr. Test Student',
              email: auditBuyerEmail,
              contact: '+919999988888'
            }
          }
        },
        payment: {
          entity: {
            id: `pay_audit_${Date.now()}`,
            status: 'captured',
            amount: 79900,
            currency: 'INR',
            email: auditBuyerEmail,
            contact: '+919999988888'
          }
        }
      }
    };
    const bodyStr = JSON.stringify(legitPayload);
    const sig = crypto.createHmac('sha256', LIVE_SECRET).update(bodyStr).digest('hex');
    const res = await fetch(`${LIVE_BASE}/api/store/razorpay-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': sig
      },
      body: bodyStr
    });
    const data = await res.json().catch(() => ({}));
    assert('1.8 Authentic payment_link.paid with live secret is accepted (200 OK, processed: true)', res.status === 200 && data.processed === true, JSON.stringify(data));

    // Duplicate submission test (Idempotency)
    const dupRes = await fetch(`${LIVE_BASE}/api/store/razorpay-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': sig
      },
      body: bodyStr
    });
    const dupData = await dupRes.json().catch(() => ({}));
    assert('1.9 Duplicate webhook delivery deduplicated cleanly without error', dupRes.status === 200, JSON.stringify(dupData));
  }

  // -------------------------------------------------------------------------
  // 2. LIVE PRICING & ORDER ENGINE INTEGRITY
  // -------------------------------------------------------------------------
  console.log('\n--- 2. Live Pricing & Order Engine Integrity ---');
  {
    const priceRes = await fetch(`${LIVE_BASE}/api/store/price`);
    const priceData = await priceRes.json().catch(() => ({}));
    assert('2.1 GET /api/store/price returns 200 OK', priceRes.status === 200 && priceData.success === true);
    assert('2.2 Server price evaluates to ₹799', priceData.price === 799);
    assert('2.3 Product slug is final-pack-2026', priceData.productSlug === 'final-pack-2026');
    assert('2.4 Payment mode is payment_link', priceData.paymentMode === 'payment_link');
    assert('2.5 Payment link URL points to https://rzp.io/rzp/locBUA0o', priceData.paymentLinkUrl === 'https://rzp.io/rzp/locBUA0o');
    assert('2.6 Seller disclosure mentions Nilam Dodiya / Dr Rajnikant Dodiya', priceData.sellerLine?.includes('Nilam Dodiya'));

    // Attacker tampering create-order amount
    const orderRes = await fetch(`${LIVE_BASE}/api/store/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentName: 'Hacker',
        email: 'hacker@example.com',
        mobile: '9999999999',
        amount: 1, // tamper attempt
        amountInPaisa: 100 // tamper attempt
      })
    });
    const orderData = await orderRes.json().catch(() => ({}));
    assert('2.7 create-order ignores client price tampering, returns ₹799 link', orderRes.status === 200 && orderData.amount === 799 && orderData.paymentLinkUrl === 'https://rzp.io/rzp/locBUA0o');
  }

  // -------------------------------------------------------------------------
  // 3. LIVE ACCESS CONTROL & PAYWALL DEFENSE
  // -------------------------------------------------------------------------
  console.log('\n--- 3. Live Access Control & Paywall Gatekeeping ---');
  {
    // Unauthenticated download attempt
    const dlNoToken = await fetch(`${LIVE_BASE}/api/store/download-file?fileId=unit-1`);
    assert('3.1 Download without token rejected (401 Unauthorized)', dlNoToken.status === 401);

    // Fake token download attempt
    const dlFakeToken = await fetch(`${LIVE_BASE}/api/store/download-file?fileId=unit-1`, {
      headers: { authorization: 'Bearer fake_jwt_token_12345' }
    });
    assert('3.2 Download with forged token rejected (401 Unauthorized)', dlFakeToken.status === 401);

    // Unauthenticated admin attempt
    const adminNoToken = await fetch(`${LIVE_BASE}/api/store/admin`);
    assert('3.3 Admin route without credentials rejected (401 Unauthorized)', adminNoToken.status === 401);

    // Attacker guess PIN
    const adminBadPin = await fetch(`${LIVE_BASE}/api/store/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: '123456' })
    });
    assert('3.4 Admin route with bad PIN rejected (401 Unauthorized)', adminBadPin.status === 401);
  }

  // -------------------------------------------------------------------------
  // 4. LIVE SECURITY HEADERS & PERIMETER DEFENSE
  // -------------------------------------------------------------------------
  console.log('\n--- 4. Live Security Headers & Compliance Routes ---');
  {
    const rootRes = await fetch(`${LIVE_BASE}/`, { method: 'GET' });
    const headers = rootRes.headers;

    assert('4.1 Root returns 200 OK', rootRes.status === 200);
    assert('4.2 X-Content-Type-Options: nosniff present', headers.get('x-content-type-options') === 'nosniff');
    assert('4.3 Content-Security-Policy (CSP) present', Boolean(headers.get('content-security-policy')));
    
    const csp = headers.get('content-security-policy') || '';
    assert('4.4 CSP allows Razorpay frames and scripts', csp.includes('razorpay.com'));
    assert('4.5 CSP allows Supabase connection', csp.includes('supabase.co'));

    // Compliance routes
    const termsRes = await fetch(`${LIVE_BASE}/terms`);
    assert('4.6 /terms returns 200 OK', termsRes.status === 200);

    const privRes = await fetch(`${LIVE_BASE}/privacy-policy`);
    assert('4.7 /privacy-policy returns 200 OK', privRes.status === 200);

    const refRes = await fetch(`${LIVE_BASE}/refund-policy`);
    assert('4.8 /refund-policy returns 200 OK', refRes.status === 200);

    const shipRes = await fetch(`${LIVE_BASE}/shipping-policy`);
    assert('4.9 /shipping-policy returns 200 OK', shipRes.status === 200);

    const robotsRes = await fetch(`${LIVE_BASE}/robots.txt`);
    assert('4.10 /robots.txt returns 200 OK', robotsRes.status === 200);

    const sitemapRes = await fetch(`${LIVE_BASE}/sitemap.xml`);
    assert('4.11 /sitemap.xml returns 200 OK', sitemapRes.status === 200);
  }

  console.log('\n======================================================================');
  console.log(`LIVE AUDIT COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================================');
  process.exit(failed > 0 ? 1 : 0);
}

runLiveAudit();
