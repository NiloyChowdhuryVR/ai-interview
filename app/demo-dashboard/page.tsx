'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { InterviewFeedback, InterviewRound } from '@/lib/types';
import { COMPANY_MODES, ROUND_LABELS } from '@/lib/companyModes';

function safe<T>(arr: T[] | undefined | null): T[] {
  return Array.isArray(arr) ? arr : [];
}

// ─── SVG Segmented Ring Chart (Matches image gauges) ────────────────────────
function SegmentedRing({ score, label, color = '#ff5500', size = 160 }: { score: number, label: string, color?: string, size?: number }) {
  const segments = 40;
  const [activeSegments, setActiveSegments] = useState(0);
  
  useEffect(() => {
    setTimeout(() => {
      setActiveSegments(Math.round((score / 100) * segments));
    }, 100);
  }, [score]);

  const radius = size / 2 - 15;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0 }}>
        {Array.from({ length: segments }).map((_, i) => {
          // Start from bottom left (-210 deg) to bottom right (30 deg) to leave a gap at the bottom like standard gauges
          const startAngle = -210;
          const endAngle = 30;
          const totalAngle = endAngle - startAngle;
          const angle = startAngle + (i / (segments - 1)) * totalAngle;
          
          const isActive = i < activeSegments;
          const strokeColor = isActive ? color : 'rgba(255,255,255,0.05)';
          const glow = isActive ? `drop-shadow(0 0 4px ${color})` : 'none';
          
          return (
            <line
              key={i}
              x1={cx + (radius - 10) * Math.cos(angle * Math.PI / 180)}
              y1={cy + (radius - 10) * Math.sin(angle * Math.PI / 180)}
              x2={cx + radius * Math.cos(angle * Math.PI / 180)}
              y2={cy + radius * Math.sin(angle * Math.PI / 180)}
              stroke={strokeColor}
              strokeWidth="4"
              strokeLinecap="round"
              style={{ filter: glow, transition: 'all 0.5s ease', transitionDelay: `${i * 10}ms` }}
            />
          );
        })}
      </svg>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
        <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff', textShadow: `0 0 10px ${color}` }}>{score}</div>
        <div style={{ fontSize: '0.6rem', color: '#888', letterSpacing: '0.5px', textTransform: 'uppercase', maxWidth: '100px', lineHeight: 1.2 }}>{label}</div>
      </div>
    </div>
  );
}

// ─── SVG Line Chart (Matches image graph) ────────────────────────────────────
function LineChart({ data, labels, color = '#ffaa00' }: { data: number[], labels: string[], color?: string }) {
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => { setTimeout(() => setIsLoaded(true), 100); }, []);

  if (!data || data.length === 0) return <div style={{ color: '#888' }}>Not enough data for chart.</div>;
  
  const width = 600;
  const height = 180;
  const max = 100;
  const min = 0;
  
  const stepX = width / Math.max(data.length - 1, 1);
  
  // Calculate points
  const points = data.map((d, i) => {
    const x = i * stepX;
    const y = height - (((isLoaded ? d : 0) - min) / (max - min)) * height;
    return `${x},${y}`;
  });
  
  // Create bezier curve
  let pathD = `M ${points[0]}`;
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1].split(',').map(Number);
    const [x1, y1] = points[i].split(',').map(Number);
    const cx = (x0 + x1) / 2;
    pathD += ` C ${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }
  
  const fillPath = `${pathD} L ${points[points.length - 1].split(',')[0]},${height} L 0,${height} Z`;

  return (
    <div style={{ width: '100%', overflowX: 'visible', paddingBottom: '10px', paddingLeft: '15px' }}>
      <svg width="100%" height={height + 20} viewBox={`-30 -10 ${width + 40} ${height + 20}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="glowFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        
        {/* Y-Axis Grid lines and Labels */}
        {[0, 25, 50, 75, 100].map(val => {
          const y = height - (val / 100) * height;
          return (
            <g key={val}>
              <line x1="0" y1={y} x2={data.length === 1 ? width : stepX * (data.length - 1)} y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <text x="-10" y={y + 4} fill="#555" fontSize="10" textAnchor="end">{val}</text>
            </g>
          );
        })}
        
        <path d={fillPath} fill="url(#glowFill)" style={{ transition: 'd 1s cubic-bezier(0.16, 1, 0.3, 1)' }} />
        <path d={pathD} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 8px ${color})`, transition: 'd 1s cubic-bezier(0.16, 1, 0.3, 1)' }} />
        
        {/* Points */}
        {data.map((d, i) => {
          const x = i * stepX;
          const y = height - (((isLoaded ? d : 0) - min) / (max - min)) * height;
          return (
            <circle key={i} cx={x} cy={y} r="4" fill="#111" stroke={color} strokeWidth="2" style={{ filter: `drop-shadow(0 0 5px ${color})`, transition: 'cy 1s cubic-bezier(0.16, 1, 0.3, 1)' }} />
          );
        })}
      </svg>
      
      {/* HTML Text Overlay (Prevents SVG warping) */}
      <div style={{ position: 'relative', width: '100%', height: '20px', marginTop: '10px' }}>
        {data.map((_, i) => {
          const leftPercent = data.length === 1 ? 0 : (i / (data.length - 1)) * 100;
          return (
            <div key={i} style={{
              position: 'absolute',
              left: `${leftPercent}%`,
              transform: data.length === 1 ? 'none' : (i === 0 ? 'none' : (i === data.length - 1 ? 'translateX(-100%)' : 'translateX(-50%)')),
              color: '#888', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap'
            }}>
              {labels[i] || `Data ${i+1}`}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Horizontal Progress Bar (Matches image top right) ──────────────────────
function HorizontalBar({ label, score, maxScore = 100, color = '#ff5500' }: { label: string, score: number, maxScore?: number, color?: string }) {
  const [width, setWidth] = useState(0);
  const percentage = Math.round((score / maxScore) * 100);
  useEffect(() => { setTimeout(() => setWidth(percentage), 100); }, [percentage]);

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        <span>{label}</span>
        <span style={{ color: '#ccc' }}>{percentage}%</span>
      </div>
      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '100px', overflow: 'visible', position: 'relative' }}>
        <div style={{ 
          width: `${width}%`, height: '100%', background: color, borderRadius: '100px', position: 'absolute', top: 0, left: 0,
          transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)', boxShadow: `0 0 10px ${color}`
        }} />
        {/* Highlight dot at the end of the bar */}
        <div style={{
          position: 'absolute', top: '50%', left: `${width}%`, transform: 'translate(-50%, -50%)',
          width: '10px', height: '10px', background: '#fff', borderRadius: '50%', boxShadow: `0 0 10px ${color}`,
          transition: 'left 1s cubic-bezier(0.16, 1, 0.3, 1)', opacity: width > 0 ? 1 : 0
        }} />
      </div>
    </div>
  );
}

const AdminCard = ({ children, style = {}, title }: { children: React.ReactNode, style?: React.CSSProperties, title?: string }) => (
  <div style={{
    background: '#0a0a0f', border: '1px solid #1a1a24', borderRadius: '12px',
    padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', position: 'relative', overflow: 'hidden', ...style
  }}>
    {/* Subtle flare in background of card */}
    <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(255,85,0,0.05) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />
    
    {title && (
      <h3 style={{ margin: '0 0 20px 0', fontSize: '0.9rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
        {title}
      </h3>
    )}
    {children}
  </div>
);

// ─── Main Admin Dashboard Page ────────────────────────────────────────────────
export default function DemoDashboardPage() {
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'questions'>('overview');

  useEffect(() => {
    // Force demo state for the showcase URL
    setIsDemo(true);
    setFeedback(getDemoFeedback());
  }, []);

  if (!feedback) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#050505', color: '#ff5500', fontFamily: 'var(--font-outfit)' }}>
        <h2 style={{ animation: 'pulse 1.5s infinite' }}>INITIALIZING DASHBOARD...</h2>
      </div>
    );
  }

  const modeConfig = feedback.companyMode ? COMPANY_MODES[feedback.companyMode] : null;
  const roundScores = safe(feedback.roundScores);
  const categoryScores = safe(feedback.categoryScores);
  const evaluations = safe(feedback.evaluations);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#050505', color: '#fff', fontFamily: 'var(--font-inter), sans-serif' }}>
      
      {/* ─── Left Sidebar ─── */}
      <aside style={{ width: '260px', background: '#08080c', borderRight: '1px solid #1a1a24', padding: '30px 20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', paddingLeft: '10px' }}>
          <div style={{ width: '12px', height: '12px', background: '#ff5500', borderRadius: '50%', boxShadow: '0 0 10px #ff5500' }} />
          <h2 style={{ margin: 0, fontFamily: 'var(--font-outfit)', fontSize: '1.4rem', letterSpacing: '1px' }}>DASHBOARD</h2>
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div 
            onClick={() => setActiveTab('overview')}
            style={{ 
              padding: '12px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '1px',
              color: activeTab === 'overview' ? '#ff5500' : '#6b7280', background: activeTab === 'overview' ? 'rgba(255,85,0,0.1)' : 'transparent',
              transition: 'all 0.2s', borderLeft: activeTab === 'overview' ? '3px solid #ff5500' : '3px solid transparent'
            }}
          >
            METRICS OVERVIEW
          </div>
          <div 
            onClick={() => setActiveTab('questions')}
            style={{ 
              padding: '12px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '1px',
              color: activeTab === 'questions' ? '#ff5500' : '#6b7280', background: activeTab === 'questions' ? 'rgba(255,85,0,0.1)' : 'transparent',
              transition: 'all 0.2s', borderLeft: activeTab === 'questions' ? '3px solid #ff5500' : '3px solid transparent'
            }}
          >
            QUESTION DETAILS
          </div>
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #1a1a24' }}>
          <Link href="/">
            <button style={{
              width: '100%', padding: '12px', background: '#ff5500', color: '#000', border: 'none', borderRadius: '6px',
              fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px',
              boxShadow: '0 0 20px rgba(255,85,0,0.4)', transition: 'transform 0.2s'
            }}>
              + NEW INTERVIEW
            </button>
          </Link>
        </div>
      </aside>

      {/* ─── Main Content Area ─── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        <div style={{ padding: '40px', overflowY: 'auto', flex: 1 }}>
          
          <div style={{ marginBottom: '30px' }}>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '1.8rem', fontFamily: 'var(--font-outfit)', letterSpacing: '1px', textTransform: 'uppercase' }}>
              PERFORMANCE <span style={{ color: '#ff5500' }}>/ {activeTab === 'overview' ? 'METRICS' : 'QUESTIONS'}</span>
            </h1>
            {isDemo && <p style={{ color: '#f59e0b', fontSize: '0.9rem', margin: 0 }}>⚠️ DEMO MODE ACTIVATED</p>}
          </div>

          {activeTab === 'overview' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
              
              {/* Top Row: 3 Gauges (Span 3 cols each) + Skills Bar (Span 3 cols) */}
              <AdminCard title="OVERALL RATING" style={{ gridColumn: 'span 3' }}>
                <SegmentedRing score={feedback.overallScore} label={feedback.overallGrade} color={feedback.overallScore >= 80 ? '#10b981' : feedback.overallScore >= 60 ? '#ffaa00' : '#ef4444'} />
              </AdminCard>
              
              <AdminCard title="TECHNICAL SCORE" style={{ gridColumn: 'span 3' }}>
                <SegmentedRing score={roundScores.find(r => r.round === 'technical')?.score || 0} label="TECH ROUND" color="#ff5500" />
              </AdminCard>
              
              <AdminCard title="COMMUNICATION" style={{ gridColumn: 'span 3' }}>
                <SegmentedRing score={roundScores.find(r => r.round === 'hr')?.score || roundScores.find(r => r.round === 'project')?.score || 0} label="HR / PROJ" color="#8b5cf6" />
              </AdminCard>

              <AdminCard title="SKILL DISTRIBUTION" style={{ gridColumn: 'span 3' }}>
                {categoryScores.length > 0 ? (
                  categoryScores.slice(0, 4).map((cs, i) => (
                    <HorizontalBar key={i} label={cs.category} score={cs.score} maxScore={cs.maxScore} color={i % 2 === 0 ? '#ffaa00' : '#ff5500'} />
                  ))
                ) : (
                  <p style={{ color: '#666', fontSize: '0.85rem' }}>No skill data available.</p>
                )}
              </AdminCard>

              {/* Middle Row: Line Chart (Span 8) + Text Block (Span 4) */}
              <AdminCard title="SCORE PROGRESSION" style={{ gridColumn: 'span 8' }}>
                <LineChart 
                  data={roundScores.map(r => r.score)} 
                  labels={roundScores.map(r => ROUND_LABELS[r.round as InterviewRound] || r.round)} 
                />
              </AdminCard>

              <AdminCard title="EXECUTIVE SUMMARY" style={{ gridColumn: 'span 4' }}>
                {modeConfig && (
                  <div style={{ marginBottom: '16px', padding: '8px', background: 'rgba(255,85,0,0.1)', border: '1px solid rgba(255,85,0,0.2)', borderRadius: '6px', fontSize: '0.85rem', color: '#ffaa00' }}>
                    TARGET: {modeConfig.label} ({modeConfig.difficulty})
                  </div>
                )}
                <p style={{ color: '#a1a1aa', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                  {feedback.summary || "Insufficient data to generate a summary."}
                </p>
              </AdminCard>

              {/* Bottom Row: Strengths and Improvements (Span 6 each) */}
              <AdminCard title="KEY STRENGTHS" style={{ gridColumn: 'span 6', borderLeft: '3px solid #10b981' }}>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#d1d5db', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  {safe(feedback.strengths).length > 0 ? safe(feedback.strengths).map((s, i) => <li key={i} style={{ marginBottom: '8px' }}>{s}</li>) : <li>No strengths recorded.</li>}
                </ul>
              </AdminCard>

              <AdminCard title="AREAS TO IMPROVE" style={{ gridColumn: 'span 6', borderLeft: '3px solid #ffaa00' }}>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#d1d5db', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  {safe(feedback.improvements).length > 0 ? safe(feedback.improvements).map((s, i) => <li key={i} style={{ marginBottom: '8px' }}>{s}</li>) : <li>No improvements recorded.</li>}
                </ul>
              </AdminCard>

            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '900px' }}>
              {evaluations.length === 0 ? (
                <AdminCard>
                  <p style={{ color: '#888', margin: 0 }}>No question evaluations recorded during this interview.</p>
                </AdminCard>
              ) : (
                evaluations.map((ev, i) => (
                  <AdminCard key={i}>
                    {/* Q Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <span style={{ background: 'rgba(255,85,0,0.1)', border: '1px solid rgba(255,85,0,0.3)', color: '#ffaa00', padding: '4px 12px', borderRadius: '100px', fontWeight: 600, fontSize: '0.9rem' }}>
                          QUESTION {i + 1}
                        </span>
                        <span style={{ color: '#888', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          {ROUND_LABELS[ev.round as InterviewRound] ?? ev.round} • {ev.category}
                        </span>
                      </div>
                      <div style={{ 
                        fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-outfit)',
                        color: ev.score >= 7 ? '#10b981' : ev.score >= 5 ? '#ffaa00' : '#ef4444' 
                      }}>
                        SCORE: {ev.score}/10
                      </div>
                    </div>

                    {/* Q&A */}
                    <h4 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#fff', lineHeight: 1.5, fontWeight: 500 }}>
                      {ev.question}
                    </h4>
                    <div style={{ background: '#0f0f16', borderLeft: '3px solid rgba(255,85,0,0.5)', padding: '16px', borderRadius: '0 8px 8px 0', marginBottom: '24px' }}>
                      <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.95rem', lineHeight: 1.6, fontStyle: 'italic' }}>
                        "{ev.answer}"
                      </p>
                    </div>

                    {/* Feedback */}
                    <div style={{ borderTop: '1px solid #1a1a24', paddingTop: '20px' }}>
                      <p style={{ margin: '0 0 20px 0', color: '#d1d5db', fontSize: '0.95rem', lineHeight: 1.6 }}>
                        <strong style={{ color: '#fff', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>AI Feedback:</strong><br/>
                        {ev.feedback}
                      </p>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                        {safe(ev.strengths).length > 0 && (
                          <div style={{ background: 'rgba(16,185,129,0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.1)' }}>
                            <h5 style={{ margin: '0 0 12px 0', color: '#10b981', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Done Well</h5>
                            <ul style={{ margin: 0, paddingLeft: '20px', color: '#a1a1aa', fontSize: '0.9rem', lineHeight: 1.5 }}>
                              {safe(ev.strengths).map((s, j) => <li key={j} style={{ marginBottom: '4px' }}>{s}</li>)}
                            </ul>
                          </div>
                        )}
                        {safe(ev.improvements).length > 0 && (
                          <div style={{ background: 'rgba(255,170,0,0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,170,0,0.1)' }}>
                            <h5 style={{ margin: '0 0 12px 0', color: '#ffaa00', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>To Improve</h5>
                            <ul style={{ margin: 0, paddingLeft: '20px', color: '#a1a1aa', fontSize: '0.9rem', lineHeight: 1.5 }}>
                              {safe(ev.improvements).map((s, j) => <li key={j} style={{ marginBottom: '4px' }}>{s}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                  </AdminCard>
                ))
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

function getDemoFeedback(): InterviewFeedback {
  return {
    overallScore: 84,
    overallGrade: 'Excellent',
    companyMode: 'google',
    roundScores: [
      { round: 'technical', score: 65, questionsAsked: 8, grade: 'Average' },
      { round: 'project', score: 85, questionsAsked: 6, grade: 'Good' },
      { round: 'hr', score: 95, questionsAsked: 6, grade: 'Excellent' },
    ],
    categoryScores: [
      { category: 'Algorithms', score: 14, maxScore: 20, percentage: 70 },
      { category: 'System Design', score: 17, maxScore: 20, percentage: 85 },
      { category: 'Communication', score: 19, maxScore: 20, percentage: 95 },
      { category: 'Problem Solving', score: 16, maxScore: 20, percentage: 80 },
    ],
    evaluations: [
      {
        questionId: 'demo-tech-1',
        round: 'technical',
        category: 'Algorithms',
        question: 'Explain how you would optimize finding the shortest path in a weighted graph.',
        answer: 'I would use Dijkstra\'s algorithm with a priority queue or min-heap to repeatedly pick the shortest known path, keeping time complexity at O(V + E log V).',
        score: 9,
        feedback: 'Excellent answer. You correctly identified Dijkstra\'s algorithm and the specific data structures needed for optimal time complexity.',
        strengths: ['Identified optimal algorithm', 'Correctly stated time complexity', 'Mentioned min-heap structure'],
        improvements: ['Could have mentioned A* as an alternative for specific use cases']
      },
      {
        questionId: 'demo-proj-1',
        round: 'project',
        category: 'System Design',
        question: 'How did you handle state management across your frontend in your last large project?',
        answer: 'I primarily used Context API with useReducer for global state to avoid prop drilling, though I think I might use Zustand next time for less boilerplate.',
        score: 7,
        feedback: 'Good overview of your practical experience. Context + useReducer is standard, but in very large apps it can cause unnecessary re-renders without proper memoization.',
        strengths: ['Clear rationale for avoiding prop drilling', 'Awareness of modern alternatives like Zustand'],
        improvements: ['Did not discuss performance implications of Context API', 'Missed mentioning memoization techniques']
      }
    ],
    strengths: ['Excellent behavioral responses', 'Strong high-level architecture design', 'Clear communication'],
    improvements: ['Brush up on algorithmic time complexities', 'Detail database indexing better'],
    recommendations: [],
    summary: 'A very strong performance showing steady improvement across rounds. While the technical fundamentals started slightly shaky, the candidate excelled in project discussions and cultural fit.',
  };
}
