/**
 * AUTHOR STUDIO EXAM & MCQ DATA TYPES
 * Dr. Rajnikant S. Dodiya Platform Architecture
 */

export interface StudioExamQuestion {
  id: number;
  section: string;
  question: string;
  options: [string, string, string, string];
  correctAnswer: string | number; // Masked string e.g. "ans_28" or number
  rawCorrectIndex: number; // 0, 1, 2, or 3
  explanation: string;
  topicTag: string;
}

export interface StudioExamTest {
  id: string; // e.g. 'exam-ugc-mock-01'
  title: string; // 'UGC-NET English & Education Master Mock Exam'
  subtitle: string; // '25 Curated High-Yield MCQs with Detailed Solutions'
  discipline: string; // 'English Literature & Pedagogy'
  durationMinutes: number; // e.g. 60
  totalMarks: number; // e.g. 50
  negativeMarking: number; // e.g. 0
  passingScore: number; // e.g. 20
  price: number; // e.g. 299
  freeSampleCount: number; // e.g. 3
  isActive: boolean;
  sourceFileName?: string;
  createdAt: string;
  updatedAt: string;
  questions: StudioExamQuestion[];
}
