export type Difficulty = "L1" | "L2" | "L3" | "L4" | "L5" | "L6";
export type TaskType = "knowledge" | "reasoning" | "creative" | "tool_use" | "retrieval" | "multi_step";

export interface EvalDimension {
  id: string;
  name: string;
  description: string;
}

export interface BenchmarkPrompt {
  id: string;
  difficulty: Difficulty;
  type: TaskType;
  prompt: string;
  evalDimensions: EvalDimension[];
}

export const DIFFICULTY_LABELS: Record<Difficulty, { name: string; description: string }> = {
  L1: { name: "Basic Recall", description: "Simple factual questions with clear answers" },
  L2: { name: "Structured Output", description: "Tasks requiring specific format, structure, or constraints" },
  L3: { name: "Analysis & Reasoning", description: "Multi-step reasoning, comparison, or trade-off analysis" },
  L4: { name: "Tool Use & Retrieval", description: "Tasks requiring tool calls, data lookup, or external context" },
  L5: { name: "Complex Synthesis", description: "Combining multiple sources, constraints, and domain knowledge" },
  L6: { name: "Agentic Workflow", description: "Multi-step tasks with planning, tool chaining, and self-correction" },
};

const DIM_ACCURACY: EvalDimension = { id: "accuracy", name: "Accuracy", description: "Factual correctness and precision" };
const DIM_COMPLETENESS: EvalDimension = { id: "completeness", name: "Completeness", description: "Fully addresses all parts of the task" };
const DIM_CONCISENESS: EvalDimension = { id: "conciseness", name: "Conciseness", description: "Right length — not padded, not truncated" };
const DIM_STRUCTURE: EvalDimension = { id: "structure", name: "Structure", description: "Output follows requested format precisely" };
const DIM_REASONING: EvalDimension = { id: "reasoning", name: "Reasoning", description: "Logical chain is sound and well-supported" };
const DIM_USEFULNESS: EvalDimension = { id: "usefulness", name: "Usefulness", description: "Actionable and valuable to a real user" };
const DIM_CREATIVITY: EvalDimension = { id: "creativity", name: "Creativity", description: "Original, non-generic, shows insight" };
const DIM_TOOL_USE: EvalDimension = { id: "tool_use", name: "Tool Use", description: "Correctly identifies when and how to call tools" };
const DIM_RETRIEVAL: EvalDimension = { id: "retrieval", name: "Retrieval Quality", description: "Extracts and cites relevant information from context" };
const DIM_PLANNING: EvalDimension = { id: "planning", name: "Planning", description: "Breaks complex tasks into logical steps" };
const DIM_COHERENCE: EvalDimension = { id: "coherence", name: "Coherence", description: "Consistent logic across a multi-step workflow" };
const DIM_SELF_CORRECTION: EvalDimension = { id: "self_correction", name: "Self-Correction", description: "Detects and recovers from mistakes" };

export const BENCHMARK_PROMPTS: BenchmarkPrompt[] = [
  // ============================================================
  // L1: Basic Recall (10 prompts)
  // ============================================================
  { id: "L1-01", difficulty: "L1", type: "knowledge", prompt: "What is the difference between TCP and UDP? Keep it to 3 sentences.", evalDimensions: [DIM_ACCURACY, DIM_COMPLETENESS, DIM_CONCISENESS] },
  { id: "L1-02", difficulty: "L1", type: "knowledge", prompt: "Explain what a RESTful API is in plain English. Maximum 4 sentences.", evalDimensions: [DIM_ACCURACY, DIM_COMPLETENESS, DIM_CONCISENESS] },
  { id: "L1-03", difficulty: "L1", type: "knowledge", prompt: "What does ACID stand for in database systems? Explain each letter in one sentence.", evalDimensions: [DIM_ACCURACY, DIM_COMPLETENESS, DIM_STRUCTURE] },
  { id: "L1-04", difficulty: "L1", type: "knowledge", prompt: "Name 3 differences between SQL and NoSQL databases.", evalDimensions: [DIM_ACCURACY, DIM_COMPLETENESS, DIM_CONCISENESS] },
  { id: "L1-05", difficulty: "L1", type: "knowledge", prompt: "What is the CAP theorem? Explain it simply.", evalDimensions: [DIM_ACCURACY, DIM_COMPLETENESS, DIM_CONCISENESS] },
  { id: "L1-06", difficulty: "L1", type: "knowledge", prompt: "What is the difference between authentication and authorization?", evalDimensions: [DIM_ACCURACY, DIM_COMPLETENESS, DIM_CONCISENESS] },
  { id: "L1-07", difficulty: "L1", type: "knowledge", prompt: "Explain what Docker containers are and how they differ from virtual machines. Keep it brief.", evalDimensions: [DIM_ACCURACY, DIM_COMPLETENESS, DIM_CONCISENESS] },
  { id: "L1-08", difficulty: "L1", type: "knowledge", prompt: "What is a webhook? Give one real-world example.", evalDimensions: [DIM_ACCURACY, DIM_COMPLETENESS, DIM_USEFULNESS] },
  { id: "L1-09", difficulty: "L1", type: "knowledge", prompt: "What are the main HTTP methods and when do you use each?", evalDimensions: [DIM_ACCURACY, DIM_COMPLETENESS, DIM_STRUCTURE] },
  { id: "L1-10", difficulty: "L1", type: "knowledge", prompt: "What is the difference between a process and a thread?", evalDimensions: [DIM_ACCURACY, DIM_COMPLETENESS, DIM_CONCISENESS] },

  // ============================================================
  // L2: Structured Output (10 prompts)
  // ============================================================
  { id: "L2-01", difficulty: "L2", type: "creative", prompt: "Write a professional cold email to a VP of Engineering introducing an AI code review tool. Under 150 words. Include subject line.", evalDimensions: [DIM_STRUCTURE, DIM_USEFULNESS, DIM_CONCISENESS, DIM_CREATIVITY] },
  { id: "L2-02", difficulty: "L2", type: "reasoning", prompt: "Create a comparison table of React, Vue, and Svelte with columns: Learning Curve, Performance, Ecosystem, Best For. Use markdown table format.", evalDimensions: [DIM_STRUCTURE, DIM_ACCURACY, DIM_COMPLETENESS, DIM_USEFULNESS] },
  { id: "L2-03", difficulty: "L2", type: "creative", prompt: "Write a product changelog entry for a new feature: 'AI-powered search that understands natural language queries.' Follow Keep a Changelog format.", evalDimensions: [DIM_STRUCTURE, DIM_CREATIVITY, DIM_CONCISENESS, DIM_USEFULNESS] },
  { id: "L2-04", difficulty: "L2", type: "reasoning", prompt: "List exactly 5 risks of deploying LLMs in production. For each risk, provide: Risk Name, Severity (High/Medium/Low), Mitigation. Use bullet points.", evalDimensions: [DIM_STRUCTURE, DIM_ACCURACY, DIM_COMPLETENESS, DIM_USEFULNESS] },
  { id: "L2-05", difficulty: "L2", type: "creative", prompt: "Write a 30-second elevator pitch for a startup that uses AI agents to automate IT helpdesk tickets. Target audience: CTO of a mid-size company.", evalDimensions: [DIM_STRUCTURE, DIM_CREATIVITY, DIM_USEFULNESS, DIM_CONCISENESS] },
  { id: "L2-06", difficulty: "L2", type: "reasoning", prompt: "Return a valid JSON object with keys: 'pros' (array of 3 strings), 'cons' (array of 3 strings), 'verdict' (string) for the question: Should a startup use microservices from day one?", evalDimensions: [DIM_STRUCTURE, DIM_ACCURACY, DIM_REASONING, DIM_USEFULNESS] },
  { id: "L2-07", difficulty: "L2", type: "creative", prompt: "Write 3 different LinkedIn headline options for a PM transitioning from enterprise B2B into AI product management. Each under 120 characters.", evalDimensions: [DIM_STRUCTURE, DIM_CREATIVITY, DIM_USEFULNESS, DIM_CONCISENESS] },
  { id: "L2-08", difficulty: "L2", type: "reasoning", prompt: "Create a decision matrix for choosing between AWS Lambda, Google Cloud Run, and Vercel for deploying a Next.js API. Rate each 1-5 on: Cost, DX, Scalability, Cold Start.", evalDimensions: [DIM_STRUCTURE, DIM_ACCURACY, DIM_COMPLETENESS, DIM_USEFULNESS] },
  { id: "L2-09", difficulty: "L2", type: "creative", prompt: "Write a bug report in standard format (Title, Steps to Reproduce, Expected, Actual, Environment) for: 'Search bar returns no results when query contains special characters.'", evalDimensions: [DIM_STRUCTURE, DIM_COMPLETENESS, DIM_USEFULNESS, DIM_ACCURACY] },
  { id: "L2-10", difficulty: "L2", type: "reasoning", prompt: "Create a RACI matrix (Responsible, Accountable, Consulted, Informed) for launching a new AI feature. Roles: PM, Engineer, Designer, Data Scientist, Legal. Tasks: Spec, Build, Test, Legal Review, Launch.", evalDimensions: [DIM_STRUCTURE, DIM_ACCURACY, DIM_COMPLETENESS, DIM_USEFULNESS] },

  // ============================================================
  // L3: Analysis & Reasoning (10 prompts)
  // ============================================================
  { id: "L3-01", difficulty: "L3", type: "reasoning", prompt: "Compare Cursor, Windsurf, and GitHub Copilot in 5 bullet points. Be specific about architectural and UX differences, not generic praise.", evalDimensions: [DIM_ACCURACY, DIM_REASONING, DIM_USEFULNESS, DIM_COMPLETENESS] },
  { id: "L3-02", difficulty: "L3", type: "reasoning", prompt: "A startup has 10K DAU, a monolithic Python backend, and is hiring its 5th engineer. Should they migrate to microservices now? Argue both sides, then give your recommendation with reasoning.", evalDimensions: [DIM_REASONING, DIM_COMPLETENESS, DIM_USEFULNESS, DIM_ACCURACY] },
  { id: "L3-03", difficulty: "L3", type: "reasoning", prompt: "An e-commerce company sees 40% cart abandonment at checkout. Propose 3 specific, prioritized solutions. For each, estimate effort (days) and expected impact (% improvement).", evalDimensions: [DIM_REASONING, DIM_USEFULNESS, DIM_ACCURACY, DIM_STRUCTURE] },
  { id: "L3-04", difficulty: "L3", type: "reasoning", prompt: "You're a PM at a B2B SaaS company. Your NPS dropped from 45 to 28 in one quarter. Walk me through your investigation framework — what data would you look at, in what order, and why?", evalDimensions: [DIM_REASONING, DIM_COMPLETENESS, DIM_USEFULNESS, DIM_STRUCTURE] },
  { id: "L3-05", difficulty: "L3", type: "reasoning", prompt: "Explain the trade-offs between fine-tuning a model vs. using RAG (Retrieval Augmented Generation) for a customer support chatbot. When would you choose each?", evalDimensions: [DIM_REASONING, DIM_ACCURACY, DIM_COMPLETENESS, DIM_USEFULNESS] },
  { id: "L3-06", difficulty: "L3", type: "reasoning", prompt: "A SaaS product charges $49/month and has 5% monthly churn. Calculate the LTV. Then propose 3 specific strategies to reduce churn to 3%, with expected timeline for each.", evalDimensions: [DIM_ACCURACY, DIM_REASONING, DIM_USEFULNESS, DIM_COMPLETENESS] },
  { id: "L3-07", difficulty: "L3", type: "reasoning", prompt: "Compare the security implications of JWT tokens vs. session-based auth for a multi-tenant B2B application. Which would you recommend and why?", evalDimensions: [DIM_REASONING, DIM_ACCURACY, DIM_COMPLETENESS, DIM_USEFULNESS] },
  { id: "L3-08", difficulty: "L3", type: "reasoning", prompt: "A company wants to add AI-powered features to their product. Compare build vs. buy vs. partner strategies. For each, list 2 scenarios where it's the best choice.", evalDimensions: [DIM_REASONING, DIM_COMPLETENESS, DIM_USEFULNESS, DIM_ACCURACY] },
  { id: "L3-09", difficulty: "L3", type: "reasoning", prompt: "You notice your API's p99 latency has increased from 200ms to 800ms over the past week, but p50 is unchanged. What are the most likely causes? How would you investigate?", evalDimensions: [DIM_REASONING, DIM_ACCURACY, DIM_COMPLETENESS, DIM_USEFULNESS] },
  { id: "L3-10", difficulty: "L3", type: "reasoning", prompt: "Analyze the competitive moat of OpenAI vs. Anthropic vs. Google in the LLM market as of 2025. Which has the strongest defensibility and why?", evalDimensions: [DIM_REASONING, DIM_ACCURACY, DIM_USEFULNESS, DIM_CREATIVITY] },

  // ============================================================
  // L4: Tool Use & Retrieval (10 prompts)
  // ============================================================
  { id: "L4-01", difficulty: "L4", type: "tool_use", prompt: "I need to check if nexu.io/blog is indexed by Google. What specific tools and commands would you use? Write the exact API calls or CLI commands.", evalDimensions: [DIM_TOOL_USE, DIM_ACCURACY, DIM_COMPLETENESS, DIM_USEFULNESS] },
  { id: "L4-02", difficulty: "L4", type: "tool_use", prompt: "Write a Python function that uses the OpenAI API to: 1) take a user question, 2) decide if it needs a calculator tool, 3) call the tool if needed, 4) return the final answer. Include the tool definition.", evalDimensions: [DIM_TOOL_USE, DIM_ACCURACY, DIM_COMPLETENESS, DIM_STRUCTURE] },
  { id: "L4-03", difficulty: "L4", type: "retrieval", prompt: "Given this context: 'Nexu is an open-source AI agent platform. It supports Slack, Teams, Feishu, and Discord. Latest version is v0.1.11 released April 2026. It uses OpenClaw for agent orchestration.' — Answer: What IM channels does Nexu support and what is the latest version?", evalDimensions: [DIM_RETRIEVAL, DIM_ACCURACY, DIM_COMPLETENESS, DIM_CONCISENESS] },
  { id: "L4-04", difficulty: "L4", type: "tool_use", prompt: "Design a tool schema (OpenAI function calling format) for a 'search_database' tool that can query a product inventory. Include parameters for: query, category filter, price range, sort order, and limit.", evalDimensions: [DIM_TOOL_USE, DIM_STRUCTURE, DIM_ACCURACY, DIM_COMPLETENESS] },
  { id: "L4-05", difficulty: "L4", type: "retrieval", prompt: "Given this error log:\n```\n2026-04-14 03:21:15 ERROR [worker-3] TimeoutError: Request to https://api.openai.com/v1/chat/completions timed out after 30000ms\n2026-04-14 03:21:15 WARN [worker-3] Retry attempt 3/3 failed\n2026-04-14 03:21:16 ERROR [main] Circuit breaker OPEN for openai-service (5 failures in 60s)\n```\nDiagnose the issue and propose a fix with code.", evalDimensions: [DIM_RETRIEVAL, DIM_REASONING, DIM_ACCURACY, DIM_USEFULNESS] },
  { id: "L4-06", difficulty: "L4", type: "tool_use", prompt: "Write a GitHub Actions workflow that: 1) triggers on push to main, 2) runs tests, 3) if tests pass, calls a custom 'notify_slack' action with the commit message. Show the complete YAML.", evalDimensions: [DIM_TOOL_USE, DIM_ACCURACY, DIM_COMPLETENESS, DIM_STRUCTURE] },
  { id: "L4-07", difficulty: "L4", type: "retrieval", prompt: "Given this GSC data:\n| Page | Impressions | Clicks | CTR | Position |\n|------|------------|--------|-----|----------|\n| /blog/ai-agents-guide | 2400 | 48 | 2.0% | 8.3 |\n| /blog/cursor-vs-copilot | 1800 | 126 | 7.0% | 4.1 |\n| /blog/llm-deployment | 950 | 12 | 1.3% | 15.2 |\nWhich page should be optimized first and what specific changes would you make?", evalDimensions: [DIM_RETRIEVAL, DIM_REASONING, DIM_USEFULNESS, DIM_ACCURACY] },
  { id: "L4-08", difficulty: "L4", type: "tool_use", prompt: "Write a complete tool-calling agent in Python that can: 1) look up current weather, 2) convert temperatures between Celsius and Fahrenheit. Include tool definitions, the agent loop, and simulated tool responses.", evalDimensions: [DIM_TOOL_USE, DIM_COMPLETENESS, DIM_ACCURACY, DIM_STRUCTURE] },
  { id: "L4-09", difficulty: "L4", type: "retrieval", prompt: "Given this API response:\n```json\n{\"users\": [{\"id\": 1, \"name\": \"Alice\", \"role\": \"admin\", \"last_active\": \"2026-04-10\"}, {\"id\": 2, \"name\": \"Bob\", \"role\": \"viewer\", \"last_active\": \"2026-01-15\"}, {\"id\": 3, \"name\": \"Carol\", \"role\": \"editor\", \"last_active\": \"2026-04-13\"}]}\n```\nIdentify inactive users (>30 days), summarize findings, and write a SQL query to find similar users in a database.", evalDimensions: [DIM_RETRIEVAL, DIM_ACCURACY, DIM_REASONING, DIM_USEFULNESS] },
  { id: "L4-10", difficulty: "L4", type: "tool_use", prompt: "Design an MCP (Model Context Protocol) server tool descriptor for a 'create_github_issue' tool. Include all required fields, parameter validation, and error handling in the schema.", evalDimensions: [DIM_TOOL_USE, DIM_ACCURACY, DIM_STRUCTURE, DIM_COMPLETENESS] },

  // ============================================================
  // L5: Complex Synthesis (10 prompts)
  // ============================================================
  { id: "L5-01", difficulty: "L5", type: "multi_step", prompt: "Design a complete evaluation framework for comparing AI coding assistants. Include: test categories, scoring rubric, sample test cases for each category, and how to handle non-deterministic outputs. This should be production-ready, not theoretical.", evalDimensions: [DIM_COMPLETENESS, DIM_REASONING, DIM_USEFULNESS, DIM_STRUCTURE, DIM_CREATIVITY] },
  { id: "L5-02", difficulty: "L5", type: "multi_step", prompt: "You're the PM for an AI agent platform. Write a one-pager for adding 'Agent Memory' — persistent memory across conversations. Include: problem statement, proposed solution, scope (in/out), success metrics, risks, and estimated effort.", evalDimensions: [DIM_COMPLETENESS, DIM_REASONING, DIM_STRUCTURE, DIM_USEFULNESS, DIM_CREATIVITY] },
  { id: "L5-03", difficulty: "L5", type: "multi_step", prompt: "Design the architecture for a real-time LLM evaluation platform that can: run 100 prompts across 5 models simultaneously, score results with LLM-as-judge, store historical results, and show live progress. Include system diagram description, tech stack choices with justification, and cost estimation.", evalDimensions: [DIM_REASONING, DIM_COMPLETENESS, DIM_ACCURACY, DIM_USEFULNESS, DIM_PLANNING] },
  { id: "L5-04", difficulty: "L5", type: "multi_step", prompt: "A B2B SaaS company (ARR $5M, 200 customers, 2% monthly churn) wants to add AI features. Create a complete go-to-market plan including: feature prioritization framework, pricing strategy (should AI be free, add-on, or new tier?), rollout timeline, and success metrics for the first 6 months.", evalDimensions: [DIM_COMPLETENESS, DIM_REASONING, DIM_USEFULNESS, DIM_ACCURACY, DIM_CREATIVITY] },
  { id: "L5-05", difficulty: "L5", type: "multi_step", prompt: "Write a technical blog post outline + first 3 paragraphs on 'Building Production-Ready AI Agents: Lessons from Shipping to Enterprise.' Must include real architectural decisions, failure modes you'd encounter, and non-obvious best practices.", evalDimensions: [DIM_CREATIVITY, DIM_ACCURACY, DIM_USEFULNESS, DIM_COMPLETENESS, DIM_REASONING] },
  { id: "L5-06", difficulty: "L5", type: "multi_step", prompt: "Design an SEO growth engine for a developer tools startup from zero. Include: technical SEO checklist, content strategy with page types, measurement framework (KPIs by week 1/4/8/12), and automation opportunities. Be specific — no generic advice.", evalDimensions: [DIM_COMPLETENESS, DIM_USEFULNESS, DIM_REASONING, DIM_ACCURACY, DIM_CREATIVITY] },
  { id: "L5-07", difficulty: "L5", type: "multi_step", prompt: "Compare 3 approaches to building an enterprise chatbot: 1) Fine-tuned model, 2) RAG with vector DB, 3) Agent with tool calling. For each: architecture diagram description, cost model at 10K/100K/1M queries/month, latency profile, and accuracy trade-offs.", evalDimensions: [DIM_REASONING, DIM_ACCURACY, DIM_COMPLETENESS, DIM_USEFULNESS, DIM_STRUCTURE] },
  { id: "L5-08", difficulty: "L5", type: "multi_step", prompt: "You inherited a codebase with no tests, no CI, and 3 engineers. Design a 90-day plan to establish engineering quality standards. Include: week-by-week milestones, tooling choices, testing strategy, and how to get buy-in without slowing feature development.", evalDimensions: [DIM_PLANNING, DIM_REASONING, DIM_USEFULNESS, DIM_COMPLETENESS, DIM_CREATIVITY] },
  { id: "L5-09", difficulty: "L5", type: "multi_step", prompt: "Design a multi-tenant AI agent platform architecture. Requirements: each tenant gets isolated agents, shared model infrastructure, per-tenant usage tracking and billing, SOC 2 compliance. Cover: data isolation strategy, cost allocation model, and scaling plan.", evalDimensions: [DIM_REASONING, DIM_COMPLETENESS, DIM_ACCURACY, DIM_USEFULNESS, DIM_PLANNING] },
  { id: "L5-10", difficulty: "L5", type: "multi_step", prompt: "Create a competitive analysis framework specifically for AI agent products. Apply it to compare: Nexu, LangChain, CrewAI, and AutoGen. Include: positioning map, feature matrix, distribution strategy comparison, and identify the biggest market gap.", evalDimensions: [DIM_REASONING, DIM_ACCURACY, DIM_COMPLETENESS, DIM_USEFULNESS, DIM_CREATIVITY] },

  // ============================================================
  // L6: Agentic Workflow (10 prompts)
  // ============================================================
  { id: "L6-01", difficulty: "L6", type: "multi_step", prompt: "You are a PM agent. A user reports: 'Our sign-up conversion dropped 15% this week.' Plan your investigation: 1) List the data sources you'd check (in order), 2) For each, specify what you're looking for, 3) Based on hypothetical findings, propose 3 fixes ranked by effort/impact, 4) Draft the Slack message to engineering.", evalDimensions: [DIM_PLANNING, DIM_REASONING, DIM_COHERENCE, DIM_USEFULNESS, DIM_COMPLETENESS] },
  { id: "L6-02", difficulty: "L6", type: "multi_step", prompt: "Act as a DevOps agent. Given: a Next.js app deployed on Vercel with a PostgreSQL database on Supabase. The app is experiencing intermittent 504 errors. Walk through your full debugging workflow: 1) Initial triage, 2) Log analysis, 3) Hypothesis generation, 4) Each diagnostic step with expected commands/queries, 5) Resolution and prevention.", evalDimensions: [DIM_PLANNING, DIM_REASONING, DIM_ACCURACY, DIM_COHERENCE, DIM_SELF_CORRECTION] },
  { id: "L6-03", difficulty: "L6", type: "multi_step", prompt: "You are a code review agent. Review this pull request description and identify issues:\nTitle: 'Add user auth'\nChanges: Added JWT auth, new /login and /register endpoints, password stored in users table, token expiry set to 30 days, no rate limiting, CORS set to '*'.\nProvide: severity-ranked issues, specific fix for each, and the order you'd address them.", evalDimensions: [DIM_REASONING, DIM_ACCURACY, DIM_COMPLETENESS, DIM_PLANNING, DIM_SELF_CORRECTION] },
  { id: "L6-04", difficulty: "L6", type: "multi_step", prompt: "You are an SEO agent. A site went from 5000 to 500 impressions in Google Search Console over 2 weeks. The site recently: migrated from /blog/[slug] to /articles/[slug], updated robots.txt, and deployed a new sitemap. Walk through your full diagnostic and recovery plan with specific commands, checks, and fixes.", evalDimensions: [DIM_PLANNING, DIM_REASONING, DIM_ACCURACY, DIM_COHERENCE, DIM_COMPLETENESS] },
  { id: "L6-05", difficulty: "L6", type: "multi_step", prompt: "You are a data analysis agent. A CEO asks: 'Should we expand to the UK market?' You have access to: customer database, revenue by region, competitor intel, and hiring cost data. Outline your complete analysis workflow: what queries you'd run, what visualizations you'd create, what framework you'd use for the recommendation, and draft the executive summary.", evalDimensions: [DIM_PLANNING, DIM_REASONING, DIM_COMPLETENESS, DIM_USEFULNESS, DIM_COHERENCE] },
  { id: "L6-06", difficulty: "L6", type: "multi_step", prompt: "You are a content strategy agent. Build a 30-day content calendar for an AI agent startup's blog. For each post: title, target keyword, search intent, estimated difficulty, internal linking targets, and CTA. The calendar should have a clear progression from awareness to consideration to conversion content.", evalDimensions: [DIM_PLANNING, DIM_COMPLETENESS, DIM_CREATIVITY, DIM_USEFULNESS, DIM_COHERENCE] },
  { id: "L6-07", difficulty: "L6", type: "multi_step", prompt: "You are a security audit agent. Audit this API design:\n- Auth: API keys in query parameters\n- Data: User PII stored unencrypted\n- Endpoints: /admin accessible without role check\n- Logging: Full request bodies logged including passwords\n- Rate limiting: None\nFor each issue: explain the attack vector, severity (Critical/High/Medium), specific fix with code example, and verification test.", evalDimensions: [DIM_ACCURACY, DIM_COMPLETENESS, DIM_PLANNING, DIM_REASONING, DIM_SELF_CORRECTION] },
  { id: "L6-08", difficulty: "L6", type: "multi_step", prompt: "You are a migration agent. Plan the migration of a monolithic Express.js app to Next.js App Router. The app has: 15 API routes, 8 pages with SSR, a PostgreSQL database, Redis sessions, and Stripe integration. Provide: migration order with dependencies, risk assessment per phase, rollback strategy, and timeline estimate.", evalDimensions: [DIM_PLANNING, DIM_REASONING, DIM_COMPLETENESS, DIM_COHERENCE, DIM_ACCURACY] },
  { id: "L6-09", difficulty: "L6", type: "multi_step", prompt: "You are a hiring agent for a startup. The company needs to hire a senior AI engineer. Create: the complete job description, a technical screening rubric (with specific questions and expected answers), a take-home assignment with evaluation criteria, and interview debrief template. All should be internally consistent.", evalDimensions: [DIM_COMPLETENESS, DIM_COHERENCE, DIM_USEFULNESS, DIM_CREATIVITY, DIM_PLANNING] },
  { id: "L6-10", difficulty: "L6", type: "multi_step", prompt: "You are a product launch agent. Plan the launch of 'AI Agent Eval Arena' — a tool that lets users compare LLM responses with automated judging. Create: 1) Launch checklist with owners and deadlines, 2) Product Hunt launch copy, 3) Twitter/X thread (5 tweets), 4) Hacker News Show HN post, 5) Outreach list of 10 specific people/communities to notify. Everything should be ready to execute, not generic templates.", evalDimensions: [DIM_COMPLETENESS, DIM_CREATIVITY, DIM_USEFULNESS, DIM_COHERENCE, DIM_PLANNING] },
];

export function getPromptsByDifficulty(difficulty: Difficulty): BenchmarkPrompt[] {
  return BENCHMARK_PROMPTS.filter((p) => p.difficulty === difficulty);
}

export function buildJudgePrompt(task: string, responseText: string, dimensions: EvalDimension[]): string {
  const dimensionList = dimensions
    .map((d, i) => `${i + 1}. ${d.name}: ${d.description}`)
    .join("\n");

  const jsonFields = dimensions
    .map((d) => `  "${d.id}": <1-5>`)
    .join(",\n");

  return `You are an expert evaluator. Score the following AI response on a task.

TASK: ${task}

RESPONSE TO EVALUATE:
${responseText}

Score on these dimensions (1-5 each):
${dimensionList}

Return ONLY valid JSON in this exact format:
{
${jsonFields},
  "total": <sum of all scores>,
  "one_line_reason": "<brief justification>"
}`;
}
