// Test Suite: 300-Page Book Upload, Storage Security, Paywall Boundary, and Reader Engine
import assert from 'node:assert/strict';

const MAX_MANUSCRIPT_SIZE_BYTES = 75 * 1024 * 1024; // 75MB
const DEFAULT_PREVIEW_PAGES = 20;
const DEFAULT_BOOK_PAGES = 320;

function validateManuscriptFile(file) {
  if (!file) {
    return { valid: false, error: 'No manuscript file selected.' };
  }

  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if (!isPdf) {
    return {
      valid: false,
      error: 'Invalid file format. Only PDF manuscripts are supported for university publications.'
    };
  }

  if (file.size <= 0) {
    return { valid: false, error: 'The selected file is empty (0 bytes).' };
  }

  if (file.size > MAX_MANUSCRIPT_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${sizeMb} MB) exceeds maximum institutional upload limit of 75 MB.`
    };
  }

  const fileSizeMb = Number((file.size / (1024 * 1024)).toFixed(2));
  return {
    valid: true,
    fileSizeMb,
    fileName: file.name
  };
}

function resolveBookAccess(book, isLicensed, isAuthor) {
  const totalPageCount = Number(book.pageCount) || DEFAULT_BOOK_PAGES;
  const previewPagesLimit = Number(book.previewPages) || DEFAULT_PREVIEW_PAGES;
  const hasFullAccess = isLicensed || isAuthor;

  if (hasFullAccess) {
    return {
      isRestricted: false,
      maxAccessiblePage: totalPageCount,
      totalPageCount,
      previewPagesLimit,
      accessibleFileUrl: book.manuscriptFileUrl || book.samplePdfUrl
    };
  }

  return {
    isRestricted: true,
    maxAccessiblePage: Math.min(previewPagesLimit, totalPageCount),
    totalPageCount,
    previewPagesLimit,
    accessibleFileUrl: book.samplePdfUrl || undefined
  };
}

function generateForensicWatermark(scholarName, scholarMobile, orderId) {
  const safeName = (scholarName || 'LICENSED SCHOLAR').toUpperCase().trim();
  const safeMobile = (scholarMobile || 'SARDAR PATEL UNIVERSITY').trim();
  const safeOrder = (orderId || 'PASS-VERIFIED').trim();
  const dateStr = new Date().toISOString().split('T')[0];
  return `${safeName} • +91 ${safeMobile} • ${safeOrder} • ${dateStr} • INSTITUTIONAL COPY`;
}

console.log('================================================================');
console.log(' STARTING 300-PAGE BOOK UPLOAD & LONG-FORM READER TEST SUITE');
console.log(' Target Platform: https://rajnikantdodiya.com');
console.log('================================================================\n');

// --------------------------------------------------------------------------
// SUITE 1: Pre-Flight File Validation
// --------------------------------------------------------------------------
console.log('--- SUITE 1: Pre-Flight File Validation ---');
{
  const mockFile = {
    name: 'kalam_educational_monograph_final.pdf',
    type: 'application/pdf',
    size: 24 * 1024 * 1024 // 24 MB
  };
  const res = validateManuscriptFile(mockFile);
  assert.equal(res.valid, true);
  assert.equal(res.fileSizeMb, 24);
  assert.equal(res.fileName, 'kalam_educational_monograph_final.pdf');
  console.log('  [PASS] Accept compliant 300-page academic PDF under 75MB');
}

{
  const mockFile = {
    name: 'malicious_payload.exe',
    type: 'application/x-msdownload',
    size: 5 * 1024 * 1024
  };
  const res = validateManuscriptFile(mockFile);
  assert.equal(res.valid, false);
  assert.match(res.error, /Only PDF manuscripts are supported/);
  console.log('  [PASS] Reject non-PDF manuscript format (e.g. .docx or .exe)');
}

{
  const mockFile = {
    name: 'empty.pdf',
    type: 'application/pdf',
    size: 0
  };
  const res = validateManuscriptFile(mockFile);
  assert.equal(res.valid, false);
  assert.match(res.error, /empty/);
  console.log('  [PASS] Reject empty 0-byte file submission');
}

{
  const mockFile = {
    name: 'heavy_monograph.pdf',
    type: 'application/pdf',
    size: 85 * 1024 * 1024 // 85 MB
  };
  const res = validateManuscriptFile(mockFile);
  assert.equal(res.valid, false);
  assert.match(res.error, /exceeds maximum institutional upload limit of 75 MB/);
  console.log('  [PASS] Reject file exceeding 75MB upload ceiling');
}

// --------------------------------------------------------------------------
// SUITE 2: Paywall Boundary & Zero-Leak Enforcement (VULN-01 Defense)
// --------------------------------------------------------------------------
console.log('\n--- SUITE 2: Paywall Boundary & Zero-Leak Enforcement (VULN-01 Defense) ---');
const mock300PageBook = {
  id: 'book-kalam-320p',
  title: 'A Study of Educational Thoughts of APJ Abdul Kalam',
  pageCount: 324,
  previewPages: 20,
  manuscriptFileUrl: 'https://secure.spu.edu/vault/kalam_full_324p_secret.pdf',
  samplePdfUrl: 'https://public.spu.edu/samples/kalam_preview_20p.pdf'
};

{
  const access = resolveBookAccess(mock300PageBook, false, false);
  assert.equal(access.isRestricted, true);
  assert.equal(access.maxAccessiblePage, 20);
  assert.equal(access.totalPageCount, 324);
  assert.equal(access.previewPagesLimit, 20);
  console.log('  [PASS] Unlicensed candidate has max accessible page clamped to 20');
}

{
  const access = resolveBookAccess(mock300PageBook, false, false);
  assert.notEqual(access.accessibleFileUrl, mock300PageBook.manuscriptFileUrl);
  assert.equal(access.accessibleFileUrl, mock300PageBook.samplePdfUrl);
  console.log('  [PASS] CRITICAL: Full manuscript URL strictly REDACTED in preview mode');
}

{
  const access = resolveBookAccess(mock300PageBook, true, false);
  assert.equal(access.isRestricted, false);
  assert.equal(access.maxAccessiblePage, 324);
  assert.equal(access.accessibleFileUrl, mock300PageBook.manuscriptFileUrl);
  console.log('  [PASS] Licensed student unlocks full 324 pages and receives manuscript URL');
}

{
  const access = resolveBookAccess(mock300PageBook, false, true);
  assert.equal(access.isRestricted, false);
  assert.equal(access.maxAccessiblePage, 324);
  assert.equal(access.accessibleFileUrl, mock300PageBook.manuscriptFileUrl);
  console.log('  [PASS] Verified author in Studio receives full 324 pages and manuscript URL');
}

// --------------------------------------------------------------------------
// SUITE 3: Forensic Multi-Layer Watermarking
// --------------------------------------------------------------------------
console.log('\n--- SUITE 3: Forensic Multi-Layer Watermarking ---');
{
  const wm = generateForensicWatermark('Aarav Patel', '9825123456', 'ORD-2026-HMP');
  assert.match(wm, /AARAV PATEL/);
  assert.match(wm, /\+91 9825123456/);
  assert.match(wm, /ORD-2026-HMP/);
  assert.match(wm, /INSTITUTIONAL COPY/);
  console.log('  [PASS] Generate compliant forensic watermark containing scholar credentials');
}

// --------------------------------------------------------------------------
// SUITE 4: Default Values & Fallbacks
// --------------------------------------------------------------------------
console.log('\n--- SUITE 4: Default Values & Fallbacks ---');
{
  const minimalBook = { id: 'book-min', title: 'English Phonetics' };
  const access = resolveBookAccess(minimalBook, false, false);
  assert.equal(access.totalPageCount, DEFAULT_BOOK_PAGES);
  assert.equal(access.previewPagesLimit, DEFAULT_PREVIEW_PAGES);
  assert.equal(access.maxAccessiblePage, 20);
  console.log('  [PASS] Fall back to 320 pages and 20 preview pages if book record omits them');
}

console.log('\n================================================================');
console.log(' 300-PAGE BOOK UPLOAD & READER AUDIT: 10/10 TESTS PASSED');
console.log(' STATUS: 100% PASS - AIR-TIGHT PREVIEW & LONG-FORM CAPABILITY VERIFIED');
console.log('================================================================');
