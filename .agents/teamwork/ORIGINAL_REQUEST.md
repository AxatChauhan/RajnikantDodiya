# Original User Request

## Approved Task Prompt — 2026-11-04T06:58:03Z

Update the NET Vidya English student store website (store.rajnikantdodiya.com) to align with the provided developer brief: change typography to a professional font, display Dr. Rajnikant Dodiya's photo in the hero section using public/dr-rajnikant-dodiya.jpg, remove all college affiliations (HMPIETR / Sardar Patel University), and implement a student login system (email and password with password reset) instead of access passes, alongside Razorpay payments, protected reading files and tests, and an admin management panel.

Working directory: c:\Users\DELL\Documents\antigravity\radiant-maxwell
Integrity mode: development

## Requirements

### R1. Typography and Hero Branding
- Change typography across the site to a normal, professional font (font selection left to the team).
- Place Dr. Rajnikant Dodiya's photo in the hero section using the project image at `public/dr-rajnikant-dodiya.jpg`.
- Remove all references to HMPIETR, Sardar Patel University, and their logos from all pages of the store.

### R2. Student Authentication and Access Control
- Implement a student login and sign-up system using email and password, with password reset by email, replacing any access pass flow.
- Restrict "My Dashboard" (Reading Files and Test Hall) to authenticated paying buyers only.
- Non-buyers and logged-out visitors must be blocked from accessing paid files or tests.

### R3. Pricing and Razorpay Payment Integration
- Sell the single bundle: "GSET + UGC NET English Final Pack 2026".
- Enforce server-side pricing: ₹799 until 10 Nov 2026, 11:59 pm IST, then automatically ₹999; access lasts until 31 Dec 2026. The price must be decided on the server, never accepted from the browser.
- Integrate Razorpay payments under Nilam Dodiya (NET Vidya): server-side order creation, server-side payment signature verification, and Razorpay webhook (`payment.captured`) to grant access reliably.
- Send a purchase confirmation email containing the student dashboard link.

### R4. Protected Reading Files and Test Hall Delivery
- Keep reading files (PDFs) in private storage and deliver them via short-lived download links (5–10 minutes) only after verifying payment.
- Serve ready-made, self-contained NTA-style test HTML files through the server to logged-in buyers only.
- Enforce test release dates: tests scheduled for a future date must show "Opens on [date]" in the dashboard and be blocked on the server from loading before that date.
- Provide a public Free Sample page accessible without login, containing a free demo test (HTML), free answers PDF, and free 25-question mini mock PDF with a Buy button.

### R5. Admin Panel
- Provide an admin panel for Dr Rajnikant allowing full management through simple forms without code editing:
  1. Upload new PDF reading files that appear in every buyer's Reading Files.
  2. Upload new test HTML files with title and release date, appearing in the Test Hall and opening on that date.
  3. Modify product price and offer end date.
  4. View buyers list (name, email, phone, date, amount) and export to Excel.
  5. Manually grant or revoke student access.
  6. Resend confirmation emails.

### R6. Legal, Branding, and Policy Pages
- Store brand is "NET Vidya English".
- Include footer on all store pages: "Sold by NET Vidya (proprietor: Nilam Dodiya). Content by Dr Rajnikant Dodiya."
- Display NET Vidya contact email and phone (no personal or institute contact details).
- Prohibit fake reviews and fake MRP or strike-through prices.
- Include footer links to policy pages: Contact, Terms, Privacy, Refund, and Delivery.

## Acceptance Criteria

### Visual and Content Verification
- [ ] Website displays professional typography across all pages.
- [ ] Hero section prominently displays Dr. Rajnikant Dodiya's photo from `public/dr-rajnikant-dodiya.jpg`.
- [ ] No mention or logos of HMPIETR or Sardar Patel University appear anywhere on the site.

### Authentication and Access Control Verification
- [ ] Anyone can open the free demo test and free sample PDFs without logging in.
- [ ] Student registration, login with email/password, and password reset work as expected.
- [ ] Logged-in non-buyers cannot open or download paid PDFs or tests (direct URL requests return 401/403).
- [ ] Tests scheduled with a future release date show "Opens on [date]" and are blocked server-side before that date.

### Payment and Pricing Verification
- [ ] Current price evaluates to ₹799 before 10 Nov 2026 11:59 pm IST and ₹999 afterward, determined exclusively on the server.
- [ ] Razorpay test purchase verifies signature server-side and grants immediate access to the dashboard.
- [ ] Access is also granted upon receipt of the Razorpay `payment.captured` webhook.

### Admin Panel and Store Management Verification
- [ ] Admin panel allows uploading a PDF and a test HTML, updating price and dates, viewing and exporting buyer records to Excel, manually granting or revoking access, and resending confirmation emails without code edits.
- [ ] Policy pages (Contact, Terms, Privacy, Refund, Delivery) are linked in the footer and render valid content.
- [ ] Site layout and controls are responsive and fully functional on mobile viewports.
