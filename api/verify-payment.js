import crypto from 'crypto';

// Sliding-window IP rate limiter: max 10 verification requests per minute per IP
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;
const ipRequestHistory = new Map();

function isRateLimited(clientIp) {
  if (!clientIp || clientIp === 'unknown') return false;
  const now = Date.now();
  const history = ipRequestHistory.get(clientIp) || [];
  const activeTimestamps = history.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);

  if (activeTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    ipRequestHistory.set(clientIp, activeTimestamps);
    return true;
  }

  activeTimestamps.push(now);
  ipRequestHistory.set(clientIp, activeTimestamps);

  // Evict old entries to prevent memory growth
  if (ipRequestHistory.size > 1000) {
    for (const [ip, list] of ipRequestHistory.entries()) {
      if (list.every(t => now - t >= RATE_LIMIT_WINDOW_MS)) {
        ipRequestHistory.delete(ip);
      }
    }
  }

  return false;
}

/**
 * Vercel Serverless Function: Cryptographic Razorpay Signature Verification
 * Validates HMAC-SHA256 signature against RAZORPAY_KEY_SECRET before license fulfillment.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const clientIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
  if (isRateLimited(clientIp)) {
    return res.status(429).json({
      success: false,
      error: 'Security Notice: Rate limit exceeded. Too many verification requests. Please wait a moment.'
    });
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

    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const receivedBuf = Buffer.from(razorpay_signature, 'utf8');

    const isValid = expectedBuf.length === receivedBuf.length && crypto.timingSafeEqual(expectedBuf, receivedBuf);

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
