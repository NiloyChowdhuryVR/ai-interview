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
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        const text = response.text || '';
        const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        feedback = JSON.parse(cleanText);
        break; // Success, exit loop
      } catch (apiError: any) {
        attempts++;
        const isRateLimitOrOverload = apiError?.status === 429 || apiError?.status === 503 || apiError?.message?.includes('429') || apiError?.message?.includes('503') || apiError?.message?.includes('quota') || apiError?.message?.includes('demand');
        
        console.warn(`[Gemini API] Feedback generation failed (Attempt ${attempts}/${maxAttempts}). Reason: ${apiError?.message || 'Unknown error'}`);
        
        if (attempts < maxAttempts && isRateLimitOrOverload) {
          console.warn('Rate limit or high demand hit. Waiting 15 seconds before retrying...');
          await new Promise(r => setTimeout(r, 15000));
        } else {
          // Fallback if all retries fail or if it's an unrecoverable JSON parse error
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
          break;
        }
      }
    }

    return NextResponse.json({
      overallScore: Math.min(100, Math.max(0, feedback?.overallScore || 0)),
      overallGrade: feedback?.overallGrade || 'Average',
      roundScores,
      categoryScores,
      evaluations,
      strengths: Array.isArray(feedback?.strengths) ? feedback.strengths : ['Completed all interview rounds'],
      improvements: Array.isArray(feedback?.improvements) ? feedback.improvements : ['Practice articulating your answers more clearly'],
      recommendations: Array.isArray(feedback?.recommendations) ? feedback.recommendations : ['Focus on structuring your answers'],
      summary: feedback?.summary || 'Interview completed. Provide more detailed technical answers for a better score.',
      companyMode,
    } satisfies InterviewFeedback);
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json({ error: 'Failed to generate feedback' }, { status: 500 });
  }
}
