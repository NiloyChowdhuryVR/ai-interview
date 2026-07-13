import { NextResponse } from 'next/server';
import { buildAdaptiveNextPrompt } from '@/lib/gemini';
import { executeWithRotation, getApiKeys } from '@/lib/ai';
import { ResumeData, CompanyMode, InterviewRound, InterviewContext, AdaptiveNextResponse, Question } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      lastQuestion: string;
      lastAnswer: string;
      resumeData: ResumeData;
      companyMode: CompanyMode;
      round: InterviewRound;
      context: InterviewContext;
      questionNumber: number;
      totalQuestions: number;
    };

    const { lastQuestion, lastAnswer, resumeData, companyMode, round, context, questionNumber, totalQuestions } = body;

    if (!lastQuestion || !lastAnswer || !resumeData || !companyMode || !round) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // If no API key, return a simple fallback
    if (getApiKeys().length === 0) {
      const fallback: AdaptiveNextResponse = {
        assessment: {
          questionId: `${round}-${questionNumber}`,
          quality: 'average',
          confidence: 'medium',
          technicalDepth: 'moderate',
          extractedEntities: [],
          topicsCovered: ['general'],
        },
        nextQuestion: {
          id: `${round}-${questionNumber + 1}`,
          text: `Can you tell me more about your experience with ${resumeData.skills[questionNumber % resumeData.skills.length] || 'your work'}?`,
          category: resumeData.skills[questionNumber % resumeData.skills.length] || 'General',
          round,
          difficulty: 'medium',
        },
        difficultyAdjustment: 'maintain',
        acknowledgment: 'Thank you for your answer. Let me ask you something else.',
      };
      return NextResponse.json(fallback);
    }

    const prompt = buildAdaptiveNextPrompt(
      lastQuestion, lastAnswer, resumeData, companyMode, round, context, questionNumber, totalQuestions
    );

    let parsed: any;
    try {
      const response = await executeWithRotation((ai) => 
        ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: prompt,
        })
      , 'Adaptive Next Question');

      const text = response.text || '';
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleanText);

      if (!parsed?.assessment || !parsed?.nextQuestion) {
        throw new Error('Invalid JSON structure: missing assessment or nextQuestion');
      }
    } catch (error) {
      console.warn('All retries failed. Using fallback response.', error);
      return NextResponse.json({
        assessment: {
          questionId: `${round}-${questionNumber}`,
          quality: 'average',
          confidence: 'medium',
          technicalDepth: 'moderate',
          extractedEntities: [],
          topicsCovered: ['general'],
        },
        nextQuestion: {
          id: `${round}-${questionNumber + 1}`,
          text: `Can you elaborate more on your approach to ${resumeData.skills[questionNumber % resumeData.skills.length] || 'problem solving'}?`,
          category: resumeData.skills[questionNumber % resumeData.skills.length] || 'General',
          round,
          difficulty: context.currentDifficulty,
        },
        difficultyAdjustment: 'maintain',
        acknowledgment: 'Thank you for that answer. Let me continue with another question.',
      } satisfies AdaptiveNextResponse);
    }

    // Ensure the nextQuestion has the round field
    const result: AdaptiveNextResponse = {
      assessment: {
        ...parsed.assessment,
        questionId: `${round}-${questionNumber}`,
      },
      nextQuestion: {
        ...parsed.nextQuestion,
        id: parsed.nextQuestion.id || `${round}-${questionNumber + 1}`,
        round,
      },
      difficultyAdjustment: parsed.difficultyAdjustment || 'maintain',
      acknowledgment: parsed.acknowledgment || 'Thank you. Let me ask you the next question.',
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Adaptive next error:', error);
    return NextResponse.json({ error: 'Failed to generate next question' }, { status: 500 });
  }
}
