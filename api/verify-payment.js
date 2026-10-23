import crypto from 'crypto';

/**
 * Vercel Serverless Function: Cryptographic Razorpay Signature Verification
 * Validates HMAC-SHA256 signature against RAZORPAY_KEY_SECRET before license fulfillment.
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
      order_id
    } = req.body || {};

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      return res.status(500).json({
        success: false,
        error: 'RAZORPAY_KEY_SECRET is not configured on server environment.'
      });
    }

    if (!razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing required Razorpay payment verification parameters.'
      });
    }

    // Cryptographic signature check: HMAC-SHA256(order_id + '|' + payment_id, secret)
    const payload = razorpay_order_id
      ? `${razorpay_order_id}|${razorpay_payment_id}`
      : razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(payload)
      .digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(razorpay_signature)
    );

    if (!isValid) {
      return res.status(400).json({
        success: false,
        verified: false,
        error: 'Security Alert: Razorpay signature mismatch. Payment tampering detected.'
      });
    }

    return res.status(200).json({
      success: true,
      verified: true,
      paymentId: razorpay_payment_id,
      orderId: order_id
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Server payment verification error'
    });
  }
}
