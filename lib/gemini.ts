import { AnswerEvaluation, ResumeData, InterviewRound } from './types';
import { CompanyMode } from './types';
import { COMPANY_MODES } from './companyModes';

// ─── Resume Parsing Prompt ────────────────────────────────────────────────────

export function buildResumeParsePrompt(rawText: string): string {
  return `You are a resume parser. Extract structured information from the following resume text.

Resume Text:
"""
${rawText}
"""

Respond in EXACTLY this JSON format (no markdown, no code blocks, just raw JSON):
{
  "skills": ["skill1", "skill2", "..."],
  "projects": [
    {
      "name": "Project Name",
      "description": "What the project does in 1-2 sentences",
      "technologies": ["tech1", "tech2"]
    }
  ],
  "experience": ["Job Title at Company (Year-Year)", "..."],
  "education": ["Degree from Institution (Year)", "..."]
}

Rules:
- skills: List ALL technical skills, languages, frameworks, tools, databases, cloud platforms mentioned
- projects: List ALL projects mentioned, including academic, personal, and professional
- experience: List jobs/internships in "Title at Company" format
- education: List degrees with institution name
- If a section is empty, return an empty array []
- Only output valid JSON, nothing else`;
}

// ─── Question Generation Prompts ──────────────────────────────────────────────

export function buildTechnicalQuestionsPrompt(resumeData: ResumeData, companyMode: CompanyMode): string {
  const modeConfig = COMPANY_MODES[companyMode];
  const skillsList = resumeData.skills.join(', ');

  return `You are an expert technical interviewer conducting a ${modeConfig.label} technical interview.

The candidate's skills from their resume: ${skillsList}

Company Interview Style Instructions:
${modeConfig.technicalFocus}

Generate a comprehensive set of technical interview questions covering ALL the candidate's listed skills.
- Generate enough questions to thoroughly cover every skill area listed
- Group related skills together but cover each one
- Vary the difficulty appropriately for ${modeConfig.label} (${modeConfig.difficulty} level)
- Do NOT ask about skills not mentioned on the resume
- Make questions specific and probing, not generic
- CRITICAL: This is a VOICE interview. DO NOT ask the candidate to "write a function", "write a query", or "write code". Instead, ask them to explain the algorithm, describe the logic, outline the approach, or explain the intuition behind the solution.
- CRITICAL: Do NOT include conversational filler, greetings, or meta-instructions (like "Take your time") in the question text. The text should ONLY be the actual interview question itself.

Respond in EXACTLY this JSON format (no markdown, no code blocks, just raw JSON):
{
  "questions": [
    {
      "id": "tech-1",
      "text": "The full interview question text",
      "category": "The specific skill/topic this question covers",
      "difficulty": "easy|medium|hard"
    }
  ]
}

Only output the JSON, nothing else.`;
}

export function buildProjectQuestionsPrompt(resumeData: ResumeData, companyMode: CompanyMode): string {
  const modeConfig = COMPANY_MODES[companyMode];
  const projectsList = resumeData.projects.map((p, i) =>
    `Project ${i + 1}: "${p.name}" — ${p.description} (Tech: ${p.technologies.join(', ')})`
  ).join('\n');

  return `You are an expert technical interviewer conducting a ${modeConfig.label} project deep-dive round.

The candidate's projects:
${projectsList}

Company Interview Style Instructions:
${modeConfig.projectFocus}

Generate 3 to 5 interview questions for EACH project listed above.
- Questions should be specific to that project, not generic
- Reference the actual project name and technologies in the questions
- Cover different angles: design decisions, challenges, testing, impact, improvements
- Difficulty: ${modeConfig.difficulty} level
- CRITICAL: This is a VOICE interview. DO NOT ask the candidate to "write code" or "write a query". Ask them to explain the architecture, logic, or algorithmic decisions.
- CRITICAL: Do NOT include conversational filler, greetings, or meta-instructions (like "Take your time") in the question text. The text should ONLY be the actual interview question itself.

Respond in EXACTLY this JSON format (no markdown, no code blocks, just raw JSON):
{
  "questions": [
    {
      "id": "proj-1",
      "text": "The full interview question text referencing the specific project",
      "category": "The project name this question is about",
      "difficulty": "easy|medium|hard"
    }
  ]
}

Only output the JSON, nothing else.`;
}

export function buildHRQuestionsPrompt(resumeData: ResumeData, companyMode: CompanyMode): string {
  const modeConfig = COMPANY_MODES[companyMode];
  const context = [
    resumeData.experience.length > 0 ? `Experience: ${resumeData.experience.join(', ')}` : '',
    resumeData.skills.length > 0 ? `Key skills: ${resumeData.skills.slice(0, 8).join(', ')}` : '',
    resumeData.projects.length > 0 ? `Projects: ${resumeData.projects.map(p => p.name).join(', ')}` : '',
  ].filter(Boolean).join('\n');

  return `You are an experienced HR interviewer conducting a ${modeConfig.label} HR round.

Candidate background:
${context}

Company HR Interview Style Instructions:
${modeConfig.hrFocus}

Generate a comprehensive set of HR and behavioral interview questions.
- Generate enough questions to fully cover the company's HR evaluation criteria
- Tailor questions to the candidate's background where possible
- Include situational, behavioral (STAR format), and culture-fit questions
- Make them specific to ${modeConfig.label} culture and expectations

Respond in EXACTLY this JSON format (no markdown, no code blocks, just raw JSON):
{
  "questions": [
    {
      "id": "hr-1",
      "text": "The full HR question text",
      "category": "HR",
      "difficulty": "easy|medium|hard"
    }
  ]
}

Only output the JSON, nothing else.`;
}

// ─── Evaluation Prompt ────────────────────────────────────────────────────────

export function buildEvaluatePrompt(
  question: string,
  answer: string,
  category: string,
  round: InterviewRound,
  companyMode: CompanyMode
): string {
  const modeConfig = COMPANY_MODES[companyMode];
  const roundContext = round === 'technical'
    ? `This is a technical skills question. Evaluate based on correctness and depth.`
    : round === 'project'
    ? `This is a project deep-dive question. Evaluate based on technical ownership and clarity.`
    : `This is an HR/behavioral question. Evaluate based on communication, self-awareness, and culture fit.`;

  return `You are an expert interviewer evaluating a candidate for a ${modeConfig.label} interview.

${roundContext}
Company Standard: ${modeConfig.difficulty} level, ${modeConfig.label} expectations.

Question: ${question}
Topic/Category: ${category}
Candidate's Answer: ${answer}

IMPORTANT: This is a VOICE interview. The candidate is speaking their answer. Do NOT penalize them for lack of exact code syntax or minor verbal stumbles. Focus on their logical approach, intuition, and understanding of the concepts.

Evaluate the answer and respond in EXACTLY this JSON format (no markdown, no code blocks, just raw JSON):
{
  "score": <number 0-10>,
  "feedback": "<1-2 sentence evaluation specific to ${modeConfig.label} standards>",
  "strengths": ["<specific strength>", "<specific strength>"],
  "improvements": ["<specific area to improve>", "<specific area to improve>"]
}

Scoring for ${modeConfig.label} (${modeConfig.difficulty}):
- 9-10: Excellent — exceeds ${modeConfig.label} expectations
- 7-8: Good — meets ${modeConfig.label} expectations  
- 5-6: Average — partially meets expectations, gaps present
- 3-4: Weak — significant gaps for this role
- 0-2: Poor — no relevant content or completely wrong

Only output the JSON, nothing else.`;
}

// ─── Final Feedback Prompt ────────────────────────────────────────────────────

export function buildFeedbackPrompt(evaluations: AnswerEvaluation[], companyMode: CompanyMode): string {
  const modeConfig = COMPANY_MODES[companyMode];

  const evalSummary = evaluations.map((e, i) =>
    `Q${i + 1} [${e.round.toUpperCase()} | ${e.category}]: ${e.question}\nAnswer: ${e.answer}\nScore: ${e.score}/10\nFeedback: ${e.feedback}`
  ).join('\n\n');

  return `You are an expert interviewer providing final feedback after a complete ${modeConfig.label} interview.

All interview evaluations:
${evalSummary}

Generate a comprehensive interview feedback report in EXACTLY this JSON format (no markdown, no code blocks, just raw JSON):
{
  "overallScore": <number 0-100>,
  "overallGrade": "<one of: Excellent, Good, Average, Needs Improvement, Poor>",
  "strengths": ["<top strength>", "<top strength>", "<top strength>"],
  "improvements": ["<area to improve>", "<area to improve>", "<area to improve>"],
  "recommendations": ["<actionable learning recommendation>", "<recommendation>", "<recommendation>"],
  "summary": "<3-4 sentence overall summary of the candidate's performance for ${modeConfig.label} specifically>"
}

Base the overall score on all individual question scores weighted equally.
Frame all feedback in the context of ${modeConfig.label} interview standards.
Be constructive, specific, and actionable. Only output the JSON, nothing else.`;
}

// ─── Category Score Calculator ────────────────────────────────────────────────

export function calculateCategoryScores(evaluations: AnswerEvaluation[]) {
  const categoryMap = new Map<string, { total: number; count: number }>();

  evaluations.forEach(e => {
    const existing = categoryMap.get(e.category) || { total: 0, count: 0 };
    existing.total += e.score;
    existing.count += 1;
    categoryMap.set(e.category, existing);
  });

  return Array.from(categoryMap.entries()).map(([category, { total, count }]) => ({
    category,
    score: total,
    maxScore: count * 10,
    percentage: Math.round((total / (count * 10)) * 100),
  }));
}

export function calculateRoundScores(evaluations: AnswerEvaluation[]) {
  const rounds: InterviewRound[] = ['technical', 'project', 'hr'];
  return rounds
    .map(round => {
      const roundEvals = evaluations.filter(e => e.round === round);
      if (roundEvals.length === 0) return null;
      const avg = roundEvals.reduce((a, b) => a + b.score, 0) / roundEvals.length;
      return {
        round,
        score: Math.round(avg * 10),
        questionsAsked: roundEvals.length,
        grade: avg >= 8 ? 'Excellent' : avg >= 6 ? 'Good' : avg >= 4 ? 'Average' : 'Needs Improvement',
      };
    })
    .filter(Boolean);
}
