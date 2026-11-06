/**
 * Comprehensive Automated SEO & Indexing Verification Suite
 */

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
console.log('  NET VIDYA / RAJNIKANT DODIYA: SEO & INDEXING VERIFICATION');
console.log('================================================================\n');

// 1. Robots.txt
console.log('--- 1. Robots Exclusion Protocol (robots.txt) ---');
const robotsPath = path.resolve('public/robots.txt');
assert(fs.existsSync(robotsPath), 'public/robots.txt exists');
const robotsContent = fs.readFileSync(robotsPath, 'utf8');
assert(robotsContent.includes('User-agent: *'), 'Allows search engine crawlers (User-agent: *)');
assert(robotsContent.includes('Sitemap: https://rajnikantdodiya.com/sitemap.xml'), 'References canonical sitemap.xml');
assert(robotsContent.includes('Disallow: /api/'), 'Protects private API routes from crawler spam');

// 2. Sitemap.xml
console.log('\n--- 2. Canonical XML Sitemap (sitemap.xml) ---');
const sitemapPath = path.resolve('public/sitemap.xml');
assert(fs.existsSync(sitemapPath), 'public/sitemap.xml exists');
const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
assert(sitemapContent.startsWith('<?xml'), 'Sitemap is valid XML declaration');
assert(sitemapContent.includes('<loc>https://rajnikantdodiya.com/</loc>'), 'Contains root canonical URL');
assert(sitemapContent.includes('<loc>https://rajnikantdodiya.com/#store</loc>'), 'Contains store canonical URL');
assert(sitemapContent.includes('<loc>https://rajnikantdodiya.com/#sample</loc>'), 'Contains free demo sample canonical URL');
assert(sitemapContent.includes('<loc>https://rajnikantdodiya.com/#publications</loc>'), 'Contains publications canonical URL');
assert(sitemapContent.includes('dr-rajnikant-dodiya.jpg'), 'Contains image sitemap tag for professor portrait');

// 3. Schema.org JSON-LD Structured Data
console.log('\n--- 3. Schema.org JSON-LD Knowledge Graph in index.html ---');
const indexHtmlPath = path.resolve('index.html');
assert(fs.existsSync(indexHtmlPath), 'index.html exists');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

assert(indexHtml.includes('application/ld+json'), 'Contains Schema.org application/ld+json script block');

// Extract JSON-LD
const jsonLdMatch = indexHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
assert(Boolean(jsonLdMatch && jsonLdMatch[1]), 'Successfully extracted JSON-LD payload');

if (jsonLdMatch && jsonLdMatch[1]) {
  try {
    const parsed = JSON.parse(jsonLdMatch[1]);
    assert(Array.isArray(parsed['@graph']), 'Schema contains @graph entity array');
    
    // Check Person schema
    const person = parsed['@graph'].find(e => e['@type'] === 'Person');
    assert(Boolean(person), 'Person schema is declared');
    assert(person.name === 'Dr. Rajnikant S. Dodiya', 'Person name matches Dr. Rajnikant S. Dodiya');
    assert(person.sameAs.some(u => u.includes('orcid.org')), 'Person sameAs links to ORCID');
    assert(person.sameAs.some(u => u.includes('scholar.google.com')), 'Person sameAs links to Google Scholar');
    assert(person.sameAs.some(u => u.includes('vidwan.inflibnet.ac.in')), 'Person sameAs links to Vidwan');
    assert(person.sameAs.some(u => u.includes('youtube.com')), 'Person sameAs links to official YouTube channel');

    // Check Course & Product schema
    const course = parsed['@graph'].find(e => Array.isArray(e['@type']) && e['@type'].includes('Course'));
    assert(Boolean(course), 'Course and Product schema is declared');
    assert(course.name.includes('GSET + UGC NET English Final Pack 2026'), 'Course name matches Final Pack 2026');
    assert(course.offers.price === '799.00', 'Course price is ₹799 in schema');

    // Check FAQPage schema
    const faq = parsed['@graph'].find(e => e['@type'] === 'FAQPage');
    assert(Boolean(faq), 'FAQPage schema is declared for Google search rich snippets');
    assert(faq.mainEntity.length >= 3, 'FAQPage contains multiple question-answer pairs');

    // Check Book schema
    const book = parsed['@graph'].find(e => e['@type'] === 'Book');
    assert(Boolean(book), 'Book schema is declared for Kalam monograph');
    assert(book.isbn === '978-93-85137-33-4', 'Book schema contains valid ISBN');
  } catch (err) {
    console.error('Failed to parse JSON-LD:', err);
    assert(false, 'JSON-LD syntax is 100% valid JSON', err.message);
  }
}

// 4. Open Graph & Social Cards
console.log('\n--- 4. Open Graph & Twitter Cards ---');
assert(indexHtml.includes('property="og:title"'), 'Contains Open Graph title');
assert(indexHtml.includes('property="og:image"'), 'Contains Open Graph image tag');
assert(indexHtml.includes('name="twitter:card"'), 'Contains Twitter large summary card tag');
assert(indexHtml.includes('rel="canonical"'), 'Contains canonical link tag');

// 5. Semantic Crawler Snapshot
console.log('\n--- 5. Semantic Crawler Snapshot (<noscript>) ---');
assert(indexHtml.includes('<noscript>'), 'Contains semantic noscript fallback block for search bots');
assert(indexHtml.includes('<h1>Dr. Rajnikant S. Dodiya</h1>'), 'Noscript contains semantic H1 heading');
assert(indexHtml.includes('demo-test.html'), 'Noscript links directly to free sample demo test');

// 6. Dynamic SEO Controller
console.log('\n--- 6. Dynamic SEO Controller in src/App.tsx ---');
const appTsx = fs.readFileSync('src/App.tsx', 'utf8');
assert(appTsx.includes('tabDescriptions'), 'App.tsx declares dynamic meta descriptions per route');
assert(appTsx.includes('document.querySelector(\'link[rel="canonical"]\')'), 'App.tsx updates canonical URL dynamically on route change');

// Summary
console.log('\n================================================================');
console.log(`TOTAL SEO CHECKS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
console.log('================================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 100% OF SEO, KNOWLEDGE GRAPH & INDEXING SPECIFICATIONS VERIFIED!');
}
