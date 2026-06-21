import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import { buildFeedbackPrompt, calculateCategoryScores, calculateRoundScores } from '@/lib/gemini';
import { AnswerEvaluation, CompanyMode, InterviewFeedback } from '@/lib/types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function POST(req: Request) {
  try {
    const { evaluations, companyMode } = await req.json() as {
      evaluations: AnswerEvaluation[];
      companyMode: CompanyMode;
    };

    const categoryScores = calculateCategoryScores(evaluations);
    const roundScores = calculateRoundScores(evaluations).filter((rs): rs is NonNullable<typeof rs> => rs !== null);

    if (!process.env.GEMINI_API_KEY) {
      const avgScore = evaluations.reduce((a, b) => a + b.score, 0) / evaluations.length;
      const overallScore = Math.round(avgScore * 10);
      return NextResponse.json({
        overallScore,
        overallGrade: overallScore >= 80 ? 'Good' : overallScore >= 60 ? 'Average' : 'Needs Improvement',
        roundScores,
        categoryScores,
        evaluations,
        strengths: ['Completed all interview rounds', 'Showed willingness to answer all questions'],
        improvements: ['Configure GEMINI_API_KEY for detailed AI feedback'],
        recommendations: ['Set up Google Gemini API for comprehensive evaluation'],
        summary: `You scored ${overallScore}/100 across ${evaluations.length} questions. Configure your Gemini API key for detailed feedback.`,
        companyMode,
      } satisfies InterviewFeedback);
    }
    const prompt = buildFeedbackPrompt(evaluations, companyMode);
    
    let feedback;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const text = response.text || '';
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      feedback = JSON.parse(cleanText);
    } catch (apiError) {
      console.warn('Gemini feedback failed (likely rate limit). Using fallback feedback.', apiError);
      const avgScore = evaluations.reduce((a, b) => a + b.score, 0) / evaluations.length || 0;
      const overallScore = Math.round(avgScore * 10);
      feedback = {
        overallScore,
        overallGrade: overallScore >= 80 ? 'Good' : overallScore >= 60 ? 'Average' : 'Needs Improvement',
        strengths: ['Completed all interview rounds'],
        improvements: ['API rate limit hit, real feedback unavailable'],
        recommendations: ['Wait a bit for the API quota to reset'],
        summary: `You scored ${overallScore}/100. We hit the API rate limit so detailed feedback is unavailable.`,
      };
    }

    return NextResponse.json({
      overallScore: Math.min(100, Math.max(0, feedback.overallScore)),
      overallGrade: feedback.overallGrade || 'Average',
      roundScores,
      categoryScores,
      evaluations,
      strengths: feedback.strengths || [],
      improvements: feedback.improvements || [],
      recommendations: feedback.recommendations || [],
      summary: feedback.summary || 'Interview completed.',
      companyMode,
    } satisfies InterviewFeedback);
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json({ error: 'Failed to generate feedback' }, { status: 500 });
  }
}
