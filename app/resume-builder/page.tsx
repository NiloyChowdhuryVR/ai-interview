'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ResumeDataState } from '@/components/ResumePDF';

// Dynamically import our custom PDFPreview component to disable SSR entirely for React-PDF
const PDFPreview = dynamic(
  () => import('@/components/PDFPreview'),
  { ssr: false, loading: () => <div style={{ color: '#ff5500', padding: '20px' }}>Loading PDF Engine...</div> }
);

export default function ResumeBuilderPage() {
  const [data, setData] = useState<ResumeDataState>({
    personalInfo: { name: '', email: '', phone: '', linkedin: '', github: '' },
    summary: '',
    experience: [{ title: '', company: '', date: '', description: '' }],
    education: [{ degree: '', school: '', date: '' }],
    projects: [{ name: '', date: '', description: '', tech: '' }],
    skills: '',
    certifications: [{ name: '', link: '' }],
  });

  const [jobDescription, setJobDescription] = useState('');
  const [atsResult, setAtsResult] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'ats'>('editor');
  const [uploadedResume, setUploadedResume] = useState<File | null>(null);

  const checkAtsScore = async () => {
    if (!jobDescription) return alert('Please enter a Job Description');
    setIsChecking(true);
    try {
      let res;
      if (uploadedResume) {
        const formData = new FormData();
        formData.append('jobDescription', jobDescription);
        formData.append('file', uploadedResume);
        res = await fetch('/api/ats-check', {
          method: 'POST',
          body: formData,
        });
      } else {
        res = await fetch('/api/ats-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobDescription, resumeData: data }),
        });
      }
      
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      setAtsResult(result);
    } catch (err: any) {
      alert(err.message || 'Failed to check ATS score');
    } finally {
      setIsChecking(false);
    }
  };

  const handlePersonalChange = (field: string, value: string) => {
    setData(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, [field]: value } }));
  };

  const handleArrayChange = (type: 'experience' | 'education' | 'projects' | 'certifications', index: number, field: string, value: string) => {
    setData(prev => {
      const arr = [...(prev[type] || [])] as any[];
      arr[index] = { ...arr[index], [field]: value };
      return { ...prev, [type]: arr };
    });
  };

  const addArrayItem = (type: 'experience' | 'education' | 'projects' | 'certifications', emptyObj: any) => {
    setData(prev => ({ ...prev, [type]: [...(prev[type] || []), emptyObj] }));
  };

  const removeArrayItem = (type: 'experience' | 'education' | 'projects' | 'certifications', index: number) => {
    setData(prev => {
      const arr = [...(prev[type] || [])];
      arr.splice(index, 1);
      return { ...prev, [type]: arr };
    });
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#050505', color: '#fff', fontFamily: 'var(--font-inter), sans-serif' }}>
      
      {/* ─── Left Sidebar / Editor ─── */}
      <div style={{ width: '45%', display: 'flex', flexDirection: 'column', borderRight: '1px solid #1a1a24', background: '#0a0a0f' }}>
        
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid #1a1a24', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/" style={{ color: '#888', textDecoration: 'none', fontSize: '1.2rem' }}>←</Link>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-outfit)', letterSpacing: '1px' }}>
              RESUME <span style={{ color: '#ff5500' }}>BUILDER</span>
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => setActiveTab('editor')}
              style={{ background: activeTab === 'editor' ? 'rgba(255,85,0,0.1)' : 'transparent', color: activeTab === 'editor' ? '#ff5500' : '#888', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
            >
              EDITOR
            </button>
            <button 
              onClick={() => setActiveTab('ats')}
              style={{ background: activeTab === 'ats' ? 'rgba(255,85,0,0.1)' : 'transparent', color: activeTab === 'ats' ? '#ff5500' : '#888', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
            >
              ATS CHECK
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>
          
          {activeTab === 'editor' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              
              {/* Personal Info */}
              <section>
                <h3 style={{ color: '#ff5500', marginBottom: '15px', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Personal Info</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <input placeholder="Full Name" value={data.personalInfo.name} onChange={e => handlePersonalChange('name', e.target.value)} style={inputStyle} />
                  <input placeholder="Email" value={data.personalInfo.email} onChange={e => handlePersonalChange('email', e.target.value)} style={inputStyle} />
                  <input placeholder="Phone" value={data.personalInfo.phone} onChange={e => handlePersonalChange('phone', e.target.value)} style={inputStyle} />
                  <input placeholder="LinkedIn / GitHub URL" value={data.personalInfo.linkedin} onChange={e => handlePersonalChange('linkedin', e.target.value)} style={inputStyle} />
                </div>
              </section>

              <div className="mt-8">
              <h3 className="text-[#ff5500] font-bold text-sm tracking-wider mb-4 flex items-center justify-between">
                SUMMARY
              </h3>
              <textarea
                placeholder="Professional Summary"
                className="w-full bg-[#1e1e24] border border-[#333] rounded-md p-3 text-sm text-gray-200 min-h-[100px]"
                value={data.summary}
                onChange={e => setData({ ...data, summary: e.target.value })}
              />
            </div>

            {/* Experience */}
            <section className="mt-8">
                <h3 style={{ color: '#ff5500', marginBottom: '15px', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', justifyContent: 'space-between' }}>
                  Experience
                  <span style={{ cursor: 'pointer', color: '#888' }} onClick={() => addArrayItem('experience', { title: '', company: '', date: '', description: '' })}>+ ADD</span>
                </h3>
                {data.experience.map((exp, i) => (
                  <div key={i} style={{ background: '#111116', padding: '15px', borderRadius: '8px', marginBottom: '15px', position: 'relative' }}>
                    <button onClick={() => removeArrayItem('experience', i)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>×</button>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                      <input placeholder="Job Title" value={exp.title} onChange={e => handleArrayChange('experience', i, 'title', e.target.value)} style={inputStyle} />
                      <input placeholder="Company" value={exp.company} onChange={e => handleArrayChange('experience', i, 'company', e.target.value)} style={inputStyle} />
                      <input placeholder="Date (e.g. Jan 2022 - Present)" value={exp.date} onChange={e => handleArrayChange('experience', i, 'date', e.target.value)} style={inputStyle} />
                    </div>
                    <textarea placeholder="Bullet points (one per line)" value={exp.description} onChange={e => handleArrayChange('experience', i, 'description', e.target.value)} style={{...inputStyle, height: '80px', resize: 'vertical'}} />
                  </div>
                ))}
              </section>

              {/* Projects */}
              <section>
                <h3 style={{ color: '#ff5500', marginBottom: '15px', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', justifyContent: 'space-between' }}>
                  Projects
                  <span style={{ cursor: 'pointer', color: '#888' }} onClick={() => addArrayItem('projects', { name: '', date: '', description: '', tech: '' })}>+ ADD</span>
                </h3>
                {data.projects.map((proj, i) => (
                  <div key={i} style={{ background: '#111116', padding: '15px', borderRadius: '8px', marginBottom: '15px', position: 'relative' }}>
                    <button onClick={() => removeArrayItem('projects', i)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>×</button>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                      <input placeholder="Project Name" value={proj.name} onChange={e => handleArrayChange('projects', i, 'name', e.target.value)} style={inputStyle} />
                      <input placeholder="Date" value={proj.date} onChange={e => handleArrayChange('projects', i, 'date', e.target.value)} style={inputStyle} />
                    </div>
                    <input placeholder="Technologies Used (e.g. React, Node.js)" value={proj.tech || ''} onChange={e => handleArrayChange('projects', i, 'tech', e.target.value)} style={{...inputStyle, marginBottom: '10px'}} />
                    <textarea placeholder="Bullet points (one per line)" value={proj.description} onChange={e => handleArrayChange('projects', i, 'description', e.target.value)} style={{...inputStyle, height: '80px', resize: 'vertical'}} />
                  </div>
                ))}
              </section>

              {/* Education */}
              <section>
                <h3 style={{ color: '#ff5500', marginBottom: '15px', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', justifyContent: 'space-between' }}>
                  Education
                  <span style={{ cursor: 'pointer', color: '#888' }} onClick={() => addArrayItem('education', { degree: '', school: '', date: '' })}>+ ADD</span>
                </h3>
                {data.education.map((edu, i) => (
                  <div key={i} style={{ background: '#111116', padding: '15px', borderRadius: '8px', marginBottom: '15px', position: 'relative' }}>
                    <button onClick={() => removeArrayItem('education', i)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>×</button>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                      <input placeholder="School/University" value={edu.school} onChange={e => handleArrayChange('education', i, 'school', e.target.value)} style={inputStyle} />
                      <input placeholder="Degree" value={edu.degree} onChange={e => handleArrayChange('education', i, 'degree', e.target.value)} style={inputStyle} />
                      <input placeholder="Graduation Date" value={edu.date} onChange={e => handleArrayChange('education', i, 'date', e.target.value)} style={inputStyle} />
                    </div>
                  </div>
                ))}
              </section>

              {/* Skills */}
              <section>
                <h3 style={{ color: '#ff5500', marginBottom: '15px', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Technical Skills</h3>
                <textarea 
                  placeholder="Languages, Frameworks, Tools (comma separated or grouped)" 
                  value={data.skills} 
                  onChange={e => setData(prev => ({ ...prev, skills: e.target.value }))} 
                  style={{...inputStyle, height: '80px', resize: 'vertical', marginBottom: '15px'}} 
                />
              </section>

              {/* Certifications */}
              <section>
                <h3 style={{ color: '#ff5500', marginBottom: '15px', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', justifyContent: 'space-between' }}>
                  Certifications
                  <span style={{ cursor: 'pointer', color: '#888' }} onClick={() => addArrayItem('certifications', { name: '', link: '' })}>+ ADD</span>
                </h3>
                {data.certifications.map((cert, i) => (
                  <div key={i} style={{ background: '#111116', padding: '15px', borderRadius: '8px', marginBottom: '15px', position: 'relative' }}>
                    <button onClick={() => removeArrayItem('certifications', i)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>×</button>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                      <input placeholder="Certification Name" value={cert.name} onChange={e => handleArrayChange('certifications', i, 'name', e.target.value)} style={inputStyle} />
                      <input placeholder="Link (Optional)" value={cert.link} onChange={e => handleArrayChange('certifications', i, 'link', e.target.value)} style={inputStyle} />
                    </div>
                  </div>
                ))}
              </section>

            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: 'rgba(255,85,0,0.05)', border: '1px solid rgba(255,85,0,0.2)', padding: '20px', borderRadius: '8px' }}>
                
                <h3 style={{ color: '#fff', margin: '0 0 10px 0', fontSize: '1rem' }}>Upload External Resume (Optional)</h3>
                <div style={{ marginBottom: '20px' }}>
                  {!uploadedResume ? (
                    <label style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      padding: '30px', border: '2px dashed rgba(255,85,0,0.5)', borderRadius: '8px',
                      background: 'rgba(255,85,0,0.05)', cursor: 'pointer', transition: 'all 0.2s ease',
                      color: '#ff5500'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,85,0,0.1)'}
                    onMouseOut={e => e.currentTarget.style.background = 'rgba(255,85,0,0.05)'}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '10px' }}>
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Click to upload PDF</span>
                      <span style={{ fontSize: '0.75rem', color: '#888', marginTop: '5px' }}>or drag and drop</span>
                      <input 
                        type="file" 
                        accept=".pdf"
                        onChange={e => setUploadedResume(e.target.files?.[0] || null)}
                        style={{ display: 'none' }}
                      />
                    </label>
                  ) : (
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '15px 20px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981',
                      borderRadius: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                          <polyline points="10 9 9 9 8 9"/>
                        </svg>
                        <div>
                          <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 'bold' }}>{uploadedResume.name}</div>
                          <div style={{ color: '#10b981', fontSize: '0.75rem' }}>Ready for ATS Scan</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => setUploadedResume(null)}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                      >
                        REMOVE
                      </button>
                    </div>
                  )}
                  
                  <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '15px', textAlign: 'center' }}>
                    If you upload a PDF, we will scan it instead of your built resume.
                  </p>
                </div>

                <h3 style={{ color: '#fff', margin: '0 0 10px 0', fontSize: '1rem' }}>Target Job Description</h3>
                <textarea 
                  placeholder="Paste the Job Description here..." 
                  value={jobDescription}
                  onChange={e => setJobDescription(e.target.value)}
                  style={{...inputStyle, height: '150px', resize: 'vertical', marginBottom: '15px'}}
                />
                
                <button 
                  onClick={checkAtsScore}
                  disabled={isChecking}
                  style={{
                    width: '100%', padding: '12px', background: '#ff5500', color: '#000', border: 'none', borderRadius: '6px',
                    fontWeight: 700, cursor: isChecking ? 'not-allowed' : 'pointer', textTransform: 'uppercase', letterSpacing: '1px',
                    opacity: isChecking ? 0.7 : 1
                  }}
                >
                  {isChecking ? 'ANALYZING MATCH...' : 'CALCULATE ATS SCORE'}
                </button>
              </div>

              {atsResult && !atsResult.error && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.5s ease' }}>
                  
                  <div style={{ background: '#111116', padding: '20px', borderRadius: '8px', borderLeft: `4px solid ${atsResult.atsScore >= 80 ? '#10b981' : atsResult.atsScore >= 60 ? '#ffaa00' : '#ef4444'}` }}>
                    <div style={{ fontSize: '0.85rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>ATS Match Score</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff' }}>{atsResult.atsScore}%</div>
                  </div>

                  {atsResult.missingSkills?.length > 0 && (
                    <div style={{ background: '#111116', padding: '20px', borderRadius: '8px' }}>
                      <h4 style={{ color: '#ef4444', margin: '0 0 10px 0', fontSize: '0.9rem', textTransform: 'uppercase' }}>Missing Keywords / Skills</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {atsResult.missingSkills.map((s: string, i: number) => (
                          <span key={i} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '4px 10px', borderRadius: '100px', fontSize: '0.8rem' }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {atsResult.lackingProjects && (
                    <div style={{ background: '#111116', padding: '20px', borderRadius: '8px' }}>
                      <h4 style={{ color: '#ffaa00', margin: '0 0 10px 0', fontSize: '0.9rem', textTransform: 'uppercase' }}>Project Experience Gap</h4>
                      <p style={{ color: '#ccc', margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>{atsResult.lackingProjects}</p>
                    </div>
                  )}

                  {atsResult.recommendations?.length > 0 && (
                    <div style={{ background: '#111116', padding: '20px', borderRadius: '8px' }}>
                      <h4 style={{ color: '#10b981', margin: '0 0 10px 0', fontSize: '0.9rem', textTransform: 'uppercase' }}>Recommendations</h4>
                      <ul style={{ margin: 0, paddingLeft: '20px', color: '#ccc', fontSize: '0.9rem', lineHeight: 1.5 }}>
                        {atsResult.recommendations.map((r: string, i: number) => <li key={i} style={{ marginBottom: '6px' }}>{r}</li>)}
                      </ul>
                    </div>
                  )}

                </div>
              )}
            </div>
          )}
          
        </div>
      </div>

      {/* ─── Right Panel / PDF Viewer ─── */}
      <div style={{ flex: 1, backgroundColor: '#333', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '10px 20px', background: '#222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px' }}>Live Preview</span>
          <span style={{ fontSize: '0.75rem', color: '#666' }}>Powered by React-PDF</span>
        </div>
        <div style={{ flex: 1 }}>
          <PDFPreview data={data} />
        </div>
      </div>

    </div>
  );
}

const inputStyle = {
  width: '100%',
  background: '#1a1a24',
  border: '1px solid #2a2a35',
  padding: '12px',
  borderRadius: '6px',
  color: '#fff',
  outline: 'none',
  fontSize: '0.9rem',
  fontFamily: 'var(--font-inter)',
};
