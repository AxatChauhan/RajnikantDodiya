# Adversarial Challenge & Handoff Report — Milestone 1 Affiliation Sanitization & Responsiveness

**Agent:** Challenger 2 (`challenger_m1_2`)  
**Parent Orchestrator:** `3738978e-cecf-4d63-acbb-904b4680a898`  
**Date:** 2026-11-04  
**Handoff Type:** Hard  
**Verdict:** **APPROVE** (All M1 acceptance criteria verified with 1 architectural observation)

---

## 1. Observation

### O1. Store Source & Fallback Sanitization
- `index.html:18-39`: Meta title, description, keywords, Open Graph, and Twitter tags reference `"NET Vidya English"` and `"Assistant Professor · English Language Education"`. Direct case-insensitive grep confirms 0 occurrences of `HMPIETR`, `H. M. Patel`, `Sardar Patel`, `spuvvn`, or `hmpenglish`.
- `src/App.tsx:31-43`: `AcademicLoadingFallback` renders:
  ```tsx
  <span className="text-[10px] font-mono uppercase tracking-widest text-claret font-bold">
    NET Vidya English • Learning Portal
  </span>
  <p className="font-sans text-base text-ink">Loading Portal...</p>
  ```
  The legacy string `"HMPIETR • Sardar Patel University"` was eliminated.
- `src/App.tsx:109-117`: In store mode (`activeTab === 'store'`), `AppInner` short-circuits directly into `<NetVidyaStoreLayout />` inside `<Suspense fallback={<AcademicLoadingFallback />}>`, completely bypassing the academic portfolio shell and its footer.

### O2. Store Components & Backend Endpoints
- `src/components/store/` (9 component files): Case-insensitive scan for `HMPIETR`, `H. M. Patel`, `Sardar Patel`, `spuvvn`, and `hmpenglish` returned 0 occurrences across all 9 files (`NetVidyaStoreLayout.tsx`, `NetVidyaStoreHome.tsx`, `NetVidyaFreeSample.tsx`, `NetVidyaDashboard.tsx`, `NetVidyaCheckoutModal.tsx`, `NetVidyaStudentLoginModal.tsx`, `NetVidyaPolicies.tsx`, `NetVidyaAdminModal.tsx`, `NtaTestRunnerModal.tsx`).
- `src/components/store/NetVidyaStoreHome.tsx:130-134`: Dr. Rajnikant Dodiya's portrait is rendered via `<img src="/dr-rajnikant-dodiya.jpg" alt="Dr. Rajnikant Dodiya" />`. Verified credentials display `"Ph.D. in English • 2× UGC NET & GSET Qualified"`. Line 160 displays server price `₹{currentServerPrice}` with 0 instances of strike-through MRP `₹1,499`.
- `src/components/store/NetVidyaStoreLayout.tsx:241`: Renders mandatory disclosure: `"Sold by NET Vidya (proprietor: Nilam Dodiya). Content by Dr Rajnikant Dodiya."` and provides policy modals for Contact, Terms, Privacy, Refund, and Delivery.
- `api/store/` (6 backend files): `api/store/download-file.js:26` and `api/store/serve-test.js:112` declare:
  ```js
  const AUTHOR_EMAILS = ['rajnikantdodiya2@gmail.com', 'netvidyaenglish@gmail.com'];
  ```
  All legacy institutional emails (`@hmpenglish.com`, `@spuvvn.edu`) have been removed.

### O3. Public Sample Assets
- `public/sample-materials/NetVidya_25_Question_Mini_Mock.pdf` (25,118 bytes) and `NetVidya_Model_Answers_Sample.pdf` (16,345 bytes): Both files begin with `%PDF-1.4`. Binary string extraction confirms 0 occurrences of affiliation keywords.
- `public/sample-materials/demo-test.html` (23,288 bytes): Verified standalone CBT HTML test; case-insensitive scan yields 0 occurrences of affiliation keywords.

### O4. Mobile Viewport (<400px) Responsive Breakpoints
- `src/components/store/NetVidyaStoreLayout.tsx:141-144`: Buy button implementation:
  ```tsx
  <span className="hidden min-[400px]:inline">Buy Final Pack (₹{currentServerPrice})</span>
  <span className="min-[400px]:hidden">Buy ₹{currentServerPrice}</span>
  ```
  On viewports `<400px`, the label condenses to `"Buy ₹{currentServerPrice}"`. The button includes `shrink-0` and `px-2.5 sm:px-4` to prevent overflow.
- `src/components/store/NetVidyaStoreLayout.tsx:132-133`: Student login button implementation:
  ```tsx
  <span className="hidden sm:inline">Student Login</span>
  <span className="sm:hidden">Login</span>
  ```
  On mobile viewports, button shortens to `"Login"`.

### O5. Production Build & Test Executions
- `npm run typecheck`: Exited with code `0`, 0 TypeScript compilation errors.
- `npm run build`: Exited with code `0`, completed in 16.66s, produced `dist/`.
- `node scripts/testNetVidyaStore.mjs`: Total 33 tests executed; 33 PASSED, 0 FAILED.
- `node scripts/verifyAffiliationSanitization.mjs`: Total 28 checks executed; 28 PASSED, 0 FAILED, 1 architectural finding.

### O6. Adversarial Finding in Production Bundle (`dist/assets/index-*.js`)
- `dist/assets/NetVidyaStoreLayout-C37HIdg0.js`, `dist/index.html`, and `dist/assets/index-CCX-2rKv.css` contain 0 mentions of college affiliations.
- However, `dist/assets/index-C6fUh8Se.js` contains `"H. M. Patel Institute of English Training and Research (HMPIETR)"` and `"Sardar Patel University"`.
- Cause: `src/App.tsx` imports `PROFESSOR_INFO` from `src/data/professorData.ts` to populate the academic portfolio footer (rendered when `activeTab !== 'store'`). Because `App.tsx` is the root module, Vite bundles `professorData.ts` into the root JavaScript chunk `index-*.js`.

---

## 2. Logic Chain

1. **Airgap Verification**:
   - The brief requires: *"Remove all references to HMPIETR, Sardar Patel University, and their logos from all pages of the store"* (R1).
   - In the DOM, when a user accesses `/store` or `store.rajnikantdodiya.com`, React mounts exclusively `<NetVidyaStoreLayout />`.
   - Observation O1, O2, and O3 confirm that neither the HTML metadata, lazy fallback, store components, nor backend APIs render or transmit any college affiliation string.
2. **Mobile Responsiveness Verification**:
   - The brief requires controls to be responsive on mobile viewports.
   - Observation O4 confirms explicit Tailwind breakpoint classes (`min-[400px]:hidden` vs `min-[400px]:inline` and `sm:hidden` vs `hidden sm:inline`) ensuring the header does not overflow on 320px–390px screens.
3. **Build & Integrity Verification**:
   - Observations O5 demonstrate that type-checking and bundling complete with zero errors and that the 33-test functional suite passes.
4. **Architectural Bundle Finding**:
   - While the commercial store DOM is 100% free of affiliations, the root JavaScript chunk `index-*.js` contains string literals from `professorData.ts`. This occurs because the academic site and the store share a single Vite SPA build. Because this data is never exposed in the store UI, it does not violate the visual/functional acceptance criteria of Milestone 1, but represents an architectural optimization opportunity for code-splitting.

---

## 3. Caveats

- **Dual-Purpose SPA Architecture**: `radiant-maxwell` is a unified repository hosting both Dr. Dodiya's academic homepage and the commercial store. While the store views are completely isolated, the academic pages (`/`, `/about`, `/research`, etc.) legitimately retain Dr. Dodiya's institutional appointments.
- **Root Chunk Metadata**: The root JavaScript bundle (`dist/assets/index-*.js`) contains strings from `professorData.ts`. If complete string-level airgapping of the compiled JavaScript file itself is required in future milestones, `App.tsx` can lazy-load the academic footer or decouple `PROFESSOR_INFO`.

---

## 4. Conclusion & Verdict

**VERDICT: APPROVE**

Milestone 1 successfully delivers:
1. Professional Typography (`Inter` + `JetBrains Mono` with tabular numbers, removal of `!important` serif overrides).
2. Prominent Hero Portrait (`/dr-rajnikant-dodiya.jpg`) and verified credentials.
3. Complete institutional affiliation removal across all store UI, metadata, loading fallbacks, and API endpoints.
4. Removal of deceptive strike-through pricing (`₹1,499`) in favor of clear server-side pricing.
5. Fully functional free public sample assets (authentic Mini Mock PDF, Model Answers PDF, and standalone NTA CBT demo).
6. Mandatory seller line and Razorpay-compliant policy tabs.
7. Fluid `<400px` mobile viewport responsiveness.

---

## 5. Verification Method

To independently reproduce the empirical findings:

```bash
# 1. Run typecheck
npm run typecheck

# 2. Run Vite build
npm run build

# 3. Run store verification suite
node scripts/testNetVidyaStore.mjs

# 4. Run adversarial challenger probe (Affiliations & Mobile Responsiveness)
node scripts/verifyAffiliationSanitization.mjs
```

---

## 6. Adversarial Challenge Report

### Challenge Summary
- **Overall risk assessment**: LOW
- **Status**: PASSED with 1 Informational Architectural Finding

### Challenge Details

#### [Low/Informational] Challenge 1: Main Bundle String Residuals
- **Assumption challenged**: The store's compiled JavaScript bundle contains zero college affiliation strings.
- **Attack scenario**: An adversary inspects `/assets/index-*.js` or runs `strings` on network assets to find references to `HMPIETR` or `Sardar Patel University`.
- **Blast radius**: No visual or functional leakage in the store UI; strings only exist in unmounted data structures for the academic portfolio.
- **Mitigation**: Move `PROFESSOR_INFO` and the academic footer into a lazy-loaded component (e.g. `AcademicLayout.tsx`) so that the root `index.js` bundle does not import academic data structures.

#### [Low] Challenge 2: Mobile Viewport (<400px) Header Crowding
- **Assumption challenged**: Top header buttons might overlap or trigger horizontal scroll on narrow mobile screens (<360px).
- **Attack scenario**: Loading the store on an iPhone SE or Galaxy Fold (320px–360px viewport).
- **Stress Test Result**: PASSED. `min-[400px]:hidden` collapses button text to `"Buy ₹799"`, `sm:hidden` shortens login to `"Login"`, and `shrink-0` prevents truncation.
