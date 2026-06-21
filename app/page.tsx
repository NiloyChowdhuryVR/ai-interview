'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useInterviewStore } from '@/store/interviewStore';
import { COMPANY_MODES, ROUND_LABELS, ROUND_DESCRIPTIONS } from '@/lib/companyModes';
import { CompanyMode, InterviewRound, ResumeData, Question } from '@/lib/types';

type SetupStep = 'upload' | 'company' | 'rounds' | 'preview';

export default function Home() {
  const router = useRouter();
  const { setCompanyMode, setResumeData, setSelectedRounds, reset: resetStore } = useInterviewStore();

  // Reset store and storage on mount to clear old interviews
  useEffect(() => {
    resetStore();
    sessionStorage.removeItem('interviewSetup');
    sessionStorage.removeItem('interviewFeedback');
  }, [resetStore]);

  const [step, setStep] = useState<SetupStep>('upload');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeData, setResumeDataLocal] = useState<ResumeData | null>(null);
  const [selectedMode, setSelectedMode] = useState<CompanyMode>('tcs-ninja');
  const [selectedRounds, setSelectedRoundsLocal] = useState<InterviewRound[]>(['technical', 'project', 'hr']);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Step 1: Upload Resume ──────────────────────────────────────────────────

  const handleFileSelect = useCallback((file: File) => {
    if (!file.name.endsWith('.pdf')) {
      setError('Please upload a PDF file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be under 5MB.');
      return;
    }
    setError('');
    setResumeFile(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleParseResume = async () => {
    if (!resumeFile) return;
    setIsLoading(true);
    setLoadingMessage('Reading your resume...');
    setError('');

    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);

      const res = await fetch('/api/parse-resume', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to parse resume');
      }
      const data: ResumeData = await res.json();
      setResumeDataLocal(data);
      setStep('company');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to parse resume. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Step 4: Generate Questions & Start ───────────────────────────────────

  const handleStartInterview = async () => {
    if (!resumeData || selectedRounds.length === 0) return;

    setIsLoading(true);
    setError('');

    // Generate questions for each selected round
    const allQuestions: Record<InterviewRound, Question[]> = {
      technical: [],
      project: [],
      hr: [],
    };

    for (const round of selectedRounds) {
      setLoadingMessage(`Generating ${ROUND_LABELS[round]} questions...`);
      try {
        const res = await fetch('/api/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resumeData, companyMode: selectedMode, round }),
        });
        if (!res.ok) throw new Error(`Failed to generate ${round} questions`);
        const data = await res.json();
        allQuestions[round] = data.questions || [];
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to generate questions');
        setIsLoading(false);
        return;
      }
    }

    // Save everything to store and sessionStorage
    setCompanyMode(selectedMode);
    setResumeData(resumeData);
    setSelectedRounds(selectedRounds);

    sessionStorage.setItem('interviewSetup', JSON.stringify({
      resumeData,
      companyMode: selectedMode,
      selectedRounds,
      allQuestions,
    }));

    setIsLoading(false);
    router.push('/interview');
  };

  const toggleRound = (round: InterviewRound) => {
    setSelectedRoundsLocal(prev =>
      prev.includes(round) ? prev.filter(r => r !== round) : [...prev, round]
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>AI Interviewer</h1>
      <p style={{ color: '#6b7280', marginBottom: '30px' }}>
        Upload your resume, pick a company mode, and get interviewed by AI.
      </p>

      {/* Progress Steps */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', fontSize: '14px' }}>
        {(['upload', 'company', 'rounds', 'preview'] as SetupStep[]).map((s, i) => (
          <span key={s} style={{
            padding: '4px 12px',
            borderRadius: '20px',
            background: step === s ? '#2563eb' : '#e5e7eb',
            color: step === s ? 'white' : '#6b7280',
          }}>
            {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
          </span>
        ))}
      </div>

      {error && (
        <div style={{ padding: '10px', background: '#fee2e2', border: '1px solid #ef4444', borderRadius: '4px', marginBottom: '20px', color: '#dc2626' }}>
          {error}
        </div>
      )}

      {/* ── STEP 1: Upload Resume ── */}
      {step === 'upload' && (
        <div>
          <h2>Step 1: Upload Your Resume</h2>
          <p style={{ color: '#6b7280' }}>Upload a PDF resume. The AI will extract your skills and projects to personalize the interview.</p>

          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed #d1d5db',
              borderRadius: '8px',
              padding: '40px',
              textAlign: 'center',
              cursor: 'pointer',
              marginTop: '20px',
              background: resumeFile ? '#f0fdf4' : '#fafafa',
              borderColor: resumeFile ? '#10b981' : '#d1d5db',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              style={{ display: 'none' }}
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            />
            {resumeFile ? (
              <>
                <p style={{ fontSize: '24px' }}>✅</p>
                <p style={{ fontWeight: 'bold' }}>{resumeFile.name}</p>
                <p style={{ color: '#6b7280', fontSize: '14px' }}>{(resumeFile.size / 1024).toFixed(1)} KB — Click to change</p>
              </>
            ) : (
              <>
                <p style={{ fontSize: '40px' }}>📄</p>
                <p style={{ fontWeight: 'bold' }}>Drop your PDF resume here</p>
                <p style={{ color: '#6b7280', fontSize: '14px' }}>or click to browse — PDF only, max 5MB</p>
              </>
            )}
          </div>

          <button
            onClick={handleParseResume}
            disabled={!resumeFile || isLoading}
            style={{
              marginTop: '20px',
              padding: '12px 24px',
              background: resumeFile && !isLoading ? '#2563eb' : '#9ca3af',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              cursor: resumeFile && !isLoading ? 'pointer' : 'not-allowed',
            }}
          >
            {isLoading ? loadingMessage : 'Analyze Resume →'}
          </button>
        </div>
      )}

      {/* ── STEP 2: Pick Company Mode ── */}
      {step === 'company' && (
        <div>
          <h2>Step 2: Select Interview Mode</h2>
          <p style={{ color: '#6b7280' }}>Choose the company whose interview style you want to practice.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginTop: '20px' }}>
            {Object.values(COMPANY_MODES).map((mode) => (
              <div
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                style={{
                  padding: '16px',
                  border: `2px solid ${selectedMode === mode.id ? '#2563eb' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: selectedMode === mode.id ? '#eff6ff' : 'white',
                }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{mode.emoji} {mode.label}</div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: '10px',
                    background: mode.difficulty === 'expert' ? '#fee2e2' : mode.difficulty === 'advanced' ? '#fef3c7' : mode.difficulty === 'intermediate' ? '#dbeafe' : '#d1fae5',
                    fontSize: '11px',
                  }}>{mode.difficulty}</span>
                  {' '}{mode.description}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button onClick={() => setStep('upload')} style={{ padding: '12px 24px', background: '#e5e7eb', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>← Back</button>
            <button onClick={() => setStep('rounds')} style={{ padding: '12px 24px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Next →</button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Select Rounds ── */}
      {step === 'rounds' && (
        <div>
          <h2>Step 3: Choose Interview Rounds</h2>
          <p style={{ color: '#6b7280' }}>Select which rounds to include. You can run all 3 or just the ones you need.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
            {(['technical', 'project', 'hr'] as InterviewRound[]).map((round) => (
              <div
                key={round}
                onClick={() => toggleRound(round)}
                style={{
                  padding: '16px',
                  border: `2px solid ${selectedRounds.includes(round) ? '#2563eb' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: selectedRounds.includes(round) ? '#eff6ff' : 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedRounds.includes(round)}
                  readOnly
                  style={{ width: '18px', height: '18px' }}
                />
                <div>
                  <div style={{ fontWeight: 'bold' }}>{ROUND_LABELS[round]}</div>
                  <div style={{ color: '#6b7280', fontSize: '14px' }}>{ROUND_DESCRIPTIONS[round]}</div>
                </div>
              </div>
            ))}
          </div>

          {selectedRounds.length === 0 && (
            <p style={{ color: '#ef4444', marginTop: '10px' }}>Please select at least one round.</p>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button onClick={() => setStep('company')} style={{ padding: '12px 24px', background: '#e5e7eb', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>← Back</button>
            <button
              onClick={() => setStep('preview')}
              disabled={selectedRounds.length === 0}
              style={{ padding: '12px 24px', background: selectedRounds.length > 0 ? '#2563eb' : '#9ca3af', color: 'white', border: 'none', borderRadius: '6px', cursor: selectedRounds.length > 0 ? 'pointer' : 'not-allowed' }}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4: Preview & Start ── */}
      {step === 'preview' && resumeData && (
        <div>
          <h2>Step 4: Confirm & Start Interview</h2>

          <div style={{ padding: '20px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 12px 0' }}>Resume Summary</h3>
            <p><strong>Skills detected ({resumeData.skills.length}):</strong> {resumeData.skills.join(', ')}</p>
            <p><strong>Projects found ({resumeData.projects.length}):</strong> {resumeData.projects.map(p => p.name).join(', ')}</p>
            {resumeData.experience.length > 0 && <p><strong>Experience:</strong> {resumeData.experience.join(' | ')}</p>}
            {resumeData.education.length > 0 && <p><strong>Education:</strong> {resumeData.education.join(' | ')}</p>}
          </div>

          <div style={{ padding: '20px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 12px 0' }}>Interview Configuration</h3>
            <p><strong>Company Mode:</strong> {COMPANY_MODES[selectedMode].emoji} {COMPANY_MODES[selectedMode].label} ({COMPANY_MODES[selectedMode].difficulty})</p>
            <p><strong>Rounds:</strong> {selectedRounds.map(r => ROUND_LABELS[r]).join(' → ')}</p>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>Questions will be generated dynamically based on your resume and company style. Expect a full-length realistic interview.</p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setStep('rounds')} style={{ padding: '12px 24px', background: '#e5e7eb', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>← Back</button>
            <button
              onClick={handleStartInterview}
              disabled={isLoading}
              style={{ padding: '12px 24px', background: isLoading ? '#9ca3af' : '#16a34a', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', cursor: isLoading ? 'not-allowed' : 'pointer' }}
            >
              {isLoading ? `⏳ ${loadingMessage}` : '🎤 Generate Questions & Start Interview'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
