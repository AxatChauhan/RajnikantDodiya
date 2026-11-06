## 2026-11-04T07:14:23Z
You are Worker 1: Frontend and Branding Worker (worker_m1_1).
Your Working Directory is: c:\Users\DELL\Documents\antigravity\radiant-maxwell\.agents\teamwork\worker_m1_1
Your original request path is: c:\Users\DELL\Documents\antigravity\radiant-maxwell\.agents\teamwork\ORIGINAL_REQUEST.md
Your master project specification is: c:\Users\DELL\Documents\antigravity\radiant-maxwell\.agents\teamwork\orchestrator_1\PROJECT.md
Your milestone scope and explorer findings are at: c:\Users\DELL\Documents\antigravity\radiant-maxwell\.agents\teamwork\explorer_survey_1\handoff.md and analysis.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

You MUST read ORIGINAL_REQUEST.md, PROJECT.md, and explorer_survey_1/handoff.md before making any changes.

Your assigned Milestone is Milestone 1: Branding, Typography, Affiliation Sanitization & Public Free Samples (Features #1 to #7).

Files exclusively owned by you:
- `src/index.css`
- `index.html`
- `src/App.tsx`
- `src/components/store/NetVidyaStoreHome.tsx`
- `src/components/store/NetVidyaFreeSample.tsx`
- `src/components/store/NetVidyaStoreLayout.tsx`
- `public/sample-materials/*` (real PDF files and demo test HTML)
- `api/store/serve-test.js` and `api/store/download-file.js` (sanitize author email lists only)

Detailed implementation requirements:
1. Professional Typography (R1):
   - Replace Google font link in `index.html` with modern `Inter` (or `Plus Jakarta Sans`).
   - Remove aggressive `!important` serif overrides in `src/index.css` for headings (`h1-h6`, `.font-serif`, `.font-display`) and allow the store to render clean, readable sans-serif typography.
   - Restore real monospace font styling to `.font-mono` so countdown timers, question numbers, and currency figures do not jitter or lose alignment.
2. Hero Branding & Photo (R1):
   - Redesign the hero section in `src/components/store/NetVidyaStoreHome.tsx` to prominently display Dr. Rajnikant Dodiya's verified portrait (`public/dr-rajnikant-dodiya.jpg`, using `/dr-rajnikant-dodiya.jpg`) alongside his credentials (Ph.D., 2× NET & GSET qualified) and bundle deliverables.
   - Remove the prohibited fake strike-through MRP price (`₹1,499`) in `NetVidyaStoreHome.tsx:129`.
3. Affiliation Removal (R1):
   - Remove `"HMPIETR • Sardar Patel University"` from `AcademicLoadingFallback` in `src/App.tsx:38` (replace with `"NET Vidya English • Learning Portal"`).
   - In `index.html:22-23`, update meta description and keywords to completely remove references to HMPIETR and Sardar Patel University.
   - In `api/store/serve-test.js:112` and `api/store/download-file.js:26`, remove institutional emails (`@hmpenglish.com`, `@spuvvn.edu`) from `AUTHOR_EMAILS`.
   - In `NetVidyaStoreLayout.tsx:251`, remove or disconnect the academic CV backlink so commercial store visitors stay within NET Vidya.
4. Public Free Sample Assets & Page (R4):
   - Create real, downloadable static PDF files in `public/sample-materials/`:
     * `public/sample-materials/NetVidya_25_Question_Mini_Mock.pdf` (valid, readable PDF with 25 authentic UGC NET English questions and answer key)
     * `public/sample-materials/NetVidya_Model_Answers_Sample.pdf` (valid, readable PDF with detailed answer explanations and syllabus mapping)
   - Update `src/components/store/NetVidyaFreeSample.tsx` so the download buttons download these real static PDF files directly instead of generating corrupt in-memory text blobs.
   - Create a standalone, self-contained demo test HTML file at `public/sample-materials/demo-test.html` providing a realistic NTA CBT interface with 10 questions, timer, question palette, review status, and a prominent "Enroll in Final Pack 2026" banner with buy button linking to checkout. Update Free Sample page to launch/open this demo test.
5. Footer, Legal & Disclosures (R6):
   - Ensure the footer line: `"Sold by NET Vidya (proprietor: Nilam Dodiya). Content by Dr Rajnikant Dodiya."` renders cleanly on all pages.
   - Ensure all 5 policy tabs (Contact, Terms, Privacy, Refund, Delivery) are functional.
6. Mobile Responsiveness:
   - In `NetVidyaStoreLayout.tsx`, format the top navigation Buy button responsively (e.g., short label on `<380px` screens) so buttons do not wrap awkwardly.
   - Optimize layout on mobile viewports.

Verification requirements:
- Worker MUST run build and test commands:
  * `npm run typecheck` (`tsc --noEmit`)
  * `npm run build` (Vite build)
  * `node scripts/testNetVidyaStore.mjs`
- All commands must pass cleanly with 0 errors.

Output requirements:
- Maintain progress.md in your working directory with timestamps.
- Record all changes in `changes.md` and write a 5-component `handoff.md` in `worker_m1_1`.
- Send a completion message to the parent orchestrator when done.

## 2026-11-04T07:25:07Z
Context: Milestone 1 Implementation (worker_m1_1)
Content: Checking in on your progress for Milestone 1 (Branding, Typography, Affiliations, Free Samples).
Action: Please provide a quick status update on your current step and updated ETA.
