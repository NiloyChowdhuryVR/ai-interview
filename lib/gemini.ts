import { AnswerEvaluation, ResumeData, InterviewRound, InterviewContext, Question } from './types';
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

// ─── Adaptive Next Question Prompt ────────────────────────────────────────────

export function buildAdaptiveNextPrompt(
  lastQuestion: string,
  lastAnswer: string,
  resumeData: ResumeData,
  companyMode: CompanyMode,
  round: InterviewRound,
  context: InterviewContext,
  questionNumber: number,
  totalQuestions: number
): string {
  const modeConfig = COMPANY_MODES[companyMode];
  const roundFocus = round === 'technical' ? modeConfig.technicalFocus
    : round === 'project' ? modeConfig.projectFocus
    : modeConfig.hrFocus;

  const resumeContext = [
    resumeData.skills.length > 0 ? `Skills: ${resumeData.skills.join(', ')}` : '',
    resumeData.projects.length > 0 ? `Projects: ${resumeData.projects.map(p => `${p.name} (${p.technologies.join(', ')})`).join('; ')}` : '',
    resumeData.experience.length > 0 ? `Experience: ${resumeData.experience.join(', ')}` : '',
  ].filter(Boolean).join('\n');

  const previousHistory = context.assessments.map((a, i) => 
    `Q${i + 1}: [${a.quality.toUpperCase()}] Topics: ${a.topicsCovered.join(', ')}`
  ).join('\n');

  return `You are an expert ${modeConfig.label} interviewer conducting a live ${round} round interview.
You are a HUMAN interviewer, not a script reader. Be conversational and adaptive.

CANDIDATE RESUME:
${resumeContext}

INTERVIEW CONTEXT:
- Round: ${round}
- Company: ${modeConfig.label} (${modeConfig.difficulty} level)
- This is question ${questionNumber} of ${totalQuestions} in this round
- Current difficulty level: ${context.currentDifficulty}
- Technologies candidate has mentioned so far: ${context.technologiesMentioned.length > 0 ? context.technologiesMentioned.join(', ') : 'None yet'}
- Projects candidate has discussed: ${context.projectsMentioned.length > 0 ? context.projectsMentioned.join(', ') : 'None yet'}
- Concepts already covered: ${context.conceptsDiscussed.length > 0 ? context.conceptsDiscussed.join(', ') : 'None yet'}
- Topics already asked about: ${context.topicsCovered.length > 0 ? context.topicsCovered.join(', ') : 'None yet'}
${previousHistory ? `\nPERFORMANCE HISTORY:\n${previousHistory}` : ''}

ROUND FOCUS:
${roundFocus}

LAST QUESTION ASKED:
"${lastQuestion}"

CANDIDATE'S ANSWER:
"${lastAnswer}"

IMPORTANT RULES:
1. This is a VOICE interview. Never ask them to write code. Ask them to explain, describe, or walk through their approach.
2. Do NOT include greetings, filler, or meta-instructions in the question text.
3. Do NOT repeat topics already covered. Ask about something NEW.
4. If the candidate mentioned a specific technology, project, or concept in their answer, you MAY reference it naturally in your next question (e.g., "You mentioned Redis earlier — how did you handle cache invalidation?").
5. Adjust difficulty based on performance: if they're doing well, go deeper; if struggling, ask something more foundational.
6. The question MUST be relevant to the ${round} round focus area.

Respond in EXACTLY this JSON format (no markdown, no code blocks, just raw JSON):
{
  "assessment": {
    "quality": "weak|average|strong",
    "confidence": "low|medium|high",
    "technicalDepth": "shallow|moderate|deep",
    "extractedEntities": ["technology or concept the candidate mentioned"],
    "topicsCovered": ["broad topic this Q&A covered"]
  },
  "nextQuestion": {
    "id": "${round}-${questionNumber + 1}",
    "text": "The next interview question — adapted to the candidate's performance and previous answers",
    "category": "The topic/skill this question covers",
    "difficulty": "easy|medium|hard"
  },
  "difficultyAdjustment": "increase|maintain|decrease",
  "acknowledgment": "A brief, natural 1-sentence acknowledgment of their answer (e.g., 'Interesting approach with Redis.' or 'Good overview. Let me ask you something different.')"
}

Only output the JSON, nothing else.`;
}

// ─── Evaluation Prompt ────────────────────────────────────────────────────────

export function buildFeedbackPrompt(evaluations: AnswerEvaluation[], companyMode: CompanyMode): string {
  const modeConfig = COMPANY_MODES[companyMode];

  const evalSummary = evaluations.map((e, i) =>
    `Q${i + 1} [${e.round.toUpperCase()} | ${e.category}]: ${e.question}\nCandidate's Answer: ${e.answer}`
  ).join('\n\n');

  return `You are an expert interviewer providing final feedback after a complete ${modeConfig.label} interview.

Here is the transcript of all questions asked and the candidate's answers:
${evalSummary}

IMPORTANT: This was a VOICE interview. The candidate spoke their answers. Do NOT penalize them for lack of exact code syntax or minor verbal stumbles. Focus on their logical approach, intuition, and understanding of the concepts.

Evaluate EVERY single answer individually, and then provide an overall summary of the interview.
Respond in EXACTLY this JSON format (no markdown, no code blocks, just raw JSON):
{
  "overallScore": <number 0-100>,
  "overallGrade": "<one of: Excellent, Good, Average, Needs Improvement, Poor>",
  "summary": "<3-4 sentence overall summary of the candidate's performance for ${modeConfig.label} specifically>",
  "strengths": ["<top overall strength>", "<top overall strength>", "<top overall strength>"],
  "improvements": ["<overall area to improve>", "<overall area to improve>", "<overall area to improve>"],
  "recommendations": ["<actionable learning recommendation>", "<recommendation>", "<recommendation>"],
  "evaluations": [
    {
      "questionId": "<must exactly match the question ID from the input transcript, e.g. tech-1, proj-1-1, hr-1. Use sequential IDs if none provided>",
      "score": <number 0-10>,
      "feedback": "<Explicitly justify the exact score given. Then provide professional, constructive feedback.>",
      "strengths": ["<specific strength for this answer>"],
      "improvements": ["<specific improvement for this answer>"]
    }
  ]
}

Scoring Rubric per Question (${modeConfig.difficulty} level):
- 9-10: Excellent — Comprehensive, highly detailed, technically accurate.
- 7-8: Good — Solid understanding with minor gaps.
- 5-6: Average — High-level or brief response. Lacks deep technical specifics.
- 3-4: Weak — Extremely brief, vague, or misses the core of the question.
- 0-2: Poor/Unanswered — Factually incorrect, skipped, or zero effort.

CRITICAL: Your "evaluations" array MUST contain exactly one evaluation object for every question asked above, in the exact same order. Base the overall score on all individual question scores weighted equally. Only output the JSON, nothing else.`;
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
