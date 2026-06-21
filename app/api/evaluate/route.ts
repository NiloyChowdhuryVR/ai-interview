import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import { buildEvaluatePrompt } from '@/lib/gemini';
import { AnswerEvaluation, InterviewRound, CompanyMode } from '@/lib/types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function POST(req: Request) {
  try {
    const { question, answer, category, questionId, round, companyMode } = await req.json() as {
      question: string;
      answer: string;
      category: string;
      questionId: string;
      round: InterviewRound;
      companyMode: CompanyMode;
    };

    if (!process.env.GEMINI_API_KEY) {
      // Fallback when no API key
      return NextResponse.json({
        questionId,
        question,
        answer,
        category,
        round,
        score: Math.floor(Math.random() * 4) + 5,
        feedback: 'API key not configured. This is a placeholder evaluation. Add your GEMINI_API_KEY to .env.local for real feedback.',
        strengths: ['Attempted to answer the question', 'Showed willingness to engage'],
        improvements: ['Configure GEMINI_API_KEY for real evaluation', 'Practice articulating your answers more clearly'],
      } satisfies AnswerEvaluation);
    }

    const prompt = buildEvaluatePrompt(question, answer, category, round, companyMode);

    let evaluation;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const text = response.text || '';
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      evaluation = JSON.parse(cleanText);
    } catch (apiError) {
      console.warn('Gemini evaluation failed (likely rate limit). Using fallback evaluation.', apiError);
      evaluation = {
        score: Math.floor(Math.random() * 3) + 6, // 6 to 8
        feedback: 'We hit the API rate limit so this is a generic placeholder evaluation. You provided a reasonable answer.',
        strengths: ['Spoke clearly', 'Answered the prompt'],
        improvements: ['Could provide more detail'],
      };
    }

    return NextResponse.json({
      questionId,
      question,
      answer,
      category,
      round,
      score: Math.min(10, Math.max(0, evaluation.score)),
      feedback: evaluation.feedback || 'No feedback available.',
      strengths: evaluation.strengths || [],
      improvements: evaluation.improvements || [],
    } satisfies AnswerEvaluation);
  } catch (error) {
    console.error('Evaluation error:', error);
    return NextResponse.json({ error: 'Failed to evaluate answer' }, { status: 500 });
  }
}
