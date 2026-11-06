# Code Changes: Milestones 4 & 5 (Content Delivery & Admin Studio)

**Worker:** `worker_m4_m5_1`  
**Milestones:** Milestone 4 (Features #18 to #20) & Milestone 5 (Features #21 to #27)  
**Timestamp:** 2026-11-04T10:40:00Z  

---

## 1. Files Created

### `public/test-hall/runner.html`
- Created self-contained, responsive NTA-style Computer-Based Testing (CBT) runner matching official NTA exam interface styling.
- URL query parameter parsing: extracts `testId` to dynamically load and display test title.
- Official NTA top header: Navy blue theme (`#0f1d32`), candidate profile information, roll number badge, and 3-hour countdown timer (`180:00:00`).
- Question canvas: displays question title, syllabus section badge (Unit 1 to Unit 10), question text, marks badge (`+2.00 Marks, No Negative Marking`), and 4 radio option items.
- Control buttons:
  - "Save & Next" (advances to next question, saving selected response)
  - "Clear Response" (clears current radio selection)
  - "Mark for Review & Next" (tags question with purple state and advances)
  - "« Previous" (navigates back)
  - "Submit Test" (confirms and evaluates test)
- 100-Question NTA Palette:
  - 4 state badges in legend: Answered (Green `#10b981`), Not Answered (Red `#ef4444`), Marked for Review (Purple `#8b5cf6`), Not Visited (Gray `#94a3b8`).
  - Dynamic real-time status counters for all 4 states.
  - 100 interactive buttons in responsive grid allowing instant navigation to any question.
- Question Bank: 100 comprehensive questions covering all 10 units of the official UGC-NET / GSET Paper II English Literature syllabus.
- Score Summary Modal:
  - Total marks display out of 200 (+2 per correct answer).
  - Stat counters: Correct, Incorrect, Unattempted, Accuracy percentage.
  - Syllabus Unit Performance Breakdown: horizontal progress bars for each of the 10 units.
  - Direct navigation button back to candidate dashboard (`window.location.href = '/#dashboard'`).

### `src/utils/excelExport.ts`
- Created pure TypeScript OpenXML spreadsheet generator (`generateXlsxBlob` & `downloadBuyersAsXlsx`).
- Constructs a genuine binary `.xlsx` ZIP archive containing:
  - `[Content_Types].xml`
  - `_rels/.rels`
  - `xl/_rels/workbook.xml.rels`
  - `xl/workbook.xml`
  - `xl/worksheets/sheet1.xml`
- Implements CRC-32 calculation and standard STORE (uncompressed) ZIP container construction in binary `Uint8Array`.
- Outputs valid MIME type `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.
- Triggers browser download of genuine `.xlsx` spreadsheet file (NOT a `.csv` renamed to `.xlsx`).

---

## 2. Files Modified

### `src/components/store/NetVidyaDashboard.tsx`
- **Protected File Downloads:** Replaced client-side ASCII text dummy string with genuine download of the signed download link returned by `/api/store/download-file?fileId=...`.
- **Date-Gated Test Launching:**
  - Evaluates `isLocked` against test `releaseDate`. For future tests, disables the launch button and displays "Opens on [formattedDate]".
  - When "Launch CBT Test" is clicked for an active test, opens `/test-hall/runner.html?testId=${test.id}` in a new tab via `window.open`.

### `src/contexts/NetVidyaStoreContext.tsx`
- **Admin State Management:** Added `adminToken`, `isAdminAuthenticated`, `adminLogin`, `adminLogout`, and `resendConfirmationEmail` to the context interface and provider.
- **Genuine Excel Export:** Replaced legacy CSV text blob generator with `downloadBuyersAsXlsx(buyersRegistry)` using pure OpenXML `.xlsx` binary generator.
- **Access Control & Server Sync:** Updated `toggleBuyerAccess` to toggle student active status and synchronize with `/api/store/admin/toggle-access` when admin credentials are active.
- **Price Synchronization:** Updated `updateSettings` to synchronize pricing changes with `/api/store/admin/update-pricing` when admin credentials are active.
- **Confirmation Email Resend:** Added `resendConfirmationEmail` calling `/api/store/admin/resend-email` with toast confirmation.

### `src/components/store/NetVidyaAdminModal.tsx`
- **Admin Authentication PIN Gate:** Protected the studio with a PIN / password gate (`isAdminAuthenticated`). When unauthenticated, displays PIN entry modal accepting `2026`, `dr_rajnikant_admin_2026`, or author password, preventing unauthorized access.
- **Genuine PDF Upload Form:** Added `<input type="file" accept=".pdf">` allowing Dr. Rajnikant to select a local PDF file, automatically populates title and calculates size in MB, and publishes to all buyers' dashboards.
- **Genuine HTML Test Upload Form:** Added `<input type="file" accept=".html">` allowing Dr. Rajnikant to select a test HTML file, set release date, question count, and duration, scheduling it in the Test Hall.
- **Dynamic Price & Cutoff Date Editor:** Form allowing dynamic modification of Early-Bird Price (₹799), Standard Price (₹999), and Offer End Date (`2026-11-10T23:59:59+05:30`), synchronizing store state.
- **Buyers Registry & Search:** Added search filter by candidate name, email, phone, or order ID.
- **True Excel Export:** Added "Export to Excel (.xlsx)" button calling `exportBuyersToExcel()`.
- **One-Click Manual Access Toggle:** One-click toggle in each buyer row to grant or revoke student access.
- **Resend Confirmation Email:** Added "Resend Email" button in each buyer row to re-dispatch the purchase confirmation email with student dashboard link.
