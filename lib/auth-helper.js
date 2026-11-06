/**
 * NET Vidya English Student Store • Authentication & Access Control Helper
 * Implements password hashing (scrypt), HMAC-SHA256 JWT sessions,
 * reset token generation, and robust data persistence (Supabase + local memory fallback).
 */

import crypto from 'crypto';

export const JWT_SECRET = process.env.JWT_SECRET || process.env.NETVIDYA_JWT_SECRET || 'netvidya_jwt_test_secret_key_2026';
export const AUTHOR_EMAILS = ['rajnikantdodiya2@gmail.com', 'netvidyaenglish@gmail.com'];
export const DEFAULT_ACCESS_EXPIRY = '2026-12-31T23:59:59+05:30';

// Initialize global storage if not already present
if (!globalThis.__NETVIDYA_USERS_DB__) {
  globalThis.__NETVIDYA_USERS_DB__ = new Map();
}
if (!globalThis.__NETVIDYA_RESET_TOKENS__) {
  globalThis.__NETVIDYA_RESET_TOKENS__ = new Map();
}

// Seed initial test buyer
if (!globalThis.__NETVIDYA_USERS_DB__.has('student@example.com')) {
  globalThis.__NETVIDYA_USERS_DB__.set('student@example.com', {
    id: 'usr_init_student',
    name: 'Test Student',
    email: 'student@example.com',
    mobile: '9898989898',
    password_hash: crypto.createHash('sha256').update('password123').digest('hex'),
    password_salt: 'init_salt',
    is_buyer: true,
    is_active: true,
    expires_at: DEFAULT_ACCESS_EXPIRY,
    enrolled_at: new Date().toISOString()
  });
}

/**
 * Hash password using Node crypto.scrypt
 */
export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return {
    salt,
    hash: derivedKey.toString('hex')
  };
}

/**
 * Verify password against stored hash using timingSafeEqual
 */
export function verifyPassword(password, salt, storedHash) {
  if (!password || !storedHash) return false;
  try {
    // If scrypt hash (128 hex chars)
    if (storedHash.length === 128 && salt) {
      const keyBuffer = crypto.scryptSync(password, salt, 64);
      const hashBuffer = Buffer.from(storedHash, 'hex');
      return crypto.timingSafeEqual(keyBuffer, hashBuffer);
    }
    // Fallback for SHA-256 (64 hex chars, e.g. from tests or seeds)
    if (storedHash.length === 64) {
      const shaHash = crypto.createHash('sha256').update(password).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(shaHash, 'hex'), Buffer.from(storedHash, 'hex'));
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Create HMAC-SHA256 Signed JWT session token
 */
export function createSessionToken(payload, expiresInSeconds = 86400 * 30) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds
  };
  const body = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

/**
 * Verify HMAC-SHA256 JWT session token
 */
export function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');
    if (signature !== expectedSig) return null;

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Extract bearer token from incoming request headers
 */
export function extractBearerToken(req) {
  if (!req) return null;
  const authHeader = req.headers?.['authorization'] || req.headers?.authorization || '';
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return null;
}

/**
 * Helper to optionally link with simulatedDb in test suite if running locally
 */
async function getSimulatedDb() {
  try {
    const helpers = await import('../../scripts/e2e/test_helpers.mjs');
    return helpers.simulatedDb || null;
  } catch {
    return null;
  }
}

/**
 * Helper to get Supabase client if configured
 */
async function getSupabaseClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  try {
    const { createClient } = await import('@supabase/supabase-js');
    return createClient(supabaseUrl, serviceRoleKey);
  } catch {
    return null;
  }
}

/**
 * Find user by email across data sources
 */
export async function findUserByEmail(email) {
  if (!email) return null;
  const cleanEmail = email.trim().toLowerCase();

  // 1. Check local memory DB
  const memoryUser = globalThis.__NETVIDYA_USERS_DB__.get(cleanEmail);

  // 2. Check test simulatedDb if active
  const simDb = await getSimulatedDb();
  if (simDb?.users?.has(cleanEmail)) {
    const simUser = simDb.users.get(cleanEmail);
    return {
      id: simUser.id || `usr_${cleanEmail}`,
      name: simUser.name || simUser.student_name || cleanEmail.split('@')[0],
      email: cleanEmail,
      mobile: simUser.mobile || '',
      password_hash: simUser.passwordHash || simUser.password_hash || memoryUser?.password_hash,
      password_salt: simUser.password_salt || memoryUser?.password_salt || '',
      is_buyer: Boolean(simUser.isBuyer ?? simUser.is_buyer ?? simDb.buyers?.has(cleanEmail)),
      is_active: simUser.isActive ?? simUser.is_active ?? true,
      expires_at: simUser.expiresAt || simUser.expires_at || DEFAULT_ACCESS_EXPIRY
    };
  }

  if (memoryUser) return memoryUser;

  // 3. Check Supabase
  const supabase = await getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('netvidya_users')
        .select('*')
        .ilike('email', cleanEmail)
        .maybeSingle();
      if (!error && data) {
        return data;
      }
    } catch {}
  }

  return null;
}

/**
 * Check if email is an active paid buyer
 */
export async function isEmailBuyer(email) {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();

  // Author bypass
  if (AUTHOR_EMAILS.includes(cleanEmail)) return true;

  // Check test simulatedDb
  const simDb = await getSimulatedDb();
  if (simDb?.buyers?.has(cleanEmail)) {
    const b = simDb.buyers.get(cleanEmail);
    if (b.is_active !== false && b.isActive !== false) return true;
  }
  if (simDb?.users?.has(cleanEmail)) {
    const u = simDb.users.get(cleanEmail);
    if ((u.isBuyer || u.is_buyer) && u.is_active !== false && u.isActive !== false) return true;
  }

  // Check memory DB
  const memoryUser = globalThis.__NETVIDYA_USERS_DB__.get(cleanEmail);
  if (memoryUser && memoryUser.is_buyer && memoryUser.is_active !== false) {
    return true;
  }

  // Check Supabase
  const supabase = await getSupabaseClient();
  if (supabase) {
    try {
      const { data: buyer } = await supabase
        .from('netvidya_buyers')
        .select('is_active, expires_at')
        .ilike('email', cleanEmail)
        .maybeSingle();
      if (buyer && buyer.is_active) {
        const expiresAt = new Date(buyer.expires_at || DEFAULT_ACCESS_EXPIRY);
        if (new Date() <= expiresAt) return true;
      }

      const { data: user } = await supabase
        .from('netvidya_users')
        .select('is_buyer, is_active, expires_at')
        .ilike('email', cleanEmail)
        .maybeSingle();
      if (user && user.is_buyer && user.is_active) {
        const expiresAt = new Date(user.expires_at || DEFAULT_ACCESS_EXPIRY);
        if (new Date() <= expiresAt) return true;
      }
    } catch {}
  }

  return false;
}

/**
 * Persist user record across data sources
 */
export async function saveUser(user) {
  const cleanEmail = user.email.trim().toLowerCase();
  const normalizedUser = {
    ...user,
    email: cleanEmail,
    is_buyer: Boolean(user.is_buyer),
    is_active: user.is_active !== false,
    expires_at: user.expires_at || DEFAULT_ACCESS_EXPIRY
  };

  // 1. Save to memory DB
  globalThis.__NETVIDYA_USERS_DB__.set(cleanEmail, normalizedUser);

  // 2. Sync to test simulatedDb if active
  const simDb = await getSimulatedDb();
  if (simDb?.users) {
    simDb.users.set(cleanEmail, {
      id: normalizedUser.id,
      name: normalizedUser.name,
      email: cleanEmail,
      mobile: normalizedUser.mobile,
      passwordHash: normalizedUser.password_hash,
      password_hash: normalizedUser.password_hash,
      password_salt: normalizedUser.password_salt,
      isBuyer: normalizedUser.is_buyer,
      isActive: normalizedUser.is_active,
      expiresAt: normalizedUser.expires_at
    });
  }

  // 3. Save to Supabase
  const supabase = await getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('netvidya_users').upsert(normalizedUser, { onConflict: 'email' });
    } catch (err) {
      console.warn('Supabase saveUser warning:', err);
    }
  }

  return normalizedUser;
}

/**
 * Save password reset token
 */
export async function saveResetToken(email, token, tokenHash, expiresAt) {
  const cleanEmail = email.trim().toLowerCase();
  const record = {
    email: cleanEmail,
    token,
    tokenHash,
    expiresAt: typeof expiresAt === 'string' ? expiresAt : new Date(expiresAt).toISOString()
  };

  // 1. Save to memory
  globalThis.__NETVIDYA_RESET_TOKENS__.set(token, record);

  // 2. Sync with test simulatedDb
  const simDb = await getSimulatedDb();
  if (simDb?.resetTokens) {
    simDb.resetTokens.set(token, {
      email: cleanEmail,
      expiresAt: new Date(record.expiresAt).getTime()
    });
  }

  // 3. Update Supabase
  const supabase = await getSupabaseClient();
  if (supabase) {
    try {
      await supabase
        .from('netvidya_users')
        .update({
          reset_token_hash: tokenHash,
          reset_token_expires_at: record.expiresAt
        })
        .ilike('email', cleanEmail);
    } catch {}
  }
}

/**
 * Lookup password reset token
 */
export async function findResetToken(token) {
  if (!token) return null;

  // 1. Check test simulatedDb
  const simDb = await getSimulatedDb();
  if (simDb?.resetTokens?.has(token)) {
    const item = simDb.resetTokens.get(token);
    return {
      email: item.email,
      expiresAt: typeof item.expiresAt === 'number' ? new Date(item.expiresAt).toISOString() : item.expiresAt
    };
  }

  // 2. Check memory
  if (globalThis.__NETVIDYA_RESET_TOKENS__.has(token)) {
    return globalThis.__NETVIDYA_RESET_TOKENS__.get(token);
  }

  // 3. Check Supabase by SHA-256 hash
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const supabase = await getSupabaseClient();
  if (supabase) {
    try {
      const { data } = await supabase
        .from('netvidya_users')
        .select('email, reset_token_expires_at')
        .eq('reset_token_hash', tokenHash)
        .maybeSingle();
      if (data) {
        return {
          email: data.email,
          expiresAt: data.reset_token_expires_at
        };
      }
    } catch {}
  }

  return null;
}

/**
 * Invalidate used password reset token
 */
export async function invalidateResetToken(token) {
  if (!token) return;

  // 1. Memory
  const item = globalThis.__NETVIDYA_RESET_TOKENS__.get(token);
  globalThis.__NETVIDYA_RESET_TOKENS__.delete(token);

  // 2. Test simulatedDb
  const simDb = await getSimulatedDb();
  if (simDb?.resetTokens) {
    simDb.resetTokens.delete(token);
  }

  // 3. Supabase
  const supabase = await getSupabaseClient();
  if (supabase && item?.email) {
    try {
      await supabase
        .from('netvidya_users')
        .update({
          reset_token_hash: null,
          reset_token_expires_at: null
        })
        .ilike('email', item.email);
    } catch {}
  }
}

/**
 * Update user password
 */
export async function updateUserPassword(email, newHash, newSalt) {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Memory
  const user = globalThis.__NETVIDYA_USERS_DB__.get(cleanEmail);
  if (user) {
    user.password_hash = newHash;
    user.password_salt = newSalt;
  }

  // 2. Test simulatedDb
  const simDb = await getSimulatedDb();
  if (simDb?.users?.has(cleanEmail)) {
    const simUser = simDb.users.get(cleanEmail);
    simUser.passwordHash = newHash;
    simUser.password_hash = newHash;
    simUser.password_salt = newSalt;
  }

  // 3. Supabase
  const supabase = await getSupabaseClient();
  if (supabase) {
    try {
      await supabase
        .from('netvidya_users')
        .update({
          password_hash: newHash,
          password_salt: newSalt,
          updated_at: new Date().toISOString()
        })
        .ilike('email', cleanEmail);
    } catch {}
  }
}
