import {
  computeCurrentServerPrice,
  DEFAULT_PAYMENT_LINK,
  DEFAULT_PAYMENT_LINK_PRICE,
  DEFAULT_STORE_SETTINGS,
  fetchStoreSettings,
  GSET_PRODUCTS,
  UGC_BUNDLE_PRODUCT
} from './price.js';
import { STORE_MERCHANT, STORE_PAYMENT_DEFAULTS } from '../../lib/store-config.js';

/**
 * Vercel Serverless Function: Create Razorpay Order
 * NET Vidya English Student Store
 * 
 * Strict Pricing Engine:
 * - GSET Single Paper Packs: ₹149 each (Paper 1, Paper 2 English, Paper 2 Education)
 * - GSET Scholar Duo Combos: ₹249 each (English Duo, Education Duo) - Max GSET price
 * - UGC NET Complete Bundle: ₹499 (all 21 CBTs + 3 Dossiers)
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { studentName, email, mobile, couponCode, productId, examStore } = req.body || {};

    if (!studentName || !email || !mobile) {
      return res.status(400).json({
        success: false,
        error: 'Student Name, Email, and Mobile number are required.'
      });
    }

    // 1. Authoritative Product & Server-Side Price Resolution
    let resolvedProduct = null;
    let basePrice = 499;
    let productName = 'UGC NET English Complete Preparation Bundle (2026 Edition)';

    if (productId === 'gset-paper1') {
      resolvedProduct = GSET_PRODUCTS.paper1;
      basePrice = 149;
      productName = GSET_PRODUCTS.paper1.name;
    } else if (productId === 'gset-paper2-english' || productId === 'gset-paper2_eng') {
      resolvedProduct = GSET_PRODUCTS.paper2_eng;
      basePrice = 149;
      productName = GSET_PRODUCTS.paper2_eng.name;
    } else if (productId === 'gset-paper2-education' || productId === 'gset-paper2_edu') {
      resolvedProduct = GSET_PRODUCTS.paper2_edu;
      basePrice = 149;
      productName = GSET_PRODUCTS.paper2_edu.name;
    } else if (productId === 'gset-english-combo' || productId === 'gset-combo_eng') {
      resolvedProduct = GSET_PRODUCTS.combo_eng;
      basePrice = 249;
      productName = GSET_PRODUCTS.combo_eng.name;
    } else if (productId === 'gset-education-combo' || productId === 'gset-combo_edu') {
      resolvedProduct = GSET_PRODUCTS.combo_edu;
      basePrice = 249;
      productName = GSET_PRODUCTS.combo_edu.name;
    } else {
      resolvedProduct = UGC_BUNDLE_PRODUCT;
      basePrice = 499;
      productName = UGC_BUNDLE_PRODUCT.name;
    }

    const settings = await fetchStoreSettings();

    // Server-enforced coupon code validation from centralized store-config
    const cleanCoupon = (couponCode || '').toString().trim().toUpperCase();
    const couponEntry = STORE_PAYMENT_DEFAULTS.validCoupons[cleanCoupon];
    const discount = couponEntry?.amount || 0;
    const finalPrice = Math.max(1, basePrice - discount);
    const amountInPaisa = finalPrice * 100; // Razorpay expects amount in paise

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Resolve dedicated product payment links (Supports both individual links and unified single-link mode)
    let targetPaymentLink = '';
    if (resolvedProduct.id === 'gset-paper2-education') {
      targetPaymentLink = (
        process.env.RAZORPAY_PAYMENT_LINK_GSET_EDU_149 ||
        process.env.VITE_RAZORPAY_PAYMENT_LINK_GSET_EDU_149 ||
        process.env.RAZORPAY_PAYMENT_LINK_GSET_149 ||
        process.env.VITE_RAZORPAY_PAYMENT_LINK_GSET_149 ||
        ''
      ).trim();
    } else if (resolvedProduct.id === 'gset-paper2-english') {
      targetPaymentLink = (
        process.env.RAZORPAY_PAYMENT_LINK_GSET_ENG_149 ||
        process.env.VITE_RAZORPAY_PAYMENT_LINK_GSET_ENG_149 ||
        process.env.RAZORPAY_PAYMENT_LINK_GSET_149 ||
        process.env.VITE_RAZORPAY_PAYMENT_LINK_GSET_149 ||
        ''
      ).trim();
    } else if (resolvedProduct.id === 'gset-paper1') {
      targetPaymentLink = (
        process.env.RAZORPAY_PAYMENT_LINK_GSET_P1_149 ||
        process.env.VITE_RAZORPAY_PAYMENT_LINK_GSET_P1_149 ||
        process.env.RAZORPAY_PAYMENT_LINK_GSET_149 ||
        process.env.VITE_RAZORPAY_PAYMENT_LINK_GSET_149 ||
        ''
      ).trim();
    } else if (resolvedProduct.id === 'gset-education-combo') {
      targetPaymentLink = (
        process.env.RAZORPAY_PAYMENT_LINK_GSET_EDU_249 ||
        process.env.VITE_RAZORPAY_PAYMENT_LINK_GSET_EDU_249 ||
        process.env.RAZORPAY_PAYMENT_LINK_GSET_249 ||
        process.env.VITE_RAZORPAY_PAYMENT_LINK_GSET_249 ||
        ''
      ).trim();
    } else if (resolvedProduct.id === 'gset-english-combo') {
      targetPaymentLink = (
        process.env.RAZORPAY_PAYMENT_LINK_GSET_ENG_249 ||
        process.env.VITE_RAZORPAY_PAYMENT_LINK_GSET_ENG_249 ||
        process.env.RAZORPAY_PAYMENT_LINK_GSET_249 ||
        process.env.VITE_RAZORPAY_PAYMENT_LINK_GSET_249 ||
        ''
      ).trim();
    } else if (basePrice === 149) {
      targetPaymentLink = (process.env.RAZORPAY_PAYMENT_LINK_GSET_149 || process.env.VITE_RAZORPAY_PAYMENT_LINK_GSET_149 || '').trim();
    } else if (basePrice === 249) {
      targetPaymentLink = (process.env.RAZORPAY_PAYMENT_LINK_GSET_249 || process.env.VITE_RAZORPAY_PAYMENT_LINK_GSET_249 || '').trim();
    } else {
      const rawPaymentLink =
        process.env.RAZORPAY_PAYMENT_LINK ??
        process.env.VITE_RAZORPAY_PAYMENT_LINK ??
        DEFAULT_PAYMENT_LINK;
      targetPaymentLink = (rawPaymentLink || '').trim();
    }

    const receipt = `NV_${Date.now().toString().slice(-8)}`;

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
            product: productName,
            product_id: resolvedProduct.id,
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
        productId: resolvedProduct.id,
        productName,
        amount: finalPrice,
        amountInPaisa,
        currency: 'INR',
        keyId,
        studentName,
        email,
        mobile,
        accessExpiryDate: '2026-12-31T23:59:59+05:30'
      });
    }

    // 3. Payment Link Mode: If a valid payment link exists for this product/price
    if (targetPaymentLink && targetPaymentLink !== 'disabled') {
      const linkOrderId = `order_link_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      let finalLinkUrl = targetPaymentLink;
      try {
        const u = new URL(targetPaymentLink);
        if (studentName && !u.searchParams.has('name')) u.searchParams.set('name', studentName.trim());
        if (email && !u.searchParams.has('email')) u.searchParams.set('email', email.trim().toLowerCase());
        if (mobile && !u.searchParams.has('contact')) u.searchParams.set('contact', mobile.trim());
        if (!u.searchParams.has('notes[product_id]')) u.searchParams.set('notes[product_id]', resolvedProduct.id);
        if (!u.searchParams.has('notes[product_name]')) u.searchParams.set('notes[product_name]', productName);
        finalLinkUrl = u.toString();
      } catch {
        finalLinkUrl = targetPaymentLink;
      }

      return res.status(200).json({
        success: true,
        paymentMode: 'payment_link',
        paymentLinkUrl: finalLinkUrl,
        orderId: linkOrderId,
        productId: resolvedProduct.id,
        productName,
        amount: finalPrice,
        amountInPaisa,
        currency: 'INR',
        studentName,
        email: email.trim().toLowerCase(),
        mobile: mobile.trim(),
        accessExpiryDate: '2026-12-31T23:59:59+05:30'
      });
    }

    // 4. If this is GSET and no specific payment link or API key is set yet:
    // DO NOT charge ₹499! Instead, provide direct WhatsApp connection with Dr. Rajnikant Dodiya / Nilam Dodiya for instant enrollment link
    if (basePrice !== 499) {
      const pendingOrderId = `NV_GSET_${Date.now()}`;
      const waMsg = encodeURIComponent(
        `Hello Dr. Rajnikant Dodiya, I want to enroll in ${productName} (₹${finalPrice}).\n` +
        `Candidate Name: ${studentName.trim()}\n` +
        `Email: ${email.trim()}\n` +
        `Mobile: ${mobile.trim()}\n` +
        `Please share the GSET payment link for ₹${finalPrice}.`
      );
      const whatsappUrl = `https://wa.me/919638716634?text=${waMsg}`;

      return res.status(200).json({
        success: true,
        paymentMode: 'gset_manual_contact',
        orderId: pendingOrderId,
        productId: resolvedProduct.id,
        productName,
        amount: finalPrice,
        amountInPaisa,
        currency: 'INR',
        studentName,
        email: email.trim().toLowerCase(),
        mobile: mobile.trim(),
        whatsappUrl,
        whatsappNumber: '+91 96387 16634',
        message: `Your GSET registration for ${productName} (₹${finalPrice}) is registered. Click below to connect on WhatsApp (+91 96387 16634) for your instant payment link.`
      });
    }

    // 5. Reject unconfigured production checkouts for UGC if link is disabled
    const isProduction = Boolean(
      process.env.VERCEL ||
      process.env.VERCEL_ENV === 'production' ||
      process.env.NODE_ENV === 'production'
    );
    if (isProduction && !targetPaymentLink) {
      return res.status(503).json({
        success: false,
        paymentMode: 'unconfigured',
        error: 'Payment gateway is currently being activated. Please contact +91 96387 16634 on WhatsApp for instant enrollment.'
      });
    }

    // 6. Local Development & Automated Test Fallback
    const testOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return res.status(200).json({
      success: true,
      paymentMode: 'test_simulation',
      orderId: testOrderId,
      productId: resolvedProduct.id,
      productName,
      amount: finalPrice,
      amountInPaisa,
      currency: 'INR',
      keyId: keyId || 'rzp_test_netvidya_key',
      studentName,
      email,
      mobile,
      accessExpiryDate: '2026-12-31T23:59:59+05:30',
      isTestMode: true
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Server error creating order'
    });
  }
}
