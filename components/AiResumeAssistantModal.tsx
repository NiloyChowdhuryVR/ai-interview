import React, { useState, useEffect } from 'react';

interface AiResumeAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (suggestion: string) => void;
  fieldName: string; 
  currentText: string;
  resumeData: any; // Context
}

export default function AiResumeAssistantModal({
  isOpen,
  onClose,
  onApply,
  fieldName,
  currentText,
  resumeData
}: AiResumeAssistantModalProps) {
  const [targetRole, setTargetRole] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-fill from resume data if possible
  useEffect(() => {
    if (isOpen) {
      setSuggestion('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!targetRole) {
      setError('Please provide a Target Role (e.g. Frontend Engineer).');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/resume-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole,
          targetCompany,
          field: fieldName,
          currentText,
          resumeData
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setSuggestion(data.suggestion);
    } catch (err: any) {
      setError(err.message || 'Failed to generate suggestion.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(5px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <div style={{
        background: '#0a0a0f', border: '1px solid #2a2a35', borderRadius: '12px',
        width: '90%', maxWidth: '600px', padding: '24px', color: '#fff',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.5rem' }}>✨</span> AI Resume Assistant 
            <span style={{ fontSize: '0.9rem', color: '#888', fontWeight: 'normal' }}>({fieldName.toUpperCase()})</span>
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
        </div>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '5px' }}>Target Role (Required)</label>
            <input 
              type="text" 
              placeholder="e.g. Software Engineer"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              style={{ width: '100%', padding: '10px', background: '#111116', border: '1px solid #333', borderRadius: '6px', color: '#fff' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '5px' }}>Target Company (Optional)</label>
            <input 
              type="text" 
              placeholder="e.g. Google, Amazon..."
              value={targetCompany}
              onChange={(e) => setTargetCompany(e.target.value)}
              style={{ width: '100%', padding: '10px', background: '#111116', border: '1px solid #333', borderRadius: '6px', color: '#fff' }}
            />
          </div>
        </div>

        {error && <div style={{ color: '#ff4444', fontSize: '0.9rem', marginBottom: '15px' }}>{error}</div>}

        <button 
          onClick={handleGenerate}
          disabled={isLoading}
          style={{
            width: '100%', padding: '12px', background: 'linear-gradient(90deg, #ff5500, #ff8800)',
            color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold',
            cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1,
            marginBottom: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
          }}
        >
          {isLoading ? (
            <>
              <div style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              Analyzing & Generating...
            </>
          ) : 'Generate AI Suggestion'}
        </button>

        {suggestion && (
          <div style={{ background: '#111116', border: '1px solid #333', borderRadius: '8px', padding: '15px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#ff8800', marginBottom: '10px', fontWeight: 'bold' }}>AI SUGGESTION:</label>
            <textarea
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              style={{
                width: '100%', height: '120px', background: 'transparent', border: 'none', color: '#fff',
                fontSize: '0.95rem', lineHeight: '1.5', resize: 'vertical', outline: 'none'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px' }}>
              <button 
                onClick={onClose}
                style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #444', color: '#fff', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={() => { onApply(suggestion); onClose(); }}
                style={{ padding: '8px 16px', background: '#fff', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Apply to Resume
              </button>
            </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
