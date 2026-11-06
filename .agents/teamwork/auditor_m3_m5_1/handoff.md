# Forensic Integrity Audit Report: Milestones 3, 4, 5 & Whole-Project Integrity

**Auditor Agent:** `auditor_m3_m5_1` (Forensic Integrity Auditor)  
**Parent Orchestrator:** `3738978e-cecf-4d63-acbb-904b4680a898`  
**Milestones Audited:** Milestone 3 (Features #13–#17), Milestone 4 (Features #18–#20), Milestone 5 (Features #21–#27), and Whole-Project Integrity  
**Integrity Mode:** `development` (per `ORIGINAL_REQUEST.md`)  
**Date:** 2026-11-04  
**Verdict:** **CLEAN** (No Integrity Violations Detected)

---

## 1. Observation

### O1. Genuine Cryptography & HMAC Signature Verification (No Bypasses)
- **`api/store/verify-payment.js` (lines 43–76):**
  - Strictly fail-closed parameter validation:
    ```javascript
    if (!razorpay_signature || !razorpay_payment_id) {
      return res.status(400).json({
        success: false,
        verified: false,
        error: 'Payment signature parameters required'
      });
    }
    ```
  - Genuine HMAC-SHA256 signature calculation using Node.js `crypto.createHmac('sha256', keySecret).update(payload).digest('hex')`.
  - Constant-time verification using `crypto.timingSafeEqual(expectedBuf, receivedBuf)`.
  - Client-supplied prices in `req.body` are ignored; price is computed authoritatively via `computeCurrentServerPrice(settings)`.
  - Immediate auto-login token issued via `createSessionToken` with scrypt/timingSafeEqual security.
  - Zero backdoors, dummy pass tokens, or `if (true)` bypasses found.
- **`api/store/razorpay-webhook.js` (lines 20–41):**
  - Requires header `x-razorpay-signature` and verifies raw body HMAC against `RAZORPAY_WEBHOOK_SECRET` using `crypto.timingSafeEqual`.
  - Ingests `payment.captured` events to asynchronously enroll buyers and dispatch purchase confirmation email.
- **`api/auth/auth-helper.js` (lines 38–113):**
  - Password hashing implemented with `crypto.scryptSync(password, salt, 64)`.
  - Timing-safe password verification via `crypto.timingSafeEqual`.
  - JWT session token generation (`HS256`) and verification with expiration checks (`exp`).
  - 32-byte cryptographic password reset tokens with 1-hour expiration and one-time consumption invalidation (`invalidateResetToken`).
- **`api/store/download-file.js` & `api/store/serve-test.js`:**
  - Strictly require `Authorization: Bearer <token>` (return HTTP 401 Unauthorized if missing, malformed, or expired).
  - Verify active paid buyer entitlement (`isBuyer === true`, returning HTTP 403 Forbidden for non-buyers).
  - Legacy backdoor queries (`?nv_buyer_token=...` or `?userToken=nv_buyer_...`) are completely ignored and return 401.

### O2. CBT Test Runner Authenticity (`public/test-hall/runner.html`)
- File `public/test-hall/runner.html` exists with size **69,102 bytes** and 972 lines.
- **Question Bank (lines 559–679):** Contains 100 genuine, authentic academic multiple-choice questions with 4 distinct options, correct answer indices, and explanatory pedagogical notes covering all 10 units of the UGC-NET Paper II English syllabus:
  - Unit 1: Drama (Qs 1–10: Marlowe, Shakespeare, Webster, Beckett, Pinter, Osborne, Miller, Stoppard, Shaw)
  - Unit 2: Poetry (Qs 11–20: Chaucer, Spenser, Donne, Milton, Pope, Wordsworth, Keats, Tennyson, Yeats, Eliot)
  - Unit 3: Fiction (Qs 21–30: Defoe, Austen, Shelley, Brontë, Dickens, Eliot, Hardy, Woolf, Joyce, Orwell)
  - Unit 4: Non-Fictional Prose (Qs 31–40: Bacon, Addison & Steele, Lamb, De Quincey, Hazlitt, Carlyle, Arnold)
  - Unit 5: Language: Basic Concepts (Qs 41–50: Saussure, Chomsky, IPA, Grimm's Law, morphology, semantics)
  - Unit 6: English in India (Qs 42–60: Macaulay's Minute 1835, Woods Despatch 1854, Radhakrishnan, Kothari, NEP 2020)
  - Unit 7: Cultural Studies (Qs 61–70: CCCS, Raymond Williams, Stuart Hall, Richard Hoggart, Althusser, Gramsci)
  - Unit 8: Literary Criticism (Qs 71–80: Aristotle, Longinus, Sidney, Dryden, Johnson, Coleridge, Arnold, Richards, Brooks)
  - Unit 9: Literary Theory (Qs 81–90: Barthes, Derrida, Foucault, Beauvoir, Showalter, Said, Bhabha, Spivak, Butler, Glotfelty)
  - Unit 10: Research Methods (Qs 91–100: MLA 9th ed, primary/secondary sources, peer-review, ibid, plagiarism, stylometry, DOI)
- **Timer (lines 725–744):** Genuine 3-hour countdown (`180 * 60 = 10,800` seconds) ticking second-by-second in `HH:MM:SS` format; auto-submits upon expiry.
- **4-State NTA Palette (lines 746–794):** Full 100-button responsive grid with dynamic state computation:
  - Answered (Emerald `#10b981`)
  - Not Answered (Red `#ef4444`)
  - Marked for Review (Purple `#8b5cf6`)
  - Not Visited (Slate `#94a3b8`)
  - Live counters for each state update in real time.
- **Dynamic Score Evaluation (lines 896–952):**
  - Calculates official UGC-NET score (+2 marks per correct answer, 0 for incorrect/unattempted; maximum 200 marks).
  - Computes accuracy percentage.
  - Dynamically computes and renders syllabus unit performance bars across all 10 units.
  - Features return link to `/#dashboard`.
  - Zero hardcoded score strings or dummy bypasses.

### O3. Genuine Binary OpenXML `.xlsx` Generation (`src/utils/excelExport.ts`)
- File `src/utils/excelExport.ts` (7,390 bytes) implements a pure TypeScript OpenXML binary builder (`generateXlsxBlob`, `downloadBuyersAsXlsx`):
  - Local file header signature: `0x04034b50` (`PK\x03\x04`).
  - Central directory file header signature: `0x02014b50` (`PK\x01\x02`).
  - End of central directory record signature: `0x06054b50` (`PK\x05\x06`).
  - IEEE 802.3 standard polynomial CRC-32 checksum calculation (`crc32`).
  - Assembles authentic SpreadsheetML OpenXML ZIP package containing:
    1. `[Content_Types].xml`
    2. `_rels/.rels`
    3. `xl/_rels/workbook.xml.rels`
    4. `xl/workbook.xml`
    5. `xl/worksheets/sheet1.xml` (contains headers and buyer rows with numeric values and inline strings).
  - Blob MIME type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.
  - Completely eliminates fake CSV file renaming; compatible with Microsoft Excel, Google Sheets, and LibreOffice Calc.

### O4. Institutional Affiliation Sanitization
- Automated ripgrep search for `HMPIETR` and `Sardar Patel University`:
  - `src/components/store/**/*`: **0 matches** across all 9 store components.
  - `api/store/**/*`: **0 matches** across all 7 backend API handlers.
  - `public/sample-materials/**/*` & `public/test-hall/**/*`: **0 matches**.
  - `index.html`: **0 matches**.
  - `src/App.tsx`: `AcademicLoadingFallback` renders `"NET Vidya English • Learning Portal"`, with **0 matches** of college affiliations.
  - `scripts/verifyAffiliationSanitization.mjs`: All 28 checks passed with 0 failures on all store surfaces.

### O5. Honest Pricing & Prohibition of Strike-Through Prices
- Grep for `1499` and `1,499`:
  - `src/components/store/**/*`: **0 matches**.
  - `api/store/**/*`: **0 matches**.
  - Zero occurrences of `line-through` CSS classes in `src/components/store/`.
- Pricing engine (`api/store/price.js`):
  - Enforces authoritative ₹799 before `2026-11-10T23:59:59+05:30` (11:59 pm IST), then automatically ₹999.
  - Client-supplied prices are completely ignored in `create-order.js` and `verify-payment.js`.
  - Deceptive `originalPrice` / fake MRP fields are completely omitted from API responses.

### O6. Mandatory Seller Disclosure Line
- The exact disclosure line `"Sold by NET Vidya (proprietor: Nilam Dodiya). Content by Dr Rajnikant Dodiya."` appears verbatim across:
  - `src/components/store/NetVidyaStoreLayout.tsx` (store footer across Home, Free Sample, Dashboard, Policies)
  - `src/components/store/NetVidyaAdminModal.tsx` (admin studio footer)
  - `api/store/price.js` (seller line in price API)
  - `api/store/email.js` (order confirmation email footer)
  - `src/contexts/NetVidyaStoreContext.tsx` (store context state)

### O7. Independent Build and Automated Test Suite Execution
- **`npm run typecheck` (`tsc --noEmit`):** Exited with code 0 (zero TypeScript errors).
- **`npm run build` (`tsc && vite build`):** Built 1,560 modules in 32.54s, generating production bundle cleanly in `dist/`.
- **`node scripts/testNetVidyaStore.mjs`:** 33 / 33 tests passed (100% success rate).
- **`node scripts/e2e/run_all_tests.mjs`:** All 359 assertions passed across all 4 tiers (Tier 1: 135/135, Tier 2: 135/135, Tier 3: 41/41, Tier 4: 48/48).
- **`node scripts/adversarial_paywall_penetration.mjs`:** 48 / 48 adversarial checks passed.
- **`node scripts/adversarial_auth_harness.mjs`:** 64 / 64 adversarial auth checks passed.
- **`node scripts/verifyAffiliationSanitization.mjs`:** 28 / 28 checks passed.

---

## 2. Logic Chain

1. **Authentication & Crypto Integrity (from O1):**
   - Observations confirm that HMAC-SHA256 calculations, fail-closed signature requirements, scrypt password hashing, and constant-time buffer comparisons (`crypto.timingSafeEqual`) are genuinely implemented in Node.js.
   - Because missing signature parameters return HTTP 400 Bad Request, forged signatures return HTTP 400 Bad Request, unauthenticated requests return HTTP 401 Unauthorized, and non-buyer requests return HTTP 403 Forbidden, no bypasses exist.
2. **CBT Simulator Authenticity (from O2):**
   - `public/test-hall/runner.html` contains 100 genuine academic questions covering all 10 units of the UGC-NET syllabus, an active JavaScript countdown timer, an interactive 4-state NTA question palette, and unit-by-unit scoring evaluation.
   - This proves the CBT runner is a complete, functioning simulation rather than a hollow facade or mock placeholder.
3. **Excel Spreadsheet Construction (from O3):**
   - The OpenXML `.xlsx` builder in `src/utils/excelExport.ts` generates valid ZIP magic headers (`0x04034b50`, `0x02014b50`, `0x06054b50`), CRC-32 checksums, and standard SpreadsheetML XML documents.
   - This satisfies the brief's requirement for genuine binary `.xlsx` export rather than disguised text/CSV files.
4. **Institutional Brand Isolation (from O4):**
   - All store surfaces (`/store`, `src/components/store/**`, `api/store/**`, `public/**`, `index.html`) contain zero mentions of HMPIETR or Sardar Patel University.
   - This complies with Requirement R1 and R6 of the brief.
5. **Ethical Pricing Verification (from O5 & O6):**
   - Zero occurrences of `1,499`, fake strike-through prices, or `line-through` CSS classes exist in the store.
   - The mandatory seller disclosure line citing proprietor Nilam Dodiya is present verbatim across all store pages and email templates.
6. **Execution Proof (from O7):**
   - TypeScript compilation, Vite production build, 33-test acceptance suite, 359 master E2E tests, and 112 adversarial penetration tests all execute with 100% pass rates and zero errors.

---

## 3. Caveats

1. **Dual-Role Repository Structure:**
   - The repository hosts both the commercial NET Vidya English student store (mounted at `/store` / `store.rajnikantdodiya.com`) and Dr. Rajnikant Dodiya's personal academic portfolio website (`/about`, `/publications`, `/research`).
   - Non-store personal CV files (`src/data/professorData.ts`, `src/components/TalksEventsPage.tsx`) contain historical academic appointments and talks at HMPIETR for his portfolio website visitors.
   - As confirmed by `verifyAffiliationSanitization.mjs` and `auditor_m1_1/handoff.md`, the commercial store is completely airgapped: when accessing `/store`, only `<NetVidyaStoreLayout />` is rendered in the DOM, producing zero institutional affiliation exposure on any commercial store surface.
2. **Live Gateway Credentials Fallback:**
   - In environments where live `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are not set in `.env`, the system automatically defaults to cryptographic test mode (`rzp_test_netvidya_key`), executing the identical HMAC-SHA256 signature verification code path.
3. **Email Transport Simulator:**
   - When `RESEND_API_KEY` is not configured, `api/store/email.js` outputs simulated email payloads to the system log, preventing transport errors from disrupting the checkout flow.

---

## 4. Conclusion

### Final Verdict: **CLEAN**

All deliverables across Milestone 3 (Pricing, Razorpay & Email), Milestone 4 (Protected Reading Files & Date-Gated Test Hall), Milestone 5 (Admin Studio & Excel Export), and Whole-Project Integrity are certified as **100% authentic, secure, and free of shortcuts or integrity violations**:
- Genuine fail-closed HMAC-SHA256 crypto and timing-safe authentication.
- Genuine 100-question NTA CBT test runner with active timer, 4-state palette, and dynamic scoring.
- Genuine binary OpenXML ZIP `.xlsx` generation.
- Zero college affiliations on any store surface.
- Zero fake strike-through prices (₹1,499) or deceptive discounts.
- Verbatim mandatory seller disclosure footer on all pages.
- Zero build errors, zero typecheck errors, and 100% test pass rate across 359 master E2E tests and 112 adversarial tests.

The forensic auditor approves the work product. No binary veto is exercised.

---

## 5. Verification Method

To independently reproduce this forensic audit:

1. **Verify TypeScript Typechecking:**
   ```powershell
   npm run typecheck
   ```
   *Expected:* Exit code 0, zero errors.

2. **Verify Production Bundle Packaging:**
   ```powershell
   npm run build
   ```
   *Expected:* Exit code 0, 1560 modules transformed, `dist/` built cleanly.

3. **Verify Core Acceptance Test Suite:**
   ```powershell
   node scripts/testNetVidyaStore.mjs
   ```
   *Expected:* 33 / 33 tests pass (100%).

4. **Verify Master E2E 4-Tier Test Runner:**
   ```powershell
   node scripts/e2e/run_all_tests.mjs
   ```
   *Expected:* 359 / 359 assertions pass across all 4 tiers (100%).

5. **Verify Adversarial Paywall & Auth Stress Tests:**
   ```powershell
   node scripts/adversarial_paywall_penetration.mjs
   node scripts/adversarial_auth_harness.mjs
   node scripts/verifyAffiliationSanitization.mjs
   ```
   *Expected:* All 48 paywall checks, 64 auth checks, and 28 affiliation checks pass (100%).

6. **Verify 100 Questions in CBT Runner:**
   ```powershell
   powershell -Command "(Select-String -Path public/test-hall/runner.html -Pattern 'unit:').Count"
   ```
   *Expected:* Exactly 100 questions.
