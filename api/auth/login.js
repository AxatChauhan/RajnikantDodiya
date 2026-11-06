/**
 * POST /api/auth/login
 * Validates student credentials and returns an HMAC-SHA256 signed session token.
 */

import {
  verifyPassword,
  createSessionToken,
  findUserByEmail,
  isEmailBuyer,
  saveUser
} from './auth-helper.js';

export default async function handler(req, res) {
  const _authHeader = req.headers?.['authorization'] || req.headers?.authorization;

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body || {};

    if (!email || !password || typeof password !== 'string' || password.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Email and password required.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Look up user
    const user = await findUserByEmail(cleanEmail);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.'
      });
    }

    // Verify password
    const isPasswordValid = verifyPassword(password, user.password_salt, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.'
      });
    }

    // Check if buyer status has changed (e.g., webhook captured payment while user was offline)
    const isBuyer = user.is_buyer || await isEmailBuyer(cleanEmail);
    if (isBuyer !== user.is_buyer) {
      user.is_buyer = isBuyer;
      await saveUser(user);
    }

    const token = createSessionToken({
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      isBuyer: user.is_buyer,
      expiresAt: user.expires_at
    });

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        isBuyer: user.is_buyer,
        expiresAt: user.expires_at
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Server error during sign in.'
    });
  }
}
