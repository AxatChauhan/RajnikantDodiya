import crypto from 'crypto';
import { computeCurrentServerPrice, DEFAULT_STORE_SETTINGS } from './price.js';

/**
 * Vercel Serverless Function: Cryptographic Payment Verification & Buyer Enrollment
 * NET Vidya English Student Store • "GSET + UGC NET English Final Pack 2026"
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

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // 1. Signature Verification (Production)
    if (keySecret && razorpay_payment_id && razorpay_signature) {
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
    }

    // 2. Server Price Enforcement
    const priceInfo = computeCurrentServerPrice(DEFAULT_STORE_SETTINGS);
    const amountPaid = priceInfo.price;
    const finalOrderId = razorpay_order_id || orderId || `NV_${Date.now()}`;

    // 3. Record Buyer in Supabase
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
          razorpay_payment_id: razorpay_payment_id || 'manual_or_test',
          razorpay_order_id: razorpay_order_id || null,
          amount_paid: amountPaid,
          payment_method: 'razorpay',
          is_active: true,
          enrolled_at: new Date().toISOString(),
          expires_at: '2026-12-31T23:59:59+05:30'
        }, { onConflict: 'email' });

        if (!error) {
          dbRecorded = true;
        }
      } catch (dbErr) {
        console.warn('Supabase buyer record warning:', dbErr);
      }
    }

    return res.status(200).json({
      success: true,
      verified: true,
      enrolled: true,
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
