import { NextResponse } from 'next/server';
import { executeWithRotation, getApiKeys } from '@/lib/ai';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (getApiKeys().length === 0) {
      return NextResponse.json({ error: 'No Gemini API key configured.' }, { status: 400 });
    }

    const systemPrompt = `You are an elite, high-end Executive Resume Writer and Technical Recruiter.
Your goal is to build an "unbeatable" ATS-friendly resume that scores 90+ for the candidate.
You do this by having a short, interactive conversation with them.

RULES FOR THE CONVERSATION:
1. Ask ONE question at a time. Do not overwhelm the candidate.
2. First, figure out their target role and target companies.
3. Then, ask for a brief dump of their skills, a project they are proud of, and their most recent experience.
4. Keep the conversation extremely brief (maximum 3-5 turns total). You do not need their entire life story, just enough to generate a highly impressive, stylized resume.
5. If the user gives brief or lazy answers, use your expert knowledge to EXPAND those answers into highly professional, deep, and quantifiable bullet points using the XYZ formula.
6. Once you have enough information to build a solid resume, you MUST output the final resume.

RESPONSE FORMAT:
You must ALWAYS respond in valid JSON. No markdown, no code blocks, just raw JSON.
You can respond in ONE of TWO formats:

Format 1 (Asking a question):
{
  "type": "question",
  "text": "Your conversational question here..."
}

Format 2 (Generating the final resume):
{
  "type": "complete",
  "resumeData": {
    "personalInfo": { "name": "John Doe", "email": "john@example.com", "phone": "", "linkedin": "", "github": "" },
    "summary": "3-4 sentence highly impactful summary...",
    "experience": [
      { "title": "Software Engineer", "company": "Tech Corp", "date": "Jan 2022 - Present", "description": "3-4 highly detailed, XYZ-formula bullet points separated by newlines" }
    ],
    "education": [
      { "degree": "B.S. Computer Science", "school": "University", "date": "2024" }
    ],
    "projects": [
      { "name": "Project Name", "date": "2023", "description": "2-3 highly detailed technical bullet points separated by newlines", "tech": "React, Node.js" }
    ],
    "skills": "Highly relevant, modern technical skills separated by commas",
    "certifications": []
  }
}

CRITICAL: When generating 'experience' and 'projects' descriptions, use plain text bullet points (e.g. starting with "-"). DO NOT nest JSON inside the descriptions. Make the content sound incredibly impressive, professional, and tailored for top tech companies.`;

    // Construct the conversation history for Gemini
    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    // Inject system prompt into the first message or as a separate system instruction
    const fullContents = [
      { role: 'user', parts: [{ text: `[SYSTEM INSTRUCTIONS]:\n${systemPrompt}\n\n[USER SAYS]:\n${messages[0].content}` }] },
      ...contents.slice(1)
    ];

    const response = await executeWithRotation((ai) => 
      ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullContents,
      })
    , 'Resume Wizard');

    let text = response.text || '';
    
    // Clean up JSON
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse wizard JSON:', text);
      throw new Error('AI returned invalid format.');
    }

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error('Resume Wizard API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process wizard request' }, { status: 500 });
  }
}
