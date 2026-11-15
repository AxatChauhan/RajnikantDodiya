/**
 * NET Vidya English Student Store • Transactional Email Module
 * Handles purchase confirmations and administrative notifications.
 * Provides fallback simulation logger when external delivery credentials are not set.
 */

import nodemailer from 'nodemailer';
import { STORE_MERCHANT, DEFAULT_STORE_SETTINGS } from '../../lib/store-config.js';

let cachedGmailTransporter = null;
function getGmailTransporter() {
  const user = (process.env.GMAIL_USER || '').trim();
  const rawPass = (process.env.GMAIL_APP_PASSWORD || '').trim();
  if (!user || !rawPass) return null;
  const pass = rawPass.replace(/\s+/g, '');
  if (!cachedGmailTransporter) {
    cachedGmailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass
      }
    });
  }
  return { transporter: cachedGmailTransporter, user };
}

export const SENDER_INFO = {
  name: `${STORE_MERCHANT.storeTitle} (${STORE_MERCHANT.proprietor})`,
  email: process.env.GMAIL_USER || STORE_MERCHANT.supportEmail,
  replyTo: STORE_MERCHANT.supportEmail
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
  productName = DEFAULT_STORE_SETTINGS.productName,
  dashboardUrl = STORE_MERCHANT.dashboardUrl
}) {
  const cleanEmail = (to || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    console.warn('[EMAIL] Skipped sending confirmation: invalid recipient email', to);
    return { success: false, error: 'Invalid recipient email' };
  }

  const cleanProductName = productName || DEFAULT_STORE_SETTINGS.productName;
  const subject = `Purchase Confirmation: ${cleanProductName} (${orderId})`;

  const textContent = `
Dear ${studentName},

Thank you for enrolling in ${cleanProductName}!
Your payment of ₹${amount} (Payment ID: ${paymentId}) has been successfully verified.

Order ID: ${orderId}
Product: ${cleanProductName}
Access Validity: Through ${STORE_MERCHANT.accessExpiryLabel}
${STORE_MERCHANT.sellerLine}

You can access your reading materials and test hall at your student dashboard:
${dashboardUrl}

Need assistance? Contact our student support at ${STORE_MERCHANT.supportEmail}.

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
      <h1 style="margin: 0; font-size: 22px;">${STORE_MERCHANT.storeTitle}</h1>
      <p style="margin: 6px 0 0; font-size: 14px; color: #93c5fd;">${cleanProductName}</p>
    </div>
    
    <div style="padding: 24px;">
      <p>Dear <strong>${studentName}</strong>,</p>
      <p>Thank you for enrolling! Your payment has been successfully verified and your digital student pass is now active.</p>
      
      <div style="background-color: #f1f5f9; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #0f172a; font-size: 15px;">Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Enrolled Course:</td>
            <td style="padding: 6px 0; font-weight: bold; text-align: right;">${cleanProductName}</td>
          </tr>
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
            <td style="padding: 6px 0; font-weight: bold; text-align: right;">Through ${STORE_MERCHANT.accessExpiryLabel}</td>
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
      <p style="margin: 0;">${STORE_MERCHANT.sellerLine}</p>
      <p style="margin: 4px 0 0;">For inquiries, email <a href="mailto:${STORE_MERCHANT.supportEmail}" style="color: #2563eb;">${STORE_MERCHANT.supportEmail}</a></p>
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
    // 1. Try Gmail SMTP if GMAIL_USER & GMAIL_APP_PASSWORD are configured
    const gmailAuth = getGmailTransporter();
    if (gmailAuth) {
      try {
        const info = await gmailAuth.transporter.sendMail({
          from: `"${STORE_MERCHANT.storeTitle}" <${gmailAuth.user}>`,
          to,
          replyTo: STORE_MERCHANT.supportEmail || gmailAuth.user,
          subject,
          text,
          html
        });
        console.log(`[EMAIL] Successfully dispatched via Gmail SMTP to ${to} (Message ID: ${info.messageId})`);
        return { success: true, messageId: info.messageId, provider: 'gmail' };
      } catch (err) {
        console.warn('[EMAIL] Gmail SMTP dispatch failed, trying next provider:', err?.message || err);
      }
    }

    // 2. Try Resend if RESEND_API_KEY is configured
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

    // 3. Fallback Simulation Logger
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

/**
 * Send password reset email containing secure reset link and optional 6-digit OTP code.
 */
export async function sendPasswordResetEmail({
  to,
  resetToken,
  otpCode = '',
  websiteUrl = STORE_MERCHANT.websiteUrl
}) {
  const cleanEmail = (to || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'Invalid recipient email' };
  }
  const resetLink = `${websiteUrl}/#reset-password?token=${encodeURIComponent(resetToken)}`;
  const subject = otpCode
    ? `Password Reset Code (${otpCode}) - ${STORE_MERCHANT.storeTitle}`
    : `Password Reset Request - ${STORE_MERCHANT.storeTitle}`;
  const textContent = `
Dear Student,

We received a request to reset your password for your ${STORE_MERCHANT.storeTitle} student account.

${otpCode ? `Your 6-Digit Password Reset Code: ${otpCode}\n\n` : ''}You can reset your password using the secure link below:
${resetLink}

This password reset code and link are valid for 1 hour. If you did not request this, you can safely ignore this email.

Best regards,
${STORE_MERCHANT.storeTitle} Team
`.trim();

  const htmlContent = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 24px;">
    <h2 style="color: #1e3a8a; margin-top: 0;">Password Reset Request</h2>
    <p>Dear Student,</p>
    <p>We received a request to reset your password for your <strong>${STORE_MERCHANT.storeTitle}</strong> account.</p>
    ${
      otpCode
        ? `<div style="background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 14px; margin: 18px 0; text-align: center;">
            <div style="font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase;">Your 6-Digit Reset Code</div>
            <div style="font-family: monospace; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #1e3a8a; margin-top: 4px;">${otpCode}</div>
          </div>`
        : ''
    }
    <div style="margin: 24px 0; text-align: center;">
      <a href="${resetLink}" style="background-color: #1e3a8a; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Reset My Password</a>
    </div>
    <p style="font-size: 13px; color: #64748b;">Or copy this link into your browser:<br><a href="${resetLink}" style="color: #2563eb; word-break: break-all;">${resetLink}</a></p>
    <p style="font-size: 12px; color: #94a3b8; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px;">This link and code expire in 60 minutes. If you did not request a password reset, no action is needed.</p>
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
 * Send 6-digit email verification OTP to candidate.
 * Used for:
 * 1. Initial account registration / signup
 * 2. First-time login verification
 * 3. Password reset request
 */
export async function sendOtpEmail({
  to,
  otp,
  studentName = 'Candidate',
  purpose = 'signup' // 'signup' | 'first_login' | 'reset_password'
}) {
  const cleanEmail = (to || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'Invalid recipient email' };
  }

  let purposeTitle = 'Email Verification';
  let purposeDesc = 'to verify that your email address is genuine and activate your student account.';
  let subject = `Your NET Vidya Verification Code: ${otp}`;

  if (purpose === 'first_login') {
    purposeTitle = 'First-Time Login Verification';
    purposeDesc = 'to verify your identity and complete your first-time login.';
    subject = `Your NET Vidya Login Verification Code: ${otp}`;
  } else if (purpose === 'reset_password') {
    purposeTitle = 'Password Reset Code';
    purposeDesc = 'to verify your request and reset your password.';
    subject = `Your NET Vidya Password Reset Code: ${otp}`;
  }

  const textContent = `
Dear ${studentName},

Your 6-digit verification code for ${STORE_MERCHANT.storeTitle} is:

${otp}

This code is required ${purposeDesc}
It is valid for 10 minutes. Please enter this code in the portal to continue.

If you did not request this verification code, please ignore this email or contact support at ${STORE_MERCHANT.supportEmail}.

Best regards,
${STORE_MERCHANT.storeTitle}
Dr. Rajnikant Dodiya
`.trim();

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${purposeTitle}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; padding: 24px; margin: 0;">
  <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background-color: #1e3a8a; padding: 24px 28px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">${STORE_MERCHANT.storeTitle}</h1>
      <p style="margin: 6px 0 0; font-size: 13px; color: #93c5fd;">UGC NET & GSET English Preparation Portal</p>
    </div>
    
    <div style="padding: 28px 24px;">
      <p style="font-size: 15px; margin-top: 0;">Dear <strong>${studentName}</strong>,</p>
      <p style="font-size: 14px; color: #475569;">Please use the 6-digit verification code below ${purposeDesc}</p>
      
      <div style="background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 10px; padding: 18px; margin: 24px 0; text-align: center;">
        <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #1e3a8a; display: inline-block;">${otp}</span>
        <div style="font-size: 12px; color: #64748b; margin-top: 8px; font-weight: 500;">Valid for 10 minutes • Single-use code</div>
      </div>

      <p style="font-size: 13px; color: #64748b; line-height: 1.5;">Enter this code on the verification screen to proceed. If you did not request this verification, no action is needed.</p>

      <div style="border-top: 1px solid #f1f5f9; margin-top: 24px; padding-top: 16px; font-size: 12px; color: #94a3b8; text-align: center;">
        Need help? Contact support at <a href="mailto:${STORE_MERCHANT.supportEmail}" style="color: #2563eb; text-decoration: none;">${STORE_MERCHANT.supportEmail}</a>
      </div>
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

export default {
  sendPurchaseConfirmationEmail,
  sendPasswordResetEmail,
  sendOtpEmail,
  sendEmail,
  SENDER_INFO
};
