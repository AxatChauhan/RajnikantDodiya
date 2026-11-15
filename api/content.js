/**
 * Vercel Serverless Function: Authoritative Site Content & Store State API
 * Dr. Rajnikant Dodiya Academic Portal & NET Vidya English Store
 * 
 * Provides permanent multi-device sync and prevents studio customization resets:
 * 1. GET  /api/content -> returns latest unified studio state (theme, profile, books, exams, store, layout, banner)
 * 2. POST /api/content -> updates unified studio state (authenticated with master credentials)
 */

import { extractBearerToken, verifySessionToken, AUTHOR_EMAILS } from '../lib/auth-helper.js';
import fs from 'fs';
import path from 'path';

// Runtime persistent cache
if (!globalThis.__AUTHOR_STUDIO_LIVE_STATE__) {
  globalThis.__AUTHOR_STUDIO_LIVE_STATE__ = null;
}

function loadBaselineSnapshot() {
  try {
    const p = path.join(process.cwd(), 'src/data/live_studio_state.json');
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    }
  } catch {}
  return null;
}

export default async function handler(req, res) {
  // CORS & Security headers
  const origin = req.headers?.origin || '';
  const allowedOrigins = [
    'https://rajnikantdodiya.com',
    'https://www.rajnikantdodiya.com',
    'http://localhost:5173',
    'http://localhost:3000'
  ];
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://rajnikantdodiya.com');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Author-Password');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. GET /api/content
  if (req.method === 'GET') {
    let liveState = globalThis.__AUTHOR_STUDIO_LIVE_STATE__;

    if (!liveState) {
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseKey) {
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const client = createClient(supabaseUrl, supabaseKey);
          const { data } = await client.from('site_content').select('content').eq('key', 'live_studio_state').maybeSingle();
          if (data?.content && typeof data.content === 'object') {
            liveState = data.content;
            globalThis.__AUTHOR_STUDIO_LIVE_STATE__ = data.content;
          }

          // Query live netvidya_users from Supabase
          const { data: dbUsers } = await client.from('netvidya_users').select('*');
          if (Array.isArray(dbUsers)) {
            if (!liveState) liveState = loadBaselineSnapshot() || { version: 1, updatedAt: new Date().toISOString() };
            if (!liveState.store) liveState.store = {};
            if (!Array.isArray(liveState.store.registeredUsers)) liveState.store.registeredUsers = [];
            const userMap = new Map(liveState.store.registeredUsers.map(u => [u.email?.toLowerCase(), u]));
            for (const u of dbUsers) {
              const cleanEmail = u.email?.toLowerCase().trim();
              if (!cleanEmail) continue;
              userMap.set(cleanEmail, {
                id: u.id,
                name: u.name || cleanEmail.split('@')[0],
                email: cleanEmail,
                mobile: u.mobile || '',
                isBuyer: Boolean(u.is_buyer),
                isActive: u.is_active !== false,
                enrolledAt: u.enrolled_at || (u.is_buyer ? u.created_at : null),
                lastLoginAt: u.last_login_at || u.created_at,
                createdAt: u.created_at || new Date().toISOString(),
                amountPaid: Number(u.amount_paid) || (u.is_buyer ? 499 : 0),
                orderId: u.order_id || null,
                enrolledPacks: u.enrolled_packs || [],
                emailVerified: Boolean(u.email_verified)
              });
            }
            liveState.store.registeredUsers = Array.from(userMap.values());
          }

          // Query live netvidya_buyers from Supabase
          const { data: dbBuyers } = await client.from('netvidya_buyers').select('*');
          if (Array.isArray(dbBuyers)) {
            if (!liveState) liveState = loadBaselineSnapshot() || { version: 1, updatedAt: new Date().toISOString() };
            if (!liveState.store) liveState.store = {};
            if (!Array.isArray(liveState.store.buyers)) liveState.store.buyers = [];
            const buyerMap = new Map(liveState.store.buyers.map(b => [b.email?.toLowerCase(), b]));
            for (const b of dbBuyers) {
              const cleanEmail = b.email?.toLowerCase().trim();
              if (!cleanEmail) continue;
              buyerMap.set(cleanEmail, {
                id: b.id,
                name: b.student_name || 'Scholar',
                email: cleanEmail,
                mobile: b.mobile || '',
                orderId: b.order_id,
                amountPaid: Number(b.amount_paid) || 499,
                paymentMethod: b.payment_method || 'razorpay',
                enrolledAt: b.enrolled_at || new Date().toISOString(),
                isActive: b.is_active !== false,
                packName: b.product_id || 'UGC NET English Complete Bundle'
              });
            }
            liveState.store.buyers = Array.from(buyerMap.values());
          }
        } catch {}
      }
    }

    if (!liveState) {
      liveState = loadBaselineSnapshot() || {
        version: 1,
        updatedAt: new Date().toISOString()
      };
    }

    // Ensure store.registeredUsers contains every user (bought or not bought)
    if (!liveState.store) liveState.store = {};
    if (!Array.isArray(liveState.store.registeredUsers)) liveState.store.registeredUsers = [];

    const isDummyEmail = (email) => {
      if (!email) return false;
      const e = String(email).toLowerCase().trim();
      return (
        e.includes('example.com') ||
        e.includes('example.in') ||
        e.includes('priya.gset') ||
        e.includes('aarav.ugc') ||
        e.includes('test.student') ||
        e.includes('candidate.scholar') ||
        e.includes('razorpay.test') ||
        e.includes('razorpay.candidate') ||
        e.includes('razorpay@netvidya')
      );
    };

    liveState.store.registeredUsers = liveState.store.registeredUsers.filter(u => !isDummyEmail(u?.email));
    if (Array.isArray(liveState.store.buyers)) {
      liveState.store.buyers = liveState.store.buyers.filter(b => !isDummyEmail(b?.email));
    }

    if (globalThis.__NETVIDYA_USERS_DB__) {
      const userMap = new Map(liveState.store.registeredUsers.map(u => [u.email?.toLowerCase(), u]));
      for (const [email, u] of globalThis.__NETVIDYA_USERS_DB__.entries()) {
        const cleanEmail = email.toLowerCase().trim();
        if (isDummyEmail(cleanEmail)) continue;
        if (!userMap.has(cleanEmail)) {
          userMap.set(cleanEmail, {
            id: u.id || `usr_${cleanEmail}`,
            name: u.name || cleanEmail.split('@')[0],
            email: cleanEmail,
            mobile: u.mobile || '',
            isBuyer: Boolean(u.is_buyer),
            isActive: u.is_active !== false,
            enrolledAt: u.enrolled_at || (u.is_buyer ? new Date().toISOString() : null),
            lastLoginAt: u.last_login_at || new Date().toISOString(),
            createdAt: u.created_at || new Date().toISOString(),
            amountPaid: Number(u.amount_paid) || (u.is_buyer ? 499 : 0),
            orderId: u.order_id
          });
        }
      }
      liveState.store.registeredUsers = Array.from(userMap.values());
    }

    res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=60');
    return res.status(200).json({
      success: true,
      state: liveState
    });
  }

  // 2. POST /api/content (Authenticated Author Sync)
  if (req.method === 'POST') {
    const token = extractBearerToken(req);
    const authorPassword = req.headers['x-author-password'] || req.body?.password;

    let isAuthenticated = false;

    // Check token if present
    if (token) {
      const payload = verifySessionToken(token);
      if (payload && (payload.role === 'author_master' || payload.role === 'admin' || (payload.email && AUTHOR_EMAILS.includes(payload.email.toLowerCase().trim())))) {
        isAuthenticated = true;
      }
    }

    // Check password if present strictly against configured ADMIN_PASSWORD
    if (!isAuthenticated && authorPassword && typeof authorPassword === 'string') {
      const cleanPass = authorPassword.trim();
      const configuredPass = process.env.ADMIN_PASSWORD || process.env.ADMIN_PIN;
      if (configuredPass && cleanPass === configuredPass.trim()) {
        isAuthenticated = true;
      }
    }

    if (!isAuthenticated) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Author Studio master credentials required to publish updates.'
      });
    }

    const existing = globalThis.__AUTHOR_STUDIO_LIVE_STATE__ || loadBaselineSnapshot() || {};
    const nextState = {
      ...existing,
      ...req.body,
      store: req.body.store ? {
        ...(existing.store || {}),
        ...req.body.store
      } : existing.store,
      updatedAt: new Date().toISOString()
    };

    delete nextState.password;
    delete nextState.authorEmail;

    globalThis.__AUTHOR_STUDIO_LIVE_STATE__ = nextState;

    // Persist live studio state to Supabase site_content table
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const client = createClient(supabaseUrl, supabaseKey);
        await client.from('site_content').upsert({
          key: 'live_studio_state',
          content: nextState,
          updated_at: nextState.updatedAt,
          updated_by: 'author_master'
        }, { onConflict: 'key' });
      } catch {}
    }

    return res.status(200).json({
      success: true,
      message: 'Studio changes synchronized across production.',
      updatedAt: nextState.updatedAt
    });
  }

  return res.status(405).json({ success: false, error: 'Method Not Allowed' });
}
