/**
 * POST /api/auth/signup
 * Registers a new student account using email, password, name, and mobile.
 * Generates an HMAC-SHA256 signed session token.
 */

import crypto from 'crypto';
import {
  hashPassword,
  createSessionToken,
  findUserByEmail,
  isEmailBuyer,
  saveUser,
  DEFAULT_ACCESS_EXPIRY
} from './auth-helper.js';

export default async function handler(req, res) {
  // Support Bearer authorization check inspection
  const _authHeader = req.headers?.['authorization'] || req.headers?.authorization;

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { name, email, mobile, password } = req.body || {};

    if (!name || !email || !password || typeof password !== 'string' || password.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and password are required.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format.'
      });
    }

    // Check if user already exists
    const existing = await findUserByEmail(cleanEmail);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Account with this email already exists.'
      });
    }

    // Check buyer entitlement (e.g. purchased as guest or webhook already fired)
    const isBuyer = await isEmailBuyer(cleanEmail);

    const { salt, hash } = hashPassword(password);
    const userId = `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const newUser = {
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      mobile: (mobile || '').toString().trim(),
      password_hash: hash,
      password_salt: salt,
      is_buyer: isBuyer,
      is_active: true,
      enrolled_at: isBuyer ? new Date().toISOString() : null,
      expires_at: DEFAULT_ACCESS_EXPIRY,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await saveUser(newUser);

    const token = createSessionToken({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      mobile: newUser.mobile,
      isBuyer: newUser.is_buyer,
      expiresAt: newUser.expires_at
    });

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        mobile: newUser.mobile,
        isBuyer: newUser.is_buyer,
        expiresAt: newUser.expires_at
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Server error during registration.'
    });
  }
}
