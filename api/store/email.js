/**
 * NET Vidya English Student Store • Transactional Email Module
 * Handles purchase confirmations and administrative notifications.
 * Provides fallback simulation logger when external delivery credentials are not set.
 */

export const SENDER_INFO = {
  name: 'NET Vidya English (Nilam Dodiya)',
  email: 'netvidyaenglish@gmail.com',
  replyTo: 'netvidyaenglish@gmail.com'
};

/**
 * Send purchase confirmation email containing student dashboard link (/#dashboard).
 * Isolates delivery errors so they never block or fail checkout.
 */
export async function sendPurchaseConfirmationEmail({
  to,
  studentName = 'Student',
  orderId = '',
  amount = 799,
  paymentId = '',
  dashboardUrl = 'https://store.rajnikantdodiya.com/#dashboard'
}) {
  const cleanEmail = (to || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    console.warn('[EMAIL] Skipped sending confirmation: invalid recipient email', to);
    return { success: false, error: 'Invalid recipient email' };
  }

  const subject = `Purchase Confirmation: GSET + UGC NET English Final Pack 2026 (${orderId})`;

  const textContent = `
Dear ${studentName},

Thank you for enrolling in the GSET + UGC NET English Final Pack 2026!
Your payment of ₹${amount} (Payment ID: ${paymentId}) has been successfully verified.

Order ID: ${orderId}
Product: GSET + UGC NET English Final Pack 2026
Access Validity: Through 31 Dec 2026
Sold by: NET Vidya (proprietor: Nilam Dodiya). Content by Dr Rajnikant Dodiya.

You can access your reading materials and test hall at your student dashboard:
${dashboardUrl}

Need assistance? Contact our student support at netvidyaenglish@gmail.com.

Best wishes for your preparation,
NET Vidya English Team
`.trim();

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Purchase Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
    <div style="background-color: #1e3a8a; padding: 24px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 22px;">NET Vidya English</h1>
      <p style="margin: 6px 0 0; font-size: 14px; color: #93c5fd;">GSET + UGC NET English Final Pack 2026</p>
    </div>
    
    <div style="padding: 24px;">
      <p>Dear <strong>${studentName}</strong>,</p>
      <p>Thank you for enrolling! Your payment has been successfully verified and your digital student pass is now active.</p>
      
      <div style="background-color: #f1f5f9; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #0f172a; font-size: 15px;">Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Order Reference:</td>
            <td style="padding: 6px 0; font-weight: bold; text-align: right;">${orderId}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Payment ID:</td>
            <td style="padding: 6px 0; font-weight: bold; text-align: right;">${paymentId}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Amount Paid:</td>
            <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #1e3a8a;">₹${amount}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Access Validity:</td>
            <td style="padding: 6px 0; font-weight: bold; text-align: right;">Through 31 Dec 2026</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${dashboardUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">
          Open Student Dashboard
        </a>
      </div>

      <p style="font-size: 13px; color: #64748b;">
        If the button above does not work, copy and paste this link into your browser:<br>
        <a href="${dashboardUrl}" style="color: #2563eb;">${dashboardUrl}</a>
      </p>
    </div>

    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; font-size: 12px; color: #64748b; text-align: center;">
      <p style="margin: 0;">Sold by NET Vidya (proprietor: Nilam Dodiya). Content by Dr Rajnikant Dodiya.</p>
      <p style="margin: 4px 0 0;">For inquiries, email <a href="mailto:netvidyaenglish@gmail.com" style="color: #2563eb;">netvidyaenglish@gmail.com</a></p>
    </div>
  </div>
</body>
</html>
`.trim();

  return sendEmail({
    to: cleanEmail,
    subject,
    text: textContent,
    html: htmlContent
  });
}

/**
 * Core send email function with provider fallback
 */
export async function sendEmail({ to, subject, html, text }) {
  try {
    // 1. Try Resend if RESEND_API_KEY is configured
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`
          },
          body: JSON.stringify({
            from: `${SENDER_INFO.name} <${SENDER_INFO.email}>`,
            to: [to],
            subject,
            html,
            text
          })
        });
        if (response.ok) {
          const data = await response.json().catch(() => ({}));
          return { success: true, messageId: data.id, provider: 'resend' };
        }
      } catch (err) {
        console.warn('[EMAIL] Resend dispatch failed, falling back to simulator:', err);
      }
    }

    // 2. Fallback Simulation Logger
    const simMessageId = `sim_msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    console.log(`[NET VIDYA EMAIL SIMULATOR] Dispatching Email:
  ID: ${simMessageId}
  To: ${to}
  From: ${SENDER_INFO.name} <${SENDER_INFO.email}>
  Subject: ${subject}
  Timestamp: ${new Date().toISOString()}
--------------------------------------------------------------------------------`);

    return {
      success: true,
      simulated: true,
      messageId: simMessageId
    };
  } catch (err) {
    // Crucial: Email failure must never crash or throw to caller
    console.error('[EMAIL] Unhandled error during email dispatch:', err);
    return {
      success: false,
      error: err?.message || 'Email dispatch failed'
    };
  }
}

export default {
  sendPurchaseConfirmationEmail,
  sendEmail,
  SENDER_INFO
};
