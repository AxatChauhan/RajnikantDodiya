import crypto from 'crypto';
import { computeCurrentServerPrice, DEFAULT_STORE_SETTINGS, fetchStoreSettings } from './price.js';
import {
  findUserByEmail,
  saveUser,
  recordPaidBuyer,
  createSessionToken,
  DEFAULT_ACCESS_EXPIRY
} from '../../lib/auth-helper.js';

/**
 * Vercel Serverless Function: Cryptographic Payment Verification & Buyer Enrollment
 * NET Vidya English Student Store • "GSET + UGC NET English Final Pack 2026"
 * 
 * Security Rule:
 * Strictly fail-closed HMAC-SHA256 signature verification with crypto.timingSafeEqual.
 * Missing razorpay_signature or razorpay_payment_id returns HTTP 400.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      studentName,
      email,
      mobile,
      orderId,
      productId,
      amount
    } = req.body || {};

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (studentName || 'Student').trim();
    const cleanMobile = (mobile || '').trim();

    if (!cleanEmail || !cleanMobile) {
      return res.status(400).json({ success: false, error: 'Email and mobile are required.' });
    }

    // 1. Fail-Closed Signature Parameter Verification (Fixes BUG-01-FAIL-OPEN-SIGNATURE)
    if (!razorpay_signature || !razorpay_payment_id) {
      return res.status(400).json({
        success: false,
        verified: false,
        error: 'Payment signature parameters required'
      });
    }

    // 2. Cryptographic HMAC-SHA256 Verification with timingSafeEqual
    const isProduction = Boolean(
      process.env.VERCEL ||
      process.env.VERCEL_ENV === 'production' ||
      process.env.NODE_ENV === 'production'
    );
    const keySecret =
      process.env.RAZORPAY_KEY_SECRET ||
      (isProduction ? '' : 'netvidya_rzp_test_secret_key_2026');

    if (!keySecret) {
      return res.status(503).json({
        success: false,
        verified: false,
        error: 'Direct Razorpay API verification is disabled until RAZORPAY_KEY_SECRET is configured.'
      });
    }

    const payload = razorpay_order_id
      ? `${razorpay_order_id}|${razorpay_payment_id}`
      : razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(payload)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const receivedBuf = Buffer.from(razorpay_signature, 'utf8');

    const isValid =
      expectedBuf.length === receivedBuf.length &&
      crypto.timingSafeEqual(expectedBuf, receivedBuf);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        verified: false,
        error: 'Security Alert: Payment signature verification failed.'
      });
    }

    // 3. Authoritative Product & Price Resolution
    const settings = await fetchStoreSettings();
    let resolvedProductName = 'UGC NET English Complete Preparation Bundle (2026 Edition)';
    let amountPaid = 499;

    if (productId === 'gset-paper1') {
      resolvedProductName = 'GSET Paper 1: General Aptitude Foundation Pack';
      amountPaid = 149;
    } else if (productId === 'gset-paper2-english' || productId === 'gset-paper2_eng') {
      resolvedProductName = 'GSET Paper 2: English Literature Specialist Pack';
      amountPaid = 149;
    } else if (productId === 'gset-paper2-education' || productId === 'gset-paper2_edu') {
      resolvedProductName = 'GSET Paper 2: Education Discipline Master Pack';
      amountPaid = 149;
    } else if (productId === 'gset-english-combo' || productId === 'gset-combo_eng') {
      resolvedProductName = 'GSET English Scholar Duo (Paper 1 + English)';
      amountPaid = 249;
    } else if (productId === 'gset-education-combo' || productId === 'gset-combo_edu') {
      resolvedProductName = 'GSET Education Scholar Duo (Paper 1 + Education)';
      amountPaid = 249;
    } else if (amount) {
      amountPaid = Number(amount);
    }

    const finalOrderId = razorpay_order_id || orderId || `NV_${Date.now()}`;
    const accessExpiresAt = settings.accessExpiryDate || DEFAULT_ACCESS_EXPIRY;

    // 4. Grant Student Access in netvidya_users (if registered) & memory session
    let user = await findUserByEmail(cleanEmail);
    if (!user) {
      user = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: cleanName,
        email: cleanEmail,
        mobile: cleanMobile,
        is_buyer: true,
        is_active: true,
        expires_at: accessExpiresAt,
        enrolled_at: new Date().toISOString()
      };
    } else {
      user.is_buyer = true;
      user.is_active = true;
      user.expires_at = accessExpiresAt;
      if (!user.name && cleanName) user.name = cleanName;
      if (!user.mobile && cleanMobile) user.mobile = cleanMobile;
    }
    await saveUser(user);

    // 5. Issue Authenticated Session Token for Immediate Auto-Login
    const sessionToken = createSessionToken({
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      isBuyer: true,
      expiresAt: user.expires_at
    });

    // 6. Record Transaction in netvidya_buyers (Supabase + memory + test DB)
    const { dbRecorded } = (await recordPaidBuyer({
      email: cleanEmail,
      studentName: cleanName,
      mobile: cleanMobile,
      orderId: finalOrderId,
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id || null,
      amountPaid,
      productId,
      paymentMethod: 'razorpay',
      expiresAt: accessExpiresAt
    })) || { dbRecorded: false };

    // 7. Dispatch Purchase Confirmation Email
    try {
      const { sendPurchaseConfirmationEmail } = await import('./email.js');
      await sendPurchaseConfirmationEmail({
        to: cleanEmail,
        studentName: cleanName,
        orderId: finalOrderId,
        amount: amountPaid,
        paymentId: razorpay_payment_id,
        productName: resolvedProductName
      });
    } catch (emailErr) {
      console.warn('Email dispatch warning:', emailErr);
    }

    return res.status(200).json({
      success: true,
      verified: true,
      enrolled: true,
      isEnrolled: true,
      token: sessionToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        isBuyer: true,
        expiresAt: user.expires_at
      },
      buyer: {
        name: cleanName,
        email: cleanEmail,
        mobile: cleanMobile,
        orderId: finalOrderId,
        amountPaid,
        product: resolvedProductName,
        productId,
        accessValidThrough: '31 Dec 2026',
        dbRecorded
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Server error verifying payment'
    });
  }
}
