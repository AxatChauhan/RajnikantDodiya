/**
 * Centralized Single Source of Truth for Store Config, Pricing, Merchant Info,
 * Release Schedule, FAQs & Mandatory Razorpay Compliance Policies.
 *
 * Shared between Vercel Serverless Functions (api/store/*.js) and React UI (src/**).
 * NOTE: Strictly brand-isolated (contains zero university/institute affiliation strings).
 */

export const STORE_MERCHANT = {
  brandName: 'NET Vidya',
  storeTitle: 'NET Vidya English',
  proprietor: 'Nilam Dodiya',
  curator: 'Dr. Rajnikant S. Dodiya',
  curatorShort: 'Dr. Rajnikant Dodiya',
  sellerLine: 'Sold by NET Vidya (proprietor: Nilam Dodiya). Content by Dr Rajnikant Dodiya.',
  supportEmail: 'netvidyaenglish@gmail.com',
  supportPhone: '+91 96387 16634',
  whatsappNumber: '919638716634',
  supportHours: '9:00 AM – 8:00 PM IST',
  websiteUrl: 'https://rajnikantdodiya.com',
  dashboardUrl: 'https://rajnikantdodiya.com/#dashboard',
  accessExpiryLabel: '31 Dec 2026',
  accessExpiryFullLabel: '31 December 2026'
};

export const STORE_PAYMENT_DEFAULTS = {
  defaultPaymentLink: 'https://rzp.io/rzp/locBUA0o',
  defaultPaymentLinkPrice: 799,
  defaultEarlyBirdPrice: 799,
  defaultStandardPrice: 999,
  defaultEarlyBirdCutoff: '2026-11-10T23:59:59+05:30',
  defaultAccessExpiry: '2026-12-31T23:59:59+05:30',
  validCoupons: {
    GSET50: { amount: 50, message: '₹50 GSET Aspirant discount applied!' },
    NET100: { amount: 100, message: '₹100 NET Candidate scholarship discount applied!' },
    SCHOLAR150: { amount: 150, message: '₹150 Special Scholar discount applied!' },
    EARLYBIRD: { amount: 50, message: '₹50 Early Bird discount applied!' }
  }
};

export const GSET_PRODUCTS = {
  paper1: {
    id: 'gset-paper1',
    name: 'GSET Paper 1: General Aptitude Foundation Pack',
    price: 399,
    originalPrice: 499
  },
  paper2_edu: {
    id: 'gset-paper2-education',
    name: 'GSET Paper 2: Education Discipline Master Pack',
    price: 499,
    originalPrice: 649
  },
  paper2_eng: {
    id: 'gset-paper2-english',
    name: 'GSET Paper 2: English Literature & ELT Specialist Pack',
    price: 499,
    originalPrice: 649
  },
  combo_edu: {
    id: 'gset-education-combo',
    name: 'GSET Education Complete Scholar Duo',
    price: 799,
    originalPrice: 999
  },
  combo_eng: {
    id: 'gset-english-combo',
    name: 'GSET English Complete Scholar Duo',
    price: 799,
    originalPrice: 999
  }
};

export const DEFAULT_STORE_SETTINGS = {
  productSlug: 'final-pack-2026',
  productName: 'GSET + UGC NET English Final Pack 2026',
  earlyBirdPrice: STORE_PAYMENT_DEFAULTS.defaultEarlyBirdPrice,
  standardPrice: STORE_PAYMENT_DEFAULTS.defaultStandardPrice,
  earlyBirdCutoff: STORE_PAYMENT_DEFAULTS.defaultEarlyBirdCutoff,
  accessExpiryDate: STORE_PAYMENT_DEFAULTS.defaultAccessExpiry,
  sellerLine: STORE_MERCHANT.sellerLine,
  supportEmail: STORE_MERCHANT.supportEmail,
  supportPhone: STORE_MERCHANT.supportPhone
};

export const STORE_POLICY_LINKS = [
  { id: 'contact', label: 'Contact Us', path: '/contact-store', policyPath: '/policies#contact' },
  { id: 'terms', label: 'Terms & Conditions', path: '/terms', policyPath: '/terms' },
  { id: 'privacy', label: 'Privacy Policy', path: '/privacy-policy', policyPath: '/privacy-policy' },
  { id: 'refund', label: 'Cancellation & Refund', path: '/refund-policy', policyPath: '/refund-policy' },
  { id: 'delivery', label: 'Digital Delivery Policy', path: '/shipping-policy', policyPath: '/shipping-policy' }
];

export const STORE_TIMELINE_ITEMS = [
  {
    releaseDateIso: null,
    date: 'Ready Now',
    title: 'NET Mock 1, Unit Test 1, 5 Bonus Practice Mocks & Reading Dossiers'
  },
  {
    releaseDateIso: '2026-11-06T00:00:00+05:30',
    date: '6 Nov 2026',
    title: 'NET Mock 2 (Full-Length Literature & Theory)'
  },
  {
    releaseDateIso: '2026-11-10T00:00:00+05:30',
    date: '10 Nov 2026',
    title: 'NET Mock 3 (Mid-Term Diagnostic Mock) • Revision Pack Access Live'
  },
  {
    releaseDateIso: '2026-11-14T00:00:00+05:30',
    date: '14 Nov 2026',
    title: 'NET Mock 4 (Cultural Studies & English in India)'
  },
  {
    releaseDateIso: '2026-11-21T00:00:00+05:30',
    date: '21 Nov 2026',
    title: 'NET Mock 5 (Research Methods & Pedagogy)'
  },
  {
    releaseDateIso: '2026-11-28T00:00:00+05:30',
    date: '28 Nov 2026',
    title: 'GSET Special Simulation Exam 1'
  },
  {
    releaseDateIso: '2026-12-05T00:00:00+05:30',
    date: '5 Dec 2026',
    title: 'Grand Final Rank Booster Exam 2026'
  }
];

export function getStoreFaqs(currentPrice = STORE_PAYMENT_DEFAULTS.defaultPaymentLinkPrice) {
  return [
    {
      q: 'What is included in the "GSET + UGC NET English Final Pack 2026"?',
      a: 'The pack includes 5 full-length 100-question Paper II NTA simulated mocks, unit-wise diagnostic tests, 5 bonus practice mocks, and complete downloadable high-yield revision dossiers (PDFs) covering Literary Theory, Post-Method Pedagogy, Cultural Studies, and Research Methodology.'
    },
    {
      q: 'How long do I have access to the Test Hall and Reading Files?',
      a: `Your student account is active continuously through ${STORE_MERCHANT.accessExpiryFullLabel}. Login anytime with your registered email and password to access the Test Hall and download your Reading Files from your phone, tablet, or laptop.`
    },
    {
      q: 'How does the online mock test interface work?',
      a: 'The test environment replicates the real NTA computer-based examination screen, including a real-time countdown timer, question palette (Answered, Not Answered, Marked for Review), and instant diagnostic scoring with model explanations for every question.'
    },
    {
      q: 'What is the enrollment fee and validity?',
      a: `Enrollment for the complete Final Pack 2026 is currently ₹${currentPrice} (all-inclusive, one-time fee) with uninterrupted access through ${STORE_MERCHANT.accessExpiryFullLabel}. No login is required before starting checkout.`
    },
    {
      q: 'Can I study on my mobile phone?',
      a: 'Yes, the entire store, student dashboard, reading files, cloud book reader, and NTA test hall are 100% responsive and optimized for smartphones, tablets, and desktop browsers.'
    }
  ];
}

export const STORE_POLICIES = {
  terms: {
    heading: '1. Terms & Conditions of Enrollment & Digital Access',
    intro: `Welcome to ${STORE_MERCHANT.storeTitle} (${STORE_MERCHANT.websiteUrl}). By purchasing or accessing any digital study product—including the "GSET + UGC NET English Final Pack 2026", Cloud Reader Digital Monographs, CBT Mock Examination Simulators, or physical book inquiries—you agree to the following terms:`,
    bullets: [
      {
        title: 'Single Candidate / Authorized Device License',
        text: 'Each purchase entitles one individual student to access the Test Hall, downloadable revision dossiers, or single/paired-device protected reader solely for personal study. Sharing login credentials, redistributing PDFs, or republishing test keys is strictly prohibited.'
      },
      {
        title: 'Access Duration',
        text: `Enrolled Final Pack 2026 candidates receive uninterrupted portal access through ${STORE_MERCHANT.accessExpiryFullLabel}. Cloud monograph and CBT exam passes remain accessible under the active candidate license.`
      },
      {
        title: 'Intellectual Property',
        text: `All pedagogical content, mock test items, analytical explanations, research monographs, and study dossiers are the copyrighted intellectual property of ${STORE_MERCHANT.brandName} and ${STORE_MERCHANT.curator}.`
      },
      {
        title: 'No Pre-Login Required for Payment',
        text: 'Candidates may initiate checkout directly from the store using their name, email address, and mobile number via official Razorpay checkout channels without pre-creating an account.'
      }
    ]
  },
  privacy: {
    heading: '2. Privacy & Data Protection Policy',
    intro: `${STORE_MERCHANT.brandName} (${STORE_MERCHANT.storeTitle}) respects candidate privacy and safeguards personal information collected during enrollment and study:`,
    bullets: [
      {
        title: 'Information Collected',
        text: 'We collect your full name, email address, and mobile number strictly for order mapping, Razorpay webhook verification, forensic licensing/watermarking, and student dashboard authentication.'
      },
      {
        title: 'Payment Security (PCI-DSS)',
        text: `All online payments are processed exclusively through Razorpay's PCI-DSS compliant encrypted payment infrastructure. ${STORE_MERCHANT.brandName} never stores your card numbers, CVVs, net-banking passwords, or UPI PINs.`
      },
      {
        title: 'Zero Data Selling',
        text: 'We never sell, rent, or trade student phone numbers or email addresses to third-party advertisers, coaching brokers, or telemarketers.'
      }
    ]
  },
  refund: {
    heading: '3. Cancellation & Refund Policy',
    intro: 'Because our study packs, cloud monographs, and test simulators grant immediate electronic access upon payment confirmation, clear refund safeguards apply:',
    bullets: [
      {
        title: 'Technical Malfunction & Duplicate Charge Guarantee',
        text: 'If a verified technical failure prevents you from accessing your purchased Test Hall, reading files, or cloud monograph within 48 hours of payment (and our support team cannot resolve it), or if a duplicate payment occurred, you are entitled to a 100% refund.'
      },
      {
        title: 'Non-Returnable Consumed Digital Access',
        text: 'Orders cannot be cancelled or refunded once digital test hall materials or downloadable PDFs have been accessed/downloaded, except under verified technical failure or duplicate debit conditions.'
      },
      {
        title: 'How to Request a Refund',
        text: `Email ${STORE_MERCHANT.supportEmail} or message WhatsApp ${STORE_MERCHANT.supportPhone} with your Razorpay Payment ID, transaction screenshot, and registered email within 48 hours of purchase.`
      },
      {
        title: 'Refund Processing Timeline',
        text: 'Approved refunds are initiated within 48 hours and credited back to the original payment method (UPI, bank account, or card) within 5–7 business days per banking rules.'
      }
    ]
  },
  delivery: {
    heading: '4. Digital Delivery & Access Policy',
    intro: 'All study packs, downloadable PDF dossiers, interactive mock examinations, and cloud monographs are delivered electronically online:',
    bullets: [
      {
        title: 'Instant Electronic Activation',
        text: 'Upon successful Razorpay payment confirmation, buyer entitlements are unlocked via server-verified payment signature / webhook and accessible immediately inside your Student Dashboard or Cloud Reader.'
      },
      {
        title: 'Confirmation Receipt & Dashboard Link',
        text: `A confirmation email containing your order reference and direct dashboard login link (${STORE_MERCHANT.dashboardUrl}) is dispatched to your registered email address.`
      },
      {
        title: 'Shipping Fees',
        text: '₹0.00 (Zero shipping charges for all digital deliverables. For optional print book inquiries via WhatsApp publisher coordination, courier availability is shared prior to order).'
      }
    ]
  },
  contact: {
    heading: '5. Merchant & Support Contact Information',
    intro: `For enrollment assistance, Razorpay webhook activation help, refund requests, or study catalog inquiries, contact ${STORE_MERCHANT.brandName} directly:`
  }
};
