'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useInterviewStore } from '@/store/interviewStore';
import { COMPANY_MODES, ROUND_LABELS, ROUND_DESCRIPTIONS } from '@/lib/companyModes';
import { CompanyMode, InterviewRound, ResumeData, Question } from '@/lib/types';
import LoadingOverlay from './LoadingOverlay';
import styles from './SetupModal.module.css';

type SetupStep = 'upload' | 'company' | 'rounds' | 'preview';

interface SetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SetupModal({ isOpen, onClose }: SetupModalProps) {
  const router = useRouter();
  const { setCompanyMode, setResumeData, setSelectedRounds } = useInterviewStore();

  const [step, setStep] = useState<SetupStep>('upload');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeData, setResumeDataLocal] = useState<ResumeData | null>(null);
  const [selectedMode, setSelectedMode] = useState<CompanyMode>('tcs-ninja');
  const [selectedRounds, setSelectedRoundsLocal] = useState<InterviewRound[]>(['technical', 'project', 'hr']);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

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

  const handleStartInterview = async () => {
    if (!resumeData || selectedRounds.length === 0) return;

    setIsLoading(true);
    setError('');

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

    setCompanyMode(selectedMode);
    setResumeData(resumeData);
    setSelectedRounds(selectedRounds);

    sessionStorage.setItem('interviewSetup', JSON.stringify({
      resumeData,
      companyMode: selectedMode,
      selectedRounds,
      allQuestions,
    }));

    setLoadingMessage('Starting interview...');
    // We intentionally DO NOT call setIsLoading(false) here. 
    // This keeps the button spinning while Next.js (Turbopack) compiles and fetches the /interview route chunk, preventing the user from thinking the app is "stuck".
    router.push('/interview');
  };

  const toggleRound = (round: InterviewRound) => {
    setSelectedRoundsLocal(prev =>
      prev.includes(round) ? prev.filter(r => r !== round) : [...prev, round]
    );
  };

  const handleClose = () => {
    if (isLoading) return;
    onClose();
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ position: 'relative' }}>
        {isLoading && <LoadingOverlay message={loadingMessage} />}
        <div className={styles.header}>
          <h2 className={styles.title}>Interview Setup</h2>
          <button className={styles.closeBtn} onClick={handleClose} disabled={isLoading}>✕</button>
        </div>

        {/* Progress Steps */}
        <div className={styles.progressContainer}>
          {(['upload', 'company', 'rounds', 'preview'] as SetupStep[]).map((s, i) => (
            <span key={s} className={`${styles.progressStep} ${step === s ? styles.activeStep : ''}`}>
              {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
            </span>
          ))}
        </div>

        {error && <div className={styles.errorBanner}>{error}</div>}

        <div className={styles.contentBody}>
          {/* ── STEP 1: Upload Resume ── */}
          {step === 'upload' && (
            <div className={styles.stepContent}>
              <h3 className={styles.stepTitle}>Upload Your Resume</h3>
              <p className={styles.stepDesc}>Upload a PDF resume. The AI will extract your skills and projects to personalize the interview.</p>

              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className={`${styles.dropzone} ${resumeFile ? styles.dropzoneActive : ''}`}
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
                    <p className={styles.icon}>✅</p>
                    <p className={styles.primaryText}>{resumeFile.name}</p>
                    <p className={styles.secondaryText}>{(resumeFile.size / 1024).toFixed(1)} KB — Click to change</p>
                  </>
                ) : (
                  <>
                    <p className={styles.icon}>📄</p>
                    <p className={styles.primaryText}>Drop your PDF resume here</p>
                    <p className={styles.secondaryText}>or click to browse — PDF only, max 5MB</p>
                  </>
                )}
              </div>

              <div className={styles.actions}>
                <button
                  onClick={handleParseResume}
                  disabled={!resumeFile || isLoading}
                  className={styles.primaryBtn}
                >
                  {isLoading ? loadingMessage : 'Analyze Resume →'}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Pick Company Mode ── */}
          {step === 'company' && (
            <div className={styles.stepContent}>
              <h3 className={styles.stepTitle}>Select Interview Mode</h3>
              <p className={styles.stepDesc}>Choose the company whose interview style you want to practice.</p>

              <div className={styles.grid}>
                {Object.values(COMPANY_MODES).map((mode) => (
                  <div
                    key={mode.id}
                    onClick={() => setSelectedMode(mode.id)}
                    className={`${styles.card} ${selectedMode === mode.id ? styles.activeCard : ''}`}
                  >
                    <div className={styles.cardHeader}>{mode.emoji} {mode.label}</div>
                    <div className={styles.cardDesc}>
                      <span className={`${styles.badge} ${styles['badge-' + mode.difficulty]}`}>{mode.difficulty}</span>
                      {' '}{mode.description}
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.actions}>
                <button onClick={() => setStep('upload')} className={styles.secondaryBtn}>← Back</button>
                <button onClick={() => setStep('rounds')} className={styles.primaryBtn}>Next →</button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Select Rounds ── */}
          {step === 'rounds' && (
            <div className={styles.stepContent}>
              <h3 className={styles.stepTitle}>Choose Interview Rounds</h3>
              <p className={styles.stepDesc}>Select which rounds to include. You can run all 3 or just the ones you need.</p>

              <div className={styles.list}>
                {(['technical', 'project', 'hr'] as InterviewRound[]).map((round) => (
                  <div
                    key={round}
                    onClick={() => toggleRound(round)}
                    className={`${styles.listItem} ${selectedRounds.includes(round) ? styles.activeListItem : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedRounds.includes(round)}
                      readOnly
                      className={styles.checkbox}
                    />
                    <div>
                      <div className={styles.itemTitle}>{ROUND_LABELS[round]}</div>
                      <div className={styles.itemDesc}>{ROUND_DESCRIPTIONS[round]}</div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedRounds.length === 0 && (
                <p className={styles.errorText}>Please select at least one round.</p>
              )}

              <div className={styles.actions}>
                <button onClick={() => setStep('company')} className={styles.secondaryBtn}>← Back</button>
                <button
                  onClick={() => setStep('preview')}
                  disabled={selectedRounds.length === 0}
                  className={styles.primaryBtn}
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 4: Preview & Start ── */}
          {step === 'preview' && resumeData && (
            <div className={styles.stepContent}>
              <h3 className={styles.stepTitle}>Confirm & Start Interview</h3>

              <div className={styles.summaryBox}>
                <h4 className={styles.summaryTitle}>Resume Summary</h4>
                <p><strong>Skills ({resumeData.skills.length}):</strong> {resumeData.skills.join(', ')}</p>
                <p><strong>Projects ({resumeData.projects.length}):</strong> {resumeData.projects.map(p => p.name).join(', ')}</p>
              </div>

              <div className={styles.summaryBox}>
                <h4 className={styles.summaryTitle}>Interview Configuration</h4>
                <p><strong>Mode:</strong> {COMPANY_MODES[selectedMode].emoji} {COMPANY_MODES[selectedMode].label} ({COMPANY_MODES[selectedMode].difficulty})</p>
                <p><strong>Rounds:</strong> {selectedRounds.map(r => ROUND_LABELS[r]).join(' → ')}</p>
              </div>

              <div className={styles.actions}>
                <button onClick={() => setStep('rounds')} className={styles.secondaryBtn}>← Back</button>
                <button
                  onClick={handleStartInterview}
                  disabled={isLoading}
                  className={styles.startBtn}
                >
                  {isLoading ? `⏳ ${loadingMessage}` : '🎤 Start Interview'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
