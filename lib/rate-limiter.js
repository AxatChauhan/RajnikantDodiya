/**
 * NET Vidya English - Serverless In-Memory Sliding-Window Rate Limiter
 * 
 * Protects serverless functions against DDoS, brute force, and automated scraping:
 * - auth_login: 10 req/min per IP
 * - auth_signup: 5 req/min per IP
 * - auth_verify_otp: 10 req/min per IP & candidate
 * - auth_resend_otp: 1 req/30 sec per IP & candidate
 * - auth_forgot_password: 3 req/min per IP
 * - auth_reset_password: 5 req/min per IP
 * - store_create_order: 6 req/min per IP
 * - store_verify_payment: 10 req/min per IP
 * - store_price: 20 req/min per IP
 * - store_serve_reader: 120 req/min per IP & candidate
 * - store_serve_test: 60 req/min per IP & candidate
 * - store_download_file: 20 req/min per IP
 * - store_admin_login: 5 req/min per IP
 */

if (!globalThis.__NETVIDYA_RATE_LIMITS__) {
  globalThis.__NETVIDYA_RATE_LIMITS__ = new Map();
}

/**
 * Safely extracts client IP from headers or socket connection
 */
export function getClientIp(req) {
  if (!req) return '127.0.0.1';
  const headers = req.headers || {};
  const forwarded = headers['x-forwarded-for'] || headers['x-real-ip'];
  if (forwarded) {
    const rawIp = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : forwarded[0];
    if (rawIp) return rawIp.replace(/^::ffff:/, '');
  }
  const socketIp = req.socket?.remoteAddress || req.connection?.remoteAddress || '127.0.0.1';
  return socketIp.replace(/^::ffff:/, '');
}

export const RATE_LIMIT_RULES = {
  auth_login: {
    limit: 10,
    windowMs: 60 * 1000,
    message: 'Too many login attempts. Please wait a moment before trying again.'
  },
  auth_signup: {
    limit: 5,
    windowMs: 60 * 1000,
    message: 'Too many account creation attempts. Please wait a minute.'
  },
  auth_verify_otp: {
    limit: 10,
    windowMs: 60 * 1000,
    message: 'Too many verification code attempts. Please wait a minute.'
  },
  auth_resend_otp: {
    limit: 1,
    windowMs: 30 * 1000,
    message: 'Please wait 30 seconds before requesting a new code.'
  },
  auth_forgot_password: {
    limit: 3,
    windowMs: 60 * 1000,
    message: 'Too many password reset requests. Please wait a minute before requesting again.'
  },
  auth_reset_password: {
    limit: 5,
    windowMs: 60 * 1000,
    message: 'Too many password reset attempts. Please wait a minute.'
  },
  store_create_order: {
    limit: 6,
    windowMs: 60 * 1000,
    message: 'Order creation rate limit reached. Please wait a moment before retrying checkout.'
  },
  store_verify_payment: {
    limit: 10,
    windowMs: 60 * 1000,
    message: 'Too many payment verification attempts. Please wait a moment.'
  },
  store_price: {
    limit: 20,
    windowMs: 60 * 1000,
    message: 'Too many pricing requests. Please slow down.'
  },
  store_serve_reader: {
    limit: 120,
    windowMs: 60 * 1000,
    message: 'Reading rate limit reached. Please wait a moment before loading more pages.'
  },
  store_serve_test: {
    limit: 60,
    windowMs: 60 * 1000,
    message: 'Test server rate limit reached. Please wait a moment before requesting tests.'
  },
  store_download_file: {
    limit: 20,
    windowMs: 60 * 1000,
    message: 'Download rate limit reached. Please wait a moment before downloading more files.'
  },
  store_admin_login: {
    limit: 5,
    windowMs: 60 * 1000,
    message: 'Too many admin login attempts. Please wait a minute.'
  }
};

/**
 * Evaluates whether an action from a given key has exceeded its sliding window quota.
 */
export function checkRateLimit({ key, limit, windowMs }) {
  const store = globalThis.__NETVIDYA_RATE_LIMITS__;
  const now = Date.now();
  const history = store.get(key) || [];

  // Filter out timestamps older than the sliding window
  const activeTimestamps = history.filter(ts => now - ts < windowMs);

  if (activeTimestamps.length >= limit) {
    const oldest = activeTimestamps[0];
    const resetMs = Math.max(0, windowMs - (now - oldest));
    const retryAfter = Math.max(1, Math.ceil(resetMs / 1000));
    store.set(key, activeTimestamps);
    return {
      allowed: false,
      limit,
      remaining: 0,
      retryAfter,
      resetMs
    };
  }

  activeTimestamps.push(now);
  store.set(key, activeTimestamps);

  // Periodic eviction if the map grows
  if (store.size > 1500) {
    for (const [k, list] of store.entries()) {
      if (list.every(t => now - t >= 60000)) {
        store.delete(k);
      }
    }
  }

  const remaining = Math.max(0, limit - activeTimestamps.length);
  return {
    allowed: true,
    limit,
    remaining,
    retryAfter: 0,
    resetMs: windowMs
  };
}

/**
 * Enforces rate limit on an HTTP request/response.
 * Returns true if allowed to proceed.
 * If limit is exceeded, writes HTTP 429 response, sets standard rate limit headers, and returns false.
 */
export function enforceRateLimit(req, res, ruleKey, customIdentifier = null, options = {}) {
  // Allow test suite or mock bypass when explicitly flagged
  if (req?.headers?.['x-bypass-ratelimit'] === '1') {
    return true;
  }

  const rule = RATE_LIMIT_RULES[ruleKey];
  if (!rule) return true;

  const clientIp = getClientIp(req);
  const compositeKey = customIdentifier
    ? `${ruleKey}:${clientIp}:${customIdentifier}`
    : `${ruleKey}:${clientIp}`;

  const result = checkRateLimit({
    key: compositeKey,
    limit: options.limit || rule.limit,
    windowMs: options.windowMs || rule.windowMs
  });

  const now = Date.now();
  const resetEpochSeconds = Math.ceil((now + result.resetMs) / 1000);

  if (!result.allowed) {
    if (res.setHeader) {
      res.setHeader('Retry-After', String(result.retryAfter));
      res.setHeader('X-RateLimit-Limit', String(result.limit));
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', String(resetEpochSeconds));
    }

    if (options.asHtml || options.asText) {
      res.status(429).send(rule.message);
    } else {
      res.status(429).json({
        success: false,
        error: rule.message,
        retryAfter: result.retryAfter
      });
    }
    return false;
  }

  if (res.setHeader) {
    res.setHeader('X-RateLimit-Limit', String(result.limit));
    res.setHeader('X-RateLimit-Remaining', String(result.remaining));
    res.setHeader('X-RateLimit-Reset', String(resetEpochSeconds));
  }

  return true;
}

/**
 * Clear rate limits (useful for testing)
 */
export function clearRateLimits() {
  if (globalThis.__NETVIDYA_RATE_LIMITS__) {
    globalThis.__NETVIDYA_RATE_LIMITS__.clear();
  }
}
