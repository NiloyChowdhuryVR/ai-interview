'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { InterviewFeedback, InterviewRound } from '@/lib/types';
import { COMPANY_MODES, ROUND_LABELS } from '@/lib/companyModes';

// Safe accessor — returns empty array if value is undefined/null
function safe<T>(arr: T[] | undefined | null): T[] {
  return Array.isArray(arr) ? arr : [];
}

export default function DashboardPage() {
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('interviewFeedback');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Ensure all array fields exist to prevent crashes
        const safe_feedback: InterviewFeedback = {
          overallScore: parsed.overallScore ?? 0,
          overallGrade: parsed.overallGrade ?? 'Average',
          roundScores: Array.isArray(parsed.roundScores) ? parsed.roundScores : [],
          categoryScores: Array.isArray(parsed.categoryScores) ? parsed.categoryScores : [],
          evaluations: Array.isArray(parsed.evaluations) ? parsed.evaluations : [],
          strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
          improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
          recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
          summary: parsed.summary ?? '',
          companyMode: parsed.companyMode,
        };
        setFeedback(safe_feedback);
      } catch (err) {
        console.error('Failed to parse feedback:', err);
        setIsDemo(true);
        setFeedback(getDemoFeedback());
      }
    } else {
      setIsDemo(true);
      setFeedback(getDemoFeedback());
    }
  }, []);

  if (!feedback) {
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif', textAlign: 'center' }}>
        <p>Loading your feedback report...</p>
      </div>
    );
  }

  const modeConfig = feedback.companyMode ? COMPANY_MODES[feedback.companyMode] : null;
  const roundScores = safe(feedback.roundScores);
  const categoryScores = safe(feedback.categoryScores);
  const evaluations = safe(feedback.evaluations);
  const strengths = safe(feedback.strengths);
  const improvements = safe(feedback.improvements);
  const recommendations = safe(feedback.recommendations);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '900px', margin: '0 auto' }}>
      <Link href="/" style={{ color: '#2563eb' }}>← Start New Interview</Link>
      <h1 style={{ marginTop: '10px' }}>Interview Feedback Report</h1>

      {isDemo && (
        <div style={{ padding: '10px', background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '4px', marginBottom: '20px' }}>
          <strong>Demo Mode</strong> — This is example data. Complete a real interview to see your actual results.
        </div>
      )}

      {/* Company + Overall Score */}
      <div style={{ padding: '20px', background: '#e5e7eb', borderRadius: '8px', marginBottom: '20px' }}>
        {modeConfig && (
          <p style={{ margin: '0 0 8px' }}>
            <strong>Company Mode:</strong> {modeConfig.emoji} {modeConfig.label} ({modeConfig.difficulty})
          </p>
        )}
        <h2 style={{ margin: '0 0 8px' }}>
          Overall Score: {feedback.overallScore}/100 — {feedback.overallGrade}
        </h2>
        {feedback.summary && (
          <p style={{ margin: 0, color: '#4b5563' }}>{feedback.summary}</p>
        )}
      </div>

      {/* Round Scores */}
      {roundScores.length > 0 && (
        <div style={{ padding: '20px', border: '1px solid #d1d5db', borderRadius: '8px', marginBottom: '20px' }}>
          <h3 style={{ marginTop: 0 }}>Score by Round</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Round', 'Score', 'Questions', 'Grade'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roundScores.filter(Boolean).map((rs, i) => (
                <tr key={i}>
                  <td style={{ padding: '8px' }}>{ROUND_LABELS[rs.round as InterviewRound] ?? rs.round}</td>
                  <td style={{ padding: '8px' }}>{rs.score}/100</td>
                  <td style={{ padding: '8px' }}>{rs.questionsAsked}</td>
                  <td style={{ padding: '8px' }}><strong>{rs.grade}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Strengths & Improvements */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px', padding: '20px', border: '1px solid #d1d5db', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 12px', color: '#16a34a' }}>✅ Strengths</h3>
          {strengths.length === 0
            ? <p style={{ color: '#9ca3af' }}>No strengths data available.</p>
            : <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {strengths.map((s, i) => <li key={i} style={{ marginBottom: '6px' }}>{s}</li>)}
              </ul>
          }
        </div>
        <div style={{ flex: 1, minWidth: '200px', padding: '20px', border: '1px solid #d1d5db', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 12px', color: '#d97706' }}>⚠️ Areas to Improve</h3>
          {improvements.length === 0
            ? <p style={{ color: '#9ca3af' }}>No improvement data available.</p>
            : <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {improvements.map((s, i) => <li key={i} style={{ marginBottom: '6px' }}>{s}</li>)}
              </ul>
          }
        </div>
      </div>

      {/* Category Scores */}
      {categoryScores.length > 0 && (
        <div style={{ padding: '20px', border: '1px solid #d1d5db', borderRadius: '8px', marginBottom: '20px' }}>
          <h3 style={{ marginTop: 0 }}>Score by Skill / Topic</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Category', 'Score', '%'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categoryScores.map((cs, i) => (
                <tr key={i}>
                  <td style={{ padding: '8px' }}>{cs.category}</td>
                  <td style={{ padding: '8px' }}>{cs.score}/{cs.maxScore}</td>
                  <td style={{ padding: '8px' }}>{cs.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Per-Question Breakdown */}
      {evaluations.length > 0 && (
        <div style={{ padding: '20px', border: '1px solid #d1d5db', borderRadius: '8px', marginBottom: '20px' }}>
          <h3 style={{ marginTop: 0 }}>
            Question-by-Question Breakdown ({evaluations.length} answered)
          </h3>
          {evaluations.map((ev, i) => (
            <div
              key={i}
              style={{
                marginBottom: '20px',
                paddingBottom: '20px',
                borderBottom: i < evaluations.length - 1 ? '1px solid #e5e7eb' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 'bold' }}>Q{i + 1}</span>
                <span style={{ padding: '2px 8px', background: '#e0e7ff', borderRadius: '10px', fontSize: '12px' }}>
                  {ROUND_LABELS[ev.round as InterviewRound] ?? ev.round}
                </span>
                <span style={{ padding: '2px 8px', background: '#f3f4f6', borderRadius: '10px', fontSize: '12px' }}>
                  {ev.category}
                </span>
                <strong style={{
                  color: ev.score >= 7 ? '#16a34a' : ev.score >= 5 ? '#d97706' : '#dc2626',
                }}>
                  {ev.score}/10
                </strong>
              </div>
              <p style={{ margin: '0 0 4px', fontWeight: 500 }}>{ev.question}</p>
              <p style={{ margin: '0 0 6px', color: '#4b5563', fontStyle: 'italic', fontSize: '14px' }}>
                Your answer: {ev.answer}
              </p>
              <p style={{ margin: '0 0 8px', fontSize: '14px' }}>
                <strong>Feedback:</strong> {ev.feedback}
              </p>
              <div style={{ display: 'flex', gap: '16px', fontSize: '13px', flexWrap: 'wrap' }}>
                {safe(ev.strengths).length > 0 && (
                  <div>
                    <strong style={{ color: '#16a34a' }}>Good:</strong>
                    <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
                      {safe(ev.strengths).map((s, j) => <li key={j}>{s}</li>)}
                    </ul>
                  </div>
                )}
                {safe(ev.improvements).length > 0 && (
                  <div>
                    <strong style={{ color: '#d97706' }}>Improve:</strong>
                    <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
                      {safe(ev.improvements).map((s, j) => <li key={j}>{s}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div style={{ padding: '20px', border: '1px solid #d1d5db', borderRadius: '8px', marginBottom: '30px' }}>
          <h3 style={{ marginTop: 0 }}>Recommendations</h3>
          <ol style={{ margin: 0, paddingLeft: '20px' }}>
            {recommendations.map((r, i) => (
              <li key={i} style={{ marginBottom: '8px' }}>{r}</li>
            ))}
          </ol>
        </div>
      )}

      <div style={{ textAlign: 'center', paddingBottom: '40px' }}>
        <Link href="/">
          <button style={{
            padding: '12px 24px',
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: 'pointer',
          }}>
            🔁 Start New Interview
          </button>
        </Link>
      </div>
    </div>
  );
}

function getDemoFeedback(): InterviewFeedback {
  return {
    overallScore: 72,
    overallGrade: 'Good',
    companyMode: 'google',
    roundScores: [
      { round: 'technical', score: 75, questionsAsked: 8, grade: 'Good' },
      { round: 'project', score: 70, questionsAsked: 6, grade: 'Good' },
      { round: 'hr', score: 68, questionsAsked: 6, grade: 'Average' },
    ],
    categoryScores: [
      { category: 'React', score: 16, maxScore: 20, percentage: 80 },
      { category: 'Python', score: 14, maxScore: 20, percentage: 70 },
      { category: 'System Design', score: 12, maxScore: 20, percentage: 60 },
      { category: 'HR', score: 40, maxScore: 60, percentage: 67 },
    ],
    evaluations: [
      {
        questionId: 'tech-1', round: 'technical',
        question: 'Explain React hooks and when to use useEffect.',
        answer: 'React hooks let you use state and lifecycle in functional components. useEffect runs after render for side effects like fetching data.',
        category: 'React', score: 8,
        feedback: 'Good explanation covering the key concepts.',
        strengths: ['Correct core concept', 'Mentioned side effects'],
        improvements: ['Could mention cleanup function'],
      },
      {
        questionId: 'proj-1', round: 'project',
        question: 'Walk me through the architecture of your main project.',
        answer: 'I built a full-stack app using React frontend and Node.js backend with MongoDB database.',
        category: 'Portfolio Project', score: 6,
        feedback: 'Basic answer — needed more depth on architecture decisions.',
        strengths: ['Named the tech stack'],
        improvements: ['Explain why you chose these technologies', 'Discuss scalability'],
      },
    ],
    strengths: ['Strong React knowledge', 'Good communication', 'Data-driven approach'],
    improvements: ['Deepen system design knowledge', 'Provide more specific metrics', 'Practice STAR format'],
    recommendations: [
      'Study Google system design resources',
      'Practice LeetCode medium/hard problems',
      'Prepare 5 STAR stories for the HR round',
    ],
    summary: 'A solid Google-style interview performance. Technical fundamentals are strong but system design depth needs work.',
  };
}
