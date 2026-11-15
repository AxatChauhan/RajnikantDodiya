/**
 * Unified Student Authentication API Route
 * Handles: /api/auth/signup, /api/auth/login, /api/auth/me,
 *          /api/auth/forgot-password, /api/auth/reset-password,
 *          /api/auth/verify-otp, /api/auth/resend-otp
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
  getUserEnrolledPacks,
  saveUser,
  saveResetToken,
  findResetToken,
  invalidateResetToken,
  updateUserPassword,
  DEFAULT_ACCESS_EXPIRY,
  generateNumericOtp,
  storeEmailOtp,
  verifyEmailOtp,
  canResendOtp,
  markUserEmailVerified,
  createStatelessResetToken
} from '../lib/auth-helper.js';
import { sendOtpEmail, sendPasswordResetEmail } from './store/email.js';
import { enforceRateLimit } from '../lib/rate-limiter.js';

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

export async function verifyOtpHandler(req, res) {
  if (!req.query) req.query = {};
  req.query.action = 'verify-otp';
  return handler(req, res);
}

export async function resendOtpHandler(req, res) {
  if (!req.query) req.query = {};
  req.query.action = 'resend-otp';
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
        if (!enforceRateLimit(req, res, 'auth_signup')) return;
        const { name, email, mobile, password } = req.body || {};
        if (!name || !email || !password || typeof password !== 'string' || password.length === 0) {
          return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
        }
        if (name.length > 100 || email.length > 254 || password.length > 128) {
          return res.status(400).json({ success: false, error: 'Input length exceeds maximum security limit.' });
        }
        const cleanEmail = email.trim().toLowerCase();
        if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
          return res.status(400).json({ success: false, error: 'Invalid email format.' });
        }
        const existing = await findUserByEmail(cleanEmail);
        if (existing && existing.password_hash) {
          return res.status(409).json({ success: false, error: 'Account with this email already exists.' });
        }
        const isBuyer = (existing && existing.is_buyer) || await isEmailBuyer(cleanEmail);
        const { salt, hash } = hashPassword(password);
        const userId = existing?.id || `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        const newUser = {
          id: userId,
          name: name.trim(),
          email: cleanEmail,
          mobile: (mobile || '').toString().trim(),
          password_hash: hash,
          password_salt: salt,
          is_buyer: isBuyer,
          email_verified: false,
          email_verified_at: null,
          is_active: true,
          enrolled_at: isBuyer ? new Date().toISOString() : null,
          expires_at: DEFAULT_ACCESS_EXPIRY,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        await saveUser(newUser);

        // Generate and dispatch 6-digit verification OTP to ensure email is genuine
        const otp = generateNumericOtp();
        const otpRecord = await storeEmailOtp(cleanEmail, otp, 'signup');
        try {
          await sendOtpEmail({
            to: cleanEmail,
            otp,
            studentName: newUser.name,
            purpose: 'signup'
          });
        } catch (emailErr) {
          console.warn('[AUTH] Notice: OTP signup dispatch error:', emailErr);
        }

        return res.status(200).json({
          success: true,
          requiresOtp: true,
          email: cleanEmail,
          purpose: 'signup',
          verificationTicket: otpRecord?.verificationTicket,
          expiresAt: otpRecord?.expiresAt,
          message: 'Account created! Please enter the 6-digit verification code sent to your email to verify your email address.'
        });
      }

      case 'login': {
        if (req.method !== 'POST') {
          return res.status(405).json({ success: false, error: 'Method not allowed' });
        }
        if (!enforceRateLimit(req, res, 'auth_login')) return;
        const { email, password } = req.body || {};
        if (!email || !password || typeof password !== 'string' || password.length === 0) {
          return res.status(400).json({ success: false, error: 'Email and password required.' });
        }
        if (email.length > 254 || password.length > 128) {
          return res.status(401).json({ success: false, error: 'Invalid email or password.' });
        }
        const cleanEmail = email.trim().toLowerCase();
        let user = await findUserByEmail(cleanEmail);
        const isBuyerKnown = await isEmailBuyer(cleanEmail);

        if (!user && isBuyerKnown) {
          // Student paid but didn't set password yet: automatically provision account with this password
          const { salt, hash } = hashPassword(password);
          user = {
            id: `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
            name: cleanEmail.split('@')[0],
            email: cleanEmail,
            mobile: '',
            password_hash: hash,
            password_salt: salt,
            is_buyer: true,
            email_verified: true,
            email_verified_at: new Date().toISOString(),
            is_active: true,
            enrolled_at: new Date().toISOString(),
            expires_at: DEFAULT_ACCESS_EXPIRY,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          await saveUser(user);
        } else if (!user) {
          return res.status(404).json({
            success: false,
            errorType: 'ACCOUNT_NOT_FOUND',
            error: "No account found with this email. Please click 'Create Account' below to sign up."
          });
        } else if (!user.password_hash && isBuyerKnown) {
          // User record was synthesized from verified buyer entry: bind password now
          const { salt, hash } = hashPassword(password);
          user.password_hash = hash;
          user.password_salt = salt;
          user.is_buyer = true;
          user.email_verified = true;
          user.email_verified_at = new Date().toISOString();
          await saveUser(user);
        } else {
          const isPasswordValid = verifyPassword(password, user.password_salt, user.password_hash);
          if (!isPasswordValid) {
            return res.status(401).json({
              success: false,
              errorType: 'INCORRECT_PASSWORD',
              error: "Incorrect password. Please verify your password or use 'Forgot Password?' to reset it."
            });
          }
        }

        const isBuyer = user.is_buyer || await isEmailBuyer(cleanEmail);
        if (isBuyer !== user.is_buyer) {
          user.is_buyer = isBuyer;
          await saveUser(user);
        }

        // Email verification gate:
        // Check if user has verified their email address.
        // If not verified (first login or pending verification), require OTP to verify email is genuine!
        if (!user.email_verified && !user.is_buyer) {
          const otp = generateNumericOtp();
          const otpRecord = await storeEmailOtp(cleanEmail, otp, 'first_login');
          try {
            await sendOtpEmail({
              to: cleanEmail,
              otp,
              studentName: user.name,
              purpose: 'first_login'
            });
          } catch (emailErr) {
            console.warn('[AUTH] Notice: OTP login dispatch error:', emailErr);
          }

          return res.status(200).json({
            success: true,
            requiresOtp: true,
            email: cleanEmail,
            purpose: 'first_login',
            verificationTicket: otpRecord?.verificationTicket,
            expiresAt: otpRecord?.expiresAt,
            message: 'Please enter the 6-digit verification code sent to your email to complete first-time login.'
          });
        }

        // Verified student: DIRECT INSTANT LOGIN!
        user.last_login_at = new Date().toISOString();
        await saveUser(user);

        const enrolledPacks = await getUserEnrolledPacks(cleanEmail);
        const token = createSessionToken({
          id: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          isBuyer: user.is_buyer,
          enrolledPacks,
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
            enrolledPacks,
            expiresAt: user.expires_at
          }
        });
      }

      case 'verify-otp': {
        if (req.method !== 'POST') {
          return res.status(405).json({ success: false, error: 'Method not allowed' });
        }
        const { email, otp, purpose, verificationTicket, expiresAt } = req.body || {};
        if (!email || !otp) {
          return res.status(400).json({ success: false, error: 'Email and verification code are required.' });
        }
        const cleanEmail = email.trim().toLowerCase();
        if (!enforceRateLimit(req, res, 'auth_verify_otp', cleanEmail)) return;
        const cleanOtp = otp.toString().trim();

        const verifyResult = await verifyEmailOtp(cleanEmail, cleanOtp, purpose, verificationTicket, expiresAt);
        if (!verifyResult.valid) {
          return res.status(400).json({ success: false, error: verifyResult.error || 'Invalid verification code.' });
        }

        // Mark user email as verified
        await markUserEmailVerified(cleanEmail);
        const user = await findUserByEmail(cleanEmail);
        if (!user) {
          return res.status(404).json({ success: false, error: 'User account not found.' });
        }
        user.last_login_at = new Date().toISOString();
        user.email_verified = true;
        user.email_verified_at = new Date().toISOString();
        await saveUser(user);

        const enrolledPacks = await getUserEnrolledPacks(cleanEmail);
        const token = createSessionToken({
          id: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          isBuyer: user.is_buyer,
          enrolledPacks,
          expiresAt: user.expires_at
        });

        return res.status(200).json({
          success: true,
          message: 'Email successfully verified!',
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            isBuyer: user.is_buyer,
            enrolledPacks,
            expiresAt: user.expires_at
          }
        });
      }

      case 'resend-otp': {
        if (req.method !== 'POST') {
          return res.status(405).json({ success: false, error: 'Method not allowed' });
        }
        const { email, purpose } = req.body || {};
        if (!email) {
          return res.status(400).json({ success: false, error: 'Email is required.' });
        }
        const cleanEmail = email.trim().toLowerCase();
        if (!enforceRateLimit(req, res, 'auth_resend_otp', cleanEmail)) return;
        const user = await findUserByEmail(cleanEmail);
        if (!user) {
          return res.status(404).json({ success: false, error: 'User account not found.' });
        }

        const rateCheck = canResendOtp(cleanEmail);
        if (!rateCheck.allowed) {
          return res.status(429).json({
            success: false,
            error: `Please wait ${rateCheck.waitSeconds} seconds before requesting a new code.`
          });
        }

        const otp = generateNumericOtp();
        const otpRecord = await storeEmailOtp(cleanEmail, otp, purpose || 'signup');
        try {
          await sendOtpEmail({
            to: cleanEmail,
            otp,
            studentName: user.name,
            purpose: purpose || 'signup'
          });
        } catch (emailErr) {
          console.warn('[AUTH] Notice: Resend OTP dispatch error:', emailErr);
        }

        return res.status(200).json({
          success: true,
          verificationTicket: otpRecord?.verificationTicket,
          expiresAt: otpRecord?.expiresAt,
          message: 'A fresh 6-digit verification code has been dispatched to your email.'
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
        const buyerRecordFound = await isEmailBuyer(payload.email);
        const isBuyer = Boolean(user?.is_buyer || buyerRecordFound || payload.isBuyer);
        if (user && isBuyer && !user.is_buyer) {
          user.is_buyer = true;
          await saveUser(user);
        }
        const resolvedUser = {
          id: user?.id || payload.id || `usr_${payload.email}`,
          name: user?.name || payload.name || payload.email.split('@')[0],
          email: user?.email || payload.email,
          mobile: user?.mobile || payload.mobile || '',
          isBuyer,
          expiresAt: user?.expires_at || payload.expiresAt || DEFAULT_ACCESS_EXPIRY
        };
        const enrolledPacks = await getUserEnrolledPacks(resolvedUser.email);
        resolvedUser.enrolledPacks = enrolledPacks;
        const refreshedToken = isBuyer && !payload.isBuyer
          ? createSessionToken(resolvedUser)
          : undefined;
        return res.status(200).json({
          success: true,
          ...(refreshedToken ? { token: refreshedToken } : {}),
          user: resolvedUser
        });
      }

      case 'forgot-password': {
        if (req.method !== 'POST') {
          return res.status(405).json({ success: false, error: 'Method not allowed' });
        }
        if (!enforceRateLimit(req, res, 'auth_forgot_password')) return;
        const { email } = req.body || {};
        if (!email || typeof email !== 'string' || !email.trim()) {
          return res.status(400).json({ success: false, error: 'Email is required.' });
        }
        const cleanEmail = email.trim().toLowerCase();
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
        await saveResetToken(cleanEmail, rawToken, tokenHash, expiresAt);

        // Also generate and store a 6-digit OTP code for password reset
        const resetOtp = generateNumericOtp();
        const resetOtpRecord = await storeEmailOtp(cleanEmail, resetOtp, 'reset_password');

        // Check if user exists to also issue a stateless reset token (immune to multi-container restarts)
        const existingUser = await findUserByEmail(cleanEmail);
        const statelessToken = existingUser
          ? createStatelessResetToken(cleanEmail, existingUser.password_salt, Date.now() + 3600 * 1000)
          : rawToken;

        // Dispatch password reset email with secure link and 6-digit reset code
        try {
          await sendPasswordResetEmail({
            to: cleanEmail,
            resetToken: statelessToken,
            otpCode: resetOtp
          });
        } catch (emailErr) {
          console.warn('[AUTH] Password reset email notice:', emailErr);
        }

        return res.status(200).json({
          success: true,
          verificationTicket: resetOtpRecord?.verificationTicket,
          expiresAt: resetOtpRecord?.expiresAt,
          message: 'If an account exists with this email, a 6-digit reset code and link have been dispatched to your inbox.'
        });
      }

      case 'reset-password': {
        if (req.method !== 'POST') {
          return res.status(405).json({ success: false, error: 'Method not allowed' });
        }
        if (!enforceRateLimit(req, res, 'auth_reset_password')) return;
        const { token, otp, email, newPassword, verificationTicket, expiresAt } = req.body || {};
        if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length === 0) {
          return res.status(400).json({ success: false, error: 'New password is required.' });
        }
        if (newPassword.length > 128) {
          return res.status(400).json({ success: false, error: 'New password must not exceed 128 characters.' });
        }

        let targetEmail = '';

        if (token) {
          // Token-based reset (supports memory, Supabase, and stateless HMAC tokens)
          const tokenRecord = await findResetToken(token);
          if (!tokenRecord) {
            return res.status(400).json({ success: false, error: 'Invalid or expired reset token.' });
          }
          const expTime = new Date(tokenRecord.expiresAt).getTime();
          if (Date.now() > expTime) {
            await invalidateResetToken(token);
            return res.status(400).json({ success: false, error: 'Invalid or expired reset token.' });
          }
          targetEmail = tokenRecord.email;
          await invalidateResetToken(token);
        } else if (otp && email) {
          // OTP-based reset (supports memory and stateless HMAC verification tickets)
          const cleanEmail = email.trim().toLowerCase();
          const verifyResult = await verifyEmailOtp(cleanEmail, otp.toString().trim(), 'reset_password', verificationTicket, expiresAt);
          if (!verifyResult.valid) {
            return res.status(400).json({ success: false, error: verifyResult.error || 'Invalid or expired reset code.' });
          }
          targetEmail = cleanEmail;
        } else {
          return res.status(400).json({ success: false, error: 'Reset token or 6-digit verification code with email is required.' });
        }

        const { salt, hash } = hashPassword(newPassword);
        await updateUserPassword(targetEmail, hash, salt);
        // Resetting password proves email ownership: verify user email as genuine
        await markUserEmailVerified(targetEmail);

        return res.status(200).json({ success: true, message: 'Password reset successful! You may now sign in.' });
      }

      default:
        return res.status(400).json({ success: false, error: `Unknown auth action: ${action}` });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err?.message || 'Server error during auth operation.' });
  }
}
