/**
 * Vercel Serverless Function: Authoritative Server-Side Pricing Engine
 * NET Vidya English Student Store • "GSET + UGC NET English Final Pack 2026"
 * 
 * Price Rule:
 * - ₹799 until 10 Nov 2026, 11:59 pm IST (2026-11-10T23:59:59+05:30)
 * - ₹999 automatically thereafter
 * - Access validity: 31 Dec 2026
 */

export const DEFAULT_PAYMENT_LINK = 'https://rzp.io/rzp/locBUA0o';
export const DEFAULT_PAYMENT_LINK_PRICE = 799;

export const DEFAULT_STORE_SETTINGS = {
  productSlug: 'final-pack-2026',
  productName: 'GSET + UGC NET English Final Pack 2026',
  earlyBirdPrice: 799,
  standardPrice: 999,
  earlyBirdCutoff: '2026-11-10T23:59:59+05:30',
  accessExpiryDate: '2026-12-31T23:59:59+05:30',
  sellerLine: 'Sold by NET Vidya (proprietor: Nilam Dodiya). Content by Dr Rajnikant Dodiya.',
  supportEmail: 'netvidyaenglish@gmail.com',
  supportPhone: '+91 96387 16634'
};

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
 * Fetch dynamic store settings from Supabase netvidya_store_settings or fallback to DEFAULT_STORE_SETTINGS
 */
export async function fetchStoreSettings() {
  let settings = { ...DEFAULT_STORE_SETTINGS };

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (supabaseUrl && anonKey) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, anonKey);
      const { data } = await supabase
        .from('netvidya_store_settings')
        .select('*')
        .eq('id', 'current_pack')
        .maybeSingle();

      if (data) {
        settings.earlyBirdPrice = Number(data.early_bird_price) || 799;
        settings.standardPrice = Number(data.standard_price) || 999;
        if (data.early_bird_cutoff) settings.earlyBirdCutoff = data.early_bird_cutoff;
        if (data.access_expiry_date) settings.accessExpiryDate = data.access_expiry_date;
        if (data.product_name) settings.productName = data.product_name;
        if (data.product_slug) settings.productSlug = data.product_slug;
      }
    } catch {
      // Fallback to strict defaults
    }
  }

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
    const resolvedPrice =
      !simulatedNow && isPaymentLinkMode
        ? Number(process.env.RAZORPAY_PAYMENT_LINK_AMOUNT || DEFAULT_PAYMENT_LINK_PRICE)
        : priceData.price;

    return res.status(200).json({
      success: true,
      productSlug: settings.productSlug,
      productName: settings.productName,
      earlyBirdPrice: settings.earlyBirdPrice,
      standardPrice: settings.standardPrice,
      earlyBirdCutoff: settings.earlyBirdCutoff,
      accessExpiryDate: settings.accessExpiryDate,
      sellerLine: settings.sellerLine,
      paymentMode: hasApiKeys ? 'api_checkout' : isPaymentLinkMode ? 'payment_link' : 'unconfigured',
      ...(isPaymentLinkMode ? { paymentLinkUrl } : {}),
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
