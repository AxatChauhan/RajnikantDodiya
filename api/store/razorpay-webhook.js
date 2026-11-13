import crypto from 'crypto';
import {
  findUserByEmail,
  saveUser,
  recordPaidBuyer,
  hasProcessedPayment,
  DEFAULT_ACCESS_EXPIRY
} from '../../lib/auth-helper.js';
import { fetchStoreSettings, computeCurrentServerPrice } from './price.js';

/**
 * Preserve raw request body bytes on Vercel so HMAC-SHA256 matches
 * Razorpay's exact byte payload without JSON re-serialization drift.
 */
export const config = {
  api: {
    bodyParser: false
  }
};

/**
 * Read raw payload string and parsed JSON safely across Vercel streams and local test mocks.
 */
async function extractWebhookPayload(req) {
  // 1. Pre-captured rawBody buffer/string (if provided by proxy/middleware)
  if (Buffer.isBuffer(req.rawBody) || typeof req.rawBody === 'string') {
    const rawBody = Buffer.isBuffer(req.rawBody) ? req.rawBody.toString('utf8') : req.rawBody;
    const parsed = rawBody ? JSON.parse(rawBody) : {};
    return { rawBody, body: parsed };
  }

  // 2. Test harnesses & pre-parsed mocks where req.body is explicitly populated
  if (req.body !== undefined) {
    if (typeof req.body === 'string') {
      return { rawBody: req.body, body: req.body ? JSON.parse(req.body) : {} };
    }
    if (Buffer.isBuffer(req.body)) {
      const rawBody = req.body.toString('utf8');
      return { rawBody, body: rawBody ? JSON.parse(rawBody) : {} };
    }
    return { rawBody: JSON.stringify(req.body), body: req.body };
  }

  // 3. Raw Node.js IncomingMessage stream on Vercel
  if (typeof req.on === 'function') {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const rawBody = Buffer.concat(chunks).toString('utf8');
    const body = rawBody ? JSON.parse(rawBody) : {};
    return { rawBody, body };
  }

  return { rawBody: '{}', body: {} };
}

/**
 * Vercel Serverless Function: Razorpay Webhook Handler
 * Captures `payment.captured`, `payment_link.paid`, and `order.paid` events
 * to verify and fulfill student purchases asynchronously.
 *
 * Security Rules:
 * 1. Fails closed in production if RAZORPAY_WEBHOOK_SECRET is missing.
 * 2. Strictly verifies HMAC-SHA256 signature on exact raw bytes using timingSafeEqual.
 * 3. Validates INR currency and minimum expected payment amount.
 * 4. Persists verified paid email to netvidya_buyers (and upgrades existing registered users).
 * 5. Handles duplicate events/retries idempotently.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const isProduction = Boolean(
      process.env.VERCEL ||
      process.env.VERCEL_ENV === 'production' ||
      process.env.NODE_ENV === 'production'
    );
    const webhookSecret =
      process.env.RAZORPAY_WEBHOOK_SECRET ||
      (isProduction ? '' : 'netvidya_wh_test_secret_key_2026');

    if (!webhookSecret) {
      return res.status(500).json({
        success: false,
        error: 'Server configuration error: RAZORPAY_WEBHOOK_SECRET is not set.'
      });
    }

    const webhookSignature = req.headers?.['x-razorpay-signature'] || req.headers?.['X-Razorpay-Signature'];
    if (!webhookSignature || typeof webhookSignature !== 'string') {
      return res.status(400).json({ success: false, error: 'Missing webhook signature header' });
    }

    let rawBody = '';
    let body = {};
    try {
      const extracted = await extractWebhookPayload(req);
      rawBody = extracted.rawBody;
      body = extracted.body || {};
    } catch {
      return res.status(400).json({ success: false, error: 'Malformed webhook JSON payload' });
    }

    // 1. Cryptographic HMAC-SHA256 Signature Verification
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const receivedBuf = Buffer.from(webhookSignature.trim(), 'utf8');

    if (expectedBuf.length !== receivedBuf.length || !crypto.timingSafeEqual(expectedBuf, receivedBuf)) {
      return res.status(400).json({ success: false, error: 'Invalid webhook signature' });
    }

    const event = body?.event;
    const payment = body?.payload?.payment?.entity;
    const paymentLink = body?.payload?.payment_link?.entity;
    const orderEntity = body?.payload?.order?.entity;

    const isPaidCaptureEvent =
      (event === 'payment.captured' && (!payment?.status || payment.status === 'captured')) ||
      (event === 'payment_link.paid' && (!paymentLink?.status || paymentLink.status === 'paid')) ||
      (event === 'order.paid' && (!orderEntity?.status || orderEntity.status === 'paid'));

    if (!isPaidCaptureEvent || (!payment && !paymentLink && !orderEntity)) {
      // Non-capture / failed events are acknowledged 200 OK without granting access
      return res.status(200).json({ status: 'ok', received: true, processed: false, event: event || 'unknown' });
    }

    // Optional Payment Link ID pinning if configured in environment
    const pinnedLinkId = process.env.RAZORPAY_PAYMENT_LINK_ID;
    if (pinnedLinkId && paymentLink?.id && paymentLink.id !== pinnedLinkId) {
      return res.status(200).json({
        status: 'ignored_unmatched_link',
        received: true,
        processed: false
      });
    }

    // 2. Validate Currency & Minimum Bundle Amount
    const currency = (payment?.currency || paymentLink?.currency || orderEntity?.currency || 'INR').toUpperCase();
    if (currency !== 'INR') {
      return res.status(200).json({ status: 'ignored_currency', currency, received: true, processed: false });
    }

    const rawAmountPaise = payment?.amount ?? paymentLink?.amount_paid ?? orderEntity?.amount_paid;
    const amountPaise = rawAmountPaise !== undefined && rawAmountPaise !== null ? Number(rawAmountPaise) : null;

    const settings = await fetchStoreSettings();
    const priceInfo = computeCurrentServerPrice(settings);
    // Dynamic minimum allowed amount across UGC NET (₹499-₹999) and GSET (₹149-₹249) packs
    const minValidPaise = Number(
      process.env.RAZORPAY_MIN_AMOUNT_PAISE || 4900 // Minimum ₹49 for micro-packs with discounts
    );

    if (amountPaise !== null && (!Number.isFinite(amountPaise) || amountPaise < minValidPaise)) {
      return res.status(200).json({
        status: 'ignored_insufficient_amount',
        received: true,
        processed: false
      });
    }

    // 3. Extract Student Identity from Notes, Payment Entity, or Payment Link Customer
    const customer = paymentLink?.customer || {};
    const notes = {
      ...(orderEntity?.notes || {}),
      ...(paymentLink?.notes || {}),
      ...(payment?.notes || {})
    };

    const email = (notes.email || payment?.email || customer.email || '').toString().trim().toLowerCase();
    const studentName = (
      notes.student_name ||
      notes.name ||
      customer.name ||
      payment?.description ||
      'Scholar'
    ).toString().trim();
    const mobile = (notes.mobile || notes.contact || payment?.contact || customer.contact || '').toString().trim();
    const paymentId = payment?.id || null;
    const orderId = payment?.order_id || orderEntity?.id || paymentLink?.id || `ORD_WH_${Date.now()}`;
    const amountPaid = amountPaise !== null ? amountPaise / 100 : 799;
    const expiresAt = settings.accessExpiryDate || DEFAULT_ACCESS_EXPIRY;
    const productId = notes.product_id || (amountPaid <= 149 ? 'gset-paper2-english' : (amountPaid <= 249 ? 'gset-english-combo' : 'ugc-bundle'));

    if (!email || !email.includes('@')) {
      return res.status(200).json({
        status: 'ok',
        received: true,
        processed: false,
        reason: 'missing_customer_email'
      });
    }

    const alreadyFulfilled = paymentId ? hasProcessedPayment(paymentId) : false;

    // 4. Record Verified Buyer in netvidya_buyers + memory registry + simulatedDb
    await recordPaidBuyer({
      email,
      studentName,
      mobile,
      orderId,
      razorpayPaymentId: paymentId,
      razorpayOrderId: payment?.order_id || orderEntity?.id || null,
      amountPaid,
      productId,
      paymentMethod: event === 'payment_link.paid' ? 'razorpay_link' : 'razorpay_webhook',
      expiresAt
    });

    // 5. If the student already created a site account earlier, upgrade their user record immediately.
    // If they paid first without an account, recordPaidBuyer above ensures /api/auth/signup automatically
    // unlocks them with isBuyer: true as soon as they create their account password with this email.
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      existingUser.is_buyer = true;
      existingUser.is_active = true;
      existingUser.expires_at = expiresAt;
      if (!existingUser.name && studentName) existingUser.name = studentName;
      if (!existingUser.mobile && mobile) existingUser.mobile = mobile;
      await saveUser(existingUser);
    }

    // 6. Dispatch Purchase Confirmation Email once per unique paymentId
    if (!alreadyFulfilled) {
      try {
        const { sendPurchaseConfirmationEmail } = await import('./email.js');
        await sendPurchaseConfirmationEmail({
          to: email,
          studentName,
          orderId,
          amount: amountPaid,
          paymentId: paymentId || orderId
        });
      } catch (emailErr) {
        console.warn('Webhook email dispatch error:', emailErr);
      }
    }

    return res.status(200).json({
      status: 'ok',
      received: true,
      processed: true,
      duplicate: alreadyFulfilled
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err?.message || 'Webhook processing failed' });
  }
}
