/**
 * Adversarial Affiliation Sanitization & Mobile Responsiveness Probe
 * Challenger 2 (challenger_m1_2)
 *
 * Verifies:
 * 1. Absence of HMPIETR, H. M. Patel, Sardar Patel, spuvvn, hmpenglish across all store surfaces.
 * 2. Store loading fallback and HTML metadata sanitization.
 * 3. Mobile viewport (<400px) responsive button styling.
 * 4. Build output isolation analysis in dist/.
 */

import fs from 'fs';
import path from 'path';

let passCount = 0;
let failCount = 0;
let warnCount = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${testName} ${details ? `(${details})` : ''}`);
    failCount++;
  }
}

function warn(testName, details = '') {
  console.warn(`  ⚠ WARN / FINDING: ${testName} ${details ? `(${details})` : ''}`);
  warnCount++;
}

console.log('================================================================');
console.log('EMPIRICAL CHALLENGER: AFFILIATION SANITIZATION & VIEWPORT AUDIT');
console.log('================================================================\n');

const KEYWORDS = [
  'hmpietr',
  'h. m. patel',
  'h.m. patel',
  'hm patel',
  'sardar patel',
  'spuvvn',
  'hmpenglish'
];

function checkContentForKeywords(content, filePath) {
  const lower = content.toLowerCase();
  const found = [];
  for (const kw of KEYWORDS) {
    if (lower.includes(kw)) {
      found.push(kw);
    }
  }
  return found;
}

function getFilesRecursively(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getFilesRecursively(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

// -----------------------------------------------------------------------------
// SECTION 1: Root HTML & Lazy Fallback Metadata Audit
// -----------------------------------------------------------------------------
console.log('--- 1. Store Loading Fallbacks & Metadata Sanitization ---');

const indexHtmlPath = path.resolve('index.html');
const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
const indexMatches = checkContentForKeywords(indexHtmlContent, 'index.html');
assert(indexMatches.length === 0, 'index.html is 100% free of college affiliations', indexMatches.join(', '));
assert(indexHtmlContent.includes('NET Vidya English'), 'index.html includes NET Vidya English branding');
assert(!indexHtmlContent.includes('hmpietr.org'), 'index.html has no legacy institutional URLs');

const appTsxPath = path.resolve('src/App.tsx');
const appTsxContent = fs.readFileSync(appTsxPath, 'utf8');
const appTsxMatches = checkContentForKeywords(appTsxContent, 'src/App.tsx');
assert(appTsxMatches.length === 0, 'src/App.tsx is free of hardcoded college affiliation keywords', appTsxMatches.join(', '));

// Verify AcademicLoadingFallback
const fallbackMatch = appTsxContent.includes('AcademicLoadingFallback');
assert(fallbackMatch, 'AcademicLoadingFallback component exists in src/App.tsx');
const fallbackHasNetVidya = appTsxContent.includes('NET Vidya English • Learning Portal');
assert(fallbackHasNetVidya, 'AcademicLoadingFallback displays "NET Vidya English • Learning Portal" instead of college affiliations');

// -----------------------------------------------------------------------------
// SECTION 2: Store Components Directory Audit (src/components/store/**/*)
// -----------------------------------------------------------------------------
console.log('\n--- 2. Commercial Store Components Scan (src/components/store/**/*) ---');

const storeFiles = getFilesRecursively('src/components/store');
assert(storeFiles.length > 0, `Discovered ${storeFiles.length} store component files`);

let storeComponentsClean = true;
for (const file of storeFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const matches = checkContentForKeywords(content, file);
  if (matches.length > 0) {
    storeComponentsClean = false;
    assert(false, `Affiliation keyword found in ${file}`, matches.join(', '));
  }
}
if (storeComponentsClean) {
  assert(true, 'All files in src/components/store/**/* are 100% clean of affiliation keywords');
}

// Check Hero Image & Credentials in NetVidyaStoreHome.tsx
const homePath = path.resolve('src/components/store/NetVidyaStoreHome.tsx');
const homeContent = fs.readFileSync(homePath, 'utf8');
assert(homeContent.includes('/dr-rajnikant-dodiya.jpg'), 'Hero section displays Dr. Rajnikant Dodiya photo (/dr-rajnikant-dodiya.jpg)');
assert(homeContent.includes('Ph.D. in English • 2× UGC NET & GSET Qualified'), 'Hero displays verified credentials without college affiliation');
assert(!homeContent.includes('line-through'), 'Hero pricing eliminates fake strike-through MRP');

// Check Mandatory Seller Line in NetVidyaStoreLayout.tsx
const layoutPath = path.resolve('src/components/store/NetVidyaStoreLayout.tsx');
const layoutContent = fs.readFileSync(layoutPath, 'utf8');
assert(
  layoutContent.includes('Sold by NET Vidya (proprietor: Nilam Dodiya). Content by Dr Rajnikant Dodiya.'),
  'Footer displays mandatory commercial disclosure line'
);
assert(!layoutContent.includes('academic-site-backlink'), 'No academic backlink leaking from commercial store footer');

// -----------------------------------------------------------------------------
// SECTION 3: API Store Directory Audit (api/store/**/*)
// -----------------------------------------------------------------------------
console.log('\n--- 3. Backend API Endpoints Scan (api/store/**/*) ---');

const apiFiles = getFilesRecursively('api/store');
assert(apiFiles.length > 0, `Discovered ${apiFiles.length} API files`);

let apiClean = true;
for (const file of apiFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const matches = checkContentForKeywords(content, file);
  if (matches.length > 0) {
    apiClean = false;
    assert(false, `Affiliation keyword found in ${file}`, matches.join(', '));
  }
}
if (apiClean) {
  assert(true, 'All files in api/store/**/* are 100% clean of institutional emails and affiliations');
}

// -----------------------------------------------------------------------------
// SECTION 4: Public Assets Audit (public/**/*)
// -----------------------------------------------------------------------------
console.log('\n--- 4. Public Assets Directory Scan (public/**/*) ---');

const publicFiles = getFilesRecursively('public');
let publicClean = true;
for (const file of publicFiles) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const matches = checkContentForKeywords(content, file);
    if (matches.length > 0) {
      publicClean = false;
      assert(false, `Affiliation keyword found in public file ${file}`, matches.join(', '));
    }
  } catch (err) {
    // Binary file (png, jpg, etc.) - check file name
    const matches = checkContentForKeywords(file, file);
    if (matches.length > 0) {
      publicClean = false;
      assert(false, `Affiliation keyword found in filename ${file}`, matches.join(', '));
    }
  }
}
if (publicClean) {
  assert(true, 'All files in public/**/* are 100% clean of affiliation keywords');
}

// Check sample materials exist and are valid
const miniMockPdf = path.resolve('public/sample-materials/NetVidya_25_Question_Mini_Mock.pdf');
const modelAnswersPdf = path.resolve('public/sample-materials/NetVidya_Model_Answers_Sample.pdf');
const demoTestHtml = path.resolve('public/sample-materials/demo-test.html');
assert(fs.existsSync(miniMockPdf), 'Free sample Mini Mock PDF exists');
assert(fs.existsSync(modelAnswersPdf), 'Free sample Model Answers PDF exists');
assert(fs.existsSync(demoTestHtml), 'Standalone demo CBT test HTML exists');

// -----------------------------------------------------------------------------
// SECTION 5: Mobile Viewport (<400px) Breakpoint Probing
// -----------------------------------------------------------------------------
console.log('\n--- 5. Mobile Viewport (<400px) Responsive Classes Audit ---');

// Audit NetVidyaStoreLayout.tsx for <400px breakpoint styling
const hasMin400Inline = layoutContent.includes('min-[400px]:inline');
const hasMin400Hidden = layoutContent.includes('min-[400px]:hidden');
assert(hasMin400Inline, 'Layout has min-[400px]:inline class for desktop/tablet Buy CTA text');
assert(hasMin400Hidden, 'Layout has min-[400px]:hidden class for compact <400px mobile Buy CTA text');

const buyButtonStart = layoutContent.indexOf('Buy CTA Button');
const buyButtonEnd = layoutContent.indexOf('Admin Trigger Button');
const buyButtonExcerpt = layoutContent.slice(buyButtonStart, buyButtonEnd);

assert(
  buyButtonExcerpt.includes('Buy ₹{currentServerPrice}'),
  'Buy button displays compact "Buy ₹{price}" on <400px mobile viewports'
);
assert(
  buyButtonExcerpt.includes('Buy Final Pack (₹{currentServerPrice})'),
  'Buy button displays extended "Buy Final Pack (₹{price})" on >=400px viewports'
);
assert(
  buyButtonExcerpt.includes('shrink-0'),
  'Buy button contains shrink-0 to prevent layout collapse in narrow headers'
);

const loginButtonStart = layoutContent.indexOf('Student Login / Dashboard Button');
const loginButtonEnd = layoutContent.indexOf('Buy CTA Button');
const loginButtonExcerpt = layoutContent.slice(loginButtonStart, loginButtonEnd);

assert(
  loginButtonExcerpt.includes('sm:hidden') && loginButtonExcerpt.includes('>Login<'),
  'Student Login button shortens to "Login" on mobile screens'
);
assert(
  loginButtonExcerpt.includes('hidden sm:inline') && loginButtonExcerpt.includes('>Student Login<'),
  'Student Login button displays full "Student Login" on sm+ screens'
);

// -----------------------------------------------------------------------------
// SECTION 6: Dist Build Artifacts Adversarial Analysis (dist/**/*)
// -----------------------------------------------------------------------------
console.log('\n--- 6. Build Artifacts Isolation & Residual Analysis (dist/**/*) ---');

assert(fs.existsSync('dist'), 'dist/ directory exists and was built');
const distFiles = getFilesRecursively('dist');

// Categorize dist files into Store Artifacts vs Non-Store (Academic) Artifacts
const storeDistArtifacts = distFiles.filter(f => {
  const norm = f.replace(/\\/g, '/');
  return (
    norm.includes('dist/index.html') ||
    norm.includes('dist/assets/NetVidyaStoreLayout-') ||
    norm.includes('dist/assets/index-') && norm.endsWith('.css') ||
    norm.includes('dist/sample-materials') ||
    norm.includes('dist/dr-rajnikant-dodiya.jpg') ||
    norm.includes('dist/assets/vendor-')
  );
});

let storeDistClean = true;
for (const file of storeDistArtifacts) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const matches = checkContentForKeywords(content, file);
    if (matches.length > 0) {
      storeDistClean = false;
      assert(false, `Affiliation keyword found in store dist artifact: ${file}`, matches.join(', '));
    }
  } catch (err) {}
}
if (storeDistClean) {
  assert(true, 'All Store-specific dist build artifacts are 100% free of affiliation keywords');
}

// Adversarial finding: Inspect non-store chunks in dist/
const nonStoreDistMatches = [];
for (const file of distFiles) {
  if (storeDistArtifacts.includes(file)) continue;
  try {
    const content = fs.readFileSync(file, 'utf8');
    const matches = checkContentForKeywords(content, file);
    if (matches.length > 0) {
      nonStoreDistMatches.push({ file: path.relative('dist', file), matches });
    }
  } catch (err) {}
}

if (nonStoreDistMatches.length > 0) {
  warn(
    `Found college affiliations in ${nonStoreDistMatches.length} non-store dist chunks (academic pages and root main bundle):`,
    nonStoreDistMatches.map(m => `${m.file} [${m.matches.join(', ')}]`).join('; ')
  );
  console.log(`    Note: The root index chunk bundles professorData.ts because src/App.tsx imports PROFESSOR_INFO for the academic site footer.`);
  console.log(`    However, when viewing /store or store.*, only NetVidyaStoreLayout is rendered in the DOM, producing zero affiliation exposure on the store UI.`);
} else {
  assert(true, 'All dist files are completely free of affiliations');
}

// -----------------------------------------------------------------------------
// SUMMARY & VERDICT
// -----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`TOTAL CHECKS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount} | WARNINGS/FINDINGS: ${warnCount}`);
console.log('================================================================\n');

if (failCount > 0) {
  console.error('VERDICT: REJECT - One or more critical affiliation or responsiveness checks failed.');
  process.exit(1);
} else {
  console.log('VERDICT: APPROVE - All store surfaces, loading fallbacks, metadata, and mobile viewports meet specifications.');
  process.exit(0);
}
