import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import {
  buildTechnicalQuestionsPrompt,
  buildProjectQuestionsPrompt,
  buildHRQuestionsPrompt,
} from '@/lib/gemini';
import { ResumeData, CompanyMode, InterviewRound, Question } from '@/lib/types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Fallback questions when no API key is set
function getFallbackQuestions(round: InterviewRound, resumeData: ResumeData, companyMode: CompanyMode): Question[] {
  if (round === 'technical') {
    return resumeData.skills.slice(0, 6).map((skill, i) => ({
      id: `tech-${i + 1}`,
      text: `Can you explain your experience with ${skill} and give an example of how you have used it in a project?`,
      category: skill,
      round: 'technical' as InterviewRound,
      difficulty: 'medium' as const,
    }));
  }
  if (round === 'project') {
    return resumeData.projects.flatMap((proj, pi) => [
      {
        id: `proj-${pi + 1}-1`,
        text: `Tell me about your project "${proj.name}". What problem does it solve and how did you approach building it?`,
        category: proj.name,
        round: 'project' as InterviewRound,
        difficulty: 'medium' as const,
      },
      {
        id: `proj-${pi + 1}-2`,
        text: `What was the biggest technical challenge you faced while building "${proj.name}" and how did you overcome it?`,
        category: proj.name,
        round: 'project' as InterviewRound,
        difficulty: 'medium' as const,
      },
    ]);
  }
  // HR round
  return [
    { id: 'hr-1', text: 'Tell me about yourself and your background.', category: 'HR', round: 'hr' as InterviewRound, difficulty: 'easy' as const },
    { id: 'hr-2', text: 'Why are you interested in this company and this role?', category: 'HR', round: 'hr' as InterviewRound, difficulty: 'easy' as const },
    { id: 'hr-3', text: 'Describe a situation where you had to work under pressure to meet a deadline.', category: 'HR', round: 'hr' as InterviewRound, difficulty: 'medium' as const },
    { id: 'hr-4', text: 'What are your greatest strengths and how do they make you a good fit for this role?', category: 'HR', round: 'hr' as InterviewRound, difficulty: 'easy' as const },
    { id: 'hr-5', text: 'Where do you see yourself in 5 years professionally?', category: 'HR', round: 'hr' as InterviewRound, difficulty: 'medium' as const },
    { id: 'hr-6', text: 'Describe a time you had a conflict with a team member. How did you handle it?', category: 'HR', round: 'hr' as InterviewRound, difficulty: 'medium' as const },
  ];
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      resumeData: ResumeData;
      companyMode: CompanyMode;
      round: InterviewRound;
    };

    const { resumeData, companyMode, round } = body;

    if (!resumeData || !companyMode || !round) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate the round has content to generate questions for
    if (round === 'project' && resumeData.projects.length === 0) {
      return NextResponse.json({ questions: [] });
    }
    if (round === 'technical' && resumeData.skills.length === 0) {
      return NextResponse.json({ questions: [] });
    }

    // If no API key, return fallback questions
    if (!process.env.GEMINI_API_KEY) {
      const fallback = getFallbackQuestions(round, resumeData, companyMode);
      return NextResponse.json({ questions: fallback });
    }

    // Build the right prompt for the round
    let prompt: string;
    if (round === 'technical') {
      prompt = buildTechnicalQuestionsPrompt(resumeData, companyMode);
    } else if (round === 'project') {
      prompt = buildProjectQuestionsPrompt(resumeData, companyMode);
    } else {
      prompt = buildHRQuestionsPrompt(resumeData, companyMode);
    }

    let parsed;
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
        parsed = JSON.parse(cleanText);
        
        if (!Array.isArray(parsed?.questions)) {
          throw new Error('Invalid JSON structure: missing questions array');
        }
        
        break; // Success, exit loop
      } catch (genError: any) {
        attempts++;
        const isRateLimitOrOverload = genError?.status === 429 || genError?.status === 503 || genError?.message?.includes('429') || genError?.message?.includes('503') || genError?.message?.includes('quota') || genError?.message?.includes('demand');
        
        console.warn(`[Gemini API] Question generation failed (Attempt ${attempts}/${maxAttempts}). Reason: ${genError?.message || 'Unknown error'}`);
        
        if (attempts < maxAttempts && isRateLimitOrOverload) {
          console.warn('Rate limit or high demand hit. Waiting 15 seconds before retrying...');
          await new Promise(r => setTimeout(r, 15000));
        } else if (attempts === maxAttempts) {
          console.warn('All retries failed. Using fallback questions.');
          const fallback = getFallbackQuestions(round, resumeData, companyMode);
          return NextResponse.json({ questions: fallback });
        }
      }
    }

    // Add round field to every question (Gemini doesn't know about our internal type)
    const questions: Question[] = (parsed.questions || []).map((q: Omit<Question, 'round'>, i: number) => ({
      ...q,
      id: q.id || `${round}-${i + 1}`,
      round,
    }));

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Generate questions error:', error);
    return NextResponse.json({ error: 'Failed to generate questions' }, { status: 500 });
  }
}
