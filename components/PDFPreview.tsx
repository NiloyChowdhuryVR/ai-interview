'use client';

import React from 'react';
import { usePDF } from '@react-pdf/renderer';
import { ResumePDF, ResumeDataState } from './ResumePDF';

export default function PDFPreview({ data }: { data: ResumeDataState }) {
  // Store the explicitly "committed" data to render
  const [activeData, setActiveData] = React.useState<ResumeDataState | null>(null);
  
  // Initialize the PDF engine with no document so it costs 0 CPU on mount
  const [instance, updateInstance] = usePDF();

  const handleGenerate = () => {
    setActiveData(data);
    updateInstance(<ResumePDF data={data} />);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#1a1a24' }}>
      
      {/* Floating Action Bar */}
      <div style={{ position: 'absolute', bottom: '20px', right: '20px', zIndex: 10, display: 'flex', gap: '15px' }}>
        <button 
          onClick={handleGenerate}
          style={{ 
            background: '#ff5500', color: '#000', padding: '10px 20px', borderRadius: '50px', 
            border: 'none', fontWeight: 'bold', fontSize: '0.85rem', textTransform: 'uppercase', 
            boxShadow: '0 4px 15px rgba(255,85,0,0.3)', letterSpacing: '1px', cursor: 'pointer',
            opacity: instance.loading ? 0.5 : 1
          }}
          disabled={instance.loading}
        >
          {instance.loading ? 'GENERATING...' : (activeData ? 'UPDATE PDF' : 'GENERATE PDF')}
        </button>

        {instance.url && (
          <a 
            href={instance.url} 
            download="Resume.pdf"
            style={{ 
              background: '#333', color: '#fff', padding: '10px 20px', borderRadius: '50px', 
              textDecoration: 'none', fontWeight: 'bold', fontSize: '0.85rem', textTransform: 'uppercase', 
              border: '1px solid #444', cursor: 'pointer'
            }}
          >
            DOWNLOAD
          </a>
        )}
      </div>

      {/* Main View Area */}
      {activeData && instance.url ? (
        <iframe 
          src={`${instance.url}#toolbar=0&navpanes=0&scrollbar=0`} 
          style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#fff' }} 
          title="Resume PDF Preview"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666', gap: '15px' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          <div style={{ fontSize: '0.9rem', letterSpacing: '1px', textTransform: 'uppercase' }}>
            {instance.loading ? 'Building your Resume...' : 'Ready to generate PDF'}
          </div>
        </div>
      )}

    </div>
  );
}
