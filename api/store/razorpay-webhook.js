import crypto from 'crypto';
import { findUserByEmail, saveUser, DEFAULT_ACCESS_EXPIRY } from '../../lib/auth-helper.js';

/**
 * Vercel Serverless Function: Razorpay Webhook Handler
 * Captures `payment.captured` events to fulfill student access asynchronously
 * even if the student closes their mobile browser window mid-checkout.
 * 
 * Reliability Rule:
 * Strictly verifies HMAC-SHA256 signature using RAZORPAY_WEBHOOK_SECRET.
 * Automatically grants buyer privileges in netvidya_users and netvidya_buyers.
 * Dispatches purchase confirmation email with dashboard access link.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'netvidya_wh_test_secret_key_2026';

    // 1. Verify webhook signature if secret is provided in environment
    if (webhookSecret) {
      if (!webhookSignature) {
        return res.status(400).json({ success: false, error: 'Missing webhook signature header' });
      }

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

    // 2. Process payment.captured event
    if (event === 'payment.captured' && payment) {
      const notes = payment.notes || {};
      const studentName = notes.student_name || notes.name || payment.description || 'Scholar';
      const email = (notes.email || payment.email || '').trim().toLowerCase();
      const mobile = (notes.mobile || notes.contact || payment.contact || '').trim();
      const amountPaid = payment.amount ? payment.amount / 100 : 799;
      const orderId = payment.order_id || `ORD_WH_${Date.now()}`;
      const expiresAt = '2026-12-31T23:59:59+05:30';

      if (email) {
        // 2a. Update or create user in netvidya_users
        let user = await findUserByEmail(email);
        if (!user) {
          user = {
            id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: studentName,
            email,
            mobile,
            is_buyer: true,
            is_active: true,
            expires_at: expiresAt,
            enrolled_at: new Date().toISOString()
          };
        } else {
          user.is_buyer = true;
          user.is_active = true;
          user.expires_at = expiresAt;
          if (!user.name && studentName) user.name = studentName;
          if (!user.mobile && mobile) user.mobile = mobile;
        }
        await saveUser(user);

        // 2b. Record transaction in netvidya_buyers
        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

        if (supabaseUrl && serviceRoleKey) {
          try {
            const { createClient } = await import('@supabase/supabase-js');
            const supabase = createClient(supabaseUrl, serviceRoleKey);

            await supabase.from('netvidya_buyers').upsert({
              student_name: studentName,
              email,
              mobile,
              order_id: orderId,
              razorpay_payment_id: payment.id,
              razorpay_order_id: payment.order_id || null,
              amount_paid: amountPaid,
              payment_method: 'razorpay_webhook',
              is_active: true,
              enrolled_at: new Date().toISOString(),
              expires_at: expiresAt
            }, { onConflict: 'email' });
          } catch (dbErr) {
            console.warn('Webhook Supabase upsert error:', dbErr);
          }
        }

        // 2c. Send Purchase Confirmation Email
        try {
          const { sendPurchaseConfirmationEmail } = await import('./email.js');
          await sendPurchaseConfirmationEmail({
            to: email,
            studentName,
            orderId,
            amount: amountPaid,
            paymentId: payment.id
          });
        } catch (emailErr) {
          console.warn('Webhook email dispatch error:', emailErr);
        }
      }
    }

    return res.status(200).json({ status: 'ok', received: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err?.message || 'Webhook processing failed' });
  }
}
