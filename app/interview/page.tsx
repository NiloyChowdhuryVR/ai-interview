'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInterviewStore } from '@/store/interviewStore';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { useAudioVisualizer } from '@/hooks/useAudioVisualizer';
import { AnswerEvaluation, InterviewRound, Question } from '@/lib/types';
import { COMPANY_MODES, ROUND_LABELS } from '@/lib/companyModes';
import Link from 'next/link';

export default function InterviewPage() {
  const router = useRouter();
  const store = useInterviewStore();
  const {
    status,
    currentRound,
    currentQuestionIndex,
    selectedRounds,
    roundQuestions,
    evaluations,
    transcript,
    startTime,
    companyMode,
    setStatus,
    addTranscriptEntry,
    addEvaluation,
    nextQuestion,
    setFeedback,
    setMicActive,
    endInterview,
    initRound,
    startNextRound,
    getCurrentQuestion,
  } = store;

  const { transcript: speechTranscript, isListening, isSupported: sttSupported, startListening, stopListening, resetTranscript } = useSpeechRecognition();
  const { speak, cancel: cancelSpeech } = useSpeechSynthesis();
  const { canvasRef, startVisualizer, stopVisualizer } = useAudioVisualizer();

  const [elapsedTime, setElapsedTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [setupError, setSetupError] = useState('');
  const isInitializedRef = useRef(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Get fresh store state
  const getStore = useCallback(() => useInterviewStore.getState(), []);

  // ─── Timer ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (status !== 'idle' && status !== 'completed' && startTime) {
      timerRef.current = setInterval(() => setElapsedTime(Math.floor((Date.now() - startTime) / 1000)), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status, startTime]);

  // Auto-scroll transcript
  useEffect(() => { transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [transcript]);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ─── Core: ask a single question ─────────────────────────────────────────────
  // Small pause between TTS ending and mic starting — prevents first word being eaten
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const askQuestion = useCallback(async (questionIndex: number) => {
    const { currentRound, roundQuestions } = getStore();
    if (!currentRound) return;
    const question = roundQuestions[currentRound][questionIndex];
    if (!question) return;

    setStatus('asking');
    addTranscriptEntry({ role: 'interviewer', text: question.text, timestamp: Date.now() });

    try { await speak(question.text); } catch { /* continue even if TTS fails */ }

    // Wait 400ms after TTS ends before mic starts — browser needs a moment
    await sleep(400);

    setStatus('listening');
    setMicActive(true);
    resetTranscript();
    startListening();
    try { await startVisualizer(); } catch { /* non-critical */ }
  }, [getStore, setStatus, addTranscriptEntry, speak, setMicActive, resetTranscript, startListening, startVisualizer]);

  // ─── End the entire interview ─────────────────────────────────────────────────
  const doEndInterview = useCallback(async () => {
    stopListening();
    stopVisualizer();
    cancelSpeech();
    setMicActive(false);
    endInterview();

    const outro = 'That concludes all interview rounds. Thank you for your time! Preparing your feedback report now.';
    addTranscriptEntry({ role: 'interviewer', text: outro, timestamp: Date.now() });
    // Don't await speak here — just fire and move on so we don't block the redirect
    try { speak(outro); } catch { /* ignore */ }

    setIsProcessing(true);
    try {
      const { evaluations, companyMode } = getStore();

      // If there are no evaluations (user ended immediately), still redirect with empty feedback
      if (!evaluations || evaluations.length === 0) {
        const emptyFeedback = {
          overallScore: 0, overallGrade: 'Needs Improvement',
          roundScores: [], categoryScores: [], evaluations: [],
          strengths: ['Interview was ended early'], improvements: ['Complete all questions for a full evaluation'],
          recommendations: ['Try again and answer all questions'], summary: 'Interview was ended before any questions were answered.',
          companyMode,
        };
        sessionStorage.setItem('interviewFeedback', JSON.stringify(emptyFeedback));
        router.push('/dashboard');
        return;
      }

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evaluations, companyMode }),
      });

      if (!res.ok) throw new Error('Feedback API failed');

      const feedback = await res.json();
      setFeedback(feedback);
      // Ensure it's stored BEFORE we navigate
      sessionStorage.setItem('interviewFeedback', JSON.stringify(feedback));
      await new Promise(r => setTimeout(r, 100)); // tiny wait for sessionStorage write
      router.push('/dashboard');
    } catch (err) {
      console.error('Feedback failed:', err);
      // Still redirect — dashboard handles missing feedback gracefully
      router.push('/dashboard');
    }
  }, [stopListening, stopVisualizer, cancelSpeech, setMicActive, endInterview, addTranscriptEntry, speak, getStore, setFeedback, router]);

  // ─── Transition to the next round ────────────────────────────────────────────
  const startRound = useCallback(async (round: InterviewRound) => {
    const modeConfig = companyMode ? COMPANY_MODES[companyMode] : null;
    const roundLabel = ROUND_LABELS[round];

    const intro = round === 'technical'
      ? `Hello! Welcome to the technical round. I'll be assessing your technical fundamentals today, focusing on the skills from your resume. Let's get started.`
      : round === 'project'
      ? `Welcome to the project round. I'd like to dive deep into the architecture and technical decisions behind the projects on your resume.`
      : `Welcome to the HR round. I'll be asking a few behavioral questions to understand your past experiences and how you work in a team.`;

    setStatus('intro');
    addTranscriptEntry({ role: 'interviewer', text: intro, timestamp: Date.now() });

    // Give browser a moment to initialize voices on mount
    await new Promise(r => setTimeout(r, 500));
    try { await speak(intro); } catch { /* continue */ }
    
    // Pause between intro and first question
    await new Promise(r => setTimeout(r, 800));

    await askQuestion(0);
  }, [companyMode, setStatus, addTranscriptEntry, speak, askQuestion]);

  // ─── Initialize from sessionStorage ──────────────────────────────────────────
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    const raw = sessionStorage.getItem('interviewSetup');
    if (!raw) {
      setSetupError('No interview setup found. Please go back to the home page and configure your interview.');
      return;
    }

    try {
      const setup = JSON.parse(raw) as {
        resumeData: unknown;
        companyMode: string;
        selectedRounds: InterviewRound[];
        allQuestions: Record<InterviewRound, Question[]>;
      };

      const { selectedRounds: rounds, allQuestions, companyMode: mode } = setup;

      // Load store
      store.setCompanyMode(mode as never);
      store.setResumeData(setup.resumeData as never);
      store.setSelectedRounds(rounds);

      // Load questions for each round into store
      rounds.forEach(round => {
        store.initRound(round, allQuestions[round] || []);
      });

      // Start with the first selected round
      const firstRound = rounds[0];
      store.initRound(firstRound, allQuestions[firstRound] || []);
      startRound(firstRound);
    } catch (e) {
      console.error('Failed to load setup:', e);
      setSetupError('Failed to load interview. Please go back and try again.');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Submit an answer ─────────────────────────────────────────────────────────
  const submitAnswer = useCallback(async () => {
    if (!speechTranscript.trim()) return;

    stopListening();
    stopVisualizer();
    setMicActive(false);

    const answer = speechTranscript.trim();
    const currentQuestion = getStore().getCurrentQuestion();
    const { companyMode, currentRound } = getStore();
    if (!currentQuestion || !currentRound) return;

    addTranscriptEntry({ role: 'candidate', text: answer, timestamp: Date.now() });
    setStatus('evaluating');
    setIsProcessing(true);

    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQuestion.text,
          answer,
          category: currentQuestion.category,
          questionId: currentQuestion.id,
          round: currentRound,
          companyMode,
        }),
      });
      const evaluation: AnswerEvaluation = await res.json();
      addEvaluation(evaluation);

      const acks = [
        'Thank you for your answer. Moving to the next question.',
        'Good response. Let us continue.',
        'Understood. Next question.',
        'Thank you. Let me ask you the next one.',
      ];
      const ack = acks[Math.floor(Math.random() * acks.length)];
      addTranscriptEntry({ role: 'interviewer', text: ack, timestamp: Date.now() });
      try { await speak(ack); } catch { /* continue */ }
    } catch (e) {
      console.error('Evaluation failed:', e);
    }

    setIsProcessing(false);
    resetTranscript();

    // Move to next question or next round or end
    const freshStore = getStore();
    const { currentQuestionIndex: idx, currentRound: round, roundQuestions, selectedRounds } = freshStore;
    const qs = round ? roundQuestions[round] : [];
    const nextIdx = idx + 1;

    if (nextIdx < qs.length) {
      nextQuestion();
      await askQuestion(nextIdx);
    } else {
      // Current round is done — try next round
      setStatus('round-complete');
      const roundDoneMsg = `We have completed the ${round ? ROUND_LABELS[round] : ''} round. Well done!`;
      addTranscriptEntry({ role: 'interviewer', text: roundDoneMsg, timestamp: Date.now() });
      try { await speak(roundDoneMsg); } catch { /* continue */ }

      // Find next round that has questions
      const currentRoundIdx = selectedRounds.indexOf(round!);
      let movedToNextRound = false;
      for (let i = currentRoundIdx + 1; i < selectedRounds.length; i++) {
        const nextRound = selectedRounds[i];
        if (roundQuestions[nextRound].length > 0) {
          store.initRound(nextRound, roundQuestions[nextRound]);
          await startRound(nextRound);
          movedToNextRound = true;
          break;
        }
      }
      if (!movedToNextRound) {
        await doEndInterview();
      }
    }
  }, [
    speechTranscript, stopListening, stopVisualizer, setMicActive, getStore,
    addTranscriptEntry, setStatus, addEvaluation, speak, resetTranscript,
    nextQuestion, askQuestion, store, startRound, doEndInterview,
  ]);

  const handleSkipQuestion = useCallback(async () => {
    stopListening();
    stopVisualizer();
    setMicActive(false);
    resetTranscript();

    const currentQuestion = getStore().getCurrentQuestion();
    const { currentRound, companyMode } = getStore();
    if (currentQuestion && currentRound) {
      addEvaluation({
        questionId: currentQuestion.id,
        question: currentQuestion.text,
        answer: '(Skipped)',
        category: currentQuestion.category,
        round: currentRound,
        score: 0,
        feedback: 'Question was skipped.',
        strengths: [],
        improvements: ['Try to attempt all questions in a real interview.'],
      });
      addTranscriptEntry({ role: 'candidate', text: '(Skipped this question)', timestamp: Date.now() });
    }

    const { currentQuestionIndex: idx, currentRound: round, roundQuestions, selectedRounds } = getStore();
    const qs = round ? roundQuestions[round] : [];
    if (idx + 1 < qs.length) {
      nextQuestion();
      await askQuestion(idx + 1);
    } else {
      setStatus('round-complete');
      const currentRoundIdx = selectedRounds.indexOf(round!);
      let movedToNextRound = false;
      for (let i = currentRoundIdx + 1; i < selectedRounds.length; i++) {
        const nextRound = selectedRounds[i];
        if (roundQuestions[nextRound].length > 0) {
          store.initRound(nextRound, roundQuestions[nextRound]);
          await startRound(nextRound);
          movedToNextRound = true;
          break;
        }
      }
      if (!movedToNextRound) await doEndInterview();
    }
  }, [stopListening, stopVisualizer, setMicActive, resetTranscript, getStore, addEvaluation, addTranscriptEntry, nextQuestion, askQuestion, setStatus, store, startRound, doEndInterview]);

  const handleEndInterview = doEndInterview;

  // ─── Browser support check ───────────────────────────────────────────────────
  if (typeof window !== 'undefined' && !sttSupported) {
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <h2>Browser Not Supported</h2>
        <p>Speech Recognition requires Google Chrome or Microsoft Edge.</p>
        <Link href="/">← Back to Home</Link>
      </div>
    );
  }

  if (setupError) {
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <h2>Setup Error</h2>
        <p style={{ color: '#ef4444' }}>{setupError}</p>
        <Link href="/" style={{ color: '#2563eb' }}>← Go back to Home</Link>
      </div>
    );
  }

  // ─── Current round info ───────────────────────────────────────────────────────
  const currentRoundQuestions = currentRound ? roundQuestions[currentRound] : [];
  const totalRoundQuestions = currentRoundQuestions.length;
  const modeConfig = companyMode ? COMPANY_MODES[companyMode] : null;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '900px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0 }}>AI Interview</h1>
          {modeConfig && <span style={{ fontSize: '14px', color: '#6b7280' }}>{modeConfig.emoji} {modeConfig.label}</span>}
        </div>
        <div style={{ textAlign: 'right', fontSize: '14px', color: '#6b7280' }}>
          <div>⏱ {formatTime(elapsedTime)}</div>
          <div>Total answers: {evaluations.length}</div>
        </div>
      </div>

      {/* Round Progress */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {selectedRounds.map(round => (
          <span key={round} style={{
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '13px',
            background: round === currentRound ? '#2563eb' : '#e5e7eb',
            color: round === currentRound ? 'white' : '#6b7280',
          }}>
            {ROUND_LABELS[round]}
          </span>
        ))}
      </div>

      {/* Status + Question Counter */}
      <div style={{ padding: '10px', background: '#e5e7eb', borderRadius: '4px', marginBottom: '16px' }}>
        <strong>Status:</strong> {status} &nbsp;|&nbsp;
        {currentRound && <><strong>Round:</strong> {ROUND_LABELS[currentRound]} &nbsp;|&nbsp;</>}
        <strong>Question:</strong> {Math.min(currentQuestionIndex + 1, totalRoundQuestions)} / {totalRoundQuestions}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        {status === 'listening' && (
          <button
            onClick={submitAnswer}
            disabled={!speechTranscript.trim()}
            style={{ padding: '10px 18px', background: speechTranscript.trim() ? '#10b981' : '#9ca3af', color: 'white', border: 'none', borderRadius: '6px', cursor: speechTranscript.trim() ? 'pointer' : 'not-allowed' }}
          >
            ✅ Submit Answer
          </button>
        )}
        {status === 'listening' && (
          <button onClick={handleSkipQuestion} style={{ padding: '10px 18px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            ⏭ Skip
          </button>
        )}
        {status !== 'completed' && status !== 'idle' && (
          <button onClick={handleEndInterview} style={{ padding: '10px 18px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            🛑 End Interview
          </button>
        )}
      </div>

      {/* Mic status */}
      <div style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px', marginBottom: '16px' }}>
        <strong>Microphone:</strong> {isListening ? '🔴 Recording...' : '⚫ Off'}
        {speechTranscript && (
          <div style={{ marginTop: '8px' }}>
            <p style={{ fontStyle: 'italic', color: '#374151', margin: 0, fontSize: '14px',
              maxHeight: '80px', overflowY: 'auto', lineHeight: '1.5',
              padding: '6px', background: '#f9fafb', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
              "{speechTranscript.length > 300 ? '...' + speechTranscript.slice(-300) : speechTranscript}"
            </p>
            <small style={{ color: '#6b7280' }}>{speechTranscript.split(/\s+/).filter(Boolean).length} words captured</small>
          </div>
        )}
        <canvas ref={canvasRef} width={600} height={60} style={{ display: 'block', marginTop: '8px', width: '100%', background: '#f3f4f6', borderRadius: '4px' }} />
      </div>


      {/* Transcript */}
      <div style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '12px', height: '450px', overflowY: 'auto' }}>
        <h3 style={{ margin: '0 0 12px 0' }}>Transcript</h3>
        {transcript.length === 0 && <p style={{ color: '#9ca3af' }}>Loading interview setup...</p>}
        {transcript.map((entry, i) => (
          <div key={i} style={{
            marginBottom: '12px',
            padding: '10px',
            background: entry.role === 'interviewer' ? '#dbeafe' : '#d1fae5',
            borderRadius: '6px',
            borderLeft: `4px solid ${entry.role === 'interviewer' ? '#2563eb' : '#10b981'}`,
          }}>
            <strong>{entry.role === 'interviewer' ? '🤖 AI Interviewer' : '🎤 You'}:</strong>
            {entry.round && <span style={{ marginLeft: '8px', fontSize: '11px', color: '#6b7280', background: '#e5e7eb', padding: '1px 6px', borderRadius: '8px' }}>{ROUND_LABELS[entry.round]}</span>}
            <p style={{ margin: '6px 0 2px' }}>{entry.text}</p>
            <small style={{ color: '#6b7280' }}>{new Date(entry.timestamp).toLocaleTimeString()}</small>
          </div>
        ))}
        {isProcessing && <p style={{ color: '#2563eb' }}>⏳ Processing...</p>}
        <div ref={transcriptEndRef} />
      </div>
    </div>
  );
}
