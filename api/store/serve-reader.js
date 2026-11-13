/**
 * Vercel Serverless Function: Watermarked Reader Server
 * Serves E-book, PYQ Trend Analysis, and Revision Kit with buyer email watermark.
 */

import fs from 'fs';
import path from 'path';
import {
  extractBearerToken,
  verifySessionToken,
  isEmailBuyer
} from '../../lib/auth-helper.js';

const ALLOWED_DOCS = {
  ebook: {
    folder: 'ebook',
    title: 'Complete E-book (283 pages)'
  },
  pyq_analysis: {
    folder: 'pyq_analysis',
    title: 'PYQ Trend Analysis (35 pages)'
  },
  revision_kit: {
    folder: 'revision_kit',
    title: 'Last 30 Days Revision Kit (29 pages)'
  }
};

export default async function handler(req, res) {
  try {
    const { doc } = req.query || {};

    if (!doc || !ALLOWED_DOCS[doc]) {
      return res.status(400).send('Invalid document requested.');
    }

    // 1. Authenticate session token
    const token = extractBearerToken(req) || req.query.token;
    if (!token) {
      return res.status(401).send('Unauthorized: please sign in to your student account.');
    }

    const payload = verifySessionToken(token);
    if (!payload || !payload.email) {
      return res.status(401).send('Unauthorized: session expired.');
    }

    // 2. Authorize Buyer Entitlement
    const isBuyer = payload.isBuyer || await isEmailBuyer(payload.email);
    if (!isBuyer) {
      return res.status(403).send('Access Denied: active student enrollment required.');
    }

    // 3. Locate reader index.html
    const filePath = path.join(process.cwd(), 'public', 'study-vault', 'ugc', 'reading', ALLOWED_DOCS[doc].folder, 'index.html');
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Document not found on server.');
    }

    let htmlContent = fs.readFileSync(filePath, 'utf8');

    // 4. Inject Dynamic Forensic Watermark
    const buyerEmail = payload.email.toLowerCase().trim();
    htmlContent = htmlContent.replace(/\{\{BUYER_EMAIL\}\}/g, buyerEmail);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');

    return res.status(200).send(htmlContent);
  } catch (err) {
    return res.status(500).send(`Server error: ${err.message}`);
  }
}
