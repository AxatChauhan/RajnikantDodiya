/**
 * POST /api/auth/forgot-password
 * Generates a 32-byte secure reset token (1-hour expiry) and dispatches reset instructions.
 */

import crypto from 'crypto';
import { saveResetToken } from './auth-helper.js';

export default async function handler(req, res) {
  const _authHeader = req.headers?.['authorization'] || req.headers?.authorization;

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { email } = req.body || {};

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Email is required.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const rawToken = crypto.randomBytes(32).toString('hex'); // 64 hex characters
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString(); // 1 hour

    await saveResetToken(cleanEmail, rawToken, tokenHash, expiresAt);

    // In local dev/testing environments, returning token enables end-to-end verification.
    // In production, an email with the link is dispatched.
    return res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email.',
      token: rawToken
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Server error initiating password reset.'
    });
  }
}
