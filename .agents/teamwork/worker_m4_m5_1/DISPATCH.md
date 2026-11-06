## 2026-11-04T10:15:47Z
You are Worker 4 & 5: Content Delivery and Admin Panel Worker (worker_m4_m5_1).
Your Working Directory is: c:\Users\DELL\Documents\antigravity\radiant-maxwell\.agents\teamwork\worker_m4_m5_1
Your original request path is: c:\Users\DELL\Documents\antigravity\radiant-maxwell\.agents\teamwork\ORIGINAL_REQUEST.md
Your master project specification is: c:\Users\DELL\Documents\antigravity\radiant-maxwell\.agents\teamwork\orchestrator_1\PROJECT.md
Explorer 3 handoff report is at: c:\Users\DELL\Documents\antigravity\radiant-maxwell\.agents\teamwork\explorer_survey_3\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

You MUST read ORIGINAL_REQUEST.md, PROJECT.md, and explorer_survey_3/handoff.md before making any changes.

Your assigned Milestones are Milestone 4 (Features #18 to #20) and Milestone 5 (Features #21 to #27):

Files exclusively owned by you:
- `public/test-hall/runner.html` (create)
- `src/components/store/NetVidyaDashboard.tsx` (reading file delivery & CBT runner links)
- `src/components/store/NetVidyaAdminModal.tsx` (admin studio)
- `src/contexts/NetVidyaStoreContext.tsx` (admin actions & storage persistence)
- `api/store/admin.js` (optional serverless admin endpoint for persistence)

Detailed implementation requirements:
1. Milestone 4: Protected Reading Files & Date-Gated Test Hall (R4):
   - Create `public/test-hall/runner.html`:
     * A self-contained, responsive NTA-style CBT test runner HTML page matching official NTA exam styling.
     * Parses `testId` from URL query string, displays 3-hour timer, question canvas with 4 options, full 100-question NTA palette with 4 state badges (Answered, Not Answered, Marked for Review, Not Visited), "Save & Next", "Clear Response", "Mark for Review & Next", and "Submit Test" buttons.
     * Evaluates responses and displays score summary modal with syllabus breakdown and link back to Dashboard (`/#dashboard`).
   - In `NetVidyaDashboard.tsx`:
     * "Launch CBT Test" opens `/test-hall/runner.html?testId=${test.id}` in a new tab or launches the interactive test.
     * Future tests (e.g. `test-net-mock-2` on 6 Nov 2026, `test-net-mock-3` on 10 Nov 2026) display "Opens on [formattedDate]" and disable/block the launch button until that date.
     * "Download PDF": calls `/api/store/download-file?fileId=...` passing Bearer token and triggers genuine download of the signed URL.

2. Milestone 5: Admin Management Panel (R5):
   - Admin Authentication:
     * In `NetVidyaAdminModal.tsx`, protect the studio with a PIN / password gate (default PIN e.g. `2026` or author password) so visitors cannot access admin controls unauthenticated.
   - Admin PDF Upload Form:
     * Provide `<input type="file" accept=".pdf">` allowing Dr. Rajnikant to select a PDF file, enter Title, Category, and Description, and upload it. The new PDF is added to `readingFiles` and immediately appears in every buyer's Reading Files tab.
   - Admin Test HTML Upload Form:
     * Provide `<input type="file" accept=".html">` allowing Dr. Rajnikant to select a test HTML file, enter Title, Category, Duration (minutes), Total Questions, and scheduled Release Date. The new test appears in the buyer's Test Hall and opens on that date.
   - Dynamic Price & Cutoff Date Editor:
     * Form allowing Dr. Rajnikant to update Early-Bird Price (₹799), Standard Price (₹999), and Offer End Date (`2026-11-10T23:59:59+05:30`), updating store state.
   - Buyers List & Genuine Excel Export:
     * Table displaying all registered buyers: Name, Email, Mobile, Enrollment Date, Amount Paid, and Active Status.
     * True Excel export (`exportBuyersToExcel`): generates a valid `.xlsx` spreadsheet file (using pure JS OpenXML/SpreadsheetML or binary `.xlsx` format, NOT `.csv`).
   - Manual Student Access Toggle:
     * One-click action button for each buyer row to manually grant or revoke student access (`is_buyer`, `is_active`).
   - Resend Confirmation Email:
     * Action button in each buyer row to resend the purchase confirmation email with student dashboard link.

Verification requirements:
- `npm run typecheck` (`tsc --noEmit`)
- `npm run build`
- `node scripts/testNetVidyaStore.mjs` (All 33 tests must pass)
- `node scripts/e2e/run_all_tests.mjs` (All 359 assertions must pass)
