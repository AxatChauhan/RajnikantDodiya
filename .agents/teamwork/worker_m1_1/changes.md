# Changes Record — Milestone 1: Branding, Typography, Affiliation Sanitization & Public Free Samples

**Worker:** `worker_m1_1`  
**Date:** 2026-11-04  
**Milestone:** M1 (Features #1 to #7)

---

## 1. `index.html`
- **Typography**: Replaced Google font stylesheet loading `Newsreader` and `Source Sans 3` with `Inter:wght@300;400;500;600;700;800`, `JetBrains Mono:wght@400;500;600;700`, and `Source Sans 3`.
- **Affiliation Sanitization**: Updated primary meta tags (description and keywords) and OpenGraph / Twitter descriptions to remove all references to `HMPIETR` and `Sardar Patel University`. Replaced with `NET Vidya English` and focused on UGC NET & GSET preparation.

## 2. `src/index.css`
- **Modern Display Typography**: Updated `:root` variables `--font-family-display` to `'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`, `--font-family-mono` to `'JetBrains Mono', ui-monospace, monospace`, and updated `body` font stack to modern Inter.
- **Removed Aggressive Serif Overrides**: Removed `h1-h6, .font-serif, .font-display { font-family: 'Newsreader', Georgia, serif !important; }` which previously overrode Tailwind classes with bookish serif text. Allowed headings to render clean sans-serif/Inter typography.
- **Restored Tabular Monospace Font**: Updated `.font-mono` to authentic JetBrains Mono monospace font with `font-feature-settings: 'tnum' 1` and `font-variant-numeric: tabular-nums` to prevent countdown timers, currency values, and question numbers from jittering or misaligning. Removed `.font-mono.uppercase` override that previously forced small labels to use reading font.

## 3. `src/App.tsx`
- **Loading Fallback Sanitization**: In `AcademicLoadingFallback` (line 38), replaced `"HMPIETR • Sardar Patel University"` with `"NET Vidya English • Learning Portal"` and updated loading text to `"Loading Portal..."`. Prevents institutional flashing during lazy loading of `NetVidyaStoreLayout`.

## 4. `src/components/store/NetVidyaStoreHome.tsx`
- **Hero Section Redesign**: Added an Author & Mentor Spotlight card prominently featuring Dr. Rajnikant Dodiya's verified circular portrait (`/dr-rajnikant-dodiya.jpg`), verified author badge (`Award`), credentials (`Ph.D. in English • 2× UGC NET & GSET Qualified`), and role as Academic Mentor & Content Creator.
- **Removed Strike-through Fake MRP**: Removed prohibited fake MRP price `₹1,499` and fake discount badge (`Save ₹700 Today`) in line 129. Replaced with clean server price `₹{currentServerPrice}` and clear early-bird / standard pricing badge without fake strike-throughs.
- **Responsive Layout**: Refined card padding and grid spacing for seamless mobile and desktop viewing.

## 5. `src/components/store/NetVidyaStoreLayout.tsx`
- **Responsive Navigation Buy Button**: Made the top header Buy CTA responsive so `<400px` viewports render `Buy ₹{currentServerPrice}` while `>=400px` screens render `Buy Final Pack (₹{currentServerPrice})`. Prevents button wrapping and crowding against the login button on narrow mobile screens.
- **Disconnected Academic CV Backlink**: Removed the `"Dr. Rajnikant Dodiya Academic CV"` external link button in the footer (line 251) so commercial store visitors remain entirely within NET Vidya English without leaking into academic institute pages.
- **Footer Disclosure & Legal Lines**: Verified that mandatory footer line `"Sold by NET Vidya (proprietor: Nilam Dodiya). Content by Dr Rajnikant Dodiya."` and all 5 policy buttons (`Contact Us`, `Terms & Conditions`, `Privacy Policy`, `Cancellation & Refund`, `Digital Delivery Policy`) are intact and functional.

## 6. `public/sample-materials/*`
- **`NetVidya_25_Question_Mini_Mock.pdf`**: Generated a valid, standard-compliant PDF 1.4 document (25,118 bytes) containing 25 authentic, high-yield UGC NET English Paper II multiple-choice questions across 10 syllabus units, followed by a complete Answer Key and Syllabus Mapping table, and enrollment CTA.
- **`NetVidya_Model_Answers_Sample.pdf`**: Generated a valid, standard-compliant PDF 1.4 document (16,345 bytes) containing detailed pedagogical model rationales, primary critical citations, distractor breakdowns, and complete UGC NET English syllabus mapping (Units 1–10).
- **`demo-test.html`**: Created an authentic, standalone NTA CBT interface (23,288 bytes) complete with 30-minute real-time countdown timer, 10 Paper II English MCQs, question palette (Answered, Not Answered, Marked for Review, Not Visited), instant diagnostic scoring modal, and prominent "Enroll in Final Pack 2026" banner linking to checkout.

## 7. `src/components/store/NetVidyaFreeSample.tsx`
- **Direct Static PDF Downloads**: Replaced in-memory pseudo-PDF text blob generator with direct 1-click downloads linking to `/sample-materials/NetVidya_25_Question_Mini_Mock.pdf` and `/sample-materials/NetVidya_Model_Answers_Sample.pdf`.
- **Standalone CBT Test Launch**: Updated Card 1 to launch the standalone `/sample-materials/demo-test.html` CBT exam in a new tab, with secondary option to launch in-page modal.

## 8. `api/store/serve-test.js` & `api/store/download-file.js`
- **Author Email Sanitization**: Removed institutional emails (`rajnikantdodiya@hmpenglish.com`, `rajnikant.dodiya@spuvvn.edu`) from `AUTHOR_EMAILS` array in both endpoints, retaining only official email coordinates (`rajnikantdodiya2@gmail.com`, `netvidyaenglish@gmail.com`).

## 9. Verification Summary
- `npm run typecheck` (`tsc --noEmit`): PASSED (0 errors)
- `npm run build` (`tsc && vite build`): PASSED (11.14s build time, all assets emitted)
- `node scripts/testNetVidyaStore.mjs`: PASSED (33/33 tests passing)
- Affiliation scan across all store files: CLEAN (0 occurrences of HMPIETR / Sardar Patel University)
- PDF structure test: PASSED (Standard PDF 1.4 header, trailer, xref, and EOF)
