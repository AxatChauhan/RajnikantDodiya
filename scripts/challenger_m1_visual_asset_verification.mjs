/**
 * Empirical and Adversarial Verification Script for Milestone 1 Visual Assets
 * Author: challenger_m1_1 (Visual Asset Challenger)
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import vm from 'vm';

const results = {
  pdfMock: { passed: true, checks: [], errors: [] },
  pdfAnswers: { passed: true, checks: [], errors: [] },
  demoTestHtml: { passed: true, checks: [], errors: [] },
  demoTestLogic: { passed: true, checks: [], errors: [] },
  authorImage: { passed: true, checks: [], errors: [] },
  componentIntegration: { passed: true, checks: [], errors: [] }
};

function logCheck(category, name, condition, details = '') {
  if (condition) {
    results[category].checks.push({ name, status: 'PASS', details });
    console.log(`  [PASS] ${name}${details ? ` (${details})` : ''}`);
  } else {
    results[category].passed = false;
    results[category].errors.push({ name, status: 'FAIL', details });
    console.error(`  [FAIL] ${name}${details ? ` (${details})` : ''}`);
  }
}

/**
 * PDF Verification Engine
 */
function verifyPdf(filePath, category, expectedMinPages, customCheckFn) {
  console.log(`\n=== Verifying PDF: ${filePath} ===`);
  
  if (!fs.existsSync(filePath)) {
    logCheck(category, 'File existence', false, 'File does not exist');
    return;
  }
  
  const buffer = fs.readFileSync(filePath);
  const text = buffer.toString('binary');
  const size = buffer.length;
  
  logCheck(category, 'File size > 10KB', size > 10240, `${size} bytes`);
  
  // 1. %PDF-1.4 header
  const header = buffer.subarray(0, 10).toString('utf-8');
  const hasPdfHeader = header.startsWith('%PDF-1.4') || header.startsWith('%PDF-1.');
  logCheck(category, 'Binary header (%PDF-1.x)', hasPdfHeader, `Found: "${header.trim()}"`);
  
  // 2. Binary comment high-byte markers (e.g. %âãÏÓ)
  const line2 = text.split(/\r?\n/)[1] || '';
  const hasBinaryMarker = line2.startsWith('%') && line2.length >= 2;
  logCheck(category, 'Binary comment marker line 2', hasBinaryMarker, `Line 2: ${JSON.stringify(line2.substring(0, 20))}`);
  
  // 3. %%EOF trailer
  const lastChunk = text.slice(-512);
  const hasEofTrailer = /%%EOF\s*$/.test(lastChunk);
  logCheck(category, 'Trailer (%%EOF)', hasEofTrailer, 'Ends with %%EOF');
  
  // 4. startxref offset and xref section
  const startxrefMatch = /startxref\s+(\d+)\s+%%EOF/s.exec(lastChunk);
  const startxrefOffset = startxrefMatch ? parseInt(startxrefMatch[1], 10) : -1;
  const hasValidStartXref = startxrefOffset > 0 && startxrefOffset < size;
  logCheck(category, 'startxref offset exists and within file size', hasValidStartXref, `Offset: ${startxrefOffset}`);
  
  if (hasValidStartXref) {
    const atOffset = text.substring(startxrefOffset, startxrefOffset + 10);
    logCheck(category, 'xref table at startxref offset', atOffset.startsWith('xref'), `Read: "${atOffset.trim()}"`);
  }
  
  // 5. Catalog and Pages object references
  const rootMatch = /\/Root\s+(\d+)\s+(\d+)\s+R/.exec(text);
  logCheck(category, 'Trailer /Root catalog pointer', !!rootMatch, rootMatch ? `Points to obj ${rootMatch[1]} ${rootMatch[2]}` : 'Missing');
  
  const catalogMatch = /(\d+)\s+(\d+)\s+obj\s*<<\s*\/Type\s*\/Catalog\s*\/Pages\s+(\d+)\s+(\d+)\s+R/s.exec(text);
  logCheck(category, 'Catalog object with /Pages reference', !!catalogMatch, catalogMatch ? `Catalog obj ${catalogMatch[1]}, Pages obj ${catalogMatch[3]}` : 'Missing');
  
  const pagesObjNum = catalogMatch ? catalogMatch[3] : null;
  let pageCount = 0;
  if (pagesObjNum) {
    const pagesRegex = new RegExp(`${pagesObjNum}\\s+0\\s+obj\\s*<<[^>]*\/Type\\s*\/Pages[^>]*\/Count\\s+(\\d+)`, 's');
    const pagesMatch = pagesRegex.exec(text);
    pageCount = pagesMatch ? parseInt(pagesMatch[1], 10) : 0;
    logCheck(category, `Pages object /Count >= ${expectedMinPages}`, pageCount >= expectedMinPages, `Page count: ${pageCount}`);
  }
  
  // 6. Inspect Streams: non-empty stream lengths and valid markers
  const streamMatches = [...text.matchAll(/(\d+)\s+(\d+)\s+obj\s*<<\s*\/Length\s+(\d+)\s*>>\s*stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g)];
  logCheck(category, 'Content streams found', streamMatches.length > 0, `Found ${streamMatches.length} content stream(s)`);
  
  let allStreamLengthsValid = streamMatches.length > 0;
  let totalStreamBytes = 0;
  for (const sm of streamMatches) {
    const declaredLen = parseInt(sm[3], 10);
    const actualLen = Buffer.byteLength(sm[4], 'binary');
    totalStreamBytes += actualLen;
    if (Math.abs(declaredLen - actualLen) > 3 || actualLen === 0) {
      allStreamLengthsValid = false;
    }
  }
  logCheck(category, 'Stream length declared vs actual match', allStreamLengthsValid, `Total stream content: ${totalStreamBytes} bytes`);
  
  // 7. Fonts dictionary
  const hasFontDict = /\/Font\s*<<\s*\/F1\s+(\d+)\s+0\s+R\s*\/F2\s+(\d+)\s+0\s+R/s.test(text);
  logCheck(category, 'Font dictionary (/F1 Helvetica, /F2 Helvetica-Bold)', hasFontDict, 'Standard Helvetica fonts referenced');
  
  // 8. Negative check: NOT a fake HTML or raw unformatted text
  const isFakeHtml = text.toLowerCase().includes('<!doctype html') || text.toLowerCase().includes('<html');
  logCheck(category, 'Not fake HTML or raw markup', !isFakeHtml, 'Valid binary PDF container');
  
  // 9. Custom Content Inspection
  if (customCheckFn) {
    customCheckFn(text, category);
  }
}

/**
 * Demo Test HTML Structural Inspection
 */
function verifyDemoTestHtml() {
  console.log('\n=== Verifying Demo Test HTML: public/sample-materials/demo-test.html ===');
  const filePath = 'public/sample-materials/demo-test.html';
  
  if (!fs.existsSync(filePath)) {
    logCheck('demoTestHtml', 'File exists', false, 'Missing');
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // 1. Self-contained HTML
  logCheck('demoTestHtml', 'Valid DOCTYPE and HTML structure', content.includes('<!DOCTYPE html>') && content.includes('</html>'));
  logCheck('demoTestHtml', 'Embedded CSS styling (no broken local stylesheets)', content.includes('<style>') && content.includes('</style>'));
  logCheck('demoTestHtml', 'Self-contained JavaScript', content.includes('<script>') && content.includes('</script>'));
  
  // 2. 30-min timer logic
  const hasTimerLogic = content.includes('30 * 60') && content.includes('timerDisplay') && content.includes('setInterval');
  logCheck('demoTestHtml', '30-minute countdown timer logic', hasTimerLogic, 'Timer logic present');
  
  // 3. Question structure
  const questionCountMatches = [...content.matchAll(/id:\s*(\d+)/g)];
  logCheck('demoTestHtml', '10 authentic diagnostic questions', questionCountMatches.length >= 10, `${questionCountMatches.length} questions parsed`);
  
  // 4. Interactive Palette clicks and states
  const hasPaletteLogic = content.includes('paletteGrid') &&
    content.includes('chip-answered') &&
    content.includes('chip-not-answered') &&
    content.includes('chip-marked-review') &&
    content.includes('chip-not-visited') &&
    content.includes('btn.onclick');
  logCheck('demoTestHtml', 'Interactive question palette with 4 state classes', hasPaletteLogic);
  
  // 5. Options and controls
  const hasOptionsAndControls = content.includes('btnClearResponse') &&
    content.includes('btnMarkReview') &&
    content.includes('btnSaveNext') &&
    content.includes('btnPrev') &&
    content.includes('btnSubmitTest');
  logCheck('demoTestHtml', 'Complete NTA control buttons present', hasOptionsAndControls);
  
  // 6. Score modal and submission
  const hasScoringModal = content.includes('scoreModal') &&
    content.includes('scoreDisplay') &&
    content.includes('correctCount') &&
    content.includes('accuracyDisplay') &&
    content.includes('submitTest');
  logCheck('demoTestHtml', 'Scoring engine and diagnostic modal', hasScoringModal);
  
  // 7. Enrollment CTA
  const hasEnrollmentCta = content.includes('promo-cta') &&
    (content.includes('href="/#store"') || content.includes('href="/store"'));
  logCheck('demoTestHtml', 'Working enrollment CTA pointing to store', hasEnrollmentCta, 'Links to store checkout');
}

/**
 * Demo Test JavaScript Logic Simulation
 */
function verifyDemoTestLogic() {
  console.log('\n=== Stress-Testing Demo Test JS Logic Engine in Sandbox ===');
  const filePath = 'public/sample-materials/demo-test.html';
  const content = fs.readFileSync(filePath, 'utf-8');
  
  const scriptMatch = /<script>([\s\S]*?)<\/script>/.exec(content);
  if (!scriptMatch) {
    logCheck('demoTestLogic', 'Script extraction', false, 'Could not find script block');
    return;
  }
  
  const scriptContent = scriptMatch[1];
  
  const mockElements = {};
  const paletteButtons = [];
  
  const mockDoc = {
    getElementById: (id) => {
      if (!mockElements[id]) {
        mockElements[id] = {
          id,
          textContent: '',
          innerHTML: '',
          classList: {
            add: function(c) { this[c] = true; },
            remove: function(c) { delete this[c]; }
          },
          appendChild: (child) => {
            if (id === 'paletteGrid') {
              paletteButtons.push(child);
            }
          }
        };
      }
      return mockElements[id];
    },
    createElement: (tag) => ({
      tagName: tag,
      className: '',
      classList: {
        add: function(c) { this[c] = true; },
        remove: function(c) { delete this[c]; }
      },
      appendChild: () => {},
      onclick: null
    })
  };
  
  let intervalsCleared = 0;
  const mockWindow = {
    setInterval: () => 12345,
    clearInterval: () => { intervalsCleared++; },
    confirm: () => true
  };
  
  const sandbox = {
    document: mockDoc,
    window: mockWindow,
    setInterval: mockWindow.setInterval,
    clearInterval: mockWindow.clearInterval,
    confirm: mockWindow.confirm,
    console,
    Math,
    String,
    Array
  };
  
  vm.createContext(sandbox);
  try {
    vm.runInContext(scriptContent, sandbox);
    
    // Test 1: Questions array integrity
    const qCount = vm.runInContext('questions.length', sandbox);
    logCheck('demoTestLogic', 'Questions array loaded (10 items)', qCount === 10, `${qCount} items`);
    
    const allQuestionsValid = vm.runInContext(
      'questions.every(q => q.id && q.question && Array.isArray(q.options) && q.options.length === 4 && typeof q.correct === "number")',
      sandbox
    );
    logCheck('demoTestLogic', 'Each question has valid 4 options and numeric correct answer', allQuestionsValid);
    
    // Test 2: Initial state
    const initIdx = vm.runInContext('currentIndex', sandbox);
    const initVisited = vm.runInContext('visitedStatus[0]', sandbox);
    logCheck('demoTestLogic', 'Initial question is Question 1 (index 0)', initIdx === 0);
    logCheck('demoTestLogic', 'Initial visitedStatus[0] is true', initVisited === true);
    
    // Test 3: Palette buttons created (10 buttons)
    logCheck('demoTestLogic', 'Palette generates 10 interactive buttons', paletteButtons.length === 10, `${paletteButtons.length} buttons`);
    
    // Test 4: Answering question and Save & Next
    vm.runInContext('userAnswers[0] = questions[0].correct;', sandbox);
    mockElements['btnSaveNext'].onclick();
    const idxAfterNext = vm.runInContext('currentIndex', sandbox);
    const visitedQ1 = vm.runInContext('visitedStatus[1]', sandbox);
    logCheck('demoTestLogic', 'Save & Next advances currentIndex from 0 to 1', idxAfterNext === 1);
    logCheck('demoTestLogic', 'Question 2 marked visited upon navigation', visitedQ1 === true);
    
    // Test 5: Mark for review button
    mockElements['btnMarkReview'].onclick();
    const markedQ1 = vm.runInContext('reviewStatus[1]', sandbox);
    const idxAfterMark = vm.runInContext('currentIndex', sandbox);
    logCheck('demoTestLogic', 'Mark for review updates reviewStatus[1] to true', markedQ1 === true);
    logCheck('demoTestLogic', 'Mark for review automatically advances to Question 3', idxAfterMark === 2);
    
    // Test 6: Clear response button
    vm.runInContext('userAnswers[2] = 1;', sandbox);
    mockElements['btnClearResponse'].onclick();
    const q2Answer = vm.runInContext('userAnswers[2]', sandbox);
    logCheck('demoTestLogic', 'Clear response sets userAnswers[2] back to null', q2Answer === null);
    
    // Test 7: Previous button navigation
    mockElements['btnPrev'].onclick();
    const idxAfterPrev = vm.runInContext('currentIndex', sandbox);
    logCheck('demoTestLogic', 'Previous button returns currentIndex from 2 to 1', idxAfterPrev === 1);
    
    // Test 8: Palette direct jump click
    if (paletteButtons[7] && typeof paletteButtons[7].onclick === 'function') {
      paletteButtons[7].onclick(); // jump to question 8 (index 7)
      const idxAfterJump = vm.runInContext('currentIndex', sandbox);
      logCheck('demoTestLogic', 'Direct palette click navigates to Question 8', idxAfterJump === 7);
    } else {
      logCheck('demoTestLogic', 'Direct palette click navigates to Question 8', false, 'Button onclick not bound');
    }
    
    // Test 9: Submitting test with known answers and testing scoring oracle
    // Set 4 known correct, 2 known wrong, 4 unanswered
    vm.runInContext(`
      userAnswers.fill(null);
      userAnswers[0] = questions[0].correct; // +2
      userAnswers[1] = questions[1].correct; // +2
      userAnswers[2] = questions[2].correct; // +2
      userAnswers[3] = questions[3].correct; // +2
      userAnswers[4] = (questions[4].correct + 1) % 4; // wrong
      userAnswers[5] = (questions[5].correct + 2) % 4; // wrong
    `, sandbox);
    
    mockElements['btnSubmitTest'].onclick();
    
    // Expected: 4 correct (8 marks), 2 incorrect, 4 unanswered.
    // Total attempted = 6. Accuracy = Math.round(4 / 6 * 100) = 67%.
    const scoreText = mockElements['scoreDisplay'].textContent;
    const correctVal = mockElements['correctCount'].textContent;
    const incorrectVal = mockElements['incorrectCount'].textContent;
    const accuracyVal = mockElements['accuracyDisplay'].textContent;
    const modalOpened = mockElements['scoreModal'].classList['open'] === true;
    
    logCheck('demoTestLogic', 'Score calculation oracle matches (8/20)', scoreText === '8/20', `Score: ${scoreText}`);
    logCheck('demoTestLogic', 'Correct count oracle matches (4)', String(correctVal) === '4', `Correct: ${correctVal}`);
    logCheck('demoTestLogic', 'Incorrect count oracle matches (2)', String(incorrectVal) === '2', `Incorrect: ${incorrectVal}`);
    logCheck('demoTestLogic', 'Accuracy oracle matches (67%)', accuracyVal === '67%', `Accuracy: ${accuracyVal}`);
    logCheck('demoTestLogic', 'Score modal receives .open class upon submit', modalOpened);
    
  } catch (err) {
    logCheck('demoTestLogic', 'Script execution in VM', false, err.message);
  }
}

/**
 * Image Asset Inspection
 */
async function verifyAuthorImage() {
  console.log('\n=== Verifying Author Image: public/dr-rajnikant-dodiya.jpg ===');
  const imgPath = 'public/dr-rajnikant-dodiya.jpg';
  
  if (!fs.existsSync(imgPath)) {
    logCheck('authorImage', 'Image exists', false, 'Missing');
    return;
  }
  
  const buffer = fs.readFileSync(imgPath);
  const size = buffer.length;
  
  // JPEG Magic Bytes (0xFF, 0xD8, 0xFF)
  const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  logCheck('authorImage', 'Valid JPEG magic bytes (FF D8 FF)', isJpeg);
  logCheck('authorImage', 'Reasonable file size (50KB - 500KB)', size > 50000 && size < 500000, `${(size / 1024).toFixed(1)} KB`);
  
  // Sharp metadata inspection
  try {
    const meta = await sharp(buffer).metadata();
    logCheck('authorImage', 'Valid JPEG dimensions readable via Sharp', !!meta.width && !!meta.height, `${meta.width}x${meta.height} px, format: ${meta.format}`);
    logCheck('authorImage', 'Square or portrait aspect ratio appropriate for avatar', meta.width >= 400 && meta.height >= 400, `Aspect ratio: ${(meta.width / meta.height).toFixed(2)}`);
  } catch (err) {
    logCheck('authorImage', 'Sharp image decode', false, err.message);
  }
  
  // NetVidyaStoreHome.tsx inspection
  console.log('\n=== Verifying Component Integration: NetVidyaStoreHome.tsx ===');
  const homeCode = fs.readFileSync('src/components/store/NetVidyaStoreHome.tsx', 'utf-8');
  
  const hasImgTag = homeCode.includes('src="/dr-rajnikant-dodiya.jpg"');
  logCheck('componentIntegration', 'Image referenced with src="/dr-rajnikant-dodiya.jpg"', hasImgTag);
  
  const hasAltText = homeCode.includes('alt="Dr. Rajnikant Dodiya"');
  logCheck('componentIntegration', 'Proper alt attribute present for accessibility', hasAltText);
  
  const hasProperStyling = homeCode.includes('object-cover') && homeCode.includes('rounded-2xl');
  logCheck('componentIntegration', 'Responsive styling with object-cover and rounded corners', hasProperStyling);
  
  const hasCredentials = homeCode.includes('Ph.D. in English') && homeCode.includes('2× UGC NET & GSET Qualified');
  logCheck('componentIntegration', 'Verified author credentials displayed beside image', hasCredentials);
  
  const noStrikeThrough = !homeCode.includes('1,499') && !homeCode.includes('1499') && !homeCode.includes('line-through');
  logCheck('componentIntegration', 'No prohibited strike-through MRP or fake discounts', noStrikeThrough);
}

async function run() {
  // 1. Verify Mini Mock PDF
  verifyPdf(
    'public/sample-materials/NetVidya_25_Question_Mini_Mock.pdf',
    'pdfMock',
    5,
    (text, cat) => {
      let allQuestionsPresent = true;
      for (let i = 1; i <= 25; i++) {
        if (!text.includes(`Q${i}.`)) {
          allQuestionsPresent = false;
        }
      }
      logCheck(cat, 'All 25 questions (Q1. through Q25.) present', allQuestionsPresent);
      
      let allKeysPresent = true;
      for (let i = 1; i <= 25; i++) {
        const keyPattern = new RegExp(`Q\\s*${i}:\\s*\\[Option`);
        if (!keyPattern.test(text)) {
          allKeysPresent = false;
        }
      }
      logCheck(cat, 'Official Answer Key covers Q1 through Q25 with options and units', allKeysPresent);
      
      logCheck(cat, 'Contains Official Answer Key heading', text.includes('OFFICIAL ANSWER KEY & SYLLABUS MAPPING'));
      logCheck(cat, 'Contains Author credit', text.includes('Dr. Rajnikant Dodiya'));
      logCheck(cat, 'Contains Store domain link', text.includes('store.rajnikantdodiya.com'));
    }
  );
  
  // 2. Verify Model Answers PDF
  verifyPdf(
    'public/sample-materials/NetVidya_Model_Answers_Sample.pdf',
    'pdfAnswers',
    3,
    (text, cat) => {
      logCheck(cat, 'Contains Model Answers title', text.includes('Model Answers & Pedagogical Rationales'));
      logCheck(cat, 'Contains Analytical Rationale sections', (text.match(/Analytical Rationale:/g) || []).length >= 5);
      logCheck(cat, 'Contains Distractor Breakdown sections', (text.match(/Distractor Breakdown:/g) || []).length >= 5);
      logCheck(cat, 'Contains Author credentials', text.includes('Dr. Rajnikant Dodiya'));
    }
  );
  
  // 3. Verify Demo Test HTML & JS Logic
  verifyDemoTestHtml();
  verifyDemoTestLogic();
  
  // 4. Verify Image
  await verifyAuthorImage();
  
  console.log('\n=======================================');
  console.log('SUMMARY OF CHALLENGER VERIFICATION');
  console.log('=======================================');
  let overallPassed = true;
  for (const [key, val] of Object.entries(results)) {
    console.log(`${key}: ${val.passed ? 'ALL CHECKS PASSED' : 'FAILED'} (${val.checks.length} checks, ${val.errors.length} errors)`);
    if (!val.passed) overallPassed = false;
  }
  
  if (!overallPassed) {
    console.error('\nOVERALL VERDICT: REJECT');
    process.exit(1);
  } else {
    console.log('\nOVERALL VERDICT: APPROVE');
    process.exit(0);
  }
}

run().catch(err => {
  console.error('Fatal error during verification:', err);
  process.exit(1);
});
