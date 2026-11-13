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
} from '../../lib/auth-helper.js';

// Master schedule of tests and release dates
export const TEST_HALL_SCHEDULE = [
  // UGC NET Tests (NTA Simulation)
  {
    id: 'test-net-mock-1',
    file: 'NET_Mock_01.html',
    title: 'NET Mock 1: Full-Length Paper II NTA Simulation',
    category: 'NET Mock',
    exam: 'ugc',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-11-01T00:00:00+05:30',
    ready: true,
    description: 'Comprehensive 100-question Paper II English Literature NTA simulation with countdown timer, question palette, and detailed explanations.'
  },
  {
    id: 'ugc-net-mock-1',
    file: 'NET_Mock_01.html',
    title: 'NET Mock 1: Full-Length Paper II NTA Simulation',
    category: 'NET Mock',
    exam: 'ugc',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-11-15T00:00:00+05:30',
    ready: true,
    description: 'Comprehensive 100-question Paper II English Literature NTA simulation with countdown timer, question palette, and detailed explanations.'
  },
  {
    id: 'ugc-practice-mock-a',
    file: 'Practice_Mock_A.html',
    title: 'Practice Mock A: Full-Length Speed Simulation',
    category: 'Practice Mock',
    exam: 'ugc',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-11-15T00:00:00+05:30',
    ready: true,
    description: 'Full-length 100-question practice mock test for speed and accuracy building.'
  },
  {
    id: 'ugc-unit-1',
    file: 'Unit_Test_01_Drama.html',
    title: 'Unit Test 1: Drama',
    category: 'Unit Test',
    exam: 'ugc',
    totalQuestions: 50,
    durationMinutes: 60,
    releaseDate: '2026-11-15T00:00:00+05:30',
    ready: true,
    description: 'Focused 50-question diagnostic test on Drama from British, American, and World literature.'
  },
  {
    id: 'ugc-unit-2',
    file: 'Unit_Test_02_Poetry.html',
    title: 'Unit Test 2: Poetry',
    category: 'Unit Test',
    exam: 'ugc',
    totalQuestions: 50,
    durationMinutes: 60,
    releaseDate: '2026-11-15T00:00:00+05:30',
    ready: true,
    description: 'Focused 50-question test on British, American, and Postcolonial Poetry.'
  },
  {
    id: 'ugc-unit-3',
    file: 'Unit_Test_03_Fiction.html',
    title: 'Unit Test 3: Fiction and Short Story',
    category: 'Unit Test',
    exam: 'ugc',
    totalQuestions: 50,
    durationMinutes: 60,
    releaseDate: '2026-11-17T00:00:00+05:30',
    ready: true,
    description: 'Comprehensive assessment of classical and modern prose fiction.'
  },
  {
    id: 'ugc-unit-4',
    file: 'Unit_Test_04_Prose.html',
    title: 'Unit Test 4: Non-fictional Prose',
    category: 'Unit Test',
    exam: 'ugc',
    totalQuestions: 50,
    durationMinutes: 60,
    releaseDate: '2026-11-17T00:00:00+05:30',
    ready: true,
    description: 'Key questions on essays, biographies, diaries, and philosophical prose.'
  },
  {
    id: 'ugc-practice-mock-b',
    file: 'Practice_Mock_B.html',
    title: 'Practice Mock B: Literature & Criticism',
    category: 'Practice Mock',
    exam: 'ugc',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-11-17T00:00:00+05:30',
    ready: true,
    description: '100 questions covering core literary periods and movements.'
  },
  {
    id: 'ugc-unit-5',
    file: 'Unit_Test_05_Language.html',
    title: 'Unit Test 5: Language and Pedagogy',
    category: 'Unit Test',
    exam: 'ugc',
    totalQuestions: 50,
    durationMinutes: 60,
    releaseDate: '2026-11-19T00:00:00+05:30',
    ready: true,
    description: 'Linguistics, English Language Teaching methods, and pedagogical heuristics.'
  },
  {
    id: 'ugc-unit-6',
    file: 'Unit_Test_06_English_in_India.html',
    title: 'Unit Test 6: English in India: History, Evolution and Futures',
    category: 'Unit Test',
    exam: 'ugc',
    totalQuestions: 50,
    durationMinutes: 60,
    releaseDate: '2026-11-19T00:00:00+05:30',
    ready: true,
    description: 'Macaulay’s Minute to NEP 2020: policy, institutionalisation, and Indian writing.'
  },
  {
    id: 'ugc-practice-mock-c',
    file: 'Practice_Mock_C.html',
    title: 'Practice Mock C: High-Yield Rehearsal',
    category: 'Practice Mock',
    exam: 'ugc',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-11-19T00:00:00+05:30',
    ready: true,
    description: 'Full-length 100-question practice mock test.'
  },
  {
    id: 'ugc-net-mock-2',
    file: 'NET_Mock_02.html',
    title: 'NET Mock 2: Full-Length Paper II NTA Simulation',
    category: 'NET Mock',
    exam: 'ugc',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-11-20T00:00:00+05:30',
    ready: false,
    description: 'Full-length NTA simulation mock test releasing on 20 November.'
  },
  {
    id: 'ugc-unit-7',
    file: 'Unit_Test_07_Cultural_Studies.html',
    title: 'Unit Test 7: Cultural Studies',
    category: 'Unit Test',
    exam: 'ugc',
    totalQuestions: 50,
    durationMinutes: 60,
    releaseDate: '2026-11-22T00:00:00+05:30',
    ready: true,
    description: 'Birmingham School, Stuart Hall, subcultures, and popular culture analysis.'
  },
  {
    id: 'ugc-unit-8',
    file: 'Unit_Test_08_Criticism.html',
    title: 'Unit Test 8: Literary Criticism',
    category: 'Unit Test',
    exam: 'ugc',
    totalQuestions: 50,
    durationMinutes: 60,
    releaseDate: '2026-11-22T00:00:00+05:30',
    ready: true,
    description: 'Classical, Renaissance, Neo-classical, Romantic, and Victorian critical doctrines.'
  },
  {
    id: 'ugc-practice-mock-d',
    file: 'Practice_Mock_D.html',
    title: 'Practice Mock D: Speed and Accuracy Rehearsal',
    category: 'Practice Mock',
    exam: 'ugc',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-11-22T00:00:00+05:30',
    ready: true,
    description: '100-question mock test covering high-frequency PYQ trends.'
  },
  {
    id: 'ugc-unit-9',
    file: 'Unit_Test_09_Theory.html',
    title: 'Unit Test 9: Literary Theory Post-World War II',
    category: 'Unit Test',
    exam: 'ugc',
    totalQuestions: 50,
    durationMinutes: 60,
    releaseDate: '2026-11-24T00:00:00+05:30',
    ready: true,
    description: 'Structuralism, Post-structuralism, Deconstruction, Psychoanalysis, and Eco-criticism.'
  },
  {
    id: 'ugc-unit-10',
    file: 'Unit_Test_10_Research.html',
    title: 'Unit Test 10: Research Methods & Materials in English',
    category: 'Unit Test',
    exam: 'ugc',
    totalQuestions: 50,
    durationMinutes: 60,
    releaseDate: '2026-11-24T00:00:00+05:30',
    ready: true,
    description: 'MLA handbook style, citation mechanics, research design, and plagiarism ethics.'
  },
  {
    id: 'ugc-practice-mock-e',
    file: 'Practice_Mock_E.html',
    title: 'Practice Mock E: Unit Mastery Mock',
    category: 'Practice Mock',
    exam: 'ugc',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-11-24T00:00:00+05:30',
    ready: true,
    description: 'Full-length 100-question mock test.'
  },
  {
    id: 'ugc-net-mock-3',
    file: 'NET_Mock_03.html',
    title: 'NET Mock 3: Grand Mid-Term Diagnostic Mock',
    category: 'NET Mock',
    exam: 'ugc',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-11-27T00:00:00+05:30',
    ready: false,
    description: 'Mid-term comprehensive diagnostic simulation.'
  },
  {
    id: 'ugc-practice-mock-f',
    file: 'Practice_Mock_F.html',
    title: 'Practice Mock F: Rapid Fire Rehearsal',
    category: 'Practice Mock',
    exam: 'ugc',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-11-27T00:00:00+05:30',
    ready: true,
    description: 'Full 100 questions NTA simulation.'
  },
  {
    id: 'ugc-practice-mock-g',
    file: 'Practice_Mock_G.html',
    title: 'Practice Mock G: Comprehensive Mock',
    category: 'Practice Mock',
    exam: 'ugc',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-11-30T00:00:00+05:30',
    ready: true,
    description: 'Full 100 questions NTA simulation.'
  },
  {
    id: 'ugc-practice-mock-h',
    file: 'Practice_Mock_H.html',
    title: 'Practice Mock H: Analytical Mock',
    category: 'Practice Mock',
    exam: 'ugc',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-12-02T00:00:00+05:30',
    ready: true,
    description: 'Full 100 questions NTA simulation.'
  },
  {
    id: 'ugc-net-mock-4',
    file: 'NET_Mock_04.html',
    title: 'NET Mock 4: Advanced Synthesis NTA Mock',
    category: 'NET Mock',
    exam: 'ugc',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-12-04T00:00:00+05:30',
    ready: false,
    description: 'Releasing 4 December 2026.'
  },
  {
    id: 'ugc-practice-mock-i',
    file: 'Practice_Mock_I.html',
    title: 'Practice Mock I: Final Sprint Mock',
    category: 'Practice Mock',
    exam: 'ugc',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-12-04T00:00:00+05:30',
    ready: true,
    description: 'Full 100 questions NTA simulation.'
  },
  {
    id: 'ugc-practice-mock-j',
    file: 'Practice_Mock_J.html',
    title: 'Practice Mock J: Ultimate Sprint Mock',
    category: 'Practice Mock',
    exam: 'ugc',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-12-06T00:00:00+05:30',
    ready: true,
    description: 'Full 100 questions NTA simulation.'
  },
  {
    id: 'ugc-net-mock-5',
    file: 'NET_Mock_05.html',
    title: 'NET Mock 5: Pre-Exam Grand Rehearsal',
    category: 'NET Mock',
    exam: 'ugc',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-12-09T00:00:00+05:30',
    ready: false,
    description: 'Releasing 9 December 2026.'
  },
  {
    id: 'ugc-net-mock-6',
    file: 'NET_Mock_06.html',
    title: 'NET Mock 6: Final Rank Booster Exam',
    category: 'NET Mock',
    exam: 'ugc',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-12-13T00:00:00+05:30',
    ready: false,
    description: 'Final full rehearsal before the December 2026 examination.'
  },

  // GSET Paper 1 Tests (Gujarati/English CBT)
  {
    id: 'gset-p1-m1',
    file: 'GSET_Paper1_Mock01_CBT.html',
    title: 'GSET Paper 1: General Aptitude CBT Mock 01',
    category: 'GSET Paper 1',
    exam: 'gset',
    stream: 'general',
    totalQuestions: 50,
    durationMinutes: 60,
    releaseDate: '2026-11-01T00:00:00+05:30',
    ready: true,
    description: 'MSU Baroda GSET Pattern — 50 Questions General Aptitude with complete Gujarati explanations.'
  },
  {
    id: 'gset-p1-m2',
    file: 'GSET_Paper1_Mock02_CBT.html',
    title: 'GSET Paper 1: General Aptitude CBT Mock 02',
    category: 'GSET Paper 1',
    exam: 'gset',
    stream: 'general',
    totalQuestions: 50,
    durationMinutes: 60,
    releaseDate: '2026-11-01T00:00:00+05:30',
    ready: true,
    description: 'MSU Baroda GSET Pattern — 50 Questions General Aptitude with complete Gujarati explanations.'
  },
  {
    id: 'gset-p1-m3',
    file: 'GSET_Paper1_Mock03_CBT.html',
    title: 'GSET Paper 1: General Aptitude CBT Mock 03',
    category: 'GSET Paper 1',
    exam: 'gset',
    stream: 'general',
    totalQuestions: 50,
    durationMinutes: 60,
    releaseDate: '2026-11-01T00:00:00+05:30',
    ready: true,
    description: 'MSU Baroda GSET Pattern — 50 Questions General Aptitude with complete Gujarati explanations.'
  },

  // GSET Paper 2 Education Discipline Tests
  {
    id: 'gset-p2-edu-m1',
    file: 'GSET_Paper2_Education_Mock01_CBT.html',
    title: 'GSET Education Paper 2: Discipline CBT Mock 01',
    category: 'GSET Education',
    exam: 'gset',
    stream: 'education',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-11-01T00:00:00+05:30',
    ready: true,
    description: 'Education Subject: 100 Questions covering Philosophical, Sociological & Psychological Foundations, Curriculum Studies & Pedagogy.'
  },
  {
    id: 'gset-p2-edu-m2',
    file: 'GSET_Paper2_Education_Mock02_CBT.html',
    title: 'GSET Education Paper 2: Discipline CBT Mock 02',
    category: 'GSET Education',
    exam: 'gset',
    stream: 'education',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-11-01T00:00:00+05:30',
    ready: true,
    description: 'Education Subject: 100 Questions covering Teacher Education, Research in Education, and Educational Technology.'
  },
  {
    id: 'gset-p2-edu-m3',
    file: 'GSET_Paper2_Education_Mock03_CBT.html',
    title: 'GSET Education Paper 2: Discipline CBT Mock 03',
    category: 'GSET Education',
    exam: 'gset',
    stream: 'education',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-11-01T00:00:00+05:30',
    ready: true,
    description: 'Education Subject: 100 Questions comprehensive GSET simulation.'
  },

  // GSET Paper 2 English Literature Tests
  {
    id: 'gset-p2-eng-m1',
    file: 'GSET_English_Paper2_Mock01_CBT.html',
    title: 'GSET English Paper 2: Literature Specialist CBT Mock 01',
    category: 'GSET English',
    exam: 'gset',
    stream: 'english',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-11-01T00:00:00+05:30',
    ready: true,
    description: 'English Subject: 100 Questions covering British, American, Indian Literature, Literary Theory & ELT.'
  },
  {
    id: 'gset-p2-eng-m3',
    file: 'GSET_English_Paper2_Mock03_CBT.html',
    title: 'GSET English Paper 2: Literature Specialist CBT Mock 03',
    category: 'GSET English',
    exam: 'gset',
    stream: 'english',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-11-01T00:00:00+05:30',
    ready: true,
    description: 'English Subject: 100 Questions covering Literary Criticism, Cultural Studies, and Research Methodology.'
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
    const runnerUrl = testItem.file
      ? (testItem.exam === 'gset'
          ? `/study-vault/gset/tests/${testItem.file}`
          : `/study-vault/ugc/tests/${testItem.file}`)
      : `/test-hall/runner.html?testId=${testId}`;

    return res.status(200).json({
      success: true,
      isLocked: false,
      test: testItem,
      runnerUrl
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Server error serving test'
    });
  }
}
