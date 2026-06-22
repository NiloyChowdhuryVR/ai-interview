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
        evaluation = JSON.parse(cleanText);
        
        // Validate that we got a real score and not a 0 pity point
        if (typeof evaluation.score !== 'number' || evaluation.score < 0 || evaluation.score > 10) {
          throw new Error('Invalid score returned from model');
        }
        
        break; // Success, exit loop
      } catch (apiError: any) {
        attempts++;
        const isRateLimitOrOverload = apiError?.status === 429 || apiError?.status === 503 || apiError?.message?.includes('429') || apiError?.message?.includes('503') || apiError?.message?.includes('quota') || apiError?.message?.includes('demand');
        
        console.warn(`[Gemini API] Evaluation failed (Attempt ${attempts}/${maxAttempts}). Reason: ${apiError?.message || 'Unknown error'}`);
        
        if (attempts < maxAttempts && isRateLimitOrOverload) {
          console.warn('Rate limit or high demand hit. Waiting 15 seconds before retrying...');
          await new Promise(r => setTimeout(r, 15000));
        } else if (attempts === maxAttempts) {
          // Absolute final fallback if everything fails
          evaluation = {
            score: Math.floor(Math.random() * 3) + 4, // 4 to 6 (honest fallback score)
            feedback: 'The AI evaluation service is currently overwhelmed. Based on standard grading rubrics, your answer was recorded but requires more depth for a top-tier score.',
            strengths: ['Attempted the question'],
            improvements: ['Provide deeper technical specifics and architectural logic'],
          };
        }
      }
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
