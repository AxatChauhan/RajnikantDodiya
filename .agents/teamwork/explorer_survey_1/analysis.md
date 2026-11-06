# Frontend, Branding, Typography & Public Pages Survey Report
**Agent:** Explorer 1 (`explorer_survey_1`)  
**Workspace:** `c:\Users\DELL\Documents\antigravity\radiant-maxwell`  
**Date:** 2026-11-04  

---

## Executive Summary
This report provides an in-depth survey of the frontend stack, typography, hero branding, college affiliations, free sample assets, footer & policy disclosures, and mobile responsiveness for the NET Vidya English student store (`store.rajnikantdodiya.com`).

Key highlights:
1. **Tech Stack**: Single-page application built on Vite 5.1.4 + React 18.2.0 + TypeScript 5.3.3 + Tailwind CSS 3.4.1, backed by Vercel serverless functions in `api/store/` and Supabase client libraries.
2. **Typography**: Headings across the entire application are aggressively forced into `Newsreader` (a high-contrast literary serif font) with `!important` rules in `src/index.css`. This contradicts modern professional EdTech aesthetics and should be replaced with `Inter` or `Plus Jakarta Sans`.
3. **Hero Branding & Photo**: `public/dr-rajnikant-dodiya.jpg` exists (170 KB, high-resolution portrait). However, it is **completely absent** from the store's current hero section in `src/components/store/NetVidyaStoreHome.tsx`.
4. **Affiliations to Remove**: While `src/components/store/` components do not mention HMPIETR or Sardar Patel University, the store's lazy loading fallback in `src/App.tsx:38` flashes `"HMPIETR • Sardar Patel University"` on screen. Additionally, `api/store/serve-test.js` and `api/store/download-file.js` contain institutional author emails (`@hmpenglish.com`, `@spuvvn.edu`), `index.html` has meta tags with these affiliations, and the store footer links back to the academic portfolio.
5. **Free Sample Page**: `NetVidyaFreeSample.tsx` generates simulated fake text blobs (`%PDF-1.4...`) dynamically in JavaScript instead of serving actual real PDF files (`25-Question Mini Mock PDF`, `Model Answers PDF`). Furthermore, `api/store/serve-test.js` references a non-existent `/test-hall/runner.html`.
6. **Footer & Legal**: The mandated seller notice (`"Sold by NET Vidya (proprietor: Nilam Dodiya). Content by Dr Rajnikant Dodiya."`) is present and verified. The 5 mandatory Razorpay policy tabs (Contact, Terms, Privacy, Refund, Delivery) are properly configured.
7. **Mobile Responsiveness**: Clean overall grid layouts, but the top commercial header suffers from button crowding on narrow viewports (<380px), and the NTA Test Runner palette places the 100-question grid below the question canvas on mobile, requiring excessive scrolling.

---

## 1. Tech Stack & Directory Layout

### 1.1 Core Technologies
- **Build Tool**: Vite 5.1.4 (`vite.config.ts`, `package.json:33`)
- **Frontend Framework**: React 18.2.0, React DOM 18.2.0 (`package.json:20-21`)
- **Language**: TypeScript 5.3.3 (`tsconfig.json`, `package.json:32`)
- **CSS Framework**: Tailwind CSS 3.4.1 (`tailwind.config.js`, `postcss.config.js`, `package.json:31`)
- **Icons**: Lucide React 0.344.0 (`package.json:18`)
- **Backend / Serverless**: Vercel Node.js serverless functions located under `api/` and `api/store/`
- **Database / Storage Client**: `@supabase/supabase-js` 2.118.0 (`package.json:17`)
- **Deployment Platform**: Vercel (`vercel.json`)

### 1.2 Routing & Dual-Mode Architecture
In `src/App.tsx:65-72` and `src/App.tsx:109-117`:
- The application detects whether the current hostname is `store.*` or if the route starts with `/store` or `#store`:
```tsx
const isStoreHost = typeof window !== 'undefined' && window.location.hostname.startsWith('store.');
const isStorePath = typeof window !== 'undefined' && (window.location.pathname.startsWith('/store') || window.location.pathname === '/store');
const isStoreHash = typeof window !== 'undefined' && (window.location.hash.startsWith('#store') || window.location.hash === '#store');
if (isStoreHost || isStorePath || isStoreHash) {
  setActiveTab('store');
}
```
- When `activeTab === 'store'`, `NetVidyaStoreLayout` renders independently, replacing the academic navbar and academic footer with the commercial store layout.

### 1.3 Directory Structure Overview
```
radiant-maxwell/
├── api/
│   └── store/
│       ├── create-order.js      # Razorpay order generation (server-side price enforcement)
│       ├── download-file.js     # Protected signed URL PDF generator (10-min access)
│       ├── price.js             # Authoritative price endpoint (₹799 early bird / ₹999 standard)
│       ├── razorpay-webhook.js  # payment.captured webhook handler
│       ├── serve-test.js        # Date-gated CBT test server
│       └── verify-payment.js    # HMAC SHA-256 signature verification
├── public/
│   ├── dr-rajnikant-dodiya.jpg  # 170 KB verified author photo
│   ├── logo.png, favicon.*      # Generated favicons and logo icons
│   └── landing-pages/           # Standalone marketing demo assets
├── src/
│   ├── components/
│   │   ├── store/               # Dedicated NET Vidya Store components
│   │   │   ├── NetVidyaStoreLayout.tsx
│   │   │   ├── NetVidyaStoreHome.tsx
│   │   │   ├── NetVidyaFreeSample.tsx
│   │   │   ├── NetVidyaDashboard.tsx
│   │   │   ├── NetVidyaCheckoutModal.tsx
│   │   │   ├── NetVidyaStudentLoginModal.tsx
│   │   │   ├── NetVidyaPolicies.tsx
│   │   │   ├── NetVidyaAdminModal.tsx
│   │   │   └── NtaTestRunnerModal.tsx
│   │   ├── library-store/       # Legacy academic bookstore & exam passes
│   │   └── [AcademicPages]      # AboutPage, HomePage, LearnPage, etc.
│   ├── contexts/
│   │   ├── NetVidyaStoreContext.tsx
│   │   └── SiteContentContext.tsx
│   ├── data/
│   │   └── professorData.ts
│   ├── index.css                # Global Tailwind directives & font overrides
│   └── App.tsx
├── tailwind.config.js
└── index.html
```

---

## 2. Typography Audit & Recommended Strategy

### 2.1 Current Typography Setup
1. **Google Fonts Link (`index.html:43`)**:
   ```html
   <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;0,6..72,700;1,6..72,400;1,6..72,600&family=Source+Sans+3:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&display=swap" rel="stylesheet">
   ```
2. **Tailwind Config (`tailwind.config.js:49-55`)**:
   ```javascript
   fontFamily: {
     serif: ['Newsreader', 'Georgia', 'serif'],
     display: ['Newsreader', 'Georgia', 'serif'],
     reading: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
     sans: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
     mono: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
   }
   ```
3. **Aggressive Global Overrides (`src/index.css:44-48, 105-108`)**:
   ```css
   /* Newsreader for ALL headings */
   h1, h2, h3, h4, h5, h6, .font-serif, .font-display {
     font-family: 'Newsreader', Georgia, serif !important;
     text-wrap: balance;
   }
   ```
   Furthermore:
   - `[class*="text-[8px]"] ... .text-xs { font-size: 14px !important; }` forcibly scales all micro text up to 14px.
   - `.font-mono { font-family: var(--font-family-reading) !important; }` erases monospace rendering for timers, keys, and question indices.

### 2.2 Issues Identified
- **Archaic Aesthetic**: `Newsreader` has serif curls and variable optical sizing appropriate for an 18th-century literary compendium, but clashes directly with modern online test interfaces, CBT examination palettes, and commercial EdTech sales funnels.
- **`!important` Rule Poisoning**: Even when components in `src/components/store/` specify `font-sans font-bold` or `font-black`, `index.css:46` forcibly overrides them to Newsreader serif.
- **Monospace Flattening**: Countdown timers (`timeLeft.seconds`), order IDs, and question numbers lack tabular numeral alignment because `font-mono` is remapped to `Source Sans 3`.

### 2.3 Recommended Typography Strategy
1. **Primary Professional Font**:
   - **`Inter`** (or **`Plus Jakarta Sans`**): Modern geometric/grotesque sans-serif widely adopted by leading EdTech platforms (Coursera, Khan Academy, PhysicsWallah, Unacademy).
   - Superior numerical legibility (`cv01`, `tnum` tabular numbers for timers and scorecards).
   - Crisp rendering across low-DPI Android screens and high-DPI Retina displays.
2. **Font Stack Configuration**:
   ```javascript
   fontFamily: {
     sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
     display: ['Inter', 'system-ui', 'sans-serif'],
     mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
   }
   ```
3. **CSS Cleanup in `src/index.css`**:
   - Remove `!important` from heading font-family rules.
   - Allow the store wrapper (`.netvidya-store`) to inherit `Inter`.
   - Restore real monospace font styling to `.font-mono` so countdown clocks and NTA question numbers do not jitter during seconds decrements.

---

## 3. Hero Branding & Photo Verification

### 3.1 Author Photo Verification
- **File**: `c:\Users\DELL\Documents\antigravity\radiant-maxwell\public\dr-rajnikant-dodiya.jpg`
- **Status**: Exists, valid 1024×1024 circular-cropped portrait (173,824 bytes).
- **Appearance**: Dr. Rajnikant S. Dodiya in a formal dark navy suit jacket with a light blue collared shirt, clean professional lighting, and an academic study in the background.

### 3.2 Current Hero Section Implementation
In `src/components/store/NetVidyaStoreHome.tsx:95-184`:
- Current Hero layout consists of:
  1. Early-bird pill badge (`isEarlyBirdActive ? "Early-Bird Offer: ₹799 (Ends in ...)" : ...`)
  2. Headline text: `GSET + UGC NET English Final Pack 2026`
  3. Paragraph subtitle: `"The definitive all-in-one preparation bundle..."`
  4. Centered white pricing card with ₹799 / ₹1,499 strike-through and buttons
  5. Mini trust icons (Instant Digital Access, Razorpay Secured, Curated by Dr. Rajnikant Dodiya)
- **Defect Observed**: Dr. Rajnikant Dodiya's photo (`public/dr-rajnikant-dodiya.jpg`) is **completely missing** from the Hero section!
- **Action Required**: The Hero must be restructured into a high-converting, authority-led two-column or integrated hero layout featuring Dr. Dodiya's verified photo alongside his credentials (Ph.D., 2× NET & GSET qualified) and the bundle deliverables.

---

## 4. Affiliations to Remove (HMPIETR & Sardar Patel University)

### 4.1 Exhaustive Audit of Affiliations in Codebase

| Location | File Path | Line(s) | Content / Prohibited Occurrence | Action Required |
|---|---|---|---|---|
| **Store Loading Fallback** | `src/App.tsx` | 38 | `<span className="text-[10px] ...">HMPIETR • Sardar Patel University</span>` | **Must Remove**: Replace with `"NET Vidya English • Learning Portal"` so it never flashes to store visitors. |
| **Store Footer Backlink** | `src/components/store/NetVidyaStoreLayout.tsx` | 251 | Button: `"Dr. Rajnikant Dodiya Academic CV"` linking back to academic tabs. | **Must Remove or Isolate**: Store visitors should stay within the NET Vidya commercial store domain. |
| **Store Test Server** | `api/store/serve-test.js` | 112 | `['rajnikantdodiya2@gmail.com', 'rajnikantdodiya@hmpenglish.com', 'rajnikant.dodiya@spuvvn.edu']` | **Must Remove**: Remove `@hmpenglish.com` and `@spuvvn.edu`. Only keep official merchant/author email (`rajnikantdodiya2@gmail.com`). |
| **Store Download Server** | `api/store/download-file.js` | 26 | `['rajnikantdodiya2@gmail.com', 'rajnikantdodiya@hmpenglish.com', 'rajnikant.dodiya@spuvvn.edu']` | **Must Remove**: Remove institutional emails. |
| **Global HTML Metadata** | `index.html` | 22 | `...at H. M. Patel Institute of English Training & Research (HMPIETR)...` | **Must Update**: Clean meta description for store. |
| **Global HTML Metadata** | `index.html` | 23 | `keywords="...HMPIETR, English Language Education, Sardar Patel University..."` | **Must Update**: Replace with `NET Vidya, GSET English, UGC NET English`. |
| **Academic Home Page** | `src/components/HomePage.tsx` | 66, 485 | `"Sardar Patel University • HMPIETR | CAIELE & IQAC Lead"`, `"HMPIETR, Vallabh Vidyanagar"` | Isolate from store. |
| **Academic Store Page** | `src/components/library-store/AcademicStorePage.tsx` | 207, 578 | `"SARDAR PATEL UNIVERSITY • ACADEMIC STUDY REPOSITORY"` | Legacy bookstore tab; ensure `/store` does not import or link to it. |
| **Security Salt Constants** | `src/lib/security.ts`, `src/lib/credentialAuth.ts` | 72, 21 | `SPU_HMPIETR_ATHENEUM_SECURE_SALT_2026` | Internal salt variable names (non-user facing, but should be neutralized). |

### 4.2 Logo Audit
- Verified: No institutional logos (HMPIETR or SPU image seals) exist in `public/`.
- `public/logo.png`, `apple-touch-icon.png`, and `favicon.png` are derived entirely from Dr. Dodiya's own portrait.
- The only college branding present is textual badges and email addresses.

---

## 5. Public Free Sample Page Investigation

### 5.1 Current Implementation (`NetVidyaFreeSample.tsx`)
1. **Routing**: Accessible via navigation bar (`Free Demo Test`) or direct view state `sample`.
2. **Current Components**:
   - **Card 1: Free Demo NTA Mock Test**: Launches `NtaTestRunnerModal` with `isFreeDemo={true}`.
   - **Card 2: 25-Question Mini Mock PDF**: Click button triggers `handleDownloadSamplePdf('NetVidya_25_Question_Mini_Mock.pdf', ...)`.
   - **Card 3: Model Answers & Explanations PDF**: Click button triggers `handleDownloadSamplePdf('NetVidya_Model_Answers_Sample.pdf', ...)`.
   - **Sticky Bottom Conversion Banner**: Features Buy Final Pack button with live server price.

### 5.2 Critical Deficiencies Found
1. **Mock Blob PDFs (Not Real PDFs)**:
   In `src/components/store/NetVidyaFreeSample.tsx:31-40`:
   ```typescript
   const sampleText = `%PDF-1.4\n% NET Vidya English Sample\n...`;
   const blob = new Blob([sampleText], { type: 'application/pdf' });
   ```
   This generates a corrupted raw text file pretending to be a PDF. Adobe Acrobat and browser PDF viewers will fail or render a blank page with syntax errors when opening it! Real, downloadable static PDFs must be placed in `public/sample-materials/`.
2. **Missing Standalone Demo Test HTML**:
   - Requirement R4 states: *"Provide a public Free Sample page accessible without login, containing a free demo test (HTML), free answers PDF, free 25-question mini mock PDF with a Buy button."*
   - Furthermore: *"Serve ready-made, self-contained NTA-style test HTML files through the server to logged-in buyers only."*
   - In `api/store/serve-test.js:153`:
     ```javascript
     runnerUrl: `/test-hall/runner.html?testId=${testId}`
     ```
     However, `/test-hall/runner.html` **does not exist** on disk anywhere in the project! The test runner is currently only a React modal (`NtaTestRunnerModal.tsx`).
   - A standalone, self-contained NTA-style test HTML file must be provided or served for the free demo test and buyers' Test Hall.

---

## 6. Footer, Legal & Policy Disclosures

### 6.1 Mandated Footer Notice
- **Required**: `"Sold by NET Vidya (proprietor: Nilam Dodiya). Content by Dr Rajnikant Dodiya."`
- **Location in Code**:
  - `src/components/store/NetVidyaStoreLayout.tsx:241-243`:
    ```tsx
    <strong className="text-gray-900 font-bold text-sm block">NET Vidya English</strong>
    <p className="mt-0.5 text-gray-600">
      Sold by NET Vidya (proprietor: Nilam Dodiya). Content by Dr Rajnikant Dodiya.
    </p>
    ```
  - `api/store/price.js:18`:
    ```javascript
    sellerLine: 'Sold by NET Vidya (proprietor: Nilam Dodiya). Content by Dr Rajnikant Dodiya.'
    ```
- **Verification Result**: Verified and strictly compliant.

### 6.2 Contact & Merchant Details
In `src/components/store/NetVidyaPolicies.tsx:161-180`:
- Merchant: NET Vidya (Proprietor: Nilam Dodiya)
- Email: `netvidyaenglish@gmail.com`
- WhatsApp / Phone: `+91 98251 23456`
- Support Hours: `9:00 AM – 8:00 PM IST`
- **Verification Result**: Compliant with requirement R6 ("Display NET Vidya contact email and phone, no personal or institute contact details").

### 6.3 Policy Pages (Razorpay Compliance)
The 5 required policy tabs are implemented inside `NetVidyaPolicies.tsx`:
1. **Terms & Conditions**: Single candidate license, digital access through 31 Dec 2026, copyright terms.
2. **Privacy Policy**: Personal data collection limited to authentication/delivery, Razorpay PCI-DSS security, zero sale to telemarketers.
3. **Cancellation & Refund Policy**: 48-hour refund for technical malfunctions, 5–7 day banking processing.
4. **Digital Delivery Policy**: Instant electronic dashboard access, confirmation email with login link, ₹0.00 delivery fee.
5. **Contact Us**: NET Vidya official support channels.

---

## 7. Mobile Responsiveness & Layout Analysis

### 7.1 Viewport Configuration
- `index.html:5`: Standard `<meta name="viewport" content="width=device-width, initial-scale=1.0" />`.
- `index.html:45`: `overflow-x-hidden` prevents unwanted horizontal scrolling.

### 7.2 Header Action Button Crowding
In `NetVidyaStoreLayout.tsx:116-163`:
- On mobile devices (<380px wide, such as iPhone SE or Galaxy A-series):
  - Elements in the top bar: Brand cap logo + "NET Vidya English" + "Store" badge + "Login" button + `Buy Final Pack (₹799)` button + Admin padlock icon + Hamburger menu.
  - The text `"Buy Final Pack (₹799)"` is 23 characters long and occupies significant width, pushing adjacent items off-screen or triggering button wrapping.
  - **Recommendation**: Use responsive text:
    ```tsx
    <span className="hidden sm:inline">Buy Final Pack</span>
    <span className="sm:hidden">Buy</span> (₹{currentServerPrice})
    ```

### 7.3 NTA Test Runner Layout on Mobile (`NtaTestRunnerModal.tsx`)
- On desktop (`lg:flex-row`), the question area and palette sit side-by-side.
- On mobile viewports, the Question Grid / Palette stacks below the question options and action buttons. To navigate between questions using the palette, students on phones must scroll all the way down past the question and choices.
- **Recommendation**: Implement a floating bottom bar or collapsible sheet for the question palette on screens under 1024px, with quick "Prev" and "Next" controls anchored at the bottom.

### 7.4 Pricing Card & Deliverables Grid
- `NetVidyaStoreHome.tsx`: Deliverables cards stack into a clean 1-column layout on mobile (`grid-cols-1 md:grid-cols-3`).
- Countdown badge wraps gracefully.
- FAQ accordion operates smoothly on touch devices with adequate tap targets (min 44px).

---

## 8. Summary of Action Items for Implementation Phase

1. **Typography**:
   - Replace Newsreader with Inter / Plus Jakarta Sans across the store.
   - Clean up `!important` serif overrides in `src/index.css`.
2. **Hero Section**:
   - Add Dr. Rajnikant Dodiya's verified portrait (`public/dr-rajnikant-dodiya.jpg`) to the hero section in `NetVidyaStoreHome.tsx`.
3. **Affiliation Removal**:
   - Remove `"HMPIETR • Sardar Patel University"` from `AcademicLoadingFallback` in `src/App.tsx:38`.
   - Remove `@hmpenglish.com` and `@spuvvn.edu` from `api/store/serve-test.js` and `api/store/download-file.js`.
   - Remove college references from `index.html` meta tags.
   - Remove store footer link leading back to the academic CV.
4. **Free Sample Assets**:
   - Replace fake text Blob downloads with real, valid PDF files (`NetVidya_25_Question_Mini_Mock.pdf` and `NetVidya_Model_Answers_Sample.pdf`) in `public/sample-materials/`.
   - Provide standalone self-contained NTA demo test HTML file.
5. **Mobile Polishing**:
   - Shorten the header Buy button label on mobile viewports.
   - Optimize NTA test runner question palette for mobile viewports.
