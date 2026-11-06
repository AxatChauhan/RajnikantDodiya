/**
 * GET /api/auth/me
 * Validates Authorization: Bearer <token> and returns the student profile.
 */

import {
  extractBearerToken,
  verifySessionToken,
  findUserByEmail,
  isEmailBuyer,
  DEFAULT_ACCESS_EXPIRY
} from './auth-helper.js';

export default async function handler(req, res) {
  const token = extractBearerToken(req);
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: valid token required.'
    });
  }

  const payload = verifySessionToken(token);
  if (!payload || !payload.email) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: valid token required.'
    });
  }

  try {
    const user = await findUserByEmail(payload.email);
    const isBuyer = user ? (user.is_buyer || await isEmailBuyer(user.email)) : payload.isBuyer;

    return res.status(200).json({
      success: true,
      user: {
        id: user?.id || payload.id || `usr_${payload.email}`,
        name: user?.name || payload.name || payload.email.split('@')[0],
        email: user?.email || payload.email,
        mobile: user?.mobile || payload.mobile || '',
        isBuyer: Boolean(isBuyer),
        expiresAt: user?.expires_at || payload.expiresAt || DEFAULT_ACCESS_EXPIRY
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Server error verifying session profile.'
    });
  }
}
