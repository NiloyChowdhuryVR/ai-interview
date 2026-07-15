import React, { useState, useRef, useEffect } from 'react';
import { ResumeDataState } from './ResumePDF';

interface AiResumeGeneratorWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (generatedResume: ResumeDataState) => void;
}

export default function AiResumeGeneratorWizard({ isOpen, onClose, onComplete }: AiResumeGeneratorWizardProps) {
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: "Hi! I'm your AI Resume Architect. I'm going to ask you a few quick questions to build you an unbeatable, 90+ ATS-scoring resume. What is your target job title or role?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const newMessages = [...messages, { role: 'user' as const, content: input }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/resume-wizard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });

      const data = await res.json();
      
      if (data.error) throw new Error(data.error);

      if (data.type === 'question') {
        setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
      } else if (data.type === 'complete' && data.resumeData) {
        setMessages(prev => [...prev, { role: 'assistant', content: "Perfect! I have enough information. I've generated your complete, optimized resume!" }]);
        // Add a slight delay before applying it so the user sees the message
        setTimeout(() => {
          onComplete(data.resumeData);
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message || 'Something went wrong.'}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <div style={{
        background: '#0a0a0f', border: '1px solid #2a2a35', borderRadius: '16px',
        width: '90%', maxWidth: '700px', height: '80vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(255,85,0,0.1)'
      }}>
        {/* Header */}
        <div style={{ 
          padding: '20px', borderBottom: '1px solid #1a1a24', display: 'flex', 
          justifyContent: 'space-between', alignItems: 'center',
          background: 'linear-gradient(90deg, rgba(255,85,0,0.1), transparent)'
        }}>
          <div>
            <h2 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.5rem' }}>🪄</span> Full Resume Generator
            </h2>
            <p style={{ margin: '5px 0 0 0', color: '#888', fontSize: '0.85rem' }}>Chat with AI to instantly build a 90+ ATS-scoring resume.</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {messages.map((m, i) => (
            <div key={i} style={{ 
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              background: m.role === 'user' ? 'linear-gradient(90deg, #ff5500, #ff8800)' : '#111116',
              color: '#fff',
              padding: '12px 18px',
              borderRadius: '12px',
              borderBottomRightRadius: m.role === 'user' ? '2px' : '12px',
              borderBottomLeftRadius: m.role === 'assistant' ? '2px' : '12px',
              maxWidth: '80%',
              border: m.role === 'assistant' ? '1px solid #333' : 'none',
              boxShadow: m.role === 'user' ? '0 4px 15px rgba(255,85,0,0.3)' : 'none',
              lineHeight: 1.5,
              fontSize: '0.95rem'
            }}>
              {m.content}
            </div>
          ))}
          {isLoading && (
            <div style={{ 
              alignSelf: 'flex-start', background: '#111116', border: '1px solid #333',
              padding: '12px 18px', borderRadius: '12px', borderBottomLeftRadius: '2px',
              display: 'flex', gap: '8px', alignItems: 'center'
            }}>
              <div style={{ width: '8px', height: '8px', background: '#ff5500', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both' }} />
              <div style={{ width: '8px', height: '8px', background: '#ff5500', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.16s' }} />
              <div style={{ width: '8px', height: '8px', background: '#ff5500', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.32s' }} />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: '20px', borderTop: '1px solid #1a1a24', background: '#0d0d12', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your answer here..."
              disabled={isLoading}
              style={{ 
                flex: 1, padding: '15px', background: '#1a1a24', border: '1px solid #333', 
                borderRadius: '8px', color: '#fff', outline: 'none', fontSize: '0.95rem'
              }}
            />
            <button 
              type="submit"
              disabled={isLoading || !input.trim()}
              style={{
                padding: '0 25px', background: 'linear-gradient(90deg, #ff5500, #ff8800)',
                color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold',
                cursor: (isLoading || !input.trim()) ? 'not-allowed' : 'pointer', 
                opacity: (isLoading || !input.trim()) ? 0.5 : 1,
              }}
            >
              Send
            </button>
          </form>
        </div>
      </div>
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
