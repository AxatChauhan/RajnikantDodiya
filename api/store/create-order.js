import crypto from 'crypto';
import { computeCurrentServerPrice, DEFAULT_STORE_SETTINGS } from './price.js';

/**
 * Vercel Serverless Function: Create Razorpay Order
 * NET Vidya English Student Store • "GSET + UGC NET English Final Pack 2026"
 * 
 * Security Rule:
 * Price is calculated strictly on the server (₹799 early-bird or ₹999 standard).
 * Client price parameters are completely ignored.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { studentName, email, mobile } = req.body || {};

    if (!studentName || !email || !mobile) {
      return res.status(400).json({
        success: false,
        error: 'Student Name, Email, and Mobile number are required.'
      });
    }

    // 1. Authoritative Server-Side Price Calculation
    const priceCalculation = computeCurrentServerPrice(DEFAULT_STORE_SETTINGS);
    const amountInPaisa = priceCalculation.price * 100; // Razorpay expects amount in paise

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    const receipt = `NV_ORD_${Date.now().toString().slice(-8)}`;

    // 2. If Razorpay server credentials exist, call Razorpay Orders API
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
            product: 'GSET + UGC NET English Final Pack 2026',
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
        orderId: orderData.id,
        amount: priceCalculation.price,
        amountInPaisa,
        currency: 'INR',
        keyId,
        studentName,
        email,
        mobile,
        isEarlyBird: priceCalculation.isEarlyBird
      });
    }

    // 3. Test / Development Fallback Order Generation
    const testOrderId = `order_test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return res.status(200).json({
      success: true,
      orderId: testOrderId,
      amount: priceCalculation.price,
      amountInPaisa,
      currency: 'INR',
      keyId: keyId || 'rzp_test_sample',
      studentName,
      email,
      mobile,
      isEarlyBird: priceCalculation.isEarlyBird,
      isTestMode: true
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Server error creating order'
    });
  }
}
