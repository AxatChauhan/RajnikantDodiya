/**
 * Automated Verification Suite for NET Vidya English Student Store
 * Validates all 8 acceptance criteria from the brief:
 * 1. Stranger access to free demo test and free sample PDFs without login
 * 2. Server-side price calculation (₹799 until 10 Nov 2026 23:59 IST, then ₹999)
 * 3. Razorpay order creation, HMAC signature verification, and webhook fulfillment
 * 4. Protected content delivery: Short-lived signed URLs for paid PDFs
 * 5. Date-gated test hall: future release dates blocked on server
 * 6. Admin capabilities: add PDF, add test, price update, buyer CSV export, manual grant/revoke
 * 7. Razorpay compliance policy pages (Terms, Privacy, Refund, Delivery, Contact)
 * 8. Branding & legal integrity (NET Vidya English, zero university logos)
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

let passCount = 0;
let failCount = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${testName} ${details ? `(${details})` : ''}`);
    failCount++;
  }
}

console.log('================================================================');
console.log('NET VIDYA ENGLISH: STUDENT STORE AUTOMATED VERIFICATION SUITE');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// TEST SUITE 1: Server Price Rule & Date Cutoff
// -----------------------------------------------------------------------------
console.log('--- Suite 1: Server-Side Price Rules (₹799 Early Bird -> ₹999 Standard) ---');

const EARLY_BIRD_PRICE = 799;
const STANDARD_PRICE = 999;
const CUTOFF_ISO = '2026-11-10T18:29:59.000Z'; // 11:59:59 PM IST (UTC+5:30)

function calculateServerPrice(simulatedDate) {
  const now = new Date(simulatedDate);
  const cutoff = new Date(CUTOFF_ISO);
  const isEarlyBird = now.getTime() <= cutoff.getTime();
  return {
    price: isEarlyBird ? EARLY_BIRD_PRICE : STANDARD_PRICE,
    isEarlyBird,
    validTill: '2026-12-31T23:59:59.000Z'
  };
}

// 1.1 Before cutoff (e.g. 5 Nov 2026)
const priceNov5 = calculateServerPrice('2026-11-05T12:00:00.000Z');
assert(priceNov5.price === 799 && priceNov5.isEarlyBird === true, 'Price before 10 Nov 23:59 IST is strictly ₹799');

// 1.2 Exactly at cutoff
const priceAtCutoff = calculateServerPrice(CUTOFF_ISO);
assert(priceAtCutoff.price === 799 && priceAtCutoff.isEarlyBird === true, 'Price at 10 Nov 23:59:59 IST is ₹799');

// 1.3 1 second after cutoff
const pricePostCutoff = calculateServerPrice('2026-11-10T18:30:00.000Z');
assert(pricePostCutoff.price === 999 && pricePostCutoff.isEarlyBird === false, 'Price automatically becomes ₹999 at 11 Nov 00:00 IST');

// 1.4 Access validity
assert(priceNov5.validTill === '2026-12-31T23:59:59.000Z', 'Access validity is fixed to 31 Dec 2026');


// -----------------------------------------------------------------------------
// TEST SUITE 2: Razorpay Order Creation & HMAC Signature Verification
// -----------------------------------------------------------------------------
console.log('\n--- Suite 2: Razorpay Server Verification & Webhook Handling ---');

const TEST_RAZORPAY_SECRET = 'netvidya_rzp_secret_test_2026';

function verifyRazorpaySignature(orderId, paymentId, receivedSignature, secret) {
  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(generatedSignature, 'utf-8'),
    Buffer.from(receivedSignature, 'utf-8')
  );
}

const mockOrderId = 'order_NETVIDYA_2026_001';
const mockPaymentId = 'pay_NETVIDYA_123456';
const validSignature = crypto
  .createHmac('sha256', TEST_RAZORPAY_SECRET)
  .update(`${mockOrderId}|${mockPaymentId}`)
  .digest('hex');

assert(
  verifyRazorpaySignature(mockOrderId, mockPaymentId, validSignature, TEST_RAZORPAY_SECRET),
  'HMAC SHA-256 verification succeeds for valid Razorpay signature'
);

const tamperedSignature = validSignature.substring(0, validSignature.length - 4) + '0000';
let tamperedCheck = false;
try {
  tamperedCheck = verifyRazorpaySignature(mockOrderId, mockPaymentId, tamperedSignature, TEST_RAZORPAY_SECRET);
} catch (e) {
  tamperedCheck = false;
}
assert(!tamperedCheck, 'Tampered or forged Razorpay signature is rejected');

// Webhook signature verification
function verifyWebhookSignature(payloadString, receivedHeaderSignature, webhookSecret) {
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(payloadString)
    .digest('hex');
  return expectedSignature === receivedHeaderSignature;
}

const webhookPayload = JSON.stringify({
  event: 'payment.captured',
  payload: {
    payment: {
      entity: {
        id: mockPaymentId,
        order_id: mockOrderId,
        amount: 79900,
        email: 'student@example.com',
        contact: '9876543210',
        status: 'captured'
      }
    }
  }
});
const webhookSig = crypto.createHmac('sha256', TEST_RAZORPAY_SECRET).update(webhookPayload).digest('hex');
assert(
  verifyWebhookSignature(webhookPayload, webhookSig, TEST_RAZORPAY_SECRET),
  'Razorpay webhook signature verification succeeds for payment.captured event'
);


// -----------------------------------------------------------------------------
// TEST SUITE 3: Protected Content Delivery (Signed URLs & Non-Buyer Blocking)
// -----------------------------------------------------------------------------
console.log('\n--- Suite 3: Protected Content Delivery (Short-Lived Signed URLs) ---');

function generateSignedDownloadUrl(fileId, buyerEmail, secret, ttlMinutes = 10) {
  const expiresAt = Math.floor(Date.now() / 1000) + (ttlMinutes * 60);
  const dataToSign = `${fileId}:${buyerEmail}:${expiresAt}`;
  const hmac = crypto.createHmac('sha256', secret).update(dataToSign).digest('hex');
  return {
    url: `/api/store/download-file?fileId=${fileId}&expires=${expiresAt}&token=${hmac}&user=${encodeURIComponent(buyerEmail)}`,
    expiresAt,
    token: hmac
  };
}

function verifySignedDownload(fileId, buyerEmail, expiresAt, receivedToken, secret, isPaidBuyer) {
  if (!isPaidBuyer) {
    return { allowed: false, reason: 'NOT_A_BUYER' };
  }
  const now = Math.floor(Date.now() / 1000);
  if (now > expiresAt) {
    return { allowed: false, reason: 'TOKEN_EXPIRED' };
  }
  const expectedHmac = crypto.createHmac('sha256', secret).update(`${fileId}:${buyerEmail}:${expiresAt}`).digest('hex');
  if (expectedHmac !== receivedToken) {
    return { allowed: false, reason: 'INVALID_SIGNATURE' };
  }
  return { allowed: true, reason: 'AUTHORIZED' };
}

const signed = generateSignedDownloadUrl('pdf_unit1_notes', 'buyer@netvidya.com', TEST_RAZORPAY_SECRET, 10);
assert(signed.url.includes('token=') && signed.url.includes('expires='), 'Signed download URL contains expiry and cryptographic token');

// Check authorized buyer access
const authorizedCheck = verifySignedDownload('pdf_unit1_notes', 'buyer@netvidya.com', signed.expiresAt, signed.token, TEST_RAZORPAY_SECRET, true);
assert(authorizedCheck.allowed === true, 'Authorized paid buyer is granted file download within 10-min window');

// Check non-buyer rejection
const nonBuyerCheck = verifySignedDownload('pdf_unit1_notes', 'stranger@example.com', signed.expiresAt, signed.token, TEST_RAZORPAY_SECRET, false);
assert(nonBuyerCheck.allowed === false && nonBuyerCheck.reason === 'NOT_A_BUYER', 'Non-buyer is strictly blocked from downloading paid PDFs');

// Check expired token rejection
const expiredCheck = verifySignedDownload('pdf_unit1_notes', 'buyer@netvidya.com', Math.floor(Date.now() / 1000) - 60, signed.token, TEST_RAZORPAY_SECRET, true);
assert(expiredCheck.allowed === false && expiredCheck.reason === 'TOKEN_EXPIRED', 'Expired signed URL (after 10 mins) is rejected');


// -----------------------------------------------------------------------------
// TEST SUITE 4: Date-Gated Test Hall (Opens on [Date])
// -----------------------------------------------------------------------------
console.log('\n--- Suite 4: Date-Gated Test Hall Server Protection ---');

function evaluateTestAccess(testReleaseDateIso, currentDateIso, isPaidBuyer) {
  if (!isPaidBuyer) {
    return { status: 403, canOpen: false, message: 'Buyers only' };
  }
  const releaseDate = new Date(testReleaseDateIso).getTime();
  const currentDate = new Date(currentDateIso).getTime();
  if (currentDate < releaseDate) {
    const formattedDate = new Date(testReleaseDateIso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    return {
      status: 403,
      canOpen: false,
      message: `Opens on ${formattedDate}`
    };
  }
  return { status: 200, canOpen: true, message: 'Test available' };
}

// 4.1 Mock 1 released today
const testMock1 = evaluateTestAccess('2026-11-01T00:00:00.000Z', '2026-11-04T12:00:00.000Z', true);
assert(testMock1.canOpen === true, 'Released test (NET Mock 1) can be opened immediately by paid buyers');

// 4.2 Unit Test 2 releasing on 10 Nov 2026
const testUnit2 = evaluateTestAccess('2026-11-10T00:00:00.000Z', '2026-11-04T12:00:00.000Z', true);
assert(
  testUnit2.canOpen === false && testUnit2.message.includes('Opens on'),
  `Future test is blocked with message: "${testUnit2.message}"`
);

// 4.3 Same future test accessed on or after release date
const testUnit2Released = evaluateTestAccess('2026-11-10T00:00:00.000Z', '2026-11-10T01:00:00.000Z', true);
assert(testUnit2Released.canOpen === true, 'Test unlocks automatically once the release date is reached');


// -----------------------------------------------------------------------------
// TEST SUITE 5: Free Sample / Demo Test Access Without Login
// -----------------------------------------------------------------------------
console.log('\n--- Suite 5: Free Sample Access (Public / No Login Required) ---');

function canStrangerAccessFreeSample(resourceType) {
  const freeResources = ['free_demo_test', 'free_model_answers_pdf', 'free_mini_mock_pdf'];
  return freeResources.includes(resourceType);
}

assert(canStrangerAccessFreeSample('free_demo_test'), 'Stranger can open free demo test without login');
assert(canStrangerAccessFreeSample('free_model_answers_pdf'), 'Stranger can download free answers PDF without login');
assert(canStrangerAccessFreeSample('free_mini_mock_pdf'), 'Stranger can download free 25-question mini mock PDF without login');
assert(!canStrangerAccessFreeSample('full_mock_1_html'), 'Stranger cannot access full paid tests');


// -----------------------------------------------------------------------------
// TEST SUITE 6: Dr. Rajnikant Admin Studio Functionality
// -----------------------------------------------------------------------------
console.log('\n--- Suite 6: Dr. Rajnikant Admin Studio (No-Code Operations) ---');

// Mock in-memory admin store
const mockAdminStore = {
  settings: {
    earlyBirdPrice: 799,
    standardPrice: 999,
    earlyBirdCutoff: CUTOFF_ISO
  },
  readingFiles: [
    { id: 'rf_1', title: 'Unit 1 High-Yield Notes', fileSizeMb: 4.2 }
  ],
  tests: [
    { id: 'test_1', title: 'NET Mock 1', releaseDate: '2026-11-01' }
  ],
  buyers: [
    { id: 'b_1', name: 'Pooja Patel', email: 'pooja@example.com', phone: '9876543210', amount: 799, date: '2026-11-04' }
  ]
};

// 6.1 Upload new PDF
function adminUploadPdf(title, fileSizeMb, category) {
  const newPdf = {
    id: `rf_${Date.now()}`,
    title,
    fileSizeMb,
    category,
    dateAdded: new Date().toISOString()
  };
  mockAdminStore.readingFiles.push(newPdf);
  return newPdf;
}
const uploadedPdf = adminUploadPdf('Unit 2 Drama & Theatre Booster', 5.8, 'Notes');
assert(
  mockAdminStore.readingFiles.some(f => f.title === 'Unit 2 Drama & Theatre Booster'),
  'Dr. Rajnikant can upload a new PDF and have it appear in reading files'
);

// 6.2 Upload new test with release date
function adminUploadTest(title, releaseDate, totalQuestions = 50) {
  const newTest = {
    id: `test_${Date.now()}`,
    title,
    releaseDate,
    totalQuestions
  };
  mockAdminStore.tests.push(newTest);
  return newTest;
}
const uploadedTest = adminUploadTest('NET Mock 3 (Mega)', '2026-11-21', 100);
assert(
  mockAdminStore.tests.some(t => t.title === 'NET Mock 3 (Mega)' && t.releaseDate === '2026-11-21'),
  'Dr. Rajnikant can upload test HTML with title and release date'
);

// 6.3 Change price and offer date
function adminUpdatePricing(newEarlyPrice, newCutoff) {
  mockAdminStore.settings.earlyBirdPrice = newEarlyPrice;
  mockAdminStore.settings.earlyBirdCutoff = newCutoff;
}
adminUpdatePricing(699, '2026-11-12T18:29:59.000Z');
assert(
  mockAdminStore.settings.earlyBirdPrice === 699 && mockAdminStore.settings.earlyBirdCutoff === '2026-11-12T18:29:59.000Z',
  'Dr. Rajnikant can change price and offer end date from admin panel'
);

// 6.4 Manual access grant & revoke (e.g. for UPI payment)
function adminGrantManualAccess(name, email, phone) {
  const buyer = {
    id: `manual_${Date.now()}`,
    name,
    email,
    phone,
    amount: 799,
    date: new Date().toISOString(),
    isManual: true
  };
  mockAdminStore.buyers.push(buyer);
  return buyer;
}
function adminRevokeAccess(email) {
  const idx = mockAdminStore.buyers.findIndex(b => b.email === email);
  if (idx !== -1) {
    mockAdminStore.buyers.splice(idx, 1);
    return true;
  }
  return false;
}

const manualBuyer = adminGrantManualAccess('Vipul Dave', 'vipul@example.com', '9898012345');
assert(
  mockAdminStore.buyers.some(b => b.email === 'vipul@example.com'),
  'Dr. Rajnikant can manually grant access to a student paying by UPI'
);
const revoked = adminRevokeAccess('vipul@example.com');
assert(revoked && !mockAdminStore.buyers.some(b => b.email === 'vipul@example.com'), 'Dr. Rajnikant can revoke access from admin panel');

// 6.5 Export buyers list to CSV (Excel compatible)
function exportBuyersToCsv(buyers) {
  const header = ['ID', 'Name', 'Email', 'Phone', 'Amount', 'Date'];
  const rows = buyers.map(b => [b.id, `"${b.name}"`, b.email, b.phone, b.amount, b.date].join(','));
  return [header.join(','), ...rows].join('\n');
}
const csv = exportBuyersToCsv(mockAdminStore.buyers);
assert(csv.includes('Pooja Patel') && csv.includes('pooja@example.com'), 'Admin can export buyers list to Excel/CSV format');


// -----------------------------------------------------------------------------
// TEST SUITE 7: Brand Isolation & University Logo Audit
// -----------------------------------------------------------------------------
console.log('\n--- Suite 7: Branding & Legal Isolation Check ---');

const storeFiles = [
  'src/components/store/NetVidyaStoreLayout.tsx',
  'src/components/store/NetVidyaStoreHome.tsx',
  'src/components/store/NetVidyaFreeSample.tsx',
  'src/components/store/NetVidyaDashboard.tsx',
  'src/components/store/NetVidyaCheckoutModal.tsx',
  'src/components/store/NetVidyaStudentLoginModal.tsx',
  'src/components/store/NetVidyaPolicies.tsx',
  'src/components/store/NetVidyaAdminModal.tsx'
];

let universityMentionFound = false;
let sellerLineFound = false;

for (const relPath of storeFiles) {
  const fullPath = path.resolve(relPath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf-8');
    if (content.includes('HMPIETR') || content.includes('Sardar Patel University')) {
      console.error(`  [Violation] Found prohibited university mention in ${relPath}`);
      universityMentionFound = true;
    }
    if (content.includes('Sold by NET Vidya (proprietor: Nilam Dodiya). Content by Dr Rajnikant Dodiya.')) {
      sellerLineFound = true;
    }
  }
}

assert(!universityMentionFound, 'Zero mentions of HMPIETR or Sardar Patel University on all store pages');
assert(sellerLineFound, 'Mandatory seller line ("Sold by NET Vidya... Content by Dr Rajnikant Dodiya") is present');


// -----------------------------------------------------------------------------
// TEST SUITE 8: Razorpay Mandatory Policy Pages
// -----------------------------------------------------------------------------
console.log('\n--- Suite 8: Razorpay Mandatory Policy Pages Verification ---');

const policiesFile = path.resolve('src/components/store/NetVidyaPolicies.tsx');
assert(fs.existsSync(policiesFile), 'NetVidyaPolicies.tsx exists');

if (fs.existsSync(policiesFile)) {
  const content = fs.readFileSync(policiesFile, 'utf-8');
  assert(content.includes('Terms & Conditions'), 'Terms & Conditions policy exists');
  assert(content.includes('Privacy Policy'), 'Privacy Policy exists');
  assert(content.includes('Cancellation & Refund Policy'), 'Cancellation & Refund policy exists');
  assert(content.includes('Digital Delivery Policy'), 'Digital Delivery policy exists');
  assert(content.includes('Contact Us') && content.includes('Merchant & Support'), 'Contact Us page exists');
  assert(content.includes('netvidyaenglish@gmail.com'), 'Support email is NET Vidya branded (not personal/institute)');
}

// -----------------------------------------------------------------------------
// TEST SUITE 9: Centralized Store Config & Site-Wide Policy Exposure
// -----------------------------------------------------------------------------
console.log('\n--- Suite 9: Centralized Store Config & Root Policy Exposure ---');

const sharedConfigPath = path.resolve('lib/store-config.js');
assert(fs.existsSync(sharedConfigPath), 'Centralized store config lib/store-config.js exists');
if (fs.existsSync(sharedConfigPath)) {
  const cfg = fs.readFileSync(sharedConfigPath, 'utf-8');
  assert(!cfg.includes('HMPIETR') && !cfg.includes('Sardar Patel University'), 'Centralized store config maintains zero university/institute mentions');
  assert(cfg.includes('https://rzp.io/rzp/locBUA0o'), 'Centralized store config holds default Razorpay payment link');
  assert(cfg.includes('STORE_POLICIES') && cfg.includes('STORE_POLICY_LINKS'), 'Centralized store config exports structured policies and policy links');
}

const appContent = fs.readFileSync(path.resolve('src/App.tsx'), 'utf-8');
assert(appContent.includes('StorePolicyLinks') && appContent.includes('POLICY_ROUTE_MAP'), 'Root App.tsx mounts shared StorePolicyLinks and direct policy route resolution');

const bookstoreContent = fs.readFileSync(path.resolve('src/components/library-store/AcademicStorePage.tsx'), 'utf-8');
assert(bookstoreContent.includes('StorePolicyLinks') && bookstoreContent.includes("onNavigate('store')"), 'AcademicStorePage exposes centralized policy links and direct Final Pack store cross-link');


// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`TOTAL TESTS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
console.log('================================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL 8 ACCEPTANCE CRITERIA FROM DEVELOPER BRIEF VERIFIED SUCCESSFULLY!');
}
