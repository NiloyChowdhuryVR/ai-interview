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
import AIVisualizer from '@/components/AIVisualizer';
import UserVisualizer from '@/components/UserVisualizer';

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
  const { speak, cancel: cancelSpeech, isSpeaking } = useSpeechSynthesis();
  const { canvasRef, startVisualizer, stopVisualizer } = useAudioVisualizer();

  const [elapsedTime, setElapsedTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [setupError, setSetupError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const isInitializedRef = useRef(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ─── Hydration & Timer ────────────────────────────────────────────────────────
  useEffect(() => {
    setMounted(true);
  }, []);

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
      const evaluation: AnswerEvaluation = {
        questionId: currentQuestion.id,
        question: currentQuestion.text,
        answer,
        category: currentQuestion.category,
        round: currentRound,
        score: 0,
        feedback: 'Pending evaluation...',
        strengths: [],
        improvements: [],
      };
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
      console.error('Failed to submit answer:', e);
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
  if (!mounted) return null; // Fix SSR hydration mismatch

  if (!sttSupported) {
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif', height: '100vh', background: '#050505', color: '#fff' }}>
        <h2>Browser Not Supported</h2>
        <p>Speech Recognition requires Google Chrome or Microsoft Edge.</p>
        <Link href="/" style={{ color: '#ff5500' }}>← Back to Home</Link>
      </div>
    );
  }

  if (setupError) {
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif', height: '100vh', background: '#050505', color: '#fff' }}>
        <h2>Setup Error</h2>
        <p style={{ color: '#ef4444' }}>{setupError}</p>
        <Link href="/" style={{ color: '#ff5500' }}>← Go back to Home</Link>
      </div>
    );
  }

  // ─── Current round info ───────────────────────────────────────────────────────
  const currentRoundQuestions = currentRound ? roundQuestions[currentRound] : [];
  const totalRoundQuestions = currentRoundQuestions.length;
  const modeConfig = companyMode ? COMPANY_MODES[companyMode] : null;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: '#050505', color: '#fff', overflow: 'hidden', fontFamily: 'var(--font-inter), sans-serif' }}>
      
      {/* Visualizers */}
      <AIVisualizer isTalking={isSpeaking} isDimmed={isListening} />
      <UserVisualizer isActive={isListening} />

      {/* Header Info */}
      <div style={{ position: 'absolute', top: '30px', left: '40px', zIndex: 10 }}>
        <h1 style={{ margin: '0 0 8px 0', fontFamily: 'var(--font-outfit), sans-serif', fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {modeConfig?.emoji} {modeConfig?.label || 'AI Interview'}
        </h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', color: '#a1a1aa', fontSize: '0.95rem' }}>
          <span>⏱ {formatTime(elapsedTime)}</span>
          <span>•</span>
          <span style={{ color: status === 'listening' ? '#10b981' : '#ff5500' }}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
          {currentRound && (
            <>
              <span>•</span>
              <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.85rem' }}>
                {ROUND_LABELS[currentRound]}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Top Right Toggle Button */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        style={{
          position: 'absolute', top: '30px', right: '40px', zIndex: 30,
          background: isSidebarOpen ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#fff', padding: '10px 20px', borderRadius: '100px',
          cursor: 'pointer', fontFamily: 'var(--font-inter), sans-serif', fontWeight: 600,
          transition: 'all 0.3s ease'
        }}
      >
        {isSidebarOpen ? 'Close Transcript' : '💬 View Transcript'}
      </button>

      {/* Floating Bottom Controls (Meet/Discord Style) */}
      <div style={{
        position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: '16px', background: 'rgba(20, 20, 22, 0.8)',
        backdropFilter: 'blur(20px)', padding: '12px 24px', borderRadius: '100px',
        border: '1px solid rgba(255, 255, 255, 0.05)', zIndex: 20, boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        alignItems: 'center', justifyContent: 'center'
      }}>
        {status === 'listening' && (
          <button
            onClick={!isListening ? startListening : submitAnswer}
            disabled={isListening && !speechTranscript.trim()}
            style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '12px 24px', 
              background: !isListening ? 'rgba(239, 68, 68, 0.2)' : speechTranscript.trim() ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)', 
              color: !isListening ? '#ef4444' : speechTranscript.trim() ? '#10b981' : '#6b7280', 
              border: !isListening ? '1px solid rgba(239, 68, 68, 0.5)' : speechTranscript.trim() ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid transparent', 
              borderRadius: '100px', 
              cursor: (!isListening || speechTranscript.trim()) ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-inter)', fontWeight: 600, transition: 'all 0.2s', whiteSpace: 'nowrap'
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>{!isListening ? '⚠️' : '🎤'}</span> 
            {!isListening ? 'Mic Error - Click to Retry' : speechTranscript.trim() ? 'Submit Answer' : 'Listening...'}
          </button>
        )}
        
        {status === 'listening' && (
          <button 
            onClick={handleSkipQuestion} 
            style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '12px 24px', background: 'rgba(255, 255, 255, 0.05)', color: '#fff', 
              border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '100px', cursor: 'pointer',
              fontFamily: 'var(--font-inter)', fontWeight: 600, transition: 'all 0.2s', whiteSpace: 'nowrap'
            }}
          >
            ⏭ Skip
          </button>
        )}

        {status !== 'completed' && status !== 'idle' && (
          <button 
            onClick={handleEndInterview} 
            style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '12px 24px', background: '#ef4444', color: '#fff', 
              border: 'none', borderRadius: '100px', cursor: 'pointer',
              fontFamily: 'var(--font-inter)', fontWeight: 600, transition: 'all 0.2s',
              boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)', whiteSpace: 'nowrap'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.98.98 0 0 1 0-1.4C3.36 8.58 7.42 7 12 7s8.64 1.58 11.71 4.68c.39.39.39 1.03 0 1.42l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
            </svg>
            End Call
          </button>
        )}
      </div>

      {/* Collapsible Transcript Sidebar */}
      <div style={{
        position: 'fixed', top: 0, right: isSidebarOpen ? 0 : '-400px', width: '400px', height: '100vh',
        background: 'rgba(15, 15, 18, 0.95)', backdropFilter: 'blur(30px)',
        borderLeft: '1px solid rgba(255, 255, 255, 0.05)', zIndex: 25,
        transition: 'right 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ padding: '30px 24px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-outfit)', fontSize: '1.4rem' }}>Transcript</h2>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {transcript.length === 0 && <p style={{ color: '#6b7280', textAlign: 'center', marginTop: '20px' }}>No messages yet.</p>}
          
          {transcript.map((entry, i) => {
            const isAI = entry.role === 'interviewer';
            return (
              <div key={i} style={{
                display: 'flex', flexDirection: 'column',
                alignItems: isAI ? 'flex-start' : 'flex-end',
                width: '100%'
              }}>
                <span style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px', marginLeft: isAI ? '4px' : '0', marginRight: isAI ? '0' : '4px' }}>
                  {isAI ? '🤖 AI Interviewer' : 'You'} • {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div style={{
                  background: isAI ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 85, 0, 0.15)',
                  border: isAI ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(255, 85, 0, 0.3)',
                  padding: '12px 16px', borderRadius: '16px',
                  borderBottomLeftRadius: isAI ? '4px' : '16px',
                  borderBottomRightRadius: !isAI ? '4px' : '16px',
                  maxWidth: '90%', fontSize: '0.95rem', lineHeight: 1.5,
                  color: isAI ? '#e5e7eb' : '#fff'
                }}>
                  {entry.text}
                </div>
              </div>
            );
          })}
          
          {isProcessing && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.05)',
                padding: '12px 16px', borderRadius: '16px', borderBottomLeftRadius: '4px',
                color: '#a1a1aa', fontSize: '0.95rem'
              }}>
                <span style={{ display: 'inline-block', animation: 'pulse 1.5s infinite' }}>Analyzing response...</span>
              </div>
            </div>
          )}
          <div ref={transcriptEndRef} />
        </div>
      </div>
      
      {/* Subtitles Overlay (When Sidebar is Closed) */}
      {!isSidebarOpen && transcript.length > 0 && (
        <div style={{
          position: 'absolute', bottom: '130px', left: '50%', transform: 'translateX(-50%)',
          width: '90%', maxWidth: '1200px', textAlign: 'center', zIndex: 15, pointerEvents: 'none'
        }}>
          <p style={{
            fontSize: '1.35rem', fontFamily: 'var(--font-outfit), sans-serif', color: '#fff',
            textShadow: '0 2px 10px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.7)',
            lineHeight: 1.6, letterSpacing: '0.5px', margin: 0, opacity: 0.95
          }}>
            {transcript[transcript.length - 1].text}
          </p>
        </div>
      )}

      {/* Global styles for pulse animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }
      `}} />

    </div>
  );
}
