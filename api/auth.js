/**
 * Unified Student Authentication API Route
 * Handles: /api/auth/signup, /api/auth/login, /api/auth/me,
 *          /api/auth/forgot-password, /api/auth/reset-password
 */

import crypto from 'crypto';
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
  extractBearerToken,
  findUserByEmail,
  isEmailBuyer,
  saveUser,
  saveResetToken,
  findResetToken,
  invalidateResetToken,
  updateUserPassword,
  DEFAULT_ACCESS_EXPIRY
} from '../lib/auth-helper.js';

export async function signupHandler(req, res) {
  if (!req.query) req.query = {};
  req.query.action = 'signup';
  return handler(req, res);
}

export async function loginHandler(req, res) {
  if (!req.query) req.query = {};
  req.query.action = 'login';
  return handler(req, res);
}

export async function meHandler(req, res) {
  if (!req.query) req.query = {};
  req.query.action = 'me';
  return handler(req, res);
}

export async function forgotPasswordHandler(req, res) {
  if (!req.query) req.query = {};
  req.query.action = 'forgot-password';
  return handler(req, res);
}

export async function resetPasswordHandler(req, res) {
  if (!req.query) req.query = {};
  req.query.action = 'reset-password';
  return handler(req, res);
}

export default async function handler(req, res) {
  // Support Bearer authorization check inspection
  const _authHeader = req.headers?.['authorization'] || req.headers?.authorization;

  // Determine action from query (via vercel rewrite ?action=xyz) or URL path
  let action = req.query?.action;
  if (!action && req.url) {
    const pathname = req.url.split('?')[0];
    const parts = pathname.split('/').filter(Boolean);
    action = parts[parts.length - 1];
  }

  // Standard CORS / headers
  if (res.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (action) {
      case 'signup': {
        if (req.method !== 'POST') {
          return res.status(405).json({ success: false, error: 'Method not allowed' });
        }
        const { name, email, mobile, password } = req.body || {};
        if (!name || !email || !password || typeof password !== 'string' || password.length === 0) {
          return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
        }
        const cleanEmail = email.trim().toLowerCase();
        if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
          return res.status(400).json({ success: false, error: 'Invalid email format.' });
        }
        const existing = await findUserByEmail(cleanEmail);
        if (existing) {
          return res.status(409).json({ success: false, error: 'Account with this email already exists.' });
        }
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
      }

      case 'login': {
        if (req.method !== 'POST') {
          return res.status(405).json({ success: false, error: 'Method not allowed' });
        }
        const { email, password } = req.body || {};
        if (!email || !password || typeof password !== 'string' || password.length === 0) {
          return res.status(400).json({ success: false, error: 'Email and password required.' });
        }
        const cleanEmail = email.trim().toLowerCase();
        const user = await findUserByEmail(cleanEmail);
        if (!user) {
          return res.status(401).json({ success: false, error: 'Invalid email or password.' });
        }
        const isPasswordValid = verifyPassword(password, user.password_salt, user.password_hash);
        if (!isPasswordValid) {
          return res.status(401).json({ success: false, error: 'Invalid email or password.' });
        }
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
      }

      case 'me': {
        const token = extractBearerToken(req);
        if (!token) {
          return res.status(401).json({ success: false, error: 'Unauthorized: valid token required.' });
        }
        const payload = verifySessionToken(token);
        if (!payload || !payload.email) {
          return res.status(401).json({ success: false, error: 'Unauthorized: valid token required.' });
        }
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
      }

      case 'forgot-password': {
        if (req.method !== 'POST') {
          return res.status(405).json({ success: false, error: 'Method not allowed' });
        }
        const { email } = req.body || {};
        if (!email || typeof email !== 'string' || !email.trim()) {
          return res.status(400).json({ success: false, error: 'Email is required.' });
        }
        const cleanEmail = email.trim().toLowerCase();
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
        await saveResetToken(cleanEmail, rawToken, tokenHash, expiresAt);
        return res.status(200).json({
          success: true,
          message: 'Password reset link sent to your email.',
          token: rawToken
        });
      }

      case 'reset-password': {
        if (req.method !== 'POST') {
          return res.status(405).json({ success: false, error: 'Method not allowed' });
        }
        const { token, newPassword } = req.body || {};
        if (!token || !newPassword || typeof newPassword !== 'string' || newPassword.trim().length === 0) {
          return res.status(400).json({ success: false, error: 'Token and new password required.' });
        }
        const tokenRecord = await findResetToken(token);
        if (!tokenRecord) {
          return res.status(400).json({ success: false, error: 'Invalid or expired reset token.' });
        }
        const expiresAt = new Date(tokenRecord.expiresAt).getTime();
        if (Date.now() > expiresAt) {
          await invalidateResetToken(token);
          return res.status(400).json({ success: false, error: 'Invalid or expired reset token.' });
        }
        const { salt, hash } = hashPassword(newPassword);
        await updateUserPassword(tokenRecord.email, hash, salt);
        await invalidateResetToken(token);
        return res.status(200).json({ success: true, message: 'Password reset successful.' });
      }

      default:
        return res.status(400).json({ success: false, error: `Unknown auth action: ${action}` });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err?.message || 'Server error during auth operation.' });
  }
}
