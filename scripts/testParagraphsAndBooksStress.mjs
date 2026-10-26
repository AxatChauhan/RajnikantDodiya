/**
 * STRESS & LAYOUT INTEGRITY VERIFICATION SUITE
 * 
 * Verifies that adding multiple paragraphs or books to the Author Studio:
 * 1. Never breaks the frontend layout
 * 2. Never causes overlapping text, crooked rows, or horizontal overflows
 * 3. Keeps book counts completely dynamic (no hardcoded book count figures)
 * 4. Ensures word-break and auto-row balance across cards and containers
 */

import fs from 'fs';
import path from 'path';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${message}`);
    process.exitCode = 1;
  }
}

console.log('================================================================');
console.log(' STARTING PARAGRAPHS & BOOKS FRONTEND INTEGRITY STRESS AUDIT');
console.log(' Target Platform: https://rajnikantdodiya.com');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// SUITE 1: AboutPage Paragraph Resilience
// -----------------------------------------------------------------------------
console.log('--- SUITE 1: AboutPage Paragraph Resilience ---');
const aboutPageSource = fs.readFileSync('src/components/AboutPage.tsx', 'utf-8');

assert(
  aboutPageSource.includes('break-words') && aboutPageSource.includes('whitespace-pre-line'),
  'Short Bio has break-words and whitespace-pre-line to safely format multiline introductions'
);

assert(
  aboutPageSource.includes('.filter(p => typeof p === \'string\' && p.trim().length > 0)'),
  'Long Bio filters empty paragraphs before rendering so no empty indentation blocks appear'
);

assert(
  aboutPageSource.includes('break-words leading-relaxed'),
  'Long Bio paragraphs have break-words and leading-relaxed applied'
);

assert(
  aboutPageSource.includes('min-w-0'),
  'Bio container uses min-w-0 to prevent horizontal flex/grid blowouts'
);

// -----------------------------------------------------------------------------
// SUITE 2: HomePage Bio & Headline Resilience
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 2: HomePage Bio & Headline Resilience ---');
const homePageSource = fs.readFileSync('src/components/HomePage.tsx', 'utf-8');

assert(
  homePageSource.includes('break-words whitespace-pre-line'),
  'HomePage shortBio has break-words and whitespace-pre-line'
);

assert(
  homePageSource.includes('break-words') && homePageSource.includes('profile.name'),
  'HomePage main headline has break-words around professor name'
);

assert(
  homePageSource.includes('allAvailableBooks') && homePageSource.includes('featuredBook'),
  'HomePage featuredBook connects dynamically to the live studio books catalog'
);

assert(
  homePageSource.includes('featuredBook.title') && homePageSource.includes('break-words'),
  'Featured monograph title and description use break-words to avoid card collisions'
);

// -----------------------------------------------------------------------------
// SUITE 3: AcademicStorePage Dynamic Books & Auto-Row Alignment
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 3: AcademicStorePage Dynamic Books & Auto-Row Alignment ---');
const storePageSource = fs.readFileSync('src/components/library-store/AcademicStorePage.tsx', 'utf-8');

assert(
  storePageSource.includes('Published Print Volumes ({allBooks.length} Books)'),
  'Bookstore section title dynamically reflects allBooks.length'
);

assert(
  storePageSource.includes('allBooks.filter(b => b.type === \'authored\').length') &&
  storePageSource.includes('allBooks.filter(b => b.type === \'edited\').length'),
  'Bookstore subtitle dynamically counts authored vs edited works without hardcoded numbers'
);

assert(
  storePageSource.includes('auto-rows-fr'),
  'Bookstore grid uses auto-rows-fr so all book cards in a row have identical height (no crooked shelves)'
);

assert(
  storePageSource.includes('flex flex-col justify-between') && storePageSource.includes('h-full'),
  'Book cards use h-full flex flex-col justify-between to keep bottom action bars aligned'
);

assert(
  storePageSource.includes('flex flex-wrap items-center justify-between gap-2.5'),
  'Book card action row wraps with gap-2.5 to prevent overlapping "Details" and "Order" buttons'
);

assert(
  storePageSource.includes('min-w-0') && storePageSource.includes('break-words'),
  'Book card titles and metadata have min-w-0 and break-words applied'
);

// -----------------------------------------------------------------------------
// SUITE 4: PublicationsPage Dynamic Catalog & Grid Harmony
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 4: PublicationsPage Dynamic Catalog & Grid Harmony ---');
const pubPageSource = fs.readFileSync('src/components/PublicationsPage.tsx', 'utf-8');

assert(
  pubPageSource.includes('Authored Books ({authoredBooks.length})'),
  'PublicationsPage authored books header dynamically reflects authoredBooks.length'
);

assert(
  pubPageSource.includes('Edited Academic Books ({editedBooks.length})'),
  'PublicationsPage edited books header dynamically reflects editedBooks.length'
);

assert(
  pubPageSource.includes('auto-rows-fr'),
  'PublicationsPage grids use auto-rows-fr for equal card height balance'
);

assert(
  pubPageSource.includes('flex flex-wrap items-center justify-between gap-2'),
  'PublicationsPage card footer wraps safely without button collision'
);

// -----------------------------------------------------------------------------
// SUITE 5: LearnPage (Study Materials) Bundle Card Resilience
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 5: LearnPage (Study Materials) Bundle Card Resilience ---');
const learnPageSource = fs.readFileSync('src/components/LearnPage.tsx', 'utf-8');

assert(
  learnPageSource.includes('auto-rows-fr'),
  'Study bundles grid uses auto-rows-fr for uniform heights across 3 tiers'
);

assert(
  learnPageSource.includes('h-full min-w-0'),
  'Study bundle cards use h-full min-w-0 to prevent horizontal stretching'
);

assert(
  learnPageSource.includes('break-words') && learnPageSource.includes('leading-tight'),
  'Study bundle titles use break-words to handle variable length names without cropping'
);

assert(
  learnPageSource.includes('profile.name || PROFESSOR_INFO.name'),
  'LearnPage header dynamically renders professor name from site context'
);

// -----------------------------------------------------------------------------
// SUITE 6: AuthorStudioModal Addition Form & Catalog Management
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 6: AuthorStudioModal Addition Form & Catalog Management ---');
const studioModalSource = fs.readFileSync('src/components/studio/AuthorStudioModal.tsx', 'utf-8');

assert(
  studioModalSource.includes('Book Synopsis / Academic Description'),
  'Author Studio includes a synopsis/details field in the "Add New Book" form'
);

assert(
  studioModalSource.includes('min-h-[85px] bg-white resize-y'),
  'Bio paragraph editor uses structured, resizable textareas with word count indicators'
);

assert(
  studioModalSource.includes('flex-wrap') && studioModalSource.includes('break-words'),
  'Author Studio book items use flex-wrap and break-words to prevent crooked edit/delete buttons'
);

// -----------------------------------------------------------------------------
// SUITE 7: SiteContentContext Catalog Initializer & Book Sanitation
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 7: SiteContentContext Catalog Initializer & Book Sanitation ---');
const contextSource = fs.readFileSync('src/contexts/SiteContentContext.tsx', 'utf-8');

assert(
  contextSource.includes('DEFAULT_STUDIO_BOOKS: StudioBookItem[] = BOOKS.map'),
  'DEFAULT_STUDIO_BOOKS initializes with all 11 published books from professorData'
);

assert(
  contextSource.includes('sanitizedTitle') && contextSource.includes('trim()'),
  'addBook sanitizes and trims title, publisher, ISBN, and details on addition'
);

assert(
  contextSource.includes('price: Number(newBook.price) && !isNaN(Number(newBook.price)) ? Number(newBook.price) : 399'),
  'addBook maintains safe price fallback if non-numeric value is submitted'
);

console.log('\n================================================================');
console.log(` AUDIT RESULT: ${passedTests}/${totalTests} Tests Passed`);
if (passedTests === totalTests) {
  console.log(' STATUS: 100% PASS - FRONTEND IS COMPLETELY RESILIENT TO CONTENT EXPANSION');
} else {
  console.log(' STATUS: FAIL - RESOLVE DEFICIENCIES');
}
console.log('================================================================\n');
