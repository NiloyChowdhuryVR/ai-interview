// All types for the AI Interviewer application

// ─── Company Modes ────────────────────────────────────────────────────────────
export type CompanyMode =
  | 'tcs-ninja'
  | 'tcs-digital'
  | 'tcs-prime'
  | 'google'
  | 'amazon'
  | 'microsoft'
  | 'meta'
  | 'infosys'
  | 'wipro'
  | 'accenture';

// ─── Interview Rounds ─────────────────────────────────────────────────────────
export type InterviewRound = 'technical' | 'project' | 'hr';

// ─── Resume Data ──────────────────────────────────────────────────────────────
export interface ResumeData {
  skills: string[];           // e.g. ["React", "Python", "AWS"]
  projects: ResumeProject[];  // list of projects with name + description
  experience: string[];       // job titles / company names
  education: string[];        // degrees / colleges
  rawText: string;            // full extracted PDF text
}

export interface ResumeProject {
  name: string;
  description: string;        // what the project does
  technologies: string[];     // tech stack used
}

// ─── Questions ────────────────────────────────────────────────────────────────
export interface Question {
  id: string;
  text: string;
  category: string;           // flexible — could be "React", "System Design", "HR", etc.
  round: InterviewRound;
  difficulty: 'easy' | 'medium' | 'hard';
}

// ─── Evaluations ─────────────────────────────────────────────────────────────
export interface AnswerEvaluation {
  questionId: string;
  question: string;
  answer: string;
  category: string;
  round: InterviewRound;
  score: number;              // 0–10
  feedback: string;
  strengths: string[];
  improvements: string[];
}

// ─── Scores ───────────────────────────────────────────────────────────────────
export interface CategoryScore {
  category: string;
  score: number;
  maxScore: number;
  percentage: number;
}

export interface RoundScore {
  round: InterviewRound;
  score: number;              // 0–100 scale for that round
  questionsAsked: number;
  grade: string;
}

// ─── Final Feedback ───────────────────────────────────────────────────────────
export interface InterviewFeedback {
  overallScore: number;       // 0–100
  overallGrade: 'Excellent' | 'Good' | 'Average' | 'Needs Improvement' | 'Poor';
  roundScores: RoundScore[];
  categoryScores: CategoryScore[];
  evaluations: AnswerEvaluation[];
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  summary: string;
  companyMode?: CompanyMode;
}

// ─── Transcript ───────────────────────────────────────────────────────────────
export interface TranscriptEntry {
  role: 'interviewer' | 'candidate';
  text: string;
  timestamp: number;
  round?: InterviewRound;
}

// ─── Interview State ──────────────────────────────────────────────────────────
export interface InterviewState {
  status: 'idle' | 'setup' | 'intro' | 'asking' | 'listening' | 'evaluating' | 'round-complete' | 'completed';
  companyMode: CompanyMode | null;
  resumeData: ResumeData | null;

  // Round tracking
  selectedRounds: InterviewRound[];
  currentRound: InterviewRound | null;
  currentQuestionIndex: number;

  // Questions split by round
  roundQuestions: Record<InterviewRound, Question[]>;

  // All evaluations across all rounds
  evaluations: AnswerEvaluation[];
  transcript: TranscriptEntry[];
  feedback: InterviewFeedback | null;
  startTime: number | null;
  endTime: number | null;
  isMicActive: boolean;
  isSpeaking: boolean;
  interviewContext: InterviewContext;
}

// ─── Adaptive Interview Engine ────────────────────────────────────────────────
export interface AnswerAssessment {
  questionId: string;
  quality: 'weak' | 'average' | 'strong';
  confidence: 'low' | 'medium' | 'high';
  technicalDepth: 'shallow' | 'moderate' | 'deep';
  extractedEntities: string[];
  topicsCovered: string[];
}

export interface InterviewContext {
  technologiesMentioned: string[];
  projectsMentioned: string[];
  conceptsDiscussed: string[];
  topicsCovered: string[];
  currentDifficulty: 'easy' | 'medium' | 'hard';
  assessments: AnswerAssessment[];
}

export interface AdaptiveNextResponse {
  assessment: AnswerAssessment;
  nextQuestion: Question;
  difficultyAdjustment: 'increase' | 'maintain' | 'decrease';
  acknowledgment: string;
}
