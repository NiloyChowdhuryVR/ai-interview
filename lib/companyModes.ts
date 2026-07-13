import { CompanyMode, InterviewRound } from './types';

export interface CompanyModeConfig {
  id: CompanyMode;
  label: string;
  emoji: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  description: string;
  technicalFocus: string;    // instructions for technical round
  projectFocus: string;      // instructions for project round
  hrFocus: string;           // instructions for HR round
  questionsPerRound: Record<InterviewRound, number>;
}

export const COMPANY_MODES: Record<CompanyMode, CompanyModeConfig> = {
  'tcs-ninja': {
    id: 'tcs-ninja',
    label: 'TCS Ninja',
    emoji: '🥷',
    difficulty: 'beginner',
    description: 'Entry-level. Covers OOP basics, DSA fundamentals, SQL, and standard HR.',
    technicalFocus: `Focus on: basic OOP concepts (inheritance, polymorphism, encapsulation, abstraction), 
    simple sorting/searching algorithms, basic SQL queries, fundamental data structures (arrays, linked lists, stacks, queues), 
    basic programming questions in their listed language. Keep difficulty easy to medium.`,
    projectFocus: `Ask simple questions: What does the project do? What tech did you use and why? 
    What was your specific role? What challenges did you face? Keep questions straightforward — 
    this is an entry-level round, focus on understanding not architecture.`,
    hrFocus: `Standard TCS HR questions: Tell me about yourself, Why TCS, Where do you see yourself in 5 years, 
    Strengths and weaknesses, Teamwork scenarios, Relocation willingness, Notice period. 
    Keep it friendly and standard.`,
    questionsPerRound: { technical: 4, project: 3, hr: 3 },
  },

  'tcs-digital': {
    id: 'tcs-digital',
    label: 'TCS Digital',
    emoji: '💻',
    difficulty: 'intermediate',
    description: 'Mid-level. Deeper coding, cloud basics, system design intro, and situation-based HR.',
    technicalFocus: `Focus on: intermediate DSA (trees, graphs, dynamic programming basics), 
    REST APIs and HTTP concepts, basic cloud concepts (AWS/Azure/GCP if listed), database design and optimization, 
    framework-specific questions based on resume skills, coding problem-solving approach. Medium difficulty.`,
    projectFocus: `Dive into: system architecture and design choices, database schema decisions, 
    API design, how you handled edge cases, performance optimizations you made, 
    what you would do differently. Probe technical depth.`,
    hrFocus: `Situational questions: Give an example of handling a tight deadline, 
    Describe a conflict with a team member and resolution, How do you prioritize tasks, 
    Experience with Agile/Scrum, Leadership examples, Why this role specifically.`,
    questionsPerRound: { technical: 5, project: 4, hr: 3 },
  },

  'tcs-prime': {
    id: 'tcs-prime',
    label: 'TCS Prime',
    emoji: '👑',
    difficulty: 'advanced',
    description: 'Senior-level. Advanced DSA, full system design, leadership, and strategic HR.',
    technicalFocus: `Focus on: advanced DSA (graph algorithms, segment trees, advanced DP), 
    full system design (design a URL shortener, design Twitter, design a cache), 
    microservices architecture, distributed systems concepts, performance tuning, 
    concurrency and threading. High difficulty — expect detailed explanations.`,
    projectFocus: `Challenge them: How did you ensure scalability? What was the bottleneck and how did you solve it? 
    Walk me through your system design decisions. How would you redesign this for 10x traffic? 
    What monitoring and alerting did you set up? Assume deep technical ownership.`,
    hrFocus: `Leadership and strategy: Describe a time you led a team through a crisis, 
    How do you mentor junior developers, Describe your approach to technical debt, 
    How do you stay current with technology, What is your 5-year technical vision, 
    How do you influence without authority.`,
    questionsPerRound: { technical: 5, project: 4, hr: 3 },
  },

  'google': {
    id: 'google',
    label: 'Google',
    emoji: '🔍',
    difficulty: 'expert',
    description: 'Elite. Hard algorithmic coding, large-scale system design, and Googleyness culture fit.',
    technicalFocus: `Google style: hard LeetCode-level algorithmic problems (graph traversal, advanced DP, 
    string manipulation, bit manipulation), time/space complexity analysis required for every answer, 
    follow-up optimizations, edge case handling, coding style and clarity. 
    Ask based on their skills but push to the hardest variant.`,
    projectFocus: `Google standards: How does your project handle scale? Walk me through the most complex 
    algorithmic challenge in this project. What is the time complexity of your core feature? 
    How would you redesign this to handle Google-scale traffic (billions of users)? 
    What metrics did you use to measure success?`,
    hrFocus: `Googleyness questions: Describe a time you disagreed with your manager and how you handled it, 
    Tell me about a project that failed and what you learned, How do you handle ambiguity, 
    Describe a time you took initiative beyond your role, How do you approach learning something completely new, 
    What makes you a good fit for Google's culture of innovation.`,
    questionsPerRound: { technical: 5, project: 4, hr: 4 },
  },

  'amazon': {
    id: 'amazon',
    label: 'Amazon',
    emoji: '📦',
    difficulty: 'expert',
    description: 'Elite. Strong DSA, AWS/cloud focus, and extensive Leadership Principles (LPs) behavioral questions.',
    technicalFocus: `Amazon style: solid DSA (trees, graphs, dynamic programming), 
    AWS services knowledge if listed on resume (Lambda, S3, DynamoDB, SQS, EC2), 
    distributed systems concepts, API design, database choices and trade-offs. 
    Also ask about operational excellence — how they handle failures and monitoring.`,
    projectFocus: `Customer obsession lens: Who was the customer for this project and how did you ensure you met their needs? 
    What was the business impact? How did you measure success? Describe the biggest technical risk and how you mitigated it. 
    If you used AWS, ask about architecture decisions. Push on ownership and accountability.`,
    hrFocus: `Amazon Leadership Principles — ask at least one question per principle relevant to a dev: 
    Customer Obsession, Ownership, Invent and Simplify, Are Right A Lot, Learn and Be Curious, 
    Hire and Develop the Best, Insist on High Standards, Think Big, Bias for Action, Frugality, 
    Earn Trust, Dive Deep, Have Backbone; Disagree and Commit, Deliver Results. 
    Use the STAR format (Situation, Task, Action, Result).`,
    questionsPerRound: { technical: 5, project: 4, hr: 4 },
  },

  'microsoft': {
    id: 'microsoft',
    label: 'Microsoft',
    emoji: '🪟',
    difficulty: 'advanced',
    description: 'Senior-level. Solid DSA, Azure/cloud, product thinking, and growth mindset culture.',
    technicalFocus: `Microsoft style: medium-hard DSA, .NET or Azure knowledge if on resume, 
    object-oriented design problems (design a parking lot, design a chess game), 
    API and REST design, SQL and NoSQL trade-offs, 
    coding problems with focus on clean code and maintainability.`,
    projectFocus: `Product and engineering lens: How did this project create value for the end user? 
    Walk me through the most important design decision. How did you test this? 
    How did you collaborate with product/design? What would you add to this project with 2 more weeks?`,
    hrFocus: `Growth mindset and collaboration: Tell me about a time you failed and what you learned, 
    How do you give and receive feedback, Describe a situation where you had to learn something quickly, 
    How do you handle disagreements in code reviews, Describe your ideal team culture, 
    Why Microsoft and this specific team.`,
    questionsPerRound: { technical: 5, project: 4, hr: 3 },
  },

  'meta': {
    id: 'meta',
    label: 'Meta',
    emoji: '🌐',
    difficulty: 'expert',
    description: 'Elite. Hard DSA, product impact focus, data systems, and culture-fit behavioral.',
    technicalFocus: `Meta style: hard DSA (arrays, graphs, trees, heaps), 
    large-scale data processing if listed (Spark, Kafka, Hadoop), 
    system design focused on social graph problems, 
    React/frontend depth if listed on resume, 
    coding with emphasis on efficiency and elegance.`,
    projectFocus: `Impact and scale: What was the measurable impact of this project (DAU, latency, revenue)? 
    How did you handle the data scale? What was the hardest engineering problem? 
    How did you test at scale? What was the tradeoff you are most proud of?`,
    hrFocus: `Move fast culture: Tell me about a time you shipped something faster than expected, 
    How do you balance speed with quality, Describe a time you pushed back on a product decision, 
    What is your philosophy on technical debt, Describe your biggest professional impact, 
    Why Meta and what excites you about our products.`,
    questionsPerRound: { technical: 5, project: 4, hr: 4 },
  },

  'infosys': {
    id: 'infosys',
    label: 'Infosys',
    emoji: '🏢',
    difficulty: 'beginner',
    description: 'Entry-level. Fundamentals, basic aptitude programming, and standard HR.',
    technicalFocus: `Infosys style: basic programming concepts, fundamental data structures, 
    simple algorithms, basic OOPS, SQL fundamentals, web basics (if applicable), 
    simple coding questions in their primary language. Keep it foundational.`,
    projectFocus: `Simple walkthrough: Explain your project in simple terms, What tech stack did you use, 
    What was your contribution, What did you learn from building it. 
    Do not go too deep — this is about communication clarity.`,
    hrFocus: `Standard Infosys HR: Tell me about yourself, Why Infosys, 
    Are you comfortable with service-based company nature, 
    Willingness to work on any technology/client, Relocation flexibility, 
    Team player examples, Career goals.`,
    questionsPerRound: { technical: 4, project: 3, hr: 3 },
  },

  'wipro': {
    id: 'wipro',
    label: 'Wipro',
    emoji: '💼',
    difficulty: 'beginner',
    description: 'Entry-level. Core CS fundamentals, basic coding, and soft-skills-focused HR.',
    technicalFocus: `Wipro style: core CS subjects (OS, DBMS, Networks, OOPs basics), 
    simple coding problems, basic data structures, 
    questions on specific technologies listed in resume but at a fundamental level.`,
    projectFocus: `Focus on communication: Describe your project and its purpose, 
    What technologies did you use and why were they chosen, What was the biggest challenge, 
    What would you improve. Gauge clarity of thought and communication.`,
    hrFocus: `Soft skills focus: How do you work in a team, 
    Describe a time you handled a difficult coworker, 
    How do you manage stress and deadlines, Why Wipro, 
    Describe your strengths and how they help in a professional setting, 
    What are your long-term goals.`,
    questionsPerRound: { technical: 4, project: 3, hr: 3 },
  },

  'accenture': {
    id: 'accenture',
    label: 'Accenture',
    emoji: '♾️',
    difficulty: 'intermediate',
    description: 'Mid-level. Consulting mindset, client-facing skills, tech breadth, and teamwork HR.',
    technicalFocus: `Accenture style: broad technology knowledge across their listed skills, 
    cloud and digital transformation concepts, basic agile and DevOps understanding, 
    integration patterns and APIs, practical problem-solving over pure algorithms.`,
    projectFocus: `Consulting lens: How did this project solve a business problem? 
    How did you communicate technical decisions to non-technical stakeholders? 
    What was the client/user impact? How did you manage changing requirements?`,
    hrFocus: `Consulting and teamwork: Describe a time you worked with a difficult client or stakeholder, 
    How do you adapt communication style for different audiences, 
    Give an example of managing multiple priorities, Why consulting, 
    How do you handle ambiguous requirements, Teamwork and collaboration examples.`,
    questionsPerRound: { technical: 5, project: 4, hr: 3 },
  },
};

export const ROUND_LABELS: Record<InterviewRound, string> = {
  technical: 'Technical Round',
  project: 'Project Round',
  hr: 'HR Round',
};

export const ROUND_DESCRIPTIONS: Record<InterviewRound, string> = {
  technical: 'Questions about your skills, languages, and frameworks',
  project: 'Deep dive into the projects listed on your resume',
  hr: 'Behavioral, situational, and culture-fit questions',
};
