/**
 * ============================================================================
 * STUDY MATERIALS DATA & COURSE TRACKS
 * Sardar Patel University • Dr. Rajnikant S. Dodiya
 * NET Vidya English • NET Vidya Education • TET-II Gujarat
 * ============================================================================
 */

import { STORE_PRODUCTS, StoreProduct } from './storeCatalogData';

export type StudyTrackId = 'net-vidya-english' | 'net-vidya-education' | 'tet-ii-gujarat';

export interface StudyBundleOption {
  id: string; // product id in STORE_PRODUCTS ('prod-kalam-book' | 'prod-ugc-mock-exam' | 'prod-scholar-bundle')
  productType: 'book' | 'exam' | 'bundle';
  title: string;
  subtitle: string;
  price: number;
  originalPrice: number;
  discountPercentage: number;
  badge: string;
  isPopular?: boolean;
  features: string[];
  materialsIncluded: string[];
}

export interface DemoPdfContent {
  title: string;
  subtitle: string;
  pages: string;
  fileSize: string;
  downloadFileName: string;
  overview: string;
  keyTopics: string[];
  sampleQuestions: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
  excerptText: string[];
}

export interface StudyTrack {
  id: StudyTrackId;
  name: string;
  shortLabel: string;
  icon: string;
  examCode: string;
  tagline: string;
  targetAspirants: string;
  officialNotificationNote: string;
  demoPdf: DemoPdfContent;
  bundles: StudyBundleOption[];
}

export const STUDY_TRACKS: Record<StudyTrackId, StudyTrack> = {
  'net-vidya-english': {
    id: 'net-vidya-english',
    name: 'NET Vidya English',
    shortLabel: 'English Literature',
    icon: '📘',
    examCode: 'UGC-NET / GSET Subject Code 30',
    tagline: 'Master English Literature, Critical Theory, Cultural Studies & ELT Pedagogy',
    targetAspirants: 'UGC NET English, GSET, Ph.D. Entrance & Assistant Professor Aspirants',
    officialNotificationNote: 'Curriculum structured per the latest NTA UGC-NET & UGC-GSET syllabus mandates.',
    demoPdf: {
      title: 'UGC-NET English Core Literature & Pedagogy Sampler',
      subtitle: 'Official High-Yield Demo PDF • Dr. Rajnikant S. Dodiya',
      pages: '16 Pages',
      fileSize: '1.8 MB',
      downloadFileName: 'NETVidya_English_Literature_Demo_Sampler.pdf',
      overview: 'Curated sample syllabus overview, high-yield literary chronologies (Chaucer to Postmodernism), B. Kumaravadivelu’s Post-Method ELT framework, and 5 fully solved exam questions with pedagogical justifications.',
      keyTopics: [
        'Chronological Timeline of British & World English Literatures',
        'Literary Theory: Structuralism, Post-Structuralism, Différance, and Eco-criticism',
        'English Language Teaching (ELT) & Kumaravadivelu Post-Method Parameters',
        'Solved High-Yield Model Questions with Diagnostic Distractor Analysis'
      ],
      sampleQuestions: [
        {
          question: 'In Jane Austen’s Pride and Prejudice (1813), what is the famous opening philosophical aphorism of the novel?',
          options: [
            '“It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.”',
            '“Happy families are all alike; every unhappy family is unhappy in its own way.”',
            '“No one who had ever seen Catherine Morland in her infancy would have supposed her born to be an heroine.”',
            '“Emma Woodhouse, handsome, clever, and rich, with a comfortable home…”'
          ],
          correctIndex: 0,
          explanation: 'The ironic first sentence of Pride and Prejudice immediately establishes the societal commercialization of marriage in Regency England.'
        },
        {
          question: 'Jacques Derrida’s foundational post-structuralist concept of "Différance" operates simultaneously through which two French significations?',
          options: [
            'To differ and to defer (postpone meaning)',
            'To define and to divide',
            'To destroy and to deconstruct',
            'To display and to disguise'
          ],
          correctIndex: 0,
          explanation: 'Derrida coined différance with an "a" to fuse "différer" (to differ spatially) and "différer" (to defer or postpone meaning temporarily).'
        },
        {
          question: 'Which scholar formulated the "Post-Method Condition" in language education, organized around Particularity, Practicality, and Possibility?',
          options: [
            'B. Kumaravadivelu',
            'Stephen Krashen',
            'Noam Chomsky',
            'Diane Larsen-Freeman'
          ],
          correctIndex: 0,
          explanation: 'B. Kumaravadivelu formulated the Post-Method framework to move beyond prescriptive methodologies toward context-sensitive teacher autonomy.'
        }
      ],
      excerptText: [
        'PREFACE TO UGC-NET ENGLISH LITERATURE PREPARATION:',
        'The examination demands moving beyond mechanical plot summaries toward epistemic rigor. Candidates must apprehend texts in dialogue with their historical contexts, aesthetic discourses, and critical theories.',
        'UNIT 1 & 2: BRITISH DRAMA AND POETRY OVERVIEW:',
        'From the Medieval morality plays and the Elizabethan stage (Marlowe, Shakespeare) through Metaphysical wit (Donne) and Augustan satire (Pope, Dryden), candidates should focus on generic conventions and sociopolitical shifts.',
        'UNIT 8: LITERARY CRITICISM AND THEORY:',
        'Modern UGC-NET papers heavily index Continental theory. A rigorous grasp of Russian Formalism, New Criticism, Deconstruction, Feminism, New Historicism, and Postcolonialism is essential for achieving the JRF percentile.'
      ]
    },
    bundles: [
      {
        id: 'prod-kalam-book',
        productType: 'book',
        title: 'English Study Notes & E-Book Pack',
        subtitle: 'Comprehensive Digital Reading & Literary Analysis Monograph',
        price: 399,
        originalPrice: 999,
        discountPercentage: 60,
        badge: 'Digital E-Books',
        features: [
          'Full High-Yield Literary Chronologies & Criticism Glossary',
          'Dr. Dodiya’s Post-Method & Pedagogy Research Monograph',
          'Protected In-Browser Cloud Reading Room (Zero Raw PDF Leaks)',
          'Authorized 2-Device Student Pass (Phone + Laptop)'
        ],
        materialsIncluded: [
          'Digital Monograph: Educational Thoughts & Pedagogy',
          'Unit-wise High-Yield Summary Notes (Units 1 to 10)',
          'Critical Theory Epistemological Glossaries',
          'Dr. Dodiya’s Reading Guide for NET/GSET Paper II'
        ]
      },
      {
        id: 'prod-ugc-mock-exam',
        productType: 'exam',
        title: 'NET Vidya CBT Test Series Engine',
        subtitle: 'NTA-Style Online Examination Simulator & Solved Bank',
        price: 299,
        originalPrice: 799,
        discountPercentage: 63,
        badge: 'CBT Test Engine',
        features: [
          'Timed 60-Minute Countdown Clock with Pause & Resume',
          '25 Curated High-Yield MCQs with Detailed Solutions',
          'NTA Exam Palette (Answered, Flagged, Unvisited)',
          'Instant Diagnostic Scorecard & Topic-wise Mastery Percentile'
        ],
        materialsIncluded: [
          'CBT Mock Exam Simulator (25 High-Yield Questions)',
          'In-Depth Question Rationale & Distractor Explanations',
          'Post-Test Academic Review Portal with Unlimited Re-takes',
          'Dr. Dodiya’s Speed & Elimination Strategy Brief'
        ]
      },
      {
        id: 'prod-scholar-bundle',
        productType: 'bundle',
        title: 'Complete Master Scholar Pass (All-Inclusive)',
        subtitle: 'All E-Books + High-Yield Notes + CBT Mock Simulator + Mentor Access',
        price: 599,
        originalPrice: 1799,
        discountPercentage: 67,
        badge: 'Most Popular • Best Value',
        isPopular: true,
        features: [
          'Complete Study Notes, Monograph E-Books & Unit Guides',
          'Full Access to CBT Mock Exam Simulator with Explanations',
          'Priority WhatsApp Mentor Channel for NET Vidya Aspirants',
          'Authorized Dual-Device Cloud Pass (1 Mobile + 1 Laptop)'
        ],
        materialsIncluded: [
          'All Digital E-Books & Dr. Dodiya’s Doctoral Monograph',
          'Full 25-Question CBT Master Simulator Portal',
          'Complete High-Yield Notes (Literature, Theory, and ELT)',
          'Direct Student Verification & 2-Device Cloud License',
          'Official NET Vidya Study Pass Access Certificate'
        ]
      }
    ]
  },

  'net-vidya-education': {
    id: 'net-vidya-education',
    name: 'NET Vidya Education',
    shortLabel: 'Education (Paper II)',
    icon: '🎓',
    examCode: 'UGC-NET / GSET Subject Code 09',
    tagline: 'Philosophical Foundations, Research Methodology, Teacher Education & NEP 2020',
    targetAspirants: 'UGC NET Education, B.Ed. / M.Ed. Trainees, and Research Scholars',
    officialNotificationNote: 'Aligned with Dr. Dodiya’s doctoral research at Sardar Patel University.',
    demoPdf: {
      title: 'UGC-NET Education Foundations & Kalam Inquiry Sampler',
      subtitle: 'Official High-Yield Demo PDF • Dr. Rajnikant S. Dodiya',
      pages: '18 Pages',
      fileSize: '2.1 MB',
      downloadFileName: 'NETVidya_Education_Foundations_Demo_Sampler.pdf',
      overview: 'Sample study material covering Western & Indian Philosophies of Education (Sankhya, Vedanta, Pragmatism), Educational Research Methodologies (Experimental vs. Descriptive), and Dr. Kalam’s Educational Philosophy.',
      keyTopics: [
        'Philosophical Foundations: Idealism, Naturalism, Pragmatism & Indian Darshanas',
        'Dr. A.P.J. Abdul Kalam’s Inquiry-Based Educational Paradigm (Doctoral Study, SPU)',
        'Research Paradigms: Qualitative, Quantitative, Experimental Variables, and Sampling',
        'Teacher Education & Policy Mandates: NEP 2020, NCTE Standards, and IQAC Benchmarks'
      ],
      sampleQuestions: [
        {
          question: 'According to Bloom’s Revised Taxonomy (Anderson & Krathwohl, 2001), which cognitive process occupies the highest hierarchical apex?',
          options: [
            'Creating (Generating new ideas, products, or perspectives)',
            'Evaluating (Making judgments based on criteria and standards)',
            'Analyzing (Breaking material into constituent elements)',
            'Remembering (Retrieving relevant knowledge from memory)'
          ],
          correctIndex: 0,
          explanation: 'Bloom’s revised taxonomy replaced "Evaluation" with "Creating" at the supreme cognitive level, emphasizing generative application.'
        },
        {
          question: 'In an experimental research design, the variable that the investigator manipulates directly to observe its effect is called:',
          options: [
            'Independent Variable',
            'Dependent Variable',
            'Extraneous Variable',
            'Confounding Variable'
          ],
          correctIndex: 0,
          explanation: 'The independent variable is the manipulated causal factor, while the dependent variable is the measured effect.'
        },
        {
          question: 'Dr. A.P.J. Abdul Kalam identified which three primary educators as foundational to transforming children into enlightened citizens?',
          options: [
            'Father, Mother, and the Primary School Teacher',
            'School Principal, University Professor, and Peer Group',
            'Government, Society, and Spiritual Leader',
            'Curriculum Designer, Textbook Author, and Examiner'
          ],
          correctIndex: 0,
          explanation: 'Dr. Kalam famously stated: "If a country is to be corruption free and become a nation of beautiful minds, I strongly feel there are three key societal members who can make a difference: father, mother and the teacher."'
        }
      ],
      excerptText: [
        'UNIT 1: PHILOSOPHICAL FOUNDATIONS OF EDUCATION:',
        'Education is the conscious realization of human potential. Indian Knowledge Systems (IKS) synthesize Sankhya dualism, Vedanta non-dualism, and Buddhist mindfulness into an experiential pedagogy.',
        'DOCTORAL TREATISE INSIGHT (SPU, 2018):',
        'Dr. Kalam argued that modern science without moral stewardship is hazardous. His pedagogical epistemology bridges technological innovation with value-based humanism.',
        'UNIT 6: RESEARCH IN EDUCATION:',
        'Mastering sampling techniques (probability vs. non-probability), hypothesis formulation, parametric vs. non-parametric tests, and APA 7th style referencing is vital for scoring top percentiles in Paper 1 and Paper 2.'
      ]
    },
    bundles: [
      {
        id: 'prod-kalam-book',
        productType: 'book',
        title: 'Education Pedagogy & Kalam Monograph Pack',
        subtitle: 'Doctoral Treatise & Philosophy of Education Reading Vault',
        price: 399,
        originalPrice: 999,
        discountPercentage: 60,
        badge: 'Doctoral Treatise',
        features: [
          'Full 4-Chapter Kalam Doctoral Study with Footnotes & Citations',
          'Indian Knowledge Systems (IKS) & NEP 2020 Teacher Education Notes',
          'Protected In-Browser Cloud Reading Room with Bookmarking',
          'Authorized Dual-Device Pass (1 Mobile + 1 Laptop)'
        ],
        materialsIncluded: [
          'Full Monograph: Educational Thoughts of APJ Abdul Kalam (SPU, 2018)',
          'Philosophical Foundations Summary Guide (Indian & Western)',
          'Research Methodology & Statistics Chapter Reference',
          'Teacher Education Policy & NEP 2020 Framework Notes'
        ]
      },
      {
        id: 'prod-ugc-mock-exam',
        productType: 'exam',
        title: 'Education & Research Aptitude CBT Simulator',
        subtitle: 'Paper I (General Aptitude) + Paper II (Education) Test Series',
        price: 299,
        originalPrice: 799,
        discountPercentage: 63,
        badge: 'CBT Test Engine',
        features: [
          'Curated 25 High-Yield Questions in Pedagogy & Research Methodology',
          'Authentic NTA University Portal Interface with Timer',
          'Immediate Answer Review with Detailed Theoretical Explanations',
          'Diagnostic Strength & Weakness Breakdown per Cognitive Unit'
        ],
        materialsIncluded: [
          'CBT Mock Exam Simulator for Education Candidates',
          'Comprehensive Pedagogical Solutions by Dr. Dodiya',
          'Statistical Formulas & Variable Identification Cheat Sheet',
          'Unlimited Practice Retakes with Session Tracking'
        ]
      },
      {
        id: 'prod-scholar-bundle',
        productType: 'bundle',
        title: 'Education Scholar Master Pass (All-Inclusive)',
        subtitle: 'Full Doctoral E-Book + Research Notes + CBT Simulator + Mentor Access',
        price: 599,
        originalPrice: 1799,
        discountPercentage: 67,
        badge: 'Best Value • Complete Prep',
        isPopular: true,
        features: [
          'Complete Education & Kalam Monograph E-Books Collection',
          'Full Access to CBT Test Series Engine with Detailed Analytics',
          'Direct WhatsApp Guidance Channel with Dr. Rajnikant Dodiya',
          'Authorized 2-Device Student Pass for Phone and Laptop'
        ],
        materialsIncluded: [
          'Full Monograph & High-Yield Educational Philosophy Notes',
          'Complete 25-Question CBT Mock Examination Simulator',
          'Research Methodology Solved Question Bank',
          'Direct Student Verified Pass & Priority Academic Support',
          'Official NET Vidya Certificate of Academic Enrollment'
        ]
      }
    ]
  },

  'tet-ii-gujarat': {
    id: 'tet-ii-gujarat',
    name: 'TET-II Gujarat',
    shortLabel: 'Gujarat TET-II',
    icon: '🏫',
    examCode: 'Gujarat State Teacher Eligibility Test (Std 6 to 8)',
    tagline: 'English Language Pedagogy, Classroom Methodology & Gujarati-English Translanguaging',
    targetAspirants: 'Gujarat TET-II Candidates, B.Ed. English Trainees & Primary/Upper-Primary Teachers',
    officialNotificationNote: 'Tailored for Gujarat State Examination Board (SEB) standards & GSEB curriculum.',
    demoPdf: {
      title: 'Gujarat TET-II English Pedagogy & Methodology Sampler',
      subtitle: 'Official High-Yield Demo PDF • Dr. Rajnikant S. Dodiya',
      pages: '14 Pages',
      fileSize: '1.6 MB',
      downloadFileName: 'Gujarat_TET_II_English_Pedagogy_Sampler.pdf',
      overview: 'Curated upper-primary language teaching methods, BICS vs. CALP communicative frameworks, bilingual Gujarati-English classroom strategies, and 5 model examination questions with Gujarati-English explanations.',
      keyTopics: [
        'Upper-Primary English Methodology (LSRW Skills Development in GSEB Schools)',
        'Basic Interpersonal Communication Skills (BICS) vs. CALP in Regional Classrooms',
        'Translanguaging & Pedagogical Scaffolding for Gujarati Medium Students',
        'Gujarat TET-II Model MCQs with Detailed Grammatical & Pedagogical Explanations'
      ],
      sampleQuestions: [
        {
          question: 'What is the primary pedagogical purpose of "Diagnostic Language Testing" in upper-primary English classrooms?',
          options: [
            'To pinpoint specific phonetic and grammatical learning gaps for targeted remediation',
            'To rank students in order of terminal annual exam grades',
            'To compare district-level school performance indices',
            'To evaluate teacher instructional speed'
          ],
          correctIndex: 0,
          explanation: 'Diagnostic testing evaluates student linguistic misconceptions before remediation, enabling upper-primary teachers to customize scaffolding.'
        },
        {
          question: 'In language acquisition theory, Jim Cummins coined "BICS" to represent which fundamental competency?',
          options: [
            'Basic Interpersonal Communication Skills (Conversational fluency)',
            'Bilingual Instructional Classroom Standards',
            'Behavioral Imitation Communication System',
            'Base International Curriculum Syntax'
          ],
          correctIndex: 0,
          explanation: 'BICS refers to everyday conversational fluency, distinct from Cognitive Academic Language Proficiency (CALP).'
        },
        {
          question: 'When Gujarati-medium student teachers use Gujarati to clarify English complex structures, this pedagogical practice is recognized in modern sociolinguistics as:',
          options: [
            'Translanguaging (Constructive bilingual scaffolding)',
            'Subtractive interference',
            'Defective fossilization',
            'Pure target immersion'
          ],
          correctIndex: 0,
          explanation: 'Translanguaging leverages the learner’s full linguistic repertoire (L1 Gujarati) to foster deeper understanding of L2 English.'
        }
      ],
      excerptText: [
        'OVERVIEW: GUJARAT TET-II ENGLISH LANGUAGE TEACHING (STD 6–8):',
        'Teaching English in Gujarat upper-primary schools requires moving away from pure grammar-translation toward communicative competence while honoring the mother tongue.',
        'METHODOLOGY FOCUS: LSRW SKILLS SCAFFOLDING:',
        'Listening and speaking must precede reading and writing. Trainees must master interactive task design, dialogue activities, and micro-teaching lesson planning aligned with GCERT textbooks.',
        'TRANSLANGUAGING IN PRACTICE:',
        'Strategic use of Gujarati does not hinder English mastery; when deployed systematically, it validates learners’ identity and bridges conceptual abstraction.'
      ]
    },
    bundles: [
      {
        id: 'prod-kalam-book',
        productType: 'book',
        title: 'TET-II English Pedagogy E-Book Pack',
        subtitle: 'Classroom Methodology & Language Skills Teaching Manual',
        price: 399,
        originalPrice: 999,
        discountPercentage: 60,
        badge: 'Pedagogy Manual',
        features: [
          'Complete Upper-Primary English Methodology Manual by Dr. Dodiya',
          'LSRW Classroom Tasks, Lesson Plans & GCERT Curriculum Alignment',
          'Protected In-Browser Cloud Reading Room on Phone and Laptop',
          'Authorized Dual-Device Pass with Automatic Cloud Bookmarking'
        ],
        materialsIncluded: [
          'English Language Pedagogy Manual (Upper Primary Std 6–8)',
          'Translanguaging & BICS Communicative Classroom Guide',
          'GCERT English Syllabus Topic Summaries',
          'Dr. Dodiya’s Teaching Methodology Lecture Notes'
        ]
      },
      {
        id: 'prod-ugc-mock-exam',
        productType: 'exam',
        title: 'TET-II Master Mock Exam Simulator',
        subtitle: 'Timed Test Series with Bilingual Explanations & Topic Scores',
        price: 299,
        originalPrice: 799,
        discountPercentage: 63,
        badge: 'CBT Test Engine',
        features: [
          'Timed Exam Simulator replicating Gujarat State Exam Board format',
          '25 High-Yield Model Questions covering Pedagogy, Grammar & Comprehension',
          'Bilingual Explanations with Clear Distractor Rationale',
          'Instant Diagnostic Scorecard with Review Portal and Retakes'
        ],
        materialsIncluded: [
          'Gujarat TET-II Mock Examination Simulator Portal',
          'Detailed Pedagogical & Grammatical Explanations',
          'Speed & Question Elimination Strategy Guidelines',
          'Unlimited Practice Retakes with Session Tracking'
        ]
      },
      {
        id: 'prod-scholar-bundle',
        productType: 'bundle',
        title: 'Complete Gujarat TET-II Preparation Bundle',
        subtitle: 'All E-Books + Methodology Guides + Mock Exam + WhatsApp Mentorship',
        price: 599,
        originalPrice: 1799,
        discountPercentage: 67,
        badge: 'Best Value • Complete Prep',
        isPopular: true,
        features: [
          'Full Pedagogy E-Books & GCERT Upper-Primary Teaching Notes',
          'Full Access to TET-II Timed Mock Exam Simulator Engine',
          'Direct WhatsApp Channel for Gujarat Teacher Trainees',
          'Authorized 2-Device Student Pass for Mobile and Laptop'
        ],
        materialsIncluded: [
          'Complete TET-II English Pedagogy Notes & E-Books',
          'Full 25-Question CBT Examination Simulator Engine',
          'Model Question Banks with Bilingual Analysis',
          'Official Candidate Pass with 2-Device Cloud Authentication',
          'Certificate of Course Enrollment under HMPIETR Faculty Mentorship'
        ]
      }
    ]
  }
};
