/**
 * POST /api/auth/reset-password
 * Validates reset token and updates the student password.
 */

import {
  findResetToken,
  invalidateResetToken,
  hashPassword,
  updateUserPassword
} from './auth-helper.js';

export default async function handler(req, res) {
  const _authHeader = req.headers?.['authorization'] || req.headers?.authorization;

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { token, newPassword } = req.body || {};

    if (!token || !newPassword || typeof newPassword !== 'string' || newPassword.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Token and new password required.'
      });
    }

    const tokenRecord = await findResetToken(token);
    if (!tokenRecord) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token.'
      });
    }

    const expiresAt = new Date(tokenRecord.expiresAt).getTime();
    if (Date.now() > expiresAt) {
      await invalidateResetToken(token);
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token.'
      });
    }

    // Hash new password
    const { salt, hash } = hashPassword(newPassword);
    await updateUserPassword(tokenRecord.email, hash, salt);

    // Invalidate token immediately to prevent replay attacks
    await invalidateResetToken(token);

    return res.status(200).json({
      success: true,
      message: 'Password reset successful.'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Server error resetting password.'
    });
  }
}
