import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function POST(req: Request) {
  try {
    let jobDescription = '';
    let dataToAnalyze = '';

    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      jobDescription = formData.get('jobDescription') as string;
      const file = formData.get('file') as File;
      
      if (file) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const pdfParse = (await import('pdf-parse')).default;
        const pdfData = await pdfParse(buffer);
        dataToAnalyze = pdfData.text;
      }
    } else {
      const body = await req.json();
      jobDescription = body.jobDescription;
      dataToAnalyze = body.resumeData ? JSON.stringify(body.resumeData, null, 2) : body.resumeText;
    }

    if (!jobDescription || !dataToAnalyze) {
      return NextResponse.json({ error: 'Missing job description or resume data' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        atsScore: 50,
        missingSkills: ['Setup GEMINI_API_KEY'],
        lackingProjects: 'Cannot perform real ATS check without API key.',
        recommendations: ['Configure Google Gemini API key to enable ATS scanning.']
      });
    }

    const prompt = `You are an expert ATS (Applicant Tracking System) bot and Senior Tech Recruiter.
Evaluate the following Resume against the Target Job Description.

Target Job Description:
"""
${jobDescription}
"""

Candidate Resume:
"""
${dataToAnalyze}
"""

Analyze the match and respond in EXACTLY this JSON format (no markdown, no code blocks, just raw JSON):
{
  "atsScore": <number 0-100, representing match percentage>,
  "missingSkills": ["<skill 1>", "<skill 2>"],
  "lackingProjects": "<1-2 sentence description of what kind of project experience is missing based on the JD>",
  "recommendations": ["<actionable advice 1>", "<actionable advice 2>"]
}

Be brutally honest and strictly evaluate based on the JD requirements. Only output the JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || '';
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(cleanText);

    return NextResponse.json(result);
  } catch (error) {
    console.error('ATS check error:', error);
    return NextResponse.json({ error: 'Failed to perform ATS check' }, { status: 500 });
  }
}
