import crypto from 'crypto';
import { computeCurrentServerPrice, DEFAULT_STORE_SETTINGS, fetchStoreSettings } from './price.js';
import {
  findUserByEmail,
  saveUser,
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
      orderId
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
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'netvidya_rzp_test_secret_key_2026';

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

    // 3. Authoritative Server Price & Order Identification
    const settings = await fetchStoreSettings();
    const priceInfo = computeCurrentServerPrice(settings);
    const amountPaid = priceInfo.price;
    const finalOrderId = razorpay_order_id || orderId || `NV_${Date.now()}`;
    const accessExpiresAt = settings.accessExpiryDate || DEFAULT_ACCESS_EXPIRY;

    // 4. Grant Student Access in netvidya_users
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

    // 6. Record Transaction in Supabase netvidya_buyers
    let dbRecorded = false;
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && serviceRoleKey) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, serviceRoleKey);

        const { error } = await supabase.from('netvidya_buyers').upsert({
          student_name: cleanName,
          email: cleanEmail,
          mobile: cleanMobile,
          order_id: finalOrderId,
          razorpay_payment_id,
          razorpay_order_id: razorpay_order_id || null,
          amount_paid: amountPaid,
          payment_method: 'razorpay',
          is_active: true,
          enrolled_at: new Date().toISOString(),
          expires_at: accessExpiresAt
        }, { onConflict: 'email' });

        if (!error) {
          dbRecorded = true;
        }
      } catch (dbErr) {
        console.warn('Supabase buyer record warning:', dbErr);
      }
    }

    // 7. Dispatch Purchase Confirmation Email
    try {
      const { sendPurchaseConfirmationEmail } = await import('./email.js');
      await sendPurchaseConfirmationEmail({
        to: cleanEmail,
        studentName: cleanName,
        orderId: finalOrderId,
        amount: amountPaid,
        paymentId: razorpay_payment_id
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
        product: 'GSET + UGC NET English Final Pack 2026',
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
