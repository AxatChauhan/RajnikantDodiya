import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let val = (match[2] || '').trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  });
}

import { sendEmail, sendPasswordResetEmail, sendPurchaseConfirmationEmail } from '../api/store/email.js';

console.log('=== TESTING GMAIL SMTP LIVE DISPATCH ===');
console.log('Sender Email:', process.env.GMAIL_USER);
console.log('Has App Password:', Boolean(process.env.GMAIL_APP_PASSWORD));

async function run() {
  const targetEmail = process.env.GMAIL_USER;
  console.log(`Sending live verification email to: ${targetEmail}...`);

  const result = await sendEmail({
    to: targetEmail,
    subject: '✅ NET Vidya English - Gmail SMTP Integration Verified',
    text: 'Congratulations! Your Gmail SMTP integration is working successfully for NET Vidya English.',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #10b981; border-radius: 8px;">
        <h2 style="color: #047857; margin-top: 0;">🎉 Gmail SMTP Verification Successful!</h2>
        <p>This email confirms that <strong>${targetEmail}</strong> is configured and operational.</p>
        <p>Transactional emails (order confirmations, password reset links, course notifications) will now be delivered via Gmail SMTP directly to students.</p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 15px 0;">
        <small style="color: #6b7280;">Sent by NET Vidya English Platform • Sardar Patel University</small>
      </div>
    `
  });

  console.log('Result:', result);
  if (result.success && result.provider === 'gmail') {
    console.log('🎉 SUCCESS: Live email delivered via Gmail SMTP!');
    process.exit(0);
  } else {
    console.error('❌ FAILED: Email was not sent via Gmail SMTP', result);
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
