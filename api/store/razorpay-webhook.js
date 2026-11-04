import crypto from 'crypto';

/**
 * Vercel Serverless Function: Razorpay Webhook Handler
 * Captures `payment.captured` events to fulfill student access asynchronously
 * even if the student closes their mobile browser window mid-checkout.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Verify webhook signature if secret is provided in environment
    if (webhookSecret && webhookSignature) {
      const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      const expectedBuf = Buffer.from(expectedSignature, 'utf8');
      const receivedBuf = Buffer.from(webhookSignature, 'utf8');

      if (expectedBuf.length !== receivedBuf.length || !crypto.timingSafeEqual(expectedBuf, receivedBuf)) {
        return res.status(400).json({ success: false, error: 'Invalid webhook signature' });
      }
    }

    const event = req.body?.event;
    const payment = req.body?.payload?.payment?.entity;

    if (event === 'payment.captured' && payment) {
      const notes = payment.notes || {};
      const studentName = notes.student_name || payment.description || 'Scholar';
      const email = (notes.email || payment.email || '').trim().toLowerCase();
      const mobile = (notes.mobile || payment.contact || '').trim();
      const amountPaid = payment.amount ? payment.amount / 100 : 799;

      if (email) {
        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

        if (supabaseUrl && serviceRoleKey) {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(supabaseUrl, serviceRoleKey);

          await supabase.from('netvidya_buyers').upsert({
            student_name: studentName,
            email,
            mobile,
            order_id: payment.order_id || `ORD_WH_${Date.now()}`,
            razorpay_payment_id: payment.id,
            razorpay_order_id: payment.order_id || null,
            amount_paid: amountPaid,
            payment_method: 'razorpay_webhook',
            is_active: true,
            enrolled_at: new Date().toISOString(),
            expires_at: '2026-12-31T23:59:59+05:30'
          }, { onConflict: 'email' });
        }
      }
    }

    return res.status(200).json({ status: 'ok', received: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err?.message || 'Webhook processing failed' });
  }
}
