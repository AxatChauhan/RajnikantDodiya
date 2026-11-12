/**
 * Targeted Verification Suite: Razorpay Payment Link + Webhook Security & Fulfillment
 */

import crypto from 'crypto';
import { Readable } from 'stream';
import razorpayWebhookHandler from '../api/store/razorpay-webhook.js';
import createOrderHandler from '../api/store/create-order.js';
import authHandler from '../api/auth.js';
import downloadFileHandler from '../api/store/download-file.js';
import { isEmailBuyer, findUserByEmail, createSessionToken } from '../lib/auth-helper.js';

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

async function invokeHandler(handler, reqOpts = {}) {
  let status = 200;
  let data = null;
  const headers = { ...reqOpts.headers };

  let req;
  if (reqOpts.rawStreamText !== undefined) {
    req = Readable.from([Buffer.from(reqOpts.rawStreamText, 'utf8')]);
    req.method = reqOpts.method || 'POST';
    req.headers = headers;
    req.query = reqOpts.query || {};
    req.url = reqOpts.url || '/api/store/razorpay-webhook';
  } else {
    req = {
      method: reqOpts.method || 'POST',
      headers,
      query: reqOpts.query || {},
      body: reqOpts.body,
      url: reqOpts.url || '/'
    };
  }

  const res = {
    setHeader: () => {},
    status(code) {
      status = code;
      return this;
    },
    json(payload) {
      data = payload;
      return this;
    },
    end() {
      return this;
    }
  };

  await handler(req, res);
  return { status, data };
}

async function runTests() {
  console.log('\n======================================================================');
  console.log('RAZORPAY PAYMENT LINK + WEBHOOK FLOW VERIFICATION');
  console.log('======================================================================');

  const testSecret = 'strong_wh_live_secret_987654';

  // 1. Production fail-closed when RAZORPAY_WEBHOOK_SECRET is missing
  {
    const prevVercel = process.env.VERCEL;
    const prevSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    process.env.VERCEL = '1';
    delete process.env.RAZORPAY_WEBHOOK_SECRET;

    const res = await invokeHandler(razorpayWebhookHandler, {
      headers: { 'x-razorpay-signature': 'anything' },
      body: { event: 'payment.captured' }
    });
    assert('1. Production webhook fails closed (500) if RAZORPAY_WEBHOOK_SECRET unset', res.status === 500, `got ${res.status}`);

    if (prevVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = prevVercel;
    if (prevSecret !== undefined) process.env.RAZORPAY_WEBHOOK_SECRET = prevSecret;
  }

  // Set webhook secret for remaining tests
  process.env.RAZORPAY_WEBHOOK_SECRET = testSecret;

  // 2. Raw stream HTTP body signature verification (simulating Vercel bodyParser: false)
  const linkBuyerEmail = `linkbuyer_${Date.now()}@example.com`;
  {
    const payloadObj = {
      event: 'payment_link.paid',
      payload: {
        payment_link: {
          entity: {
            id: 'plink_Test001',
            status: 'paid',
            amount_paid: 79900,
            currency: 'INR',
            customer: {
              name: 'Meera Nair',
              email: linkBuyerEmail,
              contact: '+919876543211'
            }
          }
        },
        payment: {
          entity: {
            id: `pay_plink_${Date.now()}`,
            status: 'captured',
            amount: 79900,
            currency: 'INR',
            email: linkBuyerEmail,
            contact: '+919876543211'
          }
        }
      }
    };
    const rawStreamText = JSON.stringify(payloadObj, null, 2); // Indented formatting!
    const sig = crypto.createHmac('sha256', testSecret).update(rawStreamText).digest('hex');

    const whRes = await invokeHandler(razorpayWebhookHandler, {
      headers: { 'x-razorpay-signature': sig },
      rawStreamText
    });

    assert('2.1 Raw stream payment_link.paid webhook succeeds (200 OK)', whRes.status === 200 && whRes.data?.processed === true, JSON.stringify(whRes));
    assert('2.2 Paid buyer email recorded in isEmailBuyer()', await isEmailBuyer(linkBuyerEmail));
    const userBeforeSignup = await findUserByEmail(linkBuyerEmail);
    assert('2.3 No password-less broken user inserted before student signs up', userBeforeSignup === null);

    // Student now signs up on site using that email -> must unlock immediately!
    const signupRes = await invokeHandler(authHandler, {
      query: { action: 'signup' },
      body: {
        name: 'Meera Nair',
        email: linkBuyerEmail,
        mobile: '9876543211',
        password: 'StrongPassword@2026'
      }
    });
    assert('2.4 Post-webhook signup succeeds cleanly (200)', signupRes.status === 200 && signupRes.data?.success === true, JSON.stringify(signupRes));
    assert('2.5 Newly signed-up buyer immediately receives isBuyer: true', signupRes.data?.user?.isBuyer === true);

    const dlRes = await invokeHandler(downloadFileHandler, {
      method: 'GET',
      headers: { authorization: `Bearer ${signupRes.data?.token}` },
      query: { fileId: 'unit-1' }
    });
    assert('2.6 Protected file download unlocked (200 OK) with signup token', dlRes.status === 200 && Boolean(dlRes.data?.downloadUrl));
  }

  // 3. Reject underpaid payment link / cheap item on same Razorpay merchant account (e.g. ₹10 = 1000 paise)
  {
    const underpaidEmail = `cheap_${Date.now()}@example.com`;
    const payloadObj = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: `pay_cheap_${Date.now()}`,
            status: 'captured',
            amount: 1000, // ₹10 only
            currency: 'INR',
            email: underpaidEmail
          }
        }
      }
    };
    const rawBody = JSON.stringify(payloadObj);
    const sig = crypto.createHmac('sha256', testSecret).update(rawBody).digest('hex');

    const res = await invokeHandler(razorpayWebhookHandler, {
      headers: { 'x-razorpay-signature': sig },
      body: payloadObj
    });

    assert('3.1 Underpaid webhook acknowledged 200 OK without granting access', res.status === 200 && res.data?.status === 'ignored_insufficient_amount');
    assert('3.2 Underpaid email is NOT granted buyer access', (await isEmailBuyer(underpaidEmail)) === false);
  }

  // 4. Reject non-INR currency webhook
  {
    const usdEmail = `usd_${Date.now()}@example.com`;
    const payloadObj = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: `pay_usd_${Date.now()}`,
            status: 'captured',
            amount: 79900,
            currency: 'USD',
            email: usdEmail
          }
        }
      }
    };
    const rawBody = JSON.stringify(payloadObj);
    const sig = crypto.createHmac('sha256', testSecret).update(rawBody).digest('hex');

    const res = await invokeHandler(razorpayWebhookHandler, {
      headers: { 'x-razorpay-signature': sig },
      body: payloadObj
    });

    assert('4.1 Non-INR currency webhook ignored', res.status === 200 && res.data?.status === 'ignored_currency');
    assert('4.2 Non-INR buyer NOT granted access', (await isEmailBuyer(usdEmail)) === false);
  }

  // 5. Already-registered free user upgrades after webhook -> /api/auth/me refreshes JWT with isBuyer: true
  {
    const freeEmail = `freeuser_${Date.now()}@example.com`;
    const regRes = await invokeHandler(authHandler, {
      query: { action: 'signup' },
      body: {
        name: 'Rohan Desai',
        email: freeEmail,
        mobile: '9876543222',
        password: 'MyPassword@2026'
      }
    });
    assert('5.1 Pre-registered free user starts with isBuyer: false', regRes.data?.user?.isBuyer === false);

    // Webhook arrives for Rohan
    const whPayload = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: `pay_upgrade_${Date.now()}`,
            status: 'captured',
            amount: 79900,
            currency: 'INR',
            email: freeEmail
          }
        }
      }
    };
    const rawBody = JSON.stringify(whPayload);
    const sig = crypto.createHmac('sha256', testSecret).update(rawBody).digest('hex');
    await invokeHandler(razorpayWebhookHandler, {
      headers: { 'x-razorpay-signature': sig },
      body: whPayload
    });

    const meRes = await invokeHandler(authHandler, {
      method: 'GET',
      query: { action: 'me' },
      headers: { authorization: `Bearer ${regRes.data?.token}` }
    });

    assert('5.2 /api/auth/me reflects upgraded isBuyer: true after webhook', meRes.data?.user?.isBuyer === true);
    assert('5.3 /api/auth/me issues refreshed buyer JWT token', Boolean(meRes.data?.token));
  }

  // 6. create-order Payment Link Mode & Production Unconfigured Blocking
  {
    const prevKeyId = process.env.RAZORPAY_KEY_ID;
    const prevKeySec = process.env.RAZORPAY_KEY_SECRET;
    const prevLink = process.env.RAZORPAY_PAYMENT_LINK;
    const prevVercel = process.env.VERCEL;

    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;
    delete process.env.RAZORPAY_PAYMENT_LINK;

    const linkOrderRes = await invokeHandler(createOrderHandler, {
      body: { studentName: 'Kiran Patel', email: 'kiran@example.com', mobile: '9876543233' }
    });
    assert(
      '6.1 create-order defaults to configured ₹799 link https://rzp.io/rzp/locBUA0o',
      linkOrderRes.status === 200 &&
        linkOrderRes.data?.paymentMode === 'payment_link' &&
        linkOrderRes.data?.paymentLinkUrl === 'https://rzp.io/rzp/locBUA0o' &&
        linkOrderRes.data?.amount === 799 &&
        linkOrderRes.data?.amountInPaisa === 79900
    );

    process.env.RAZORPAY_PAYMENT_LINK = 'disabled';
    process.env.VERCEL = '1';
    const unconfRes = await invokeHandler(createOrderHandler, {
      body: { studentName: 'Kiran Patel', email: 'kiran@example.com', mobile: '9876543233' }
    });
    assert('6.2 Production disabled checkout fails closed with 503', unconfRes.status === 503 && unconfRes.data?.success === false);

    if (prevKeyId !== undefined) process.env.RAZORPAY_KEY_ID = prevKeyId;
    if (prevKeySec !== undefined) process.env.RAZORPAY_KEY_SECRET = prevKeySec;
    if (prevLink !== undefined) process.env.RAZORPAY_PAYMENT_LINK = prevLink;
    if (prevVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = prevVercel;
  }

  console.log('\n======================================================================');
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================================');
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
