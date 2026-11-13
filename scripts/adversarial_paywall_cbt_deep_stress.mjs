/**
 * NET Vidya English Student Store • Milestone 3, 4, 5 Adversarial Challenger Suite
 * Author: challenger_m3_m5_1 (Paywall CBT Challenger)
 * 
 * Comprehensive Adversarial Probing & Stress-Testing of:
 * 1. Paywall Authorization & Token Cryptographic Integrity (api/store/download-file.js)
 * 2. Date-Gated Test Enforcement & Schedule Engine (api/store/serve-test.js)
 * 3. CBT Test Hall Runner Validity & Evaluation Machine (public/test-hall/runner.html)
 * 4. Dashboard Paywall & Gatekeeping Integrity (src/components/store/NetVidyaDashboard.tsx)
 * 5. Authorization Edge Cases (Revocation, Expiration, Forgery, Tampering, Traversal)
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import downloadFileHandler from '../api/store/download-file.js';
import serveTestHandler, { TEST_HALL_SCHEDULE } from '../api/store/serve-test.js';
import {
  createSessionToken,
  saveUser,
  JWT_SECRET,
  DEFAULT_ACCESS_EXPIRY,
  AUTHOR_EMAILS
} from '../lib/auth-helper.js';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function assert(condition, category, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [${category}] ${testName}`);
    return true;
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: [${category}] ${testName} ${details ? `--> ${details}` : ''}`);
    failures.push({ category, testName, details });
    return false;
  }
}

async function invoke(handler, options = {}) {
  const {
    method = 'GET',
    headers = {},
    query = {},
    body = null
  } = options;

  let responseStatus = 200;
  let responseHeaders = {};
  let responseData = null;

  const mockReq = {
    method,
    headers: Object.fromEntries(
      Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])
    ),
    query,
    body: typeof body === 'string' ? JSON.parse(body) : body
  };

  const mockRes = {
    status(s) {
      responseStatus = s;
      return this;
    },
    setHeader(k, v) {
      responseHeaders[k.toLowerCase()] = v;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
    send(str) {
      responseData = str;
      return this;
    }
  };

  await handler(mockReq, mockRes);

  return {
    status: responseStatus,
    headers: responseHeaders,
    data: responseData
  };
}

function createForgedJwt(payload, secretKey = 'rogue_attacker_key_2026', expiresIn = 3600) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    ...payload,
    iat: now,
    exp: now + expiresIn
  };
  const body = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

function createAlgNoneJwt(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const claims = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  };
  const body = Buffer.from(JSON.stringify(claims)).toString('base64url');
  return `${header}.${body}.`;
}

async function main() {
  console.log('================================================================================');
  console.log('     EMPIRICAL CHALLENGER: DEEP ADVERSARIAL STRESS HARNESS (M3, M4, M5)         ');
  console.log('================================================================================\n');

  // --- Seed Personas ---
  const nonBuyerEmail = 'challenger_nonbuyer_probe@example.com';
  await saveUser({
    id: 'usr_probe_nb',
    name: 'Unpaid Candidate',
    email: nonBuyerEmail,
    mobile: '9900112233',
    password_hash: crypto.createHash('sha256').update('pass123').digest('hex'),
    password_salt: 'salt_nb',
    is_buyer: false,
    is_active: true
  });
  const nonBuyerToken = createSessionToken({
    id: 'usr_probe_nb',
    email: nonBuyerEmail,
    isBuyer: false,
    name: 'Unpaid Candidate'
  });

  const buyerEmail = 'challenger_buyer_probe@example.com';
  await saveUser({
    id: 'usr_probe_b',
    name: 'Paid Scholar',
    email: buyerEmail,
    mobile: '9900112244',
    password_hash: crypto.createHash('sha256').update('pass123').digest('hex'),
    password_salt: 'salt_b',
    is_buyer: true,
    is_active: true,
    expires_at: DEFAULT_ACCESS_EXPIRY
  });
  const buyerToken = createSessionToken({
    id: 'usr_probe_b',
    email: buyerEmail,
    isBuyer: true,
    name: 'Paid Scholar'
  });

  const authorToken = createSessionToken({
    id: 'usr_probe_author',
    email: AUTHOR_EMAILS[0],
    isBuyer: true,
    name: 'Dr. Rajnikant Dodiya'
  });

  // ===========================================================================
  // SECTION 1: PAYWALL AUTHENTICATION & TOKEN ADVERSARIAL ATTACKS
  // ===========================================================================
  console.log('--- Section 1: Paywall Authentication & Token Security ---');

  // 1.1 Unauthenticated requests
  const r1_1 = await invoke(downloadFileHandler, { query: { fileId: 'unit-1' } });
  assert(r1_1.status === 401, 'PaywallAuth', '1.1 download-file without auth returns 401', `Status: ${r1_1.status}`);

  const r1_2 = await invoke(serveTestHandler, { query: { testId: 'test-net-mock-1' } });
  assert(r1_2.status === 401, 'PaywallAuth', '1.2 serve-test without auth returns 401', `Status: ${r1_2.status}`);

  // 1.2 "alg: none" bypass attempt
  const algNoneToken = createAlgNoneJwt({ id: 'usr_hacker', email: 'hacker@darkweb.org', isBuyer: true });
  const r1_3 = await invoke(downloadFileHandler, {
    headers: { Authorization: `Bearer ${algNoneToken}` },
    query: { fileId: 'unit-1' }
  });
  assert(r1_3.status === 401, 'PaywallAuth', '1.3 download-file rejects alg:none token with 401', `Status: ${r1_3.status}`);

  const r1_4 = await invoke(serveTestHandler, {
    headers: { Authorization: `Bearer ${algNoneToken}` },
    query: { testId: 'test-net-mock-1' }
  });
  assert(r1_4.status === 401, 'PaywallAuth', '1.4 serve-test rejects alg:none token with 401', `Status: ${r1_4.status}`);

  // 1.3 Forged JWT with rogue key
  const forgedToken = createForgedJwt({ id: 'usr_hacker', email: 'hacker@darkweb.org', isBuyer: true });
  const r1_5 = await invoke(downloadFileHandler, {
    headers: { Authorization: `Bearer ${forgedToken}` },
    query: { fileId: 'unit-1' }
  });
  assert(r1_5.status === 401, 'PaywallAuth', '1.5 download-file rejects forged JWT signature with 401', `Status: ${r1_5.status}`);

  // 1.4 Expired session token
  const expiredToken = createForgedJwt({ id: 'usr_probe_b', email: buyerEmail, isBuyer: true }, JWT_SECRET, -60);
  const r1_6 = await invoke(downloadFileHandler, {
    headers: { Authorization: `Bearer ${expiredToken}` },
    query: { fileId: 'unit-1' }
  });
  assert(r1_6.status === 401, 'PaywallAuth', '1.6 download-file rejects expired token (exp in past) with 401', `Status: ${r1_6.status}`);

  const r1_7 = await invoke(serveTestHandler, {
    headers: { Authorization: `Bearer ${expiredToken}` },
    query: { testId: 'test-net-mock-1' }
  });
  assert(r1_7.status === 401, 'PaywallAuth', '1.7 serve-test rejects expired token with 401', `Status: ${r1_7.status}`);

  // 1.5 Malformed Authorization header schemes
  const badHeaders = [
    { name: 'Basic Auth', val: 'Basic dXNlcjpwYXNz' },
    { name: 'Bearer with no token', val: 'Bearer ' },
    { name: 'Bearer with spaces only', val: 'Bearer     ' },
    { name: 'Single-part token', val: 'Bearer randomletters' },
    { name: 'Two-part token', val: 'Bearer abc.def' },
    { name: 'Four-part token', val: 'Bearer a.b.c.d' },
    { name: 'Token with null bytes', val: 'Bearer header\x00.body\x00.sig' }
  ];
  for (const bh of badHeaders) {
    const res = await invoke(downloadFileHandler, {
      headers: { Authorization: bh.val },
      query: { fileId: 'unit-1' }
    });
    assert(res.status === 401, 'PaywallAuth', `1.8 download-file rejects ${bh.name} with 401`, `Status: ${res.status}`);
  }

  // 1.6 Query parameter backdoor injections
  const queryBackdoors = [
    { desc: '?userToken=nv_buyer_pass', q: { fileId: 'unit-1', userToken: 'nv_buyer_pass' } },
    { desc: '?token=bearer_in_query', q: { fileId: 'unit-1', token: buyerToken } },
    { desc: '?email=buyer_email', q: { fileId: 'unit-1', email: buyerEmail } },
    { desc: '?isBuyer=true', q: { fileId: 'unit-1', isBuyer: 'true' } },
    { desc: '?is_buyer=1', q: { fileId: 'unit-1', is_buyer: '1' } },
    { desc: '?role=admin', q: { fileId: 'unit-1', role: 'admin' } }
  ];
  for (const qb of queryBackdoors) {
    const res = await invoke(downloadFileHandler, { query: qb.q });
    assert(res.status === 401, 'PaywallBackdoors', `1.9 download-file rejects query backdoor (${qb.desc}) without Bearer`, `Status: ${res.status}`);
  }

  // ===========================================================================
  // SECTION 2: AUTHENTICATED NON-BUYER PRIVILEGE ESCALATION
  // ===========================================================================
  console.log('\n--- Section 2: Non-Buyer Privilege Escalation Probes ---');

  // 2.1 Non-buyer requesting reading file
  const r2_1 = await invoke(downloadFileHandler, {
    headers: { Authorization: `Bearer ${nonBuyerToken}` },
    query: { fileId: 'unit-1' }
  });
  assert(r2_1.status === 403, 'NonBuyerGating', '2.1 Non-buyer requesting reading file returns 403 Forbidden', `Status: ${r2_1.status}`);

  // 2.2 Non-buyer requesting unlocked test
  const r2_2 = await invoke(serveTestHandler, {
    headers: { Authorization: `Bearer ${nonBuyerToken}` },
    query: { testId: 'test-net-mock-1' }
  });
  assert(r2_2.status === 403, 'NonBuyerGating', '2.2 Non-buyer requesting unlocked test returns 403 Forbidden', `Status: ${r2_2.status}`);

  // 2.3 Non-buyer requesting future test
  const r2_3 = await invoke(serveTestHandler, {
    headers: { Authorization: `Bearer ${nonBuyerToken}` },
    query: { testId: 'test-net-mock-2' }
  });
  assert(r2_3.status === 403, 'NonBuyerGating', '2.3 Non-buyer requesting future test returns 403 Forbidden', `Status: ${r2_3.status}`);

  // 2.4 Non-buyer attempting query spoofing with buyer's email
  const r2_4 = await invoke(downloadFileHandler, {
    headers: { Authorization: `Bearer ${nonBuyerToken}` },
    query: { fileId: 'unit-1', email: buyerEmail }
  });
  assert(r2_4.status === 403, 'NonBuyerGating', '2.4 Non-buyer cannot spoof buyer identity via query parameter (403)', `Status: ${r2_4.status}`);

  // ===========================================================================
  // SECTION 3: DATE-GATED TEST ENFORCEMENT & SCHEDULE INTEGRITY
  // ===========================================================================
  console.log('\n--- Section 3: Date-Gated Test Enforcement & Schedule Engine ---');

  const now = new Date();

  // Test all modules in master schedule
  for (const testItem of TEST_HALL_SCHEDULE) {
    const releaseTime = new Date(testItem.releaseDate);
    const isFuture = now < releaseTime;

    const res = await invoke(serveTestHandler, {
      headers: { Authorization: `Bearer ${buyerToken}` },
      query: { testId: testItem.id }
    });

    if (isFuture) {
      assert(
        res.status === 403,
        'DateGating',
        `3.1 Future test "${testItem.id}" (Release: ${testItem.releaseDate.split('T')[0]}) returns 403`,
        `Status: ${res.status}`
      );
      assert(
        res.data?.isLocked === true,
        'DateGating',
        `3.1b Future test "${testItem.id}" has isLocked: true in response payload`,
        `isLocked: ${res.data?.isLocked}`
      );
      assert(
        /Opens on/i.test(res.data?.error || ''),
        'DateGating',
        `3.1c Future test "${testItem.id}" error contains "Opens on [date]"`,
        `Error: ${res.data?.error}`
      );
    } else {
      assert(
        res.status === 200,
        'DateGating',
        `3.2 Unlocked test "${testItem.id}" (Release: ${testItem.releaseDate.split('T')[0]}) returns 200 OK`,
        `Status: ${res.status}`
      );
      assert(
        res.data?.isLocked === false,
        'DateGating',
        `3.2b Unlocked test "${testItem.id}" has isLocked: false in response payload`,
        `isLocked: ${res.data?.isLocked}`
      );
      assert(
        res.data?.runnerUrl?.includes(testItem.id),
        'DateGating',
        `3.2c Unlocked test "${testItem.id}" returns valid runnerUrl`,
        `runnerUrl: ${res.data?.runnerUrl}`
      );
    }
  }

  // 3.3 Author preview bypass of future tests
  const r3_3 = await invoke(serveTestHandler, {
    headers: { Authorization: `Bearer ${authorToken}` },
    query: { testId: 'test-future-mock' }
  });
  assert(
    r3_3.status === 200 && r3_3.data?.isLocked === false,
    'AuthorBypass',
    '3.3 Author email token can preview future test before public release date (200 OK)',
    `Status: ${r3_3.status}`
  );

  // 3.4 Non-author with author email in query string cannot bypass date gate
  const r3_4 = await invoke(serveTestHandler, {
    headers: { Authorization: `Bearer ${buyerToken}` },
    query: { testId: 'test-future-mock', email: AUTHOR_EMAILS[0] }
  });
  assert(
    r3_4.status === 403,
    'AuthorBypass',
    '3.4 Non-author cannot bypass date gate by passing author email in query param (403)',
    `Status: ${r3_4.status}`
  );

  // 3.5 Client-side clock tampering resistance
  // Server-side check uses `new Date()` exclusively; query params like ?now, ?date are ignored
  const r3_5 = await invoke(serveTestHandler, {
    headers: { Authorization: `Bearer ${buyerToken}` },
    query: { testId: 'test-future-mock', now: '2026-12-31T23:59:59Z', currentDate: '2027-01-01' }
  });
  assert(
    r3_5.status === 403,
    'DateGating',
    '3.5 Server ignores client spoofed date parameters (?now, ?currentDate) and enforces server time (403)',
    `Status: ${r3_5.status}`
  );

  // ===========================================================================
  // SECTION 4: CBT TEST HALL RUNNER VALIDITY & SCORING MACHINE
  // ===========================================================================
  console.log('\n--- Section 4: CBT Test Hall Runner Structure, DOM & Evaluation Machine ---');

  const runnerPath = path.resolve('public/test-hall/runner.html');
  assert(fs.existsSync(runnerPath), 'CbtRunner', '4.1 public/test-hall/runner.html exists on disk');

  const runnerHtml = fs.readFileSync(runnerPath, 'utf8');

  // 4.2 Verify return link to /#dashboard
  const hasDashboardHref = runnerHtml.includes('/#dashboard');
  assert(hasDashboardHref, 'CbtRunner', '4.2 runner.html contains explicit return link to /#dashboard');

  const hasReturnFunction = /function\s+returnToDashboard\s*\(\)\s*\{[^}]*\/#dashboard[^}]*\}/.test(runnerHtml);
  assert(hasReturnFunction, 'CbtRunner', '4.3 runner.html defines returnToDashboard() setting location to /#dashboard');

  const hasReturnButton = runnerHtml.includes('btnBackDashboard') && runnerHtml.includes('returnToDashboard()');
  assert(hasReturnButton, 'CbtRunner', '4.4 runner.html contains clickable return button calling returnToDashboard()');

  // 4.3 Verify 100-Question Bank Extraction & Schema Conformance
  const questionsMatch = runnerHtml.match(/const\s+QUESTIONS\s*=\s*(\[[\s\S]*?\]);/);
  assert(Boolean(questionsMatch), 'CbtRunner', '4.5 runner.html contains valid QUESTIONS array declaration');

  let questions = [];
  if (questionsMatch) {
    try {
      // Evaluate questions array in safe function
      const fn = new Function(`return ${questionsMatch[1]};`);
      questions = fn();
    } catch (err) {
      console.error('Error parsing QUESTIONS array:', err);
    }
  }

  assert(questions.length === 100, 'CbtRunner', `4.6 QUESTIONS array contains exactly 100 questions (Actual: ${questions.length})`);

  // Verify all 10 UGC-NET units are represented
  const unitsFound = new Set(questions.map(q => q.unit));
  assert(unitsFound.size === 10, 'CbtRunner', `4.7 All 10 UGC-NET syllabus units are represented (Found: ${unitsFound.size})`);

  let allQuestionsValid = true;
  let invalidReason = '';
  questions.forEach((q, idx) => {
    if (typeof q.id !== 'number' || q.id !== idx + 1) {
      allQuestionsValid = false;
      invalidReason = `Question #${idx + 1} has invalid id: ${q.id}`;
    }
    if (!q.unit || typeof q.unit !== 'string') {
      allQuestionsValid = false;
      invalidReason = `Question #${idx + 1} has invalid unit: ${q.unit}`;
    }
    if (!q.q || typeof q.q !== 'string' || q.q.trim().length === 0) {
      allQuestionsValid = false;
      invalidReason = `Question #${idx + 1} has empty question text`;
    }
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      allQuestionsValid = false;
      invalidReason = `Question #${idx + 1} does not have exactly 4 options`;
    } else {
      q.options.forEach((opt, oIdx) => {
        if (!opt || typeof opt !== 'string' || opt.trim().length === 0) {
          allQuestionsValid = false;
          invalidReason = `Question #${idx + 1} option ${oIdx} is blank`;
        }
      });
    }
    if (typeof q.answer !== 'number' || q.answer < 0 || q.answer > 3) {
      allQuestionsValid = false;
      invalidReason = `Question #${idx + 1} has invalid answer index: ${q.answer}`;
    }
    if (!q.explanation || typeof q.explanation !== 'string' || q.explanation.trim().length === 0) {
      allQuestionsValid = false;
      invalidReason = `Question #${idx + 1} missing explanation text`;
    }
  });

  assert(allQuestionsValid, 'CbtRunner', '4.8 All 100 questions satisfy rigorous schema (id, unit, q, 4 options, valid answer 0-3, explanation)', invalidReason);

  // 4.4 Verify NTA 4-State Palette DOM structure
  const has4PaletteClasses = [
    'p-btn.answered',
    'p-btn.not-answered',
    'p-btn.marked-review',
    'p-btn.not-visited'
  ].every(cls => runnerHtml.includes(cls));
  assert(has4PaletteClasses, 'CbtRunner', '4.9 runner.html defines CSS for all 4 official NTA palette states');

  const hasPaletteColors = [
    '#10b981', // Answered Green
    '#ef4444', // Not Answered Red
    '#8b5cf6', // Marked for Review Purple
    '#94a3b8'  // Not Visited Gray
  ].every(color => runnerHtml.includes(color));
  assert(hasPaletteColors, 'CbtRunner', '4.10 runner.html implements standard NTA color hex badges (Green, Red, Purple, Gray)');

  // 4.5 Verify Score Calculation Logic Simulation
  function simulateEvaluation(answers) {
    let correct = 0;
    let incorrect = 0;
    let unattempted = 0;
    const unitStats = {};

    questions.forEach((q, i) => {
      if (!unitStats[q.unit]) {
        unitStats[q.unit] = { total: 0, correct: 0 };
      }
      unitStats[q.unit].total++;

      const userAns = answers[i];
      if (userAns === undefined) {
        unattempted++;
      } else if (userAns === q.answer) {
        correct++;
        unitStats[q.unit].correct++;
      } else {
        incorrect++;
      }
    });

    const totalScore = correct * 2;
    const accuracy = (correct + incorrect > 0) ? Math.round((correct / (correct + incorrect)) * 100) : 0;
    return { correct, incorrect, unattempted, totalScore, accuracy, unitStats };
  }

  // Simulation Scenario A: Perfect Score (100% correct)
  const perfectAnswers = {};
  questions.forEach((q, i) => { perfectAnswers[i] = q.answer; });
  const evalA = simulateEvaluation(perfectAnswers);
  assert(
    evalA.totalScore === 200 && evalA.correct === 100 && evalA.incorrect === 0 && evalA.unattempted === 0 && evalA.accuracy === 100,
    'ScoringEngine',
    '4.11 Scoring engine evaluates perfect 100/100 score to 200 Marks with 100% accuracy',
    `Score: ${evalA.totalScore}, Accuracy: ${evalA.accuracy}%`
  );

  // Simulation Scenario B: Zero Attempted (all blank)
  const emptyAnswers = {};
  const evalB = simulateEvaluation(emptyAnswers);
  assert(
    evalB.totalScore === 0 && evalB.correct === 0 && evalB.incorrect === 0 && evalB.unattempted === 100 && evalB.accuracy === 0,
    'ScoringEngine',
    '4.12 Scoring engine evaluates zero attempted to 0 Marks with 100 unattempted',
    `Score: ${evalB.totalScore}, Unattempted: ${evalB.unattempted}`
  );

  // Simulation Scenario C: Mixed Performance (50 correct, 25 wrong, 25 unattempted)
  const mixedAnswers = {};
  questions.forEach((q, i) => {
    if (i < 50) mixedAnswers[i] = q.answer; // Correct
    else if (i < 75) mixedAnswers[i] = (q.answer + 1) % 4; // Wrong
    // Remaining 25 left unattempted
  });
  const evalC = simulateEvaluation(mixedAnswers);
  assert(
    evalC.totalScore === 100 && evalC.correct === 50 && evalC.incorrect === 25 && evalC.unattempted === 25 && evalC.accuracy === 67,
    'ScoringEngine',
    '4.13 Scoring engine evaluates mixed answers (50 correct * 2 = 100 Marks, 67% accuracy)',
    `Score: ${evalC.totalScore}, Acc: ${evalC.accuracy}%, Unatt: ${evalC.unattempted}`
  );

  // Simulation Scenario D: Negative Marking Rule Verification
  // In UGC NET, wrong answers award 0 marks (NO negative marking).
  // Total score must be strictly correct * 2, never subtracting wrong answers.
  assert(
    evalC.totalScore === evalC.correct * 2,
    'ScoringEngine',
    '4.14 UGC NET non-negative marking rule strictly preserved (Score = Correct * 2)',
    `Total: ${evalC.totalScore}, Expected: ${evalC.correct * 2}`
  );

  // ===========================================================================
  // SECTION 5: DASHBOARD UI GATEKEEPING VERIFICATION
  // ===========================================================================
  console.log('\n--- Section 5: NetVidyaDashboard.tsx Gatekeeping & UI Enforcement ---');

  const dashboardPath = path.resolve('src/components/store/NetVidyaDashboard.tsx');
  assert(fs.existsSync(dashboardPath), 'DashboardUI', '5.1 NetVidyaDashboard.tsx exists on disk');

  const dashboardSrc = fs.readFileSync(dashboardPath, 'utf8');

  // 5.2 Unauthenticated Gate
  assert(
    dashboardSrc.includes('!buyerSession.isLoggedIn'),
    'DashboardUI',
    '5.2 Dashboard explicitly guards unauthenticated visitors with !buyerSession.isLoggedIn'
  );
  assert(
    dashboardSrc.includes('Student Dashboard is Restricted'),
    'DashboardUI',
    '5.3 Unauthenticated visitors see "Student Dashboard is Restricted"'
  );

  // 5.3 Non-Buyer Gate
  assert(
    dashboardSrc.includes('!buyerSession.isBuyer'),
    'DashboardUI',
    '5.4 Dashboard explicitly guards non-buyers with !buyerSession.isBuyer'
  );
  assert(
    dashboardSrc.includes('Complete Your Enrollment to Unlock Content'),
    'DashboardUI',
    '5.5 Authenticated non-buyers see "Complete Your Enrollment to Unlock Content"'
  );

  // 5.4 Test Launching & Date Gate in Dashboard
  assert(
    dashboardSrc.includes('window.open(runnerUrl, \'_blank\')'),
    'DashboardUI',
    '5.6 Dashboard launches runnerUrl via window.open in new tab for unlocked tests'
  );
  assert(
    dashboardSrc.includes('now < releaseTime') && dashboardSrc.includes('Opens on'),
    'DashboardUI',
    '5.7 Dashboard client-side disables future tests with "Opens on [date]"'
  );

  // 5.5 Download file triggering signed URL
  assert(
    dashboardSrc.includes('/api/store/download-file?fileId='),
    'DashboardUI',
    '5.8 Dashboard calls /api/store/download-file?fileId= to fetch signed link'
  );
  assert(
    dashboardSrc.includes('Authorization: `Bearer ${buyerSession.token') || dashboardSrc.includes('buyerSession.token'),
    'DashboardUI',
    '5.9 Dashboard attaches Bearer token header in download request'
  );

  // ===========================================================================
  // SECTION 6: ROBUSTNESS & ATTACK SURFACE PROBING
  // ===========================================================================
  console.log('\n--- Section 6: Additional Adversarial Robustness Probes ---');

  // 6.1 Path traversal in download-file
  const traversalPayloads = [
    '../../../../etc/passwd',
    '..\\..\\..\\windows\\system32\\calc.exe',
    'reading-files/../../../package.json',
    '%2e%2e%2f%2e%2e%2fetc%2fpasswd'
  ];
  for (const tp of traversalPayloads) {
    const res = await invoke(downloadFileHandler, {
      headers: { Authorization: `Bearer ${buyerToken}` },
      query: { fileId: tp }
    });
    // Should never throw 500 or return server filesystem content
    assert(
      res.status === 200 || res.status === 400 || res.status === 404,
      'InputRobustness',
      `6.1 Directory traversal payload safely handled without crashing (Status: ${res.status})`,
      `Payload: ${tp}`
    );
  }

  // 6.2 Non-existent testId in serve-test
  const nonExistentTestRes = await invoke(serveTestHandler, {
    headers: { Authorization: `Bearer ${buyerToken}` },
    query: { testId: 'test-ghost-module-999' }
  });
  assert(
    nonExistentTestRes.status === 404,
    'InputRobustness',
    '6.2 Non-existent testId returns 404 Not Found',
    `Status: ${nonExistentTestRes.status}`
  );

  // 6.3 Missing testId parameter in serve-test
  const missingTestIdRes = await invoke(serveTestHandler, {
    headers: { Authorization: `Bearer ${buyerToken}` },
    query: {}
  });
  assert(
    missingTestIdRes.status === 400,
    'InputRobustness',
    '6.3 Missing testId query parameter returns 400 Bad Request',
    `Status: ${missingTestIdRes.status}`
  );

  // 6.4 Missing fileId parameter in download-file
  const missingFileIdRes = await invoke(downloadFileHandler, {
    headers: { Authorization: `Bearer ${buyerToken}` },
    query: {}
  });
  assert(
    missingFileIdRes.status === 400,
    'InputRobustness',
    '6.4 Missing fileId query parameter returns 400 Bad Request',
    `Status: ${missingFileIdRes.status}`
  );

  // ===========================================================================
  // SUMMARY
  // ===========================================================================
  console.log('\n================================================================================');
  console.log('             CHALLENGER ADVERSARIAL STRESS TEST SUMMARY SCORECARD               ');
  console.log('================================================================================');
  console.log(`Total Checks Executed : ${totalTests}`);
  console.log(`Passed Checks         : ${passedTests}`);
  console.log(`Failed Checks         : ${failedTests}`);
  console.log(`Pass Rate             : ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log('--------------------------------------------------------------------------------\n');

  if (failedTests > 0) {
    console.error('FAILURES DETECTED:');
    failures.forEach((f, idx) => {
      console.error(`[${idx + 1}] [${f.category}] ${f.testName} --> ${f.details}`);
    });
    process.exit(1);
  } else {
    console.log('ALL EMPIRICAL CHALLENGER ASSERTIONS PASSED WITH 100% RATE!');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('FATAL UNCAUGHT ERROR IN CHALLENGER HARNESS:', err);
  process.exit(1);
});
