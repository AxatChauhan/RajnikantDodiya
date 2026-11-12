import {
  computeCurrentServerPrice,
  DEFAULT_PAYMENT_LINK,
  DEFAULT_PAYMENT_LINK_PRICE,
  DEFAULT_STORE_SETTINGS,
  fetchStoreSettings
} from './price.js';

/**
 * Vercel Serverless Function: Create Razorpay Order
 * NET Vidya English Student Store • "GSET + UGC NET English Final Pack 2026"
 * 
 * Security Rule:
 * Price is calculated strictly on the server (₹799 early-bird or ₹999 standard).
 * Client price parameters are completely ignored.
 * Merchant descriptor: Nilam Dodiya (NET Vidya)
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { studentName, email, mobile, couponCode } = req.body || {};

    if (!studentName || !email || !mobile) {
      return res.status(400).json({
        success: false,
        error: 'Student Name, Email, and Mobile number are required.'
      });
    }

    // 1. Authoritative Server-Side Price Calculation (client price completely ignored)
    const simulatedNow = req.query?.now || req.headers?.['x-simulated-date'] || req.body?.simulatedNow;
    const settings = await fetchStoreSettings();
    const priceCalculation = computeCurrentServerPrice(settings, simulatedNow);

    // Server-enforced coupon code validation
    const VALID_COUPONS = {
      'GSET50': 50,
      'NET100': 100,
      'SCHOLAR150': 150,
      'EARLYBIRD': 50
    };
    const cleanCoupon = (couponCode || '').toString().trim().toUpperCase();
    const discount = VALID_COUPONS[cleanCoupon] || 0;
    const finalPrice = Math.max(1, priceCalculation.price - discount);
    const amountInPaisa = finalPrice * 100; // Razorpay expects amount in paise

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const rawPaymentLink =
      process.env.RAZORPAY_PAYMENT_LINK ??
      process.env.VITE_RAZORPAY_PAYMENT_LINK ??
      DEFAULT_PAYMENT_LINK;
    const paymentLinkUrl = rawPaymentLink.trim();

    const receipt = `NV_ORD_${Date.now().toString().slice(-8)}`;

    // 2. If Razorpay server API credentials exist, call Razorpay Orders API (Native In-App Checkout)
    if (keyId && keySecret) {
      const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${authHeader}`
        },
        body: JSON.stringify({
          amount: amountInPaisa,
          currency: 'INR',
          receipt,
          notes: {
            merchant: 'Nilam Dodiya (NET Vidya)',
            product: 'GSET + UGC NET English Final Pack 2026',
            seller: settings.sellerLine,
            student_name: studentName.trim(),
            email: email.trim().toLowerCase(),
            mobile: mobile.trim()
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return res.status(502).json({
          success: false,
          error: errorData.error?.description || 'Failed to initialize payment with Razorpay'
        });
      }

      const orderData = await response.json();
      return res.status(200).json({
        success: true,
        paymentMode: 'api_checkout',
        orderId: orderData.id,
        amount: priceCalculation.price,
        amountInPaisa,
        currency: 'INR',
        keyId,
        studentName,
        email,
        mobile,
        isEarlyBird: priceCalculation.isEarlyBird,
        accessExpiryDate: priceCalculation.accessExpiryDate
      });
    }

    // 3. Verified Payment Link + Webhook Mode (before live website API keys are activated)
    if (paymentLinkUrl && paymentLinkUrl !== 'disabled') {
      const linkOrderId = `order_link_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const linkAmount = Number(process.env.RAZORPAY_PAYMENT_LINK_AMOUNT || DEFAULT_PAYMENT_LINK_PRICE);
      return res.status(200).json({
        success: true,
        paymentMode: 'payment_link',
        paymentLinkUrl,
        orderId: linkOrderId,
        amount: linkAmount,
        amountInPaisa: linkAmount * 100,
        currency: 'INR',
        studentName,
        email: email.trim().toLowerCase(),
        mobile: mobile.trim(),
        isEarlyBird: priceCalculation.isEarlyBird,
        accessExpiryDate: priceCalculation.accessExpiryDate
      });
    }

    // 4. Reject unconfigured production checkouts (never expose free auto-unlocks in production)
    const isProduction = Boolean(
      process.env.VERCEL ||
      process.env.VERCEL_ENV === 'production' ||
      process.env.NODE_ENV === 'production'
    );
    if (isProduction) {
      return res.status(503).json({
        success: false,
        paymentMode: 'unconfigured',
        error: 'Payment gateway is currently being activated. Please contact +91 96387 16634 on WhatsApp for instant enrollment.'
      });
    }

    // 5. Local Development & Automated Test Fallback Order Generation
    const testOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return res.status(200).json({
      success: true,
      paymentMode: 'test_simulation',
      orderId: testOrderId,
      amount: priceCalculation.price,
      amountInPaisa,
      currency: 'INR',
      keyId: keyId || 'rzp_test_netvidya_key',
      studentName,
      email,
      mobile,
      isEarlyBird: priceCalculation.isEarlyBird,
      accessExpiryDate: priceCalculation.accessExpiryDate,
      isTestMode: true
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Server error creating order'
    });
  }
}
