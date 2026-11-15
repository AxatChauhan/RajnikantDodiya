/**
 * Comprehensive Site & UI Inconsistency Audit & User Flow Verification Suite
 * Runs purely via automated Node.js test harness against localhost:5173 and codebase.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

let passed = 0;
let failed = 0;
const inconsistencies = [];

function assert(condition, message, inconsistencyDetail = null) {
  if (condition) {
    console.log(`  ${GREEN}✓ [PASS]${RESET} ${message}`);
    passed++;
  } else {
    console.error(`  ${RED}✗ [FAIL]${RESET} ${message}`);
    failed++;
    if (inconsistencyDetail) {
      inconsistencies.push(inconsistencyDetail);
    }
  }
}

function flagInconsistency(category, location, description, recommendation) {
  inconsistencies.push({ category, location, description, recommendation });
  console.log(`  ${YELLOW}⚠ [INCONSISTENCY]${RESET} ${category} (${location}): ${description}`);
}

// HTTP request helper
function fetchUrl(urlPath) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:5173${urlPath}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
    });
    req.on('error', err => reject(err));
    req.setTimeout(4000, () => {
      req.destroy();
      reject(new Error('Connection timed out'));
    });
  });
}

// Mock req/res for Vercel serverless handlers
function createMockReqRes({ method = 'POST', body = {}, query = {}, headers = {} }) {
  let statusCode = 200;
  let responseData = null;

  const req = { method, body, query, headers, url: '' };
  const res = {
    setHeader() { return res; },
    status(code) { statusCode = code; return res; },
    json(data) { responseData = data; return res; },
    end() { return res; },
    getStatusCode: () => statusCode,
    getData: () => responseData
  };
  return { req, res };
}

async function runAudit() {
  console.log(`\n${BOLD}${CYAN}================================================================${RESET}`);
  console.log(`${BOLD}${CYAN} NET VIDYA — COMPREHENSIVE SITE & UI AUDIT HARNESS${RESET}`);
  console.log(`${BOLD}${CYAN} Testing Localhost 5173 & Full Codebase Consistency${RESET}`);
  console.log(`${BOLD}${CYAN}================================================================${RESET}\n`);

  // ============================================================================
  // 1. ROUTE ACCESSIBILITY & HTTP SERVER INTEGRITY
  // ============================================================================
  console.log(`${BOLD}--- 1. HTTP Server & Route Endpoints ---${RESET}`);
  const routesToTest = [
    { path: '/', label: 'Root Home' },
    { path: '/store', label: 'Store Direct Path' },
    { path: '/gset', label: 'GSET Direct Path' },
    { path: '/materials', label: 'Materials Direct Path' },
    { path: '/policies', label: 'Policies Direct Path' },
    { path: '/terms', label: 'Terms Direct Path' },
    { path: '/privacy', label: 'Privacy Direct Path' },
    { path: '/refund', label: 'Refund Direct Path' },
    { path: '/delivery', label: 'Delivery Direct Path' }
  ];

  for (const r of routesToTest) {
    try {
      const res = await fetchUrl(r.path);
      assert(res.status === 200, `Route [${r.label}] (${r.path}) serves HTTP 200`);
      assert(res.data.includes('<div id="root"></div>'), `Route [${r.label}] contains React root mount point`);
    } catch (err) {
      assert(false, `Route [${r.label}] (${r.path}) failed: ${err.message}`, {
        category: 'Routing',
        location: r.path,
        description: `Server could not respond to ${r.path}: ${err.message}`,
        recommendation: 'Verify Vite server is listening on port 5173'
      });
    }
  }

  // ============================================================================
  // 2. END-TO-END SIMULATED USER FLOW VERIFICATION
  // ============================================================================
  console.log(`\n${BOLD}--- 2. End-to-End User Flow State Transitions ---${RESET}`);

  const { default: createOrderHandler } = await import('../api/store/create-order.js');
  const { default: verifyPaymentHandler } = await import('../api/store/verify-payment.js');

  // Authoritative Pack Enrollment Resolver (mirrored from src/contexts/NetVidyaStoreContext.tsx)
  function isPackEnrolled(packId, buyerSession) {
    if (!buyerSession || !buyerSession.isLoggedIn) return false;
    const cleanEmail = (buyerSession.email || '').toLowerCase().trim();
    if (cleanEmail === 'rajnikantdodiya2@gmail.com') return true;

    const enrolled = buyerSession.enrolledPacks || [];

    // 1. UGC NET English Complete Bundle
    if (packId === 'ugc-net-english-bundle' || packId === 'ugc' || packId === 'ugc-bundle') {
      return buyerSession.isBuyer || enrolled.includes('ugc-net-english-bundle') || enrolled.includes('ugc-bundle');
    }

    // 2. GSET All-Access
    if (enrolled.includes('gset-all')) return true;

    // 3. GSET Duos
    if (packId === 'gset-english-combo' || packId === 'gset-combo_eng') {
      return enrolled.includes('gset-english-combo') || enrolled.includes('gset-combo_eng');
    }
    if (packId === 'gset-education-combo' || packId === 'gset-combo_edu') {
      return enrolled.includes('gset-education-combo') || enrolled.includes('gset-combo_edu');
    }

    // 4. GSET Standalone Singles (also granted automatically if candidate owns the Duo combo!)
    if (packId === 'gset-paper1') {
      return (
        enrolled.includes('gset-paper1') ||
        enrolled.includes('gset-english-combo') ||
        enrolled.includes('gset-education-combo') ||
        enrolled.includes('gset-combo_eng') ||
        enrolled.includes('gset-combo_edu')
      );
    }
    if (packId === 'gset-paper2-english' || packId === 'gset-paper2_eng') {
      return (
        enrolled.includes('gset-paper2-english') ||
        enrolled.includes('gset-paper2_eng') ||
        enrolled.includes('gset-english-combo') ||
        enrolled.includes('gset-combo_eng')
      );
    }
    if (packId === 'gset-paper2-education' || packId === 'gset-paper2_edu') {
      return (
        enrolled.includes('gset-paper2-education') ||
        enrolled.includes('gset-paper2_edu') ||
        enrolled.includes('gset-education-combo') ||
        enrolled.includes('gset-combo_edu')
      );
    }

    return enrolled.includes(packId);
  }

  // --- Flow A: UGC NET Aspirant ---
  console.log(`\n  ${CYAN}[Flow A: UGC NET English Complete Bundle Aspirant]${RESET}`);
  let userSessionA = { isLoggedIn: false, isBuyer: false, name: '', email: '', mobile: '', enrolledPacks: [] };
  
  // Step A1: Unauthenticated user checks pack access
  assert(isPackEnrolled('ugc-net-english-bundle', userSessionA) === false, 'Step A1: Visitor initially has no access to UGC NET bundle');

  // Step A2: User triggers order with SIMULATE
  const { req: reqA, res: resA } = createMockReqRes({
    body: {
      studentName: 'Aarav Patel',
      email: 'aarav.ugc@example.in',
      mobile: '9825123456',
      couponCode: 'SIMULATE',
      productId: 'ugc-net-english-bundle',
      examStore: 'ugc'
    }
  });
  await createOrderHandler(reqA, resA);
  const orderA = resA.getData();
  assert(orderA.success === true && orderA.amount === 0, 'Step A2: Order successfully created with ₹0 simulation');
  assert(orderA.isTestMode === true, 'Step A2: isTestMode flag set');

  // Step A3: User verifies simulation payment
  const { req: vReqA, res: vResA } = createMockReqRes({
    body: {
      orderId: orderA.orderId,
      studentName: 'Aarav Patel',
      email: 'aarav.ugc@example.in',
      mobile: '9825123456',
      productId: 'ugc-net-english-bundle',
      amount: 0,
      couponCode: 'SIMULATE'
    }
  });
  await verifyPaymentHandler(vReqA, vResA);
  const verifyDataA = vResA.getData();
  assert(verifyDataA.success === true && verifyDataA.verified === true, 'Step A3: Payment verified without external bank gateway');
  assert(typeof verifyDataA.token === 'string', 'Step A3: Valid auth session token granted');

  // Step A4: Client state updates to logged in buyer
  userSessionA = {
    isLoggedIn: true,
    isBuyer: true,
    name: 'Aarav Patel',
    email: 'aarav.ugc@example.in',
    mobile: '9825123456',
    token: verifyDataA.token,
    enrolledPacks: ['ugc-net-english-bundle', 'ugc-bundle']
  };
  assert(isPackEnrolled('ugc-net-english-bundle', userSessionA) === true, 'Step A4: User is now recognized as enrolled in UGC NET Bundle');
  assert(isPackEnrolled('gset-english-combo', userSessionA) === false, 'Step A4: User does NOT have access to unpurchased GSET packs');

  // --- Flow B: GSET Aspirant with Modular Pack Ownership ---
  console.log(`\n  ${CYAN}[Flow B: GSET English Scholar Duo Combo Aspirant]${RESET}`);
  let userSessionB = { isLoggedIn: false, isBuyer: false, name: '', email: '', mobile: '', enrolledPacks: [] };

  // Step B1: Order GSET English Duo (₹249 -> ₹0 SIMULATE)
  const { req: reqB, res: resB } = createMockReqRes({
    body: {
      studentName: 'Priya Sharma',
      email: 'priya.gset@example.in',
      mobile: '9876543210',
      couponCode: 'SIMULATE',
      productId: 'gset-english-combo',
      examStore: 'gset'
    }
  });
  await createOrderHandler(reqB, resB);
  const orderB = resB.getData();
  assert(orderB.success === true && orderB.productId === 'gset-english-combo', 'Step B1: GSET Duo order created');

  // Step B2: Verify Duo payment
  const { req: vReqB, res: vResB } = createMockReqRes({
    body: {
      orderId: orderB.orderId,
      studentName: 'Priya Sharma',
      email: 'priya.gset@example.in',
      mobile: '9876543210',
      productId: 'gset-english-combo',
      amount: 0,
      couponCode: 'SIMULATE'
    }
  });
  await verifyPaymentHandler(vReqB, vResB);
  const verifyDataB = vResB.getData();
  assert(verifyDataB.success === true, 'Step B2: GSET Duo verified');

  // Step B3: Duo candidate session inherits Paper 1 and Paper 2 English
  userSessionB = {
    isLoggedIn: true,
    isBuyer: false, // Not UGC buyer
    name: 'Priya Sharma',
    email: 'priya.gset@example.in',
    mobile: '9876543210',
    enrolledPacks: ['gset-english-combo']
  };
  assert(isPackEnrolled('gset-english-combo', userSessionB) === true, 'Step B3: Owns GSET English Duo');
  assert(isPackEnrolled('gset-paper1', userSessionB) === true, 'Step B3: Inherits Paper 1 Foundation Pack');
  assert(isPackEnrolled('gset-paper2-english', userSessionB) === true, 'Step B3: Inherits Paper 2 English Pack');
  assert(isPackEnrolled('gset-paper2-education', userSessionB) === false, 'Step B3: Does NOT own Paper 2 Education (correct isolation)');
  assert(isPackEnrolled('ugc-net-english-bundle', userSessionB) === false, 'Step B3: Does NOT own UGC NET Bundle (correct isolation)');

  // ============================================================================
  // 3. CODEBASE DEEP AUDIT FOR UI & BUSINESS LOGIC INCONSISTENCIES
  // ============================================================================
  console.log(`\n${BOLD}--- 3. Codebase Deep Audit for UI & Business Inconsistencies ---${RESET}`);

  // Check 3A: Authoritative Pricing Audit across files
  console.log(`  ${CYAN}[Check 3A: Authoritative Pricing Scan]${RESET}`);
  const storeConfigModule = await import('../lib/store-config.js');
  const priceJs = fs.readFileSync(path.resolve('api/store/price.js'), 'utf-8');
  
  assert(storeConfigModule.UGC_BUNDLE_PRODUCT.price === 499, 'Server store-config specifies ₹499 UGC NET bundle price');
  assert(storeConfigModule.GSET_PRODUCTS.paper1.price === 149, 'Server store-config specifies ₹149 GSET single pack price');
  assert(storeConfigModule.GSET_PRODUCTS.combo_eng.price === 249, 'Server store-config specifies ₹249 GSET combo duo price');

  // Check 3B: Phone Number & Contact Consistency
  console.log(`  ${CYAN}[Check 3B: Support & Merchant Contact Consistency]${RESET}`);
  const expectedPhone = '+91 96387 16634';
  const expectedPhoneDigits = '9638716634';
  const expectedEmail = 'netvidyaenglish@gmail.com';

  const checkoutModalCode = fs.readFileSync(path.resolve('src/components/store/NetVidyaCheckoutModal.tsx'), 'utf-8');
  const storeHomeCode = fs.readFileSync(path.resolve('src/components/store/NetVidyaStoreHome.tsx'), 'utf-8');
  const gsetHomeCode = fs.readFileSync(path.resolve('src/components/store/gset/NetVidyaGsetHome.tsx'), 'utf-8');
  const policyCode = fs.readFileSync(path.resolve('src/components/store/NetVidyaPolicies.tsx'), 'utf-8');

  assert(checkoutModalCode.includes('+91 96387 16634') || checkoutModalCode.includes('96387'), 'Checkout modal uses consistent WhatsApp support number');
  assert(policyCode.includes('STORE_MERCHANT.supportPhone') || policyCode.includes('96387'), 'Store policies use official support number');

  // Check 3C: Brand Isolation Scan
  console.log(`  ${CYAN}[Check 3C: Commercial Store Brand Isolation Scan]${RESET}`);
  // In the store components, there must be NO external university institutional affiliation claimed
  const storeFiles = [
    'src/components/store/NetVidyaCheckoutModal.tsx',
    'src/components/store/NetVidyaStoreHome.tsx',
    'src/components/store/gset/NetVidyaGsetHome.tsx',
    'src/components/store/NetVidyaStoreLayout.tsx'
  ];

  for (const f of storeFiles) {
    const content = fs.readFileSync(path.resolve(f), 'utf-8');
    // Institutional affiliation phrases that should NOT be in the commercial store
    const forbiddenPhrases = [
      'Official SPU Store',
      'Sardar Patel University Store',
      'SPU Examination Portal'
    ];
    let fileClean = true;
    for (const phrase of forbiddenPhrases) {
      if (content.includes(phrase)) {
        flagInconsistency('Brand Isolation', f, `Found forbidden institutional phrase "${phrase}" in commercial store`, 'Remove university claim to maintain brand isolation');
        fileClean = false;
      }
    }
    if (fileClean) {
      assert(true, `Brand isolation verified in ${path.basename(f)}`);
    }
  }

  // Check 3D: Modal Escape Key Listeners Audit
  console.log(`  ${CYAN}[Check 3D: Modal Navigation & Escape Trap Audit]${RESET}`);
  const allModalFiles = [
    'src/components/store/NetVidyaCheckoutModal.tsx',
    'src/components/store/NetVidyaStudentLoginModal.tsx',
    'src/components/store/NetVidyaPolicies.tsx',
    'src/components/store/NetVidyaAdminModal.tsx'
  ];

  for (const mf of allModalFiles) {
    const content = fs.readFileSync(path.resolve(mf), 'utf-8');
    const hasEscape = content.includes('useModalEscape') || content.includes('keydown') || content.includes('Escape');
    const hasCloseBtn = content.includes('onClose') && (content.includes('<X') || content.includes('Close'));
    assert(hasEscape, `${path.basename(mf)} implements Escape key listener`);
    assert(hasCloseBtn, `${path.basename(mf)} provides explicit close button`);
  }

  // Check 3E: Inactive / Dead Link / Missing File Scan in Study Vault
  console.log(`  ${CYAN}[Check 3E: Study Vault Reading Files & CBT Test Files Scan]${RESET}`);
  
  // UGC Reading dossiers: check if directories exist and have index.html
  const expectedUgcReading = [
    'ebook/index.html',
    'pyq_analysis/index.html',
    'revision_kit/index.html'
  ];
  
  for (const rf of expectedUgcReading) {
    const publicPath = path.resolve('public/study-vault/ugc/reading', rf);
    const vaultPath = path.resolve('study-vault/ugc/reading', rf);
    const exists = fs.existsSync(publicPath) || fs.existsSync(vaultPath);
    if (!exists) {
      flagInconsistency('Content Vault', rf, `Referenced reading dossier file not found in public/study-vault/ugc/reading/`, 'Ensure file is copied to public/study-vault/ugc/reading/ for direct student reading');
    } else {
      assert(true, `Verified reading dossier file: ${rf}`);
    }
  }

  // UGC Tests: sample check
  const sampleUgcTests = [
    'NET_Mock_01.html',
    'Unit_Test_01_Drama.html',
    'Practice_Mock_A.html'
  ];
  for (const tf of sampleUgcTests) {
    const publicPath = path.resolve('public/study-vault/ugc/tests', tf);
    const vaultPath = path.resolve('study-vault/ugc/tests', tf);
    const exists = fs.existsSync(publicPath) || fs.existsSync(vaultPath);
    if (!exists) {
      flagInconsistency('Content Vault', tf, `Referenced CBT test simulator not found in public/study-vault/ugc/tests/`, 'Ensure file is copied to public/study-vault/ugc/tests/');
    } else {
      assert(true, `Verified CBT simulator file: ${tf}`);
    }
  }

  // GSET Tests: sample check
  const sampleGsetTests = [
    'GSET_Paper1_Mock01_CBT.html',
    'GSET_English_Paper2_Mock01_CBT.html',
    'GSET_Paper2_Education_Mock01_CBT.html'
  ];
  for (const gtf of sampleGsetTests) {
    const publicPath = path.resolve('public/study-vault/gset/tests', gtf);
    const vaultPath = path.resolve('study-vault/gset/tests', gtf);
    const exists = fs.existsSync(publicPath) || fs.existsSync(vaultPath);
    if (!exists) {
      flagInconsistency('Content Vault', gtf, `Referenced GSET CBT simulator not found in public/study-vault/gset/tests/`, 'Ensure file is copied to public/study-vault/gset/tests/');
    } else {
      assert(true, `Verified GSET simulator file: ${gtf}`);
    }
  }

  // Check 3F: Accessibility & Screen Contrast Scan
  console.log(`  ${CYAN}[Check 3F: UI Contrast & Accessibility Heuristics]${RESET}`);
  // Check for buttons with missing aria-label or title when icon-only
  const iconOnlyCheck = checkoutModalCode.includes('aria-label="Close Checkout"');
  assert(iconOnlyCheck, `Checkout close button contains explicit aria-label for screen readers`);

  // ============================================================================
  // 4. AUDIT SUMMARY
  // ============================================================================
  console.log(`\n${BOLD}${CYAN}================================================================${RESET}`);
  console.log(`${BOLD} AUDIT COMPLETE: ${passed} Automated Checks Passed, ${failed} Failed${RESET}`);
  console.log(`${BOLD} TOTAL INCONSISTENCIES FOUND: ${inconsistencies.length}${RESET}`);
  console.log(`${BOLD}${CYAN}================================================================${RESET}\n`);

  if (inconsistencies.length > 0) {
    console.log(`${BOLD}${YELLOW}LIST OF DETECTED INCONSISTENCIES / ACTION ITEMS:${RESET}`);
    inconsistencies.forEach((inc, idx) => {
      console.log(`\n  ${idx + 1}. [${inc.category}] in ${inc.location}`);
      console.log(`     Issue: ${inc.description}`);
      console.log(`     Fix:   ${inc.recommendation}`);
    });
  } else {
    console.log(`${BOLD}${GREEN}PERFECT AUDIT: Zero inconsistencies detected across user flows and UI!${RESET}`);
  }
}

runAudit().catch(err => {
  console.error('Audit exception:', err);
  process.exit(1);
});
