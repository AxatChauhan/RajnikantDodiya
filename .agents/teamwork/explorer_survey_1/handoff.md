# Handoff Report — Frontend, Branding, Typography & Public Pages Survey

**Agent Folder:** `c:\Users\DELL\Documents\antigravity\radiant-maxwell\.agents\teamwork\explorer_survey_1`  
**Parent Orchestrator:** `3738978e-cecf-4d63-acbb-904b4680a898`  
**Date:** 2026-11-04  
**Handoff Type:** Hard (Survey Task Complete)  

---

## 1. Observation

### O1. Tech Stack & Architecture
- `package.json`: Vite `5.1.4` (line 33), React `18.2.0` (line 20), React-DOM `18.2.0` (line 21), TypeScript `5.3.3` (line 32), Tailwind CSS `3.4.1` (line 31), `@supabase/supabase-js` `^2.118.0` (line 17), `lucide-react` `^0.344.0` (line 18).
- `src/App.tsx:65-72`: Route switcher listens for `store.` hostname, `/store`, or `#store` to activate `activeTab = 'store'`.
- `src/App.tsx:109-117`: When `activeTab === 'store'`, renders `<NetVidyaStoreLayout onBackToAcademicSite={() => handleNavigate('home')} />` wrapped in `<Suspense fallback={<AcademicLoadingFallback />}>`.

### O2. Typography & Overrides
- `index.html:43`: Google Fonts link loads `Newsreader:ital,opsz,wght@0,6..72,400...700` and `Source Sans 3:ital,wght@0,400...700`.
- `src/index.css:44-48`:
  ```css
  /* Newsreader for ALL headings */
  h1, h2, h3, h4, h5, h6, .font-serif, .font-display {
    font-family: 'Newsreader', Georgia, serif !important;
    text-wrap: balance;
  }
  ```
- `src/index.css:69-81`: Floor rule forcibly scales `.text-xs`, `.text-2xs`, and all `text-[8px]`..`text-[13px]` to `14px !important`.
- `src/index.css:84-86`: `.font-mono { font-family: var(--font-family-reading, 'Source Sans 3', system-ui, -apple-system, sans-serif) !important; }`.

### O3. Hero Branding & Photo
- `public/dr-rajnikant-dodiya.jpg`: Exists, file size 173,824 bytes, 1024×1024 resolution circular-cropped portrait of Dr. Rajnikant Dodiya.
- `src/components/store/NetVidyaStoreHome.tsx:95-184`: Hero section contains only countdown badge, headline, subtitle, centered pricing card, and checkmarks. There is **zero image element** (`<img>`) or reference to `dr-rajnikant-dodiya.jpg`.

### O4. Affiliations to Remove
- `src/App.tsx:38`: `AcademicLoadingFallback` verbatim code:
  ```tsx
  <span className="text-[10px] font-mono uppercase tracking-widest text-claret font-bold">
    HMPIETR • Sardar Patel University
  </span>
  ```
  This fallback renders while `NetVidyaStoreLayout` is lazy-loading.
- `src/components/store/NetVidyaStoreLayout.tsx:251`:
  ```tsx
  <span>Dr. Rajnikant Dodiya Academic CV</span>
  ```
  Button links back to the academic site containing extensive HMPIETR / SPU references.
- `api/store/serve-test.js:112`:
  ```javascript
  const AUTHOR_EMAILS = ['rajnikantdodiya2@gmail.com', 'rajnikantdodiya@hmpenglish.com', 'rajnikant.dodiya@spuvvn.edu'];
  ```
- `api/store/download-file.js:26`:
  ```javascript
  const AUTHOR_EMAILS = ['rajnikantdodiya2@gmail.com', 'rajnikantdodiya@hmpenglish.com', 'rajnikant.dodiya@spuvvn.edu'];
  ```
- `index.html:22-23`:
  ```html
  <meta name="description" content="Official academic portfolio of Dr. Rajnikant S. Dodiya, Assistant Professor · English Language Education & Teacher Education at H. M. Patel Institute of English Training & Research (HMPIETR), Vallabh Vidyanagar." />
  <meta name="keywords" content="Dr. Rajnikant S. Dodiya, Dr. Rajnikant Dodiya, Rajnikant Dodiya, HMPIETR, English Language Education, Sardar Patel University, Teacher Education, ELEF, CAIELE" />
  ```

### O5. Public Free Sample Deliverables
- `src/components/store/NetVidyaFreeSample.tsx:31-40`:
  ```typescript
  const sampleText = `%PDF-1.4\n% NET Vidya English Sample\n% ${label}\n...`;
  const blob = new Blob([sampleText], { type: 'application/pdf' });
  ```
  Generates fake text blobs for `NetVidya_25_Question_Mini_Mock.pdf` and `NetVidya_Model_Answers_Sample.pdf` instead of real PDFs.
- `src/components/store/NtaTestRunnerModal.tsx:28-121`: Contains only 8 sample questions in `SAMPLE_NTA_QUESTIONS`.
- `api/store/serve-test.js:153`: Refers to `/test-hall/runner.html?testId=${testId}`, but `/test-hall/runner.html` does not exist in `public/` or anywhere in the repo.

### O6. Footer, Legal & Disclosures
- `src/components/store/NetVidyaStoreLayout.tsx:241-243`:
  ```tsx
  <strong className="text-gray-900 font-bold text-sm block">NET Vidya English</strong>
  <p className="mt-0.5 text-gray-600">
    Sold by NET Vidya (proprietor: Nilam Dodiya). Content by Dr Rajnikant Dodiya.
  </p>
  ```
- `api/store/price.js:18`: `sellerLine: 'Sold by NET Vidya (proprietor: Nilam Dodiya). Content by Dr Rajnikant Dodiya.'`.
- `src/components/store/NetVidyaPolicies.tsx:161-180`: Discloses NET Vidya (Proprietor: Nilam Dodiya), `netvidyaenglish@gmail.com`, `+91 98251 23456`, with tabs for Terms, Privacy, Refund, Delivery, and Contact.

### O7. Mobile Responsiveness
- `src/components/store/NetVidyaStoreLayout.tsx:141-145`: Buy button text `Buy Final Pack (₹{currentServerPrice})` in header crowded against student login button and logos on `<380px` viewports.
- `src/components/store/NtaTestRunnerModal.tsx:538-574`: Question palette grid renders below question canvas in mobile viewports (`flex flex-col lg:flex-row`), requiring substantial scrolling.

---

## 2. Logic Chain

1. **Tech Stack Assessment**: From O1, the site is a client-side Vite React application with Vercel serverless API handlers in `api/store/`. When accessing `store.rajnikantdodiya.com`, `App.tsx` routes to `NetVidyaStoreLayout`.
2. **Typography Evaluation**: From O2, `index.css` forces `Newsreader` (serif) on all headings (`h1-h6`) with `!important`. This overrides Tailwind utility classes and gives the commercial store an archaic bookish look. Transitioning to a modern grotesque sans-serif like `Inter` (or `Plus Jakarta Sans`) and unbinding `!important` will fulfill Requirement R1.
3. **Branding Gap**: From O3, `dr-rajnikant-dodiya.jpg` exists in `public/` but is completely absent from `NetVidyaStoreHome.tsx`. Thus, the store currently fails Acceptance Criterion 54 ("Hero section prominently displays Dr. Rajnikant Dodiya's photo from public/dr-rajnikant-dodiya.jpg").
4. **Affiliation Exposure**: From O4, although the store inner pages avoid HMPIETR text, the loading fallback in `App.tsx:38` flashes `"HMPIETR • Sardar Patel University"` when entering the store, `api/store` includes `@hmpenglish.com` and `@spuvvn.edu`, `index.html` has meta keywords with both institutions, and the footer links to the academic CV. To satisfy Acceptance Criterion 55 ("No mention or logos of HMPIETR or Sardar Patel University appear anywhere on the site"), these locations must be sanitized.
5. **Sample Delivery Gap**: From O5, the public sample downloads are pseudo-PDF text blobs created in JavaScript. Opening them in Acrobat Reader produces syntax errors. Furthermore, `serve-test.js` expects `/test-hall/runner.html` which does not exist. Genuine static PDFs (`25-Question Mini Mock PDF`, `Model Answers PDF`) and standalone demo HTML must be provided to satisfy Acceptance Criterion 58 ("Anyone can open the free demo test and free sample PDFs without logging in").
6. **Compliance Confirmed**: From O6, the mandated seller line and 5 policy tabs are fully compliant with R6 and Razorpay merchant requirements.

---

## 3. Caveats

- **Academic Tabs vs. Store Isolation**: The user request specifies store domain `store.rajnikantdodiya.com`. In this repo, `App.tsx` houses both the academic portfolio (tabs: home, about, research, publications, talks, communities, learn, bookstore, contact) and the student store (`store`). Removing affiliations from the store requires ensuring store visitors cannot accidentally encounter the academic fallback or backlink. If the prompt implies removing affiliations across all pages of the repo, the academic data files (`professorData.ts`) would also require refactoring.
- **Razorpay Live Credentials**: Checkout modal and backend API use test mode fallbacks when `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` environment variables are absent.

---

## 4. Conclusion

The existing codebase contains a well-structured base in `src/components/store/` with server-side price calculation and policy pages, but requires 5 key frontend refactors:
1. **Typography**: Replace global `Newsreader` with clean `Inter` sans-serif and remove `!important` font family overrides in `src/index.css`.
2. **Hero Section**: Redesign `NetVidyaStoreHome.tsx` Hero to include `public/dr-rajnikant-dodiya.jpg` with author credentials.
3. **Affiliation Sanitization**: Remove `"HMPIETR • Sardar Patel University"` from `App.tsx:38`, delete institutional emails from `api/store/`, update `index.html` meta tags, and remove the academic CV link from the store footer.
4. **Free Sample Assets**: Provide real static PDFs in `public/sample-materials/` (Mini Mock and Model Answers) and a standalone NTA test HTML runner.
5. **Mobile Polishing**: Responsively truncate the header Buy CTA on mobile screens and refine NTA test runner palette layout.

---

## 5. Verification Method

To independently verify these findings:
1. **Automated Verification Test**:
   ```bash
   node scripts/testNetVidyaStore.mjs
   ```
2. **Typography Verification**:
   - Inspect `index.html` line 43 (`Newsreader` font link).
   - Inspect `src/index.css` lines 44-48 (`h1-h6 font-family: 'Newsreader' !important`).
3. **Hero Image Verification**:
   - Inspect `public/dr-rajnikant-dodiya.jpg` (verifies image presence).
   - Inspect `src/components/store/NetVidyaStoreHome.tsx` lines 95-184 (confirms absence of `<img>`).
4. **Affiliation Grep Verification**:
   - Search for `"HMPIETR"` in `src/App.tsx:38`, `api/store/serve-test.js:112`, `api/store/download-file.js:26`, and `index.html:22-23`.
5. **Sample PDF Download Verification**:
   - Inspect `src/components/store/NetVidyaFreeSample.tsx` lines 31-40 (`Blob([sampleText], { type: 'application/pdf' })`).
