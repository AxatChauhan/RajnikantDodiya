/**
 * Vercel Serverless Function: Authoritative Server-Side Pricing Engine
 * NET Vidya English Student Store • "GSET + UGC NET English Final Pack 2026"
 * 
 * Price Rule:
 * - ₹799 until 10 Nov 2026, 11:59 pm IST (2026-11-10T23:59:59+05:30)
 * - ₹999 automatically thereafter
 * - Access validity: 31 Dec 2026
 */

import {
  DEFAULT_STORE_SETTINGS,
  STORE_MERCHANT,
  STORE_PAYMENT_DEFAULTS,
  GSET_PRODUCTS,
  UGC_BUNDLE_PRODUCT
} from '../../lib/store-config.js';

export const DEFAULT_PAYMENT_LINK = STORE_PAYMENT_DEFAULTS.defaultPaymentLink;
export const DEFAULT_PAYMENT_LINK_PRICE = STORE_PAYMENT_DEFAULTS.defaultPaymentLinkPrice;
export { DEFAULT_STORE_SETTINGS, GSET_PRODUCTS, UGC_BUNDLE_PRODUCT };

export function computeCurrentServerPrice(settings = DEFAULT_STORE_SETTINGS, simulatedNow = null) {
  const now = simulatedNow ? new Date(simulatedNow) : new Date();
  const cutoff = new Date(settings.earlyBirdCutoff);
  const isEarlyBird = now <= cutoff;
  const currentPrice = isEarlyBird ? settings.earlyBirdPrice : settings.standardPrice;
  const msRemaining = Math.max(0, cutoff.getTime() - now.getTime());

  return {
    price: currentPrice,
    isEarlyBird,
    earlyBirdPrice: settings.earlyBirdPrice,
    standardPrice: settings.standardPrice,
    earlyBirdCutoff: settings.earlyBirdCutoff,
    accessExpiryDate: settings.accessExpiryDate,
    msRemaining,
    serverTime: now.toISOString()
  };
}

/**
 * Fetch dynamic store settings or enforce authoritative defaults (₹499 UGC Bundle)
 */
export async function fetchStoreSettings() {
  let settings = { ...DEFAULT_STORE_SETTINGS };

  // Strict enforcement of user pricing requirements:
  // UGC NET Bundle = ₹499
  settings.earlyBirdPrice = 499;
  settings.standardPrice = 499;
  settings.productSlug = 'ugc-net-bundle';
  settings.productName = 'UGC NET English Complete Preparation Bundle (2026 Edition)';

  return settings;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  try {
    const simulatedNow = req.query?.now || req.headers?.['x-simulated-date'] || req.body?.simulatedNow;
    const settings = await fetchStoreSettings();
    const priceData = computeCurrentServerPrice(settings, simulatedNow);

    const hasApiKeys = Boolean(
      (process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID) &&
      process.env.RAZORPAY_KEY_SECRET
    );
    const rawLink = process.env.RAZORPAY_PAYMENT_LINK ?? process.env.VITE_RAZORPAY_PAYMENT_LINK ?? DEFAULT_PAYMENT_LINK;
    const paymentLinkUrl = rawLink.trim();
    const isPaymentLinkMode = !hasApiKeys && Boolean(paymentLinkUrl) && paymentLinkUrl !== 'disabled';
    const resolvedPrice = 499;

    return res.status(200).json({
      success: true,
      productSlug: settings.productSlug,
      productName: settings.productName,
      earlyBirdPrice: 499,
      standardPrice: 499,
      earlyBirdCutoff: settings.earlyBirdCutoff,
      accessExpiryDate: settings.accessExpiryDate,
      sellerLine: settings.sellerLine,
      paymentMode: hasApiKeys ? 'api_checkout' : isPaymentLinkMode ? 'payment_link' : 'unconfigured',
      ...(isPaymentLinkMode ? { paymentLinkUrl } : {}),
      paymentLinks: STORE_PAYMENT_DEFAULTS.paymentLinksByAmount,
      paymentLinksByProduct: STORE_PAYMENT_DEFAULTS.paymentLinksByProduct,
      gsetProducts: GSET_PRODUCTS,
      ugcBundle: UGC_BUNDLE_PRODUCT,
      product: {
        slug: settings.productSlug,
        name: settings.productName,
        seller: settings.sellerLine
      },
      ...priceData,
      price: resolvedPrice
    });
  } catch (err) {
    const fallback = computeCurrentServerPrice(DEFAULT_STORE_SETTINGS);
    return res.status(200).json({
      success: true,
      productSlug: DEFAULT_STORE_SETTINGS.productSlug,
      productName: DEFAULT_STORE_SETTINGS.productName,
      price: fallback.price,
      isEarlyBird: fallback.isEarlyBird,
      earlyBirdPrice: fallback.earlyBirdPrice,
      standardPrice: fallback.standardPrice,
      earlyBirdCutoff: fallback.earlyBirdCutoff,
      accessExpiryDate: fallback.accessExpiryDate,
      sellerLine: DEFAULT_STORE_SETTINGS.sellerLine,
      product: {
        slug: DEFAULT_STORE_SETTINGS.productSlug,
        name: DEFAULT_STORE_SETTINGS.productName,
        seller: DEFAULT_STORE_SETTINGS.sellerLine
      },
      ...fallback
    });
  }
}
