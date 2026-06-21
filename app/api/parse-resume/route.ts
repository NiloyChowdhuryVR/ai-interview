import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import { buildResumeParsePrompt } from '@/lib/gemini';
import pdf from 'pdf-parse';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('resume') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No resume file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text from PDF using classic pdf-parse v1
    let rawText = '';
    try {
      const pdfData = await pdf(buffer);
      rawText = pdfData.text;
    } catch (parseErr) {
      console.error('PDF parse error:', parseErr);
      return NextResponse.json(
        { error: 'Could not extract text from PDF. Please ensure it is a text-based PDF, not a scanned image.' },
        { status: 422 }
      );
    }

    if (!rawText || rawText.trim().length < 30) {
      return NextResponse.json(
        { error: 'Resume appears empty or unreadable. Please upload a text-based PDF.' },
        { status: 422 }
      );
    }

    // Fallback when no API key: return mock data based on raw text
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        skills: ['JavaScript', 'React', 'Node.js', 'Python', 'SQL'],
        projects: [
          {
            name: 'Sample Project',
            description: 'A web application built for demo purposes',
            technologies: ['React', 'Node.js', 'MongoDB'],
          },
        ],
        experience: ['Software Developer Intern at TechCorp (2023-2024)'],
        education: ['B.Tech Computer Science from XYZ University (2024)'],
        rawText: rawText.slice(0, 2000),
      });
    }

    const prompt = buildResumeParsePrompt(rawText);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || '';
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanText);

    return NextResponse.json({
      ...parsed,
      rawText: rawText.slice(0, 3000),
    });
  } catch (error) {
    console.error('Resume parse error:', error);
    return NextResponse.json({ error: 'Failed to parse resume' }, { status: 500 });
  }
}
