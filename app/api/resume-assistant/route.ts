import { NextResponse } from 'next/server';
import { executeWithRotation, getApiKeys } from '@/lib/ai';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { targetRole, targetCompany, field, currentText, resumeData } = body;

    if (!targetRole || !field) {
      return NextResponse.json({ error: 'Missing target role or field' }, { status: 400 });
    }

    if (getApiKeys().length === 0) {
      return NextResponse.json({
        suggestion: `[Fallback] Since no API keys are set, here is a generic template for a ${targetRole} at ${targetCompany || 'a top tech company'}. Please add a Gemini API key to get tailored AI suggestions.`
      });
    }

    // Determine specific prompt based on the field being edited
    let systemInstructions = '';
    
    if (field === 'summary') {
      systemInstructions = `Write a highly impactful, ATS-optimized 3-4 sentence professional summary. Focus on the candidate's core strengths, years of experience (if any), and align it heavily with what ${targetCompany ? `${targetCompany} looks for in a ${targetRole}` : `a hiring manager looks for in a ${targetRole}`}.`;
    } else if (field === 'skills') {
      systemInstructions = `List the absolute most critical technical and soft skills required for a ${targetRole} at ${targetCompany ? targetCompany : 'top tech companies'}. Return them as a clean, comma-separated list. Focus on high-demand, modern technologies.`;
    } else if (field === 'experience') {
      systemInstructions = `Write 3-4 powerful, quantifiable resume bullet points for a ${targetRole} role. Use the XYZ formula (Accomplished [X] as measured by [Y], by doing [Z]). Make it sound like they are a perfect fit for ${targetCompany ? targetCompany : 'a top tech company'}.`;
    } else if (field === 'projects') {
      systemInstructions = `Write 2-3 technical resume bullet points describing a complex, impressive project suitable for a ${targetRole}. Focus on technical architecture, problem-solving, and measurable outcomes.`;
    } else {
      systemInstructions = `Write professional resume content for the ${field} section tailored for a ${targetRole} at ${targetCompany || 'a tech company'}.`;
    }

    const context = `
CURRENT RESUME CONTEXT:
${resumeData ? JSON.stringify(resumeData, null, 2) : 'No overall resume context provided.'}

CURRENT TEXT IN THE '${field}' FIELD (Draft/Starting point):
"${currentText || 'None'}"
`;

    const prompt = `You are an elite, highly strict Technical Recruiter and Resume Writer for top-tier tech companies.
Your job is to generate the PERFECT text for the '${field}' section of the candidate's resume.

TARGET ROLE: ${targetRole}
TARGET COMPANY: ${targetCompany || 'Top Tech Companies'}

${systemInstructions}

${context}

CRITICAL RULES:
1. ONLY return the final text to be placed in the resume. Do NOT include greetings, meta-text, or formatting like "Here is the summary:".
2. ABSOLUTELY NO JSON. Do NOT output a JSON object, even if you see JSON in the context. If you are generating bullet points for an experience or project, output plain text bullet points (e.g. starting with "-").
3. If the user provided a "Draft/Starting point", improve and enhance it. If it's empty or very weak, generate from scratch.
4. Use extremely professional, active, and impactful language. Avoid buzzword salad, but ensure ATS keywords are present.
`;

    const response = await executeWithRotation((ai) => 
      ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      })
    , 'Resume Assistant');

    let text = response.text || '';
    
    // Clean up any potential markdown wrapper the AI might add
    text = text.trim();
    if (text.startsWith('```')) {
      const lines = text.split('\n');
      if (lines.length > 1) {
        text = lines.slice(1, -1).join('\n').trim();
      }
    }

    return NextResponse.json({ suggestion: text });
  } catch (error) {
    console.error('Resume Assistant API Error:', error);
    return NextResponse.json({ error: 'Failed to generate suggestion' }, { status: 500 });
  }
}
