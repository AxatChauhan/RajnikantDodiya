/**
 * Vercel Serverless Function: Protected Date-Gated Test Server
 * NET Vidya English Student Store • "GSET + UGC NET English Final Pack 2026"
 * 
 * Security Rule:
 * 1. Requires valid Authorization: Bearer <token> (returns 401 if missing/invalid).
 * 2. Checks that student is an authenticated paying buyer (returns 403 if non-buyer).
 * 3. Checks test release date against server clock. If release date is in the future,
 *    returns HTTP 403 Forbidden with `{ error: "Opens on [releaseDate]" }`.
 * 4. Zero query backdoors: nv_buyer_ query params and unverified email parameters are strictly prohibited.
 */

import {
  extractBearerToken,
  verifySessionToken,
  isEmailBuyer,
  AUTHOR_EMAILS
} from '../auth/auth-helper.js';

// Master schedule of tests and release dates
export const TEST_HALL_SCHEDULE = [
  {
    id: 'test-net-mock-1',
    title: 'NET Mock 1: Full-Length Paper II NTA Simulation',
    category: 'Full Mock',
    totalQuestions: 100,
    durationMinutes: 180,
    releaseDate: '2026-11-01T00:00:00+05:30', // Ready now
    description: 'Comprehensive 100-question Paper II English Literature NTA simulation with real-time countdown timer, question palette, and detailed explanatory notes.'
  },
  {
    id: 'test-unit-1',
    title: 'Unit Test 1: British Drama & Elizabethan Poetry',
    category: 'Unit Test',
    totalQuestions: 50,
    durationMinutes: 90,
    releaseDate: '2026-11-01T00:00:00+05:30', // Ready now
    description: 'High-frequency exam questions spanning Shakespeare, Marlowe, University Wits, and Metaphysical poets.'
  },
  {
    id: 'test-bonus-practice-1',
    title: 'Bonus Practice Mock A: Quick Speed Revision',
    category: 'Bonus Mock',
    totalQuestions: 50,
    durationMinutes: 75,
    releaseDate: '2026-11-01T00:00:00+05:30', // Ready now
    description: 'Rapid-fire speed test designed to enhance accuracy under time pressure.'
  },
  {
    id: 'test-net-mock-2',
    title: 'NET Mock 2: Full-Length Literature & Literary Theory',
    category: 'Full Mock',
    totalQuestions: 100,
    durationMinutes: 180,
    releaseDate: '2026-11-06T00:00:00+05:30',
    description: 'Intensive Paper II exam focusing on Poststructuralism, Deconstruction, Postcolonialism, and Feminist Criticism.'
  },
  {
    id: 'test-net-mock-3',
    title: 'NET Mock 3: Grand Mid-Term Diagnostic Mock',
    category: 'Full Mock',
    totalQuestions: 100,
    durationMinutes: 180,
    releaseDate: '2026-11-10T00:00:00+05:30',
    description: 'Comprehensive mock scheduled for the final day of the early-bird window.'
  },
  {
    id: 'test-net-mock-4',
    title: 'NET Mock 4: Cultural Studies & English in India',
    category: 'Full Mock',
    totalQuestions: 100,
    durationMinutes: 180,
    releaseDate: '2026-11-14T00:00:00+05:30',
    description: 'Deep dive into Macaulay’s Minute, NEP 2020 pedagogical transitions, and Stuart Hall cultural theory.'
  },
  {
    id: 'test-net-mock-5',
    title: 'NET Mock 5: Research Methods & Pedagogy Master Mock',
    category: 'Full Mock',
    totalQuestions: 100,
    durationMinutes: 180,
    releaseDate: '2026-11-21T00:00:00+05:30',
    description: 'Comprehensive Paper II testing with dedicated focus on ELT classroom methodology and MLA 9th style sheets.'
  },
  {
    id: 'test-gset-special-1',
    title: 'GSET Special Simulation Exam 1',
    category: 'GSET Special',
    totalQuestions: 100,
    durationMinutes: 180,
    releaseDate: '2026-11-28T00:00:00+05:30',
    description: 'Tailored specifically to the Gujarat State Eligibility Test pattern and syllabus weightage.'
  },
  {
    id: 'test-grand-final-booster',
    title: 'Grand Final Rank Booster Exam 2026',
    category: 'Grand Final',
    totalQuestions: 100,
    durationMinutes: 180,
    releaseDate: '2026-12-05T00:00:00+05:30',
    description: 'The definitive final revision simulation before the university examination session.'
  },
  {
    id: 'test-future-mock',
    title: 'NET Mock 6: Advanced Contemporary Synthesis',
    category: 'Full Mock',
    totalQuestions: 100,
    durationMinutes: 180,
    releaseDate: '2026-11-25T00:00:00+05:30',
    description: 'Advanced test module releasing 25 Nov 2026.'
  }
];

export default async function handler(req, res) {
  try {
    const { testId } = req.query || {};

    if (!testId) {
      return res.status(400).json({ success: false, error: 'Test ID is required.' });
    }

    // 1. Authenticate session token via Bearer header
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: login required.'
      });
    }

    const payload = verifySessionToken(token);
    if (!payload || !payload.email) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: invalid or expired session token.'
      });
    }

    // 2. Authorize Buyer Entitlement
    const isBuyer = payload.isBuyer || await isEmailBuyer(payload.email);
    if (!isBuyer) {
      return res.status(403).json({
        success: false,
        error: 'Access Denied: active pass required.'
      });
    }

    // 3. Locate Test Module
    const testItem = TEST_HALL_SCHEDULE.find(t => t.id === testId);
    if (!testItem) {
      return res.status(404).json({ success: false, error: 'Test not found.' });
    }

    // 4. Enforce Release Date Gate
    const now = new Date();
    const releaseTime = new Date(testItem.releaseDate);
    const isAuthor = AUTHOR_EMAILS.includes(payload.email.toLowerCase().trim());

    if (now < releaseTime && !isAuthor) {
      const formattedDate = releaseTime.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

      return res.status(403).json({
        success: false,
        isLocked: true,
        releaseDate: testItem.releaseDate,
        formattedReleaseDate: formattedDate,
        error: `Opens on ${releaseTime.toLocaleDateString('en-IN')}`
      });
    }

    // 5. Unlocked: Return Test Payload
    return res.status(200).json({
      success: true,
      isLocked: false,
      test: testItem,
      runnerUrl: `/test-hall/runner.html?testId=${testId}`
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Server error serving test'
    });
  }
}
