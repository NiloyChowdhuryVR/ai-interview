import { NextResponse } from 'next/server';
import { buildFeedbackPrompt, calculateCategoryScores, calculateRoundScores } from '@/lib/gemini';
import { executeWithRotation, getApiKeys } from '@/lib/ai';
import { AnswerEvaluation, CompanyMode, InterviewFeedback } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const { evaluations, companyMode } = await req.json() as {
      evaluations: AnswerEvaluation[];
      companyMode: CompanyMode;
    };

    if (getApiKeys().length === 0) {
      return NextResponse.json({
        overallScore: 0,
        overallGrade: 'Needs Improvement',
        roundScores: calculateRoundScores(evaluations).filter((rs): rs is NonNullable<typeof rs> => rs !== null),
        categoryScores: calculateCategoryScores(evaluations),
        evaluations,
        strengths: ['Completed all interview rounds', 'Showed willingness to answer all questions'],
        improvements: ['Configure GEMINI_API_KEY for detailed AI feedback'],
        recommendations: ['Set up Google Gemini API for comprehensive evaluation'],
        summary: `You scored 0/100 across ${evaluations.length} questions. Configure your Gemini API key for detailed feedback.`,
        companyMode,
      } satisfies InterviewFeedback);
    }
    
    const prompt = buildFeedbackPrompt(evaluations, companyMode);
    
    let feedback;
    try {
      const response = await executeWithRotation((ai) => 
        ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        })
      , 'Feedback Generation');

      const text = response.text || '';
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      feedback = JSON.parse(cleanText);
    } catch (error) {
      console.warn('Feedback generation failed after all retries.', error);
      feedback = {
        overallScore: 0,
        overallGrade: 'Needs Improvement',
        strengths: ['Completed all interview rounds'],
        improvements: ['API rate limit hit, real feedback unavailable'],
        recommendations: ['Wait a bit for the API quota to reset'],
        summary: `You scored 0/100. We hit the API rate limit so detailed feedback is unavailable.`,
        evaluations: []
      };
    }

    // Merge generated evaluations back into the original transcript
    const enrichedEvaluations = evaluations.map((e, index) => {
      const generatedEval = feedback?.evaluations?.find((ge: any) => ge.questionId === e.questionId) 
                         || feedback?.evaluations?.[index];
      return {
        ...e,
        score: generatedEval?.score || 0,
        feedback: generatedEval?.feedback || 'Feedback generation failed.',
        strengths: generatedEval?.strengths || [],
        improvements: generatedEval?.improvements || []
      };
    });

    const categoryScores = calculateCategoryScores(enrichedEvaluations);
    const roundScores = calculateRoundScores(enrichedEvaluations).filter((rs): rs is NonNullable<typeof rs> => rs !== null);

    return NextResponse.json({
      overallScore: Math.min(100, Math.max(0, feedback?.overallScore || 0)),
      overallGrade: feedback?.overallGrade || 'Average',
      roundScores,
      categoryScores,
      evaluations: enrichedEvaluations,
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
