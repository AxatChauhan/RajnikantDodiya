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
  proprietor: 'Dr. Rajnikant Dodiya',
  curator: 'Dr. Rajnikant S. Dodiya',
  curatorShort: 'Dr. Rajnikant Dodiya',
  sellerLine: 'Sold by NET Vidya. Content curated by Dr. Rajnikant Dodiya.',
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
  defaultPaymentLink: 'https://rzp.io/rzp/locBUA0o', // ₹499 UGC NET English Bundle (updated from old 799)
  defaultPaymentLinkPrice: 499,
  gsetPaymentLink149: 'https://rzp.io/rzp/5RjuNNp', // ₹149 GSET Single Papers (Paper 1, Paper 2 English, Paper 2 Education)
  gsetPaymentLink249: 'https://rzp.io/rzp/oXfY4Va', // ₹249 GSET Scholar Duo Combos (English Duo, Education Duo)
  ugcPaymentLink499: 'https://rzp.io/rzp/locBUA0o',  // ₹499 UGC NET English Complete Bundle
  paymentLinksByAmount: {
    149: 'https://rzp.io/rzp/5RjuNNp',
    249: 'https://rzp.io/rzp/oXfY4Va',
    499: 'https://rzp.io/rzp/locBUA0o'
  },
  paymentLinksByProduct: {
    'gset-paper1': 'https://rzp.io/rzp/5RjuNNp',
    'gset-paper2-english': 'https://rzp.io/rzp/5RjuNNp',
    'gset-paper2-education': 'https://rzp.io/rzp/5RjuNNp',
    'gset-english-combo': 'https://rzp.io/rzp/oXfY4Va',
    'gset-education-combo': 'https://rzp.io/rzp/oXfY4Va',
    'ugc-net-english-bundle': 'https://rzp.io/rzp/locBUA0o'
  },
  defaultEarlyBirdPrice: 499,
  defaultStandardPrice: 999,
  defaultEarlyBirdCutoff: '2026-11-22T23:59:59+05:30',
  defaultAccessExpiry: '2026-12-31T23:59:59+05:30',
  validCoupons: {
    GSET50: { amount: 50, message: '₹50 GSET Aspirant discount applied!' },
    NET100: { amount: 100, message: '₹100 NET Candidate scholarship discount applied!' },
    SCHOLAR150: { amount: 150, message: '₹150 Special Scholar discount applied!' },
    EARLYBIRD: { amount: 50, message: '₹50 Early Bird discount applied!' },
    SIMULATE: { amount: 499, message: '🎓 Test Simulation Voucher Applied: ₹0 test enrollment with full candidate unlock' }
  }
};

export const GSET_PRODUCTS = {
  paper1: {
    id: 'gset-paper1',
    name: 'GSET Paper 1: General Aptitude Foundation Pack',
    stream: 'general',
    price: 149,
    originalPrice: 499,
    paymentLink: 'https://rzp.io/rzp/5RjuNNp',
    badge: 'COMMON TO ALL STREAMS',
    description: 'Master all 10 general units: Teaching Aptitude, Research Methodology, Comprehension, Mathematical & Logical Reasoning, ICT, and Higher Education.',
    testCount: 3,
    cbtFiles: [
      { id: 'gset-p1-m1', file: 'GSET_Paper1_Mock01_CBT.html', title: 'GSET Paper 1 — CBT Mock 01 (50 Qs)' },
      { id: 'gset-p1-m2', file: 'GSET_Paper1_Mock02_CBT.html', title: 'GSET Paper 1 — CBT Mock 02 (50 Qs)' },
      { id: 'gset-p1-m3', file: 'GSET_Paper1_Mock03_CBT.html', title: 'GSET Paper 1 — CBT Mock 03 (50 Qs)' }
    ]
  },
  paper2_edu: {
    id: 'gset-paper2-education',
    name: 'GSET Paper 2: Education Discipline Master Pack',
    stream: 'education',
    price: 149,
    originalPrice: 499,
    paymentLink: 'https://rzp.io/rzp/5RjuNNp',
    badge: 'EDUCATION DISCIPLINE SPECIALIST',
    description: 'Master GSET Paper 2 Education: Philosophical, Sociological & Psychological Foundations, Teacher Education, Curriculum Studies, and Pedagogy.',
    testCount: 3,
    cbtFiles: [
      { id: 'gset-p2-edu-m1', file: 'GSET_Paper2_Education_Mock01_CBT.html', title: 'GSET Education Paper 2 — CBT Mock 01 (100 Qs)' },
      { id: 'gset-p2-edu-m2', file: 'GSET_Paper2_Education_Mock02_CBT.html', title: 'GSET Education Paper 2 — CBT Mock 02 (100 Qs)' },
      { id: 'gset-p2-edu-m3', file: 'GSET_Paper2_Education_Mock03_CBT.html', title: 'GSET Education Paper 2 — CBT Mock 03 (100 Qs)' }
    ]
  },
  paper2_eng: {
    id: 'gset-paper2-english',
    name: 'GSET Paper 2: English Literature Specialist Pack',
    stream: 'english',
    price: 149,
    originalPrice: 499,
    paymentLink: 'https://rzp.io/rzp/5RjuNNp',
    badge: 'ENGLISH SUBJECT SPECIALIST',
    description: 'Master GSET Paper 2 English Literature: British, American & Indian Literature, Literary Criticism & Theory, Cultural Studies, and ELT in India.',
    testCount: 2,
    cbtFiles: [
      { id: 'gset-p2-eng-m1', file: 'GSET_English_Paper2_Mock01_CBT.html', title: 'GSET English Paper 2 — CBT Mock 01 (100 Qs)' },
      { id: 'gset-p2-eng-m3', file: 'GSET_English_Paper2_Mock03_CBT.html', title: 'GSET English Paper 2 — CBT Mock 03 (100 Qs)' }
    ]
  },
  combo_edu: {
    id: 'gset-education-combo',
    name: 'GSET Education Scholar Duo (Paper 1 + Education)',
    stream: 'education',
    price: 249,
    originalPrice: 799,
    paymentLink: 'https://rzp.io/rzp/oXfY4Va',
    badge: 'MOST POPULAR • COMPLETE EDUCATION PASS',
    description: 'The definitive dual-paper preparation package for GSET Education candidates: complete Paper 1 General Aptitude combined with specialized Teacher Education & Pedagogy.',
    testCount: 6,
    isCombo: true
  },
  combo_eng: {
    id: 'gset-english-combo',
    name: 'GSET English Scholar Duo (Paper 1 + English)',
    stream: 'english',
    price: 249,
    originalPrice: 799,
    paymentLink: 'https://rzp.io/rzp/oXfY4Va',
    badge: 'MOST POPULAR • COMPLETE ENGLISH PASS',
    description: 'The definitive all-in-one preparation package for GSET English aspirants: comprehensive Paper 1 General Aptitude combined with specialized Paper 2 English Literature & ELT.',
    testCount: 5,
    isCombo: true
  }
};

export const UGC_BUNDLE_PRODUCT = {
  id: 'ugc-net-english-bundle',
  slug: 'ugc-bundle',
  name: 'UGC NET English Complete Preparation Bundle (2026 Edition)',
  price: 499,
  originalPrice: 999,
  paymentLink: 'https://rzp.io/rzp/locBUA0o',
  badge: 'ALL-IN-ONE COMPLETE BUNDLE',
  description: 'The definitive national preparation bundle: 21 authentic NTA computer-based test simulations, 3 complete high-yield online reading dossiers, and verified model rationales.',
  accessUntil: '31 Dec 2026',
  stats: {
    cbtTestsCount: 21,
    ebookPages: 283,
    pyqPages: 35,
    revisionPages: 29
  }
};

export const DEFAULT_STORE_SETTINGS = {
  productSlug: 'ugc-net-bundle',
  productName: 'UGC NET English Complete Preparation Bundle (2026 Edition)',
  earlyBirdPrice: 499,
  standardPrice: 499,
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
    title: 'NET Mock 1, Practice Mocks A–E, Unit Tests 1–4 & Reading Dossiers'
  },
  {
    releaseDateIso: '2026-11-19T00:00:00+05:30',
    date: '19 Nov 2026',
    title: 'Unit Test 5: Language & Pedagogy • Unit Test 6: English in India • Practice Mock C'
  },
  {
    releaseDateIso: '2026-11-20T00:00:00+05:30',
    date: '20 Nov 2026',
    title: 'NET Mock 2 (Full-Length Literature & Theory NTA Simulation)'
  },
  {
    releaseDateIso: '2026-11-22T00:00:00+05:30',
    date: '22 Nov 2026',
    title: 'Unit Test 7: Cultural Studies • Unit Test 8: Literary Criticism • Practice Mock D'
  },
  {
    releaseDateIso: '2026-11-24T00:00:00+05:30',
    date: '24 Nov 2026',
    title: 'Unit Test 9: Literary Theory • Unit Test 10: Research Methods • Practice Mock E'
  },
  {
    releaseDateIso: '2026-11-27T00:00:00+05:30',
    date: '27 Nov 2026',
    title: 'NET Mock 3 (Mid-Term Diagnostic Full Mock) • Practice Mock F'
  },
  {
    releaseDateIso: '2026-12-04T00:00:00+05:30',
    date: '4 Dec 2026',
    title: 'NET Mock 4 (Advanced Synthesis) • Practice Mock I'
  },
  {
    releaseDateIso: '2026-12-09T00:00:00+05:30',
    date: '9 Dec 2026',
    title: 'NET Mock 5 (Grand Diagnostic NTA Mock)'
  },
  {
    releaseDateIso: '2026-12-13T00:00:00+05:30',
    date: '13 Dec 2026',
    title: 'NET Mock 6 (Final Exam Rehearsal) • Last-Week Revision Sheet'
  }
];

export function getStoreFaqs(currentPrice = STORE_PAYMENT_DEFAULTS.defaultPaymentLinkPrice) {
  return [
    {
      q: 'What is included in the "UGC NET English Complete Preparation Bundle (2026)"?',
      a: 'The bundle includes full access to 21 authentic NTA computer-based CBT tests (1 Grand NET Mock, 10 Practice Mocks A-J, and 10 Unit Tests), 5 scheduled full mocks, plus 3 complete high-yield online reading dossiers: the 283-page Complete E-book, the 35-page PYQ Trend Analysis, and the 29-page Last 30 Days Revision Kit.'
    },
    {
      q: 'How long do I have access to the Test Hall and Reading Dossiers?',
      a: `Your student account is active continuously through ${STORE_MERCHANT.accessExpiryFullLabel}. Login anytime with your registered email to access the Test Hall and read your dossiers from your smartphone, tablet, or laptop.`
    },
    {
      q: 'How are GSET and UGC NET products separated?',
      a: 'GSET and UGC NET are completely separate sections. In GSET, Education and English are distinct subject streams. You can enroll in GSET Paper 1, Paper 2 Education, Paper 2 English (₹149 each), or the complete Scholar Duos (₹249 each) tailored to your specific qualifying discipline.'
    },
    {
      q: 'How does the online mock test interface work?',
      a: 'The test environment replicates the real NTA/CBT computer-based examination screen, including a real-time countdown timer, question palette (Answered, Not Answered, Marked for Review), and instant diagnostic scoring with model explanations for every question.'
    },
    {
      q: 'Can I try a sample before enrolling?',
      a: 'Yes! A free 10-question NTA-style demo test and a 15-page sample notes reader are available directly on the site with zero login required.'
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
