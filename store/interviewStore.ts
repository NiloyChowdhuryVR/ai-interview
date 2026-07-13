import { create } from 'zustand';
import {
  InterviewState,
  Question,
  AnswerEvaluation,
  TranscriptEntry,
  InterviewFeedback,
  CompanyMode,
  InterviewRound,
  ResumeData,
} from '@/lib/types';

interface InterviewStore extends InterviewState {
  // Setup actions
  setCompanyMode: (mode: CompanyMode) => void;
  setResumeData: (data: ResumeData) => void;
  setSelectedRounds: (rounds: InterviewRound[]) => void;

  // Round management
  initRound: (round: InterviewRound, questions: Question[]) => void;
  startNextRound: () => boolean; // returns false if no more rounds
  getCurrentRoundQuestions: () => Question[];
  getCurrentQuestion: () => Question | null;

  // During interview
  setStatus: (status: InterviewState['status']) => void;
  addTranscriptEntry: (entry: TranscriptEntry) => void;
  addEvaluation: (evaluation: AnswerEvaluation) => void;
  nextQuestion: () => void;
  setFeedback: (feedback: InterviewFeedback) => void;
  setMicActive: (active: boolean) => void;
  setSpeaking: (speaking: boolean) => void;
  endInterview: () => void;
  reset: () => void;
}

const DEFAULT_ROUND_QUESTIONS: Record<InterviewRound, Question[]> = {
  technical: [],
  project: [],
  hr: [],
};

const initialState: InterviewState = {
  status: 'idle',
  companyMode: null,
  resumeData: null,
  selectedRounds: ['technical', 'project', 'hr'],
  currentRound: null,
  currentQuestionIndex: 0,
  roundQuestions: DEFAULT_ROUND_QUESTIONS,
  evaluations: [],
  transcript: [],
  feedback: null,
  startTime: null,
  endTime: null,
  isMicActive: false,
  isSpeaking: false,
  interviewContext: {
    technologiesMentioned: [],
    projectsMentioned: [],
    conceptsDiscussed: [],
    topicsCovered: [],
    currentDifficulty: 'medium',
    assessments: [],
  },
};

export const useInterviewStore = create<InterviewStore>((set, get) => ({
  ...initialState,

  // ─── Setup ─────────────────────────────────────────────────────────────────

  setCompanyMode: (mode) => set({ companyMode: mode }),

  setResumeData: (data) => set({ resumeData: data }),

  setSelectedRounds: (rounds) => set({ selectedRounds: rounds }),

  // ─── Round Management ───────────────────────────────────────────────────────

  initRound: (round, questions) => {
    set((state) => ({
      currentRound: round,
      currentQuestionIndex: 0,
      status: 'intro',
      startTime: state.startTime || Date.now(),
      roundQuestions: {
        ...state.roundQuestions,
        [round]: questions,
      },
    }));
  },

  startNextRound: () => {
    const state = get();
    const { selectedRounds, currentRound, roundQuestions } = state;

    // Find what round comes next
    const currentIndex = currentRound ? selectedRounds.indexOf(currentRound) : -1;
    const nextRound = selectedRounds[currentIndex + 1];

    if (!nextRound) return false; // no more rounds

    // Only move if we have questions loaded for next round
    if (roundQuestions[nextRound].length === 0) return false;

    set({
      currentRound: nextRound,
      currentQuestionIndex: 0,
      status: 'intro',
    });
    return true;
  },

  getCurrentRoundQuestions: () => {
    const { currentRound, roundQuestions } = get();
    if (!currentRound) return [];
    return roundQuestions[currentRound];
  },

  getCurrentQuestion: () => {
    const state = get();
    const { currentRound, currentQuestionIndex, roundQuestions } = state;
    if (!currentRound) return null;
    const questions = roundQuestions[currentRound];
    if (currentQuestionIndex < questions.length) {
      return questions[currentQuestionIndex];
    }
    return null;
  },

  // ─── During Interview ───────────────────────────────────────────────────────

  setStatus: (status) => set({ status }),

  addTranscriptEntry: (entry) =>
    set((state) => ({
      transcript: [...state.transcript, { ...entry, round: state.currentRound ?? undefined }],
    })),

  addEvaluation: (evaluation) =>
    set((state) => ({
      evaluations: [...state.evaluations, evaluation],
    })),

  nextQuestion: () =>
    set((state) => ({
      currentQuestionIndex: state.currentQuestionIndex + 1,
      status: 'asking',
    })),

  setFeedback: (feedback) => set({ feedback }),

  setMicActive: (active) => set({ isMicActive: active }),

  setSpeaking: (speaking) => set({ isSpeaking: speaking }),

  endInterview: () =>
    set({
      status: 'completed',
      endTime: Date.now(),
    }),

  reset: () =>
    set({
      ...initialState,
      roundQuestions: { ...DEFAULT_ROUND_QUESTIONS },
    }),
}));
