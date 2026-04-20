export interface EvalPrompt {
  id: string;
  level: number;
  category: string;
  prompt: string;
  criteria: EvalCriterion[];
  tools?: ToolDef[];
  context?: string;
}

export interface EvalCriterion {
  name: string;
  description: string;
}

export interface ToolDef {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

const COMPANY_LOOKUP_TOOL: ToolDef = {
  type: "function",
  function: {
    name: "lookup_company",
    description: "Look up company information including funding, headcount, products, and recent news",
    parameters: {
      type: "object",
      properties: {
        company_name: { type: "string", description: "Company name to look up" },
      },
      required: ["company_name"],
    },
  },
};

const SEARCH_TOOL: ToolDef = {
  type: "function",
  function: {
    name: "web_search",
    description: "Search the web for current information on a topic",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        num_results: { type: "number", description: "Number of results to return (1-10)" },
      },
      required: ["query"],
    },
  },
};

const CALCULATOR_TOOL: ToolDef = {
  type: "function",
  function: {
    name: "calculate",
    description: "Perform mathematical calculations",
    parameters: {
      type: "object",
      properties: {
        expression: { type: "string", description: "Math expression to evaluate, e.g. '(500000 * 0.12) / 365'" },
      },
      required: ["expression"],
    },
  },
};

const DATABASE_TOOL: ToolDef = {
  type: "function",
  function: {
    name: "query_database",
    description: "Run a SQL query against the company database. Tables: users(id, name, email, plan, created_at), orders(id, user_id, amount, status, created_at), products(id, name, price, category)",
    parameters: {
      type: "object",
      properties: {
        sql: { type: "string", description: "SQL query to execute" },
      },
      required: ["sql"],
    },
  },
};

const SEND_EMAIL_TOOL: ToolDef = {
  type: "function",
  function: {
    name: "send_email",
    description: "Send an email to a recipient",
    parameters: {
      type: "object",
      properties: {
        to: { type: "string", description: "Recipient email address" },
        subject: { type: "string", description: "Email subject line" },
        body: { type: "string", description: "Email body content" },
      },
      required: ["to", "subject", "body"],
    },
  },
};

// ─── L1: Basic Q&A ──────────────────────────────────────────────────────────
const L1_BASIC: EvalPrompt[] = [
  {
    id: "l1-01", level: 1, category: "Basic",
    prompt: "What is a large language model? Explain in 3 sentences for a non-technical person.",
    criteria: [
      { name: "Accuracy", description: "Is the explanation factually correct?" },
      { name: "Completeness", description: "Does it cover the core concept adequately?" },
      { name: "Conciseness", description: "Is it exactly 3 sentences, no padding?" },
    ],
  },
  {
    id: "l1-02", level: 1, category: "Basic",
    prompt: "List 5 differences between Python and JavaScript. One sentence each.",
    criteria: [
      { name: "Accuracy", description: "Are the differences correct?" },
      { name: "Completeness", description: "Are there exactly 5 distinct differences?" },
      { name: "Conciseness", description: "Is each point one sentence?" },
    ],
  },
  {
    id: "l1-03", level: 1, category: "Basic",
    prompt: "What is the difference between TCP and UDP? Give a real-world analogy.",
    criteria: [
      { name: "Accuracy", description: "Is the technical explanation correct?" },
      { name: "Completeness", description: "Does it cover both protocols?" },
      { name: "Conciseness", description: "Is the analogy clear and not over-explained?" },
    ],
  },
  {
    id: "l1-04", level: 1, category: "Basic",
    prompt: "Explain what an API is to a 10-year-old. Use an everyday example.",
    criteria: [
      { name: "Accuracy", description: "Is the core concept correct?" },
      { name: "Completeness", description: "Does the example make the concept tangible?" },
      { name: "Conciseness", description: "Is it age-appropriate and not over-complicated?" },
    ],
  },
  {
    id: "l1-05", level: 1, category: "Basic",
    prompt: "What does 'open source' mean? Name 3 well-known open source projects.",
    criteria: [
      { name: "Accuracy", description: "Is the definition correct? Are the projects actually open source?" },
      { name: "Completeness", description: "Definition + 3 named projects?" },
      { name: "Conciseness", description: "Brief and to the point?" },
    ],
  },
  {
    id: "l1-06", level: 1, category: "Basic",
    prompt: "What is the difference between machine learning and deep learning?",
    criteria: [
      { name: "Accuracy", description: "Are the distinctions factually correct?" },
      { name: "Completeness", description: "Does it explain the relationship between the two?" },
      { name: "Conciseness", description: "No unnecessary jargon?" },
    ],
  },
  {
    id: "l1-07", level: 1, category: "Basic",
    prompt: "What is Docker? Why do developers use it? Answer in under 100 words.",
    criteria: [
      { name: "Accuracy", description: "Is the explanation correct?" },
      { name: "Completeness", description: "Does it cover what + why?" },
      { name: "Conciseness", description: "Under 100 words?" },
    ],
  },
  {
    id: "l1-08", level: 1, category: "Basic",
    prompt: "What is the difference between authentication and authorization? Give one example of each.",
    criteria: [
      { name: "Accuracy", description: "Are definitions and examples correct?" },
      { name: "Completeness", description: "Both concepts defined with examples?" },
      { name: "Conciseness", description: "Clear and direct?" },
    ],
  },
  {
    id: "l1-09", level: 1, category: "Basic",
    prompt: "What is a REST API? How is it different from GraphQL?",
    criteria: [
      { name: "Accuracy", description: "Are both technologies described correctly?" },
      { name: "Completeness", description: "Does it explain key differences?" },
      { name: "Conciseness", description: "Focused comparison, not a textbook?" },
    ],
  },
  {
    id: "l1-10", level: 1, category: "Basic",
    prompt: "Explain what cloud computing is. Name the 3 major cloud providers and one unique strength of each.",
    criteria: [
      { name: "Accuracy", description: "Is the definition correct? Are the strengths accurate?" },
      { name: "Completeness", description: "3 providers with distinct strengths?" },
      { name: "Conciseness", description: "Not padded with generic praise?" },
    ],
  },
];

// ─── L2: Analytical / Comparison ────────────────────────────────────────────
const L2_ANALYTICAL: EvalPrompt[] = [
  {
    id: "l2-01", level: 2, category: "Analytical",
    prompt: "Compare React, Vue, and Svelte for a startup building a customer dashboard. Consider learning curve, ecosystem, and performance. Recommend one with justification.",
    criteria: [
      { name: "Specificity", description: "Are comparisons concrete with specific tradeoffs, not generic?" },
      { name: "Balance", description: "Is each framework assessed fairly?" },
      { name: "Actionability", description: "Is the recommendation justified with clear reasoning?" },
    ],
  },
  {
    id: "l2-02", level: 2, category: "Analytical",
    prompt: "A B2B SaaS company has 500 enterprise customers and wants to add AI features. Compare build-in-house vs. using a third-party AI API. Consider cost, time-to-market, and data privacy.",
    criteria: [
      { name: "Specificity", description: "Are tradeoffs concrete with numbers/estimates where possible?" },
      { name: "Balance", description: "Are both options fairly evaluated?" },
      { name: "Actionability", description: "Does it help the reader make a decision?" },
    ],
  },
  {
    id: "l2-03", level: 2, category: "Analytical",
    prompt: "Analyse the pros and cons of microservices vs. monolithic architecture for a fintech startup with a team of 8 engineers. Which would you recommend and why?",
    criteria: [
      { name: "Specificity", description: "Does it consider the team size constraint?" },
      { name: "Balance", description: "Are both approaches fairly weighed?" },
      { name: "Actionability", description: "Is the recommendation practical for this specific scenario?" },
    ],
  },
  {
    id: "l2-04", level: 2, category: "Analytical",
    prompt: "Compare Vercel, AWS Amplify, and Netlify for deploying a Next.js app. Consider pricing at 100K monthly visitors, DX, and scaling.",
    criteria: [
      { name: "Specificity", description: "Are pricing estimates concrete?" },
      { name: "Balance", description: "Fair comparison across all three?" },
      { name: "Actionability", description: "Clear winner for the stated use case?" },
    ],
  },
  {
    id: "l2-05", level: 2, category: "Analytical",
    prompt: "A PM needs to decide between shipping an MVP in 4 weeks with known UX debt vs. spending 8 weeks for a polished v1. The product is a developer tool in a competitive market. Advise them.",
    criteria: [
      { name: "Specificity", description: "Does it address the competitive context?" },
      { name: "Balance", description: "Are both timelines seriously considered?" },
      { name: "Actionability", description: "Is the advice actionable with clear conditions?" },
    ],
  },
  {
    id: "l2-06", level: 2, category: "Analytical",
    prompt: "Compare PostgreSQL, MongoDB, and DynamoDB for a social media app expecting 10M users in Year 1. Consider data model, scaling, and cost.",
    criteria: [
      { name: "Specificity", description: "Does it address the specific scale and data patterns?" },
      { name: "Balance", description: "Are all three evaluated on the same criteria?" },
      { name: "Actionability", description: "Clear recommendation for this use case?" },
    ],
  },
  {
    id: "l2-07", level: 2, category: "Analytical",
    prompt: "Compare hiring full-time ML engineers vs. using AutoML platforms (like Vertex AI, SageMaker) for a Series A startup adding recommendation features. Team has 2 backend engineers.",
    criteria: [
      { name: "Specificity", description: "Does it consider the team constraint?" },
      { name: "Balance", description: "Are both paths fairly evaluated?" },
      { name: "Actionability", description: "Clear next steps for the startup?" },
    ],
  },
  {
    id: "l2-08", level: 2, category: "Analytical",
    prompt: "Evaluate the trade-offs between fine-tuning an open-source LLM (Llama 3) vs. using GPT-4o via API for a customer support chatbot handling 10K tickets/month.",
    criteria: [
      { name: "Specificity", description: "Are cost, latency, and accuracy tradeoffs concrete?" },
      { name: "Balance", description: "Both options fairly compared?" },
      { name: "Actionability", description: "Does it help the reader choose?" },
    ],
  },
  {
    id: "l2-09", level: 2, category: "Analytical",
    prompt: "A company wants to measure developer productivity. Compare DORA metrics, Sprint velocity, and Lines of Code. Which combination would you recommend and what pitfalls to avoid?",
    criteria: [
      { name: "Specificity", description: "Does it explain what each metric actually measures?" },
      { name: "Balance", description: "Are limitations of each clearly stated?" },
      { name: "Actionability", description: "Practical recommendation with pitfall warnings?" },
    ],
  },
  {
    id: "l2-10", level: 2, category: "Analytical",
    prompt: "Compare Stripe, Adyen, and PayPal for a European marketplace accepting payments in 5 currencies. Consider fees, regulatory compliance, and integration effort.",
    criteria: [
      { name: "Specificity", description: "Does it address multi-currency and EU regulation?" },
      { name: "Balance", description: "Fair comparison across all three?" },
      { name: "Actionability", description: "Clear pick for this scenario?" },
    ],
  },
];

// ─── L3: Reasoning / Multi-step ─────────────────────────────────────────────
const L3_REASONING: EvalPrompt[] = [
  {
    id: "l3-01", level: 3, category: "Reasoning",
    prompt: "A startup's MRR grew from $50K to $120K over 12 months, but churn increased from 3% to 7% monthly. Net revenue retention dropped below 100%. Diagnose the most likely causes and propose 3 prioritised actions.",
    criteria: [
      { name: "Logic", description: "Is the causal reasoning sound?" },
      { name: "Depth", description: "Does it go beyond surface-level observations?" },
      { name: "Correctness", description: "Are the metrics and math accurate?" },
    ],
  },
  {
    id: "l3-02", level: 3, category: "Reasoning",
    prompt: "Design a rate limiting system for an API that serves 3 tiers of users (free, pro, enterprise). Free gets 100 req/min, Pro gets 1000, Enterprise gets 10000. How would you handle burst traffic and what data structure would you use?",
    criteria: [
      { name: "Logic", description: "Is the system design logically sound?" },
      { name: "Depth", description: "Does it address edge cases like burst traffic?" },
      { name: "Correctness", description: "Is the data structure choice appropriate?" },
    ],
  },
  {
    id: "l3-03", level: 3, category: "Reasoning",
    prompt: "An e-commerce site's conversion rate dropped 40% after a redesign. Page load time is the same. What would your investigation plan look like? Walk through your reasoning step by step.",
    criteria: [
      { name: "Logic", description: "Is the debugging approach systematic?" },
      { name: "Depth", description: "Does it consider multiple hypotheses?" },
      { name: "Correctness", description: "Are the suggested metrics and tools appropriate?" },
    ],
  },
  {
    id: "l3-04", level: 3, category: "Reasoning",
    prompt: "You have a recommendation engine that works well for users with 50+ interactions but performs poorly for new users (cold start). Propose a solution that doesn't require retraining the main model.",
    criteria: [
      { name: "Logic", description: "Is the cold-start solution logically sound?" },
      { name: "Depth", description: "Does it go beyond obvious answers?" },
      { name: "Correctness", description: "Is the technical approach feasible?" },
    ],
  },
  {
    id: "l3-05", level: 3, category: "Reasoning",
    prompt: "Company A (50 engineers, monolith) acquires Company B (20 engineers, microservices). Both have paying customers. Propose an integration strategy for the first 6 months. What do you merge first, what do you leave alone, and why?",
    criteria: [
      { name: "Logic", description: "Is the integration sequence well-reasoned?" },
      { name: "Depth", description: "Does it consider team, tech, and customer impact?" },
      { name: "Correctness", description: "Are the priorities realistic?" },
    ],
  },
  {
    id: "l3-06", level: 3, category: "Reasoning",
    prompt: "A B2B product has 3 pricing tiers. Analytics show 80% of users are on the free tier, 15% on mid, 5% on enterprise. Enterprise generates 70% of revenue. The CEO wants to grow the mid tier. What do you propose?",
    criteria: [
      { name: "Logic", description: "Does it address the underlying value gap?" },
      { name: "Depth", description: "Beyond simple price changes?" },
      { name: "Correctness", description: "Does the math support the strategy?" },
    ],
  },
  {
    id: "l3-07", level: 3, category: "Reasoning",
    prompt: "You notice your LLM-based feature has a 15% hallucination rate on factual queries. Your options: add RAG, fine-tune, add a verification layer, or restrict the feature scope. Walk through each option's tradeoffs and recommend a phased approach.",
    criteria: [
      { name: "Logic", description: "Are the tradeoffs accurately assessed?" },
      { name: "Depth", description: "Does it consider implementation cost and timeline?" },
      { name: "Correctness", description: "Is the phased approach realistic?" },
    ],
  },
  {
    id: "l3-08", level: 3, category: "Reasoning",
    prompt: "A SaaS platform processes payments through a single provider. That provider just announced a 60% fee increase effective in 90 days. You handle $2M/month in transactions. What's your 90-day action plan?",
    criteria: [
      { name: "Logic", description: "Is the action plan sequenced correctly?" },
      { name: "Depth", description: "Does it consider negotiation, migration, and risk?" },
      { name: "Correctness", description: "Are timeline estimates realistic?" },
    ],
  },
  {
    id: "l3-09", level: 3, category: "Reasoning",
    prompt: "Your CI/CD pipeline takes 45 minutes. Developers are context-switching and productivity is suffering. The pipeline includes: lint (2min), unit tests (8min), build (10min), integration tests (15min), E2E tests (10min). Propose optimizations with expected impact.",
    criteria: [
      { name: "Logic", description: "Are the optimizations targeted at the right bottlenecks?" },
      { name: "Depth", description: "Multiple strategies with tradeoffs?" },
      { name: "Correctness", description: "Do the time savings estimates add up?" },
    ],
  },
  {
    id: "l3-10", level: 3, category: "Reasoning",
    prompt: "Two teams disagree on API design: Team A wants REST with versioned endpoints, Team B wants GraphQL. The product serves both a web app and mobile app with different data needs. You're the tech lead. How do you resolve this?",
    criteria: [
      { name: "Logic", description: "Is the decision framework sound?" },
      { name: "Depth", description: "Does it consider the different client needs?" },
      { name: "Correctness", description: "Is the recommendation technically justified?" },
    ],
  },
];

// ─── L4: Creative / Persuasive ──────────────────────────────────────────────
const L4_CREATIVE: EvalPrompt[] = [
  {
    id: "l4-01", level: 4, category: "Creative",
    prompt: "Write a cold outreach LinkedIn message to the VP of Engineering at a Series B fintech company. You're a PM candidate with enterprise experience and hands-on AI agent building skills. Under 100 words.",
    criteria: [
      { name: "Originality", description: "Does it stand out from generic outreach?" },
      { name: "Persuasiveness", description: "Would the recipient want to respond?" },
      { name: "Constraint-following", description: "Under 100 words? Appropriate tone?" },
    ],
  },
  {
    id: "l4-02", level: 4, category: "Creative",
    prompt: "Write a product launch tweet thread (5 tweets) for an AI-powered code review tool. Target audience: engineering managers at mid-size companies. Make it specific, not hype-y.",
    criteria: [
      { name: "Originality", description: "Does it avoid generic AI hype?" },
      { name: "Persuasiveness", description: "Would the target audience engage?" },
      { name: "Constraint-following", description: "Exactly 5 tweets? Thread format?" },
    ],
  },
  {
    id: "l4-03", level: 4, category: "Creative",
    prompt: "Draft a one-paragraph product description for a developer tool marketplace listing. The product: an open-source AI agent that connects to Slack/Teams and automates IT support ticket triage. Max 80 words.",
    criteria: [
      { name: "Originality", description: "Does it communicate the unique value?" },
      { name: "Persuasiveness", description: "Would a developer click 'Install'?" },
      { name: "Constraint-following", description: "One paragraph, under 80 words?" },
    ],
  },
  {
    id: "l4-04", level: 4, category: "Creative",
    prompt: "Write a rejection email to a vendor whose proposal didn't meet requirements. Be professional, specific about why, and leave the door open for future work. Under 150 words.",
    criteria: [
      { name: "Originality", description: "Does it feel human, not templated?" },
      { name: "Persuasiveness", description: "Would the vendor feel respected?" },
      { name: "Constraint-following", description: "Under 150 words? Professional tone?" },
    ],
  },
  {
    id: "l4-05", level: 4, category: "Creative",
    prompt: "Create a 30-second elevator pitch for an AI Agent Eval Arena — a product that lets companies compare LLMs on their own tasks with automated scoring. You're pitching to a CTO.",
    criteria: [
      { name: "Originality", description: "Does it hook the listener?" },
      { name: "Persuasiveness", description: "Would the CTO want a demo?" },
      { name: "Constraint-following", description: "Under 30 seconds when spoken?" },
    ],
  },
  {
    id: "l4-06", level: 4, category: "Creative",
    prompt: "Write 3 different taglines for a password manager app. One for security-conscious users, one for convenience-seekers, one for enterprise buyers.",
    criteria: [
      { name: "Originality", description: "Are the taglines memorable and distinct?" },
      { name: "Persuasiveness", description: "Does each resonate with its target persona?" },
      { name: "Constraint-following", description: "Exactly 3, each targeting a different persona?" },
    ],
  },
  {
    id: "l4-07", level: 4, category: "Creative",
    prompt: "Write a changelog entry for a major feature release: real-time collaboration in a design tool. Include what's new, who it's for, and one known limitation. Under 200 words.",
    criteria: [
      { name: "Originality", description: "Does it sound like a real changelog, not marketing?" },
      { name: "Persuasiveness", description: "Does it make users want to try the feature?" },
      { name: "Constraint-following", description: "Under 200 words? Includes the limitation?" },
    ],
  },
  {
    id: "l4-08", level: 4, category: "Creative",
    prompt: "Write an internal Slack message announcing that the team needs to delay a feature launch by 2 weeks due to a critical bug. Be transparent, maintain morale, and include next steps.",
    criteria: [
      { name: "Originality", description: "Does it feel authentic, not corporate?" },
      { name: "Persuasiveness", description: "Would the team feel informed and motivated?" },
      { name: "Constraint-following", description: "Appropriate Slack tone? Includes next steps?" },
    ],
  },
  {
    id: "l4-09", level: 4, category: "Creative",
    prompt: "Write a problem statement for a PRD: enterprise customers spend 3+ hours weekly manually routing IT support tickets. Include who's affected, current workarounds, and why now.",
    criteria: [
      { name: "Originality", description: "Is the problem framed with specificity?" },
      { name: "Persuasiveness", description: "Does it build urgency for solving this?" },
      { name: "Constraint-following", description: "Covers who, workarounds, and timing?" },
    ],
  },
  {
    id: "l4-10", level: 4, category: "Creative",
    prompt: "Write a 'Why we built this' blog post intro (3 paragraphs) for an open-source LLM evaluation framework. Target audience: ML engineers frustrated with vibe-checking models.",
    criteria: [
      { name: "Originality", description: "Does it empathise with the pain point?" },
      { name: "Persuasiveness", description: "Would the reader keep reading?" },
      { name: "Constraint-following", description: "Exactly 3 paragraphs? Right audience?" },
    ],
  },
];

// ─── L5: Tool Calling ───────────────────────────────────────────────────────
const L5_TOOL_CALLING: EvalPrompt[] = [
  {
    id: "l5-01", level: 5, category: "Tool Calling",
    prompt: "What is PolyAI's latest funding round and how many employees do they have?",
    tools: [COMPANY_LOOKUP_TOOL],
    criteria: [
      { name: "Tool Selection", description: "Did it correctly decide to use lookup_company?" },
      { name: "Argument Accuracy", description: "Did it pass the correct company name?" },
      { name: "Result Integration", description: "Did it incorporate the tool result naturally?" },
    ],
  },
  {
    id: "l5-02", level: 5, category: "Tool Calling",
    prompt: "If I invest $500,000 at 12% annual interest compounded daily, how much will I have after 5 years?",
    tools: [CALCULATOR_TOOL],
    criteria: [
      { name: "Tool Selection", description: "Did it use the calculator tool?" },
      { name: "Argument Accuracy", description: "Is the compound interest formula correct?" },
      { name: "Result Integration", description: "Did it present the answer clearly?" },
    ],
  },
  {
    id: "l5-03", level: 5, category: "Tool Calling",
    prompt: "Find me the top 3 AI agent frameworks for enterprise use in 2026.",
    tools: [SEARCH_TOOL],
    criteria: [
      { name: "Tool Selection", description: "Did it use web_search?" },
      { name: "Argument Accuracy", description: "Is the search query well-formed and specific?" },
      { name: "Result Integration", description: "Would it synthesize results well?" },
    ],
  },
  {
    id: "l5-04", level: 5, category: "Tool Calling",
    prompt: "How many users signed up this month who are on the 'pro' plan? And what's their total order value?",
    tools: [DATABASE_TOOL],
    criteria: [
      { name: "Tool Selection", description: "Did it use query_database?" },
      { name: "Argument Accuracy", description: "Is the SQL query correct and efficient?" },
      { name: "Result Integration", description: "Would it present the data clearly?" },
    ],
  },
  {
    id: "l5-05", level: 5, category: "Tool Calling",
    prompt: "Send a follow-up email to john@example.com about the partnership proposal we discussed last week. Keep it professional and brief.",
    tools: [SEND_EMAIL_TOOL],
    criteria: [
      { name: "Tool Selection", description: "Did it use send_email?" },
      { name: "Argument Accuracy", description: "Are to, subject, and body all appropriate?" },
      { name: "Result Integration", description: "Is the email content professional and relevant?" },
    ],
  },
  {
    id: "l5-06", level: 5, category: "Tool Calling",
    prompt: "What is the weather like in London today?",
    tools: [SEARCH_TOOL, CALCULATOR_TOOL],
    criteria: [
      { name: "Tool Selection", description: "Did it choose web_search (not calculator)?" },
      { name: "Argument Accuracy", description: "Is the search query appropriate?" },
      { name: "Result Integration", description: "Would it report weather naturally?" },
    ],
  },
  {
    id: "l5-07", level: 5, category: "Tool Calling",
    prompt: "Compare the headcount of PolyAI and Intercom. Which one has more employees?",
    tools: [COMPANY_LOOKUP_TOOL],
    criteria: [
      { name: "Tool Selection", description: "Did it call lookup_company twice?" },
      { name: "Argument Accuracy", description: "Did it look up both companies?" },
      { name: "Result Integration", description: "Did it compare the results correctly?" },
    ],
  },
  {
    id: "l5-08", level: 5, category: "Tool Calling",
    prompt: "Find the top 5 customers by total order amount and draft a thank-you email to the #1 customer.",
    tools: [DATABASE_TOOL, SEND_EMAIL_TOOL],
    criteria: [
      { name: "Tool Selection", description: "Did it use both database and email tools?" },
      { name: "Argument Accuracy", description: "Is the SQL correct? Is the email appropriate?" },
      { name: "Result Integration", description: "Did it chain the tools logically?" },
    ],
  },
  {
    id: "l5-09", level: 5, category: "Tool Calling",
    prompt: "How much is 15% tip on a bill of $847.50 split between 6 people?",
    tools: [CALCULATOR_TOOL],
    criteria: [
      { name: "Tool Selection", description: "Did it use the calculator?" },
      { name: "Argument Accuracy", description: "Is the expression correct?" },
      { name: "Result Integration", description: "Is the per-person amount clearly stated?" },
    ],
  },
  {
    id: "l5-10", level: 5, category: "Tool Calling",
    prompt: "What's the capital of France?",
    tools: [SEARCH_TOOL, CALCULATOR_TOOL],
    criteria: [
      { name: "Tool Selection", description: "Did it answer directly WITHOUT using any tool? (This is a test of restraint — no tool needed)" },
      { name: "Argument Accuracy", description: "N/A if no tool was called (which is correct)" },
      { name: "Result Integration", description: "Is the answer correct and direct?" },
    ],
  },
];

// ─── L6: Retrieval / Synthesis ──────────────────────────────────────────────
const L6_RETRIEVAL: EvalPrompt[] = [
  {
    id: "l6-01", level: 6, category: "Retrieval",
    prompt: "Based on the following context, answer the question.\n\nCONTEXT:\nNexu is an open-source AI agent platform for enterprise collaboration. It connects agents built with frameworks like OpenClaw to enterprise IM channels (Slack, Teams, Feishu/Lark). The desktop client supports multi-agent orchestration. Latest version is v0.1.11 released in April 2026. The platform is MIT-licensed and has 1,200+ GitHub stars.\n\nQUESTION: What IM channels does Nexu support and what is its licence?",
    context: "Nexu docs",
    criteria: [
      { name: "Source Relevance", description: "Did it answer from the provided context?" },
      { name: "Synthesis Quality", description: "Is the answer well-organized?" },
      { name: "Factual Grounding", description: "Are all facts traceable to the context?" },
    ],
  },
  {
    id: "l6-02", level: 6, category: "Retrieval",
    prompt: "Based on the following context, answer the question.\n\nCONTEXT:\nQ1 Revenue: $2.3M (up 15% QoQ). Q2 Revenue: $2.8M (up 22% QoQ). Q3 Revenue: $3.1M (up 11% QoQ). Q4 Revenue: $2.9M (down 6% QoQ). Total headcount grew from 45 to 72 during the year. Customer acquisition cost (CAC) increased from $1,200 to $1,800. Net Revenue Retention (NRR) was 112%.\n\nQUESTION: What was the full-year revenue and what concerns should the board focus on?",
    context: "Financial data",
    criteria: [
      { name: "Source Relevance", description: "Did it calculate from the provided numbers?" },
      { name: "Synthesis Quality", description: "Did it identify the Q4 dip and rising CAC as concerns?" },
      { name: "Factual Grounding", description: "Are all numbers accurate from context?" },
    ],
  },
  {
    id: "l6-03", level: 6, category: "Retrieval",
    prompt: "Based on the following context, answer the question.\n\nCONTEXT:\nUser feedback (last 30 days):\n- 'Search is broken on mobile' (12 reports)\n- 'Can't export to PDF' (8 reports)\n- 'Dashboard loads slowly' (23 reports)\n- 'Love the new dark mode!' (15 reports)\n- 'API rate limits are too strict' (6 reports)\n- 'Onboarding tutorial is confusing' (18 reports)\n\nQUESTION: Prioritise the top 3 issues to fix and justify your ranking.",
    context: "User feedback",
    criteria: [
      { name: "Source Relevance", description: "Did it use the report counts from context?" },
      { name: "Synthesis Quality", description: "Is the prioritisation framework clear?" },
      { name: "Factual Grounding", description: "Are the counts and issues accurate?" },
    ],
  },
  {
    id: "l6-04", level: 6, category: "Retrieval",
    prompt: "Based on the following context, answer the question.\n\nCONTEXT:\nJob posting: Senior Product Manager at FinTechCo. Requirements: 5+ years PM experience, fintech or payments domain, SQL proficiency, experience with regulatory compliance (PSD2/PCI-DSS), stakeholder management across engineering and compliance teams. Nice to have: AI/ML feature experience, marketplace/platform experience.\n\nCandidate profile: 2 years full-time Technical PM at telecom (P&L ownership, ServiceNow, enterprise clients). 3 months AI PM intern at startup (built SEO infrastructure, AI agent skills). MSc from Imperial College. SQL, Python, GitHub.\n\nQUESTION: How strong is this candidate's fit? What gaps need addressing?",
    context: "Job matching",
    criteria: [
      { name: "Source Relevance", description: "Did it map candidate profile to job requirements?" },
      { name: "Synthesis Quality", description: "Did it identify both strengths and gaps?" },
      { name: "Factual Grounding", description: "Are all assessments traceable to the provided data?" },
    ],
  },
  {
    id: "l6-05", level: 6, category: "Retrieval",
    prompt: "Based on the following context, answer the question.\n\nCONTEXT:\nAPI Documentation:\nPOST /api/arena - Run an evaluation. Body: { task: string, models: string[] }. Returns: { results: [{ model, response, tokens, latency, score }] }. Rate limit: 10 requests/minute. Authentication: Bearer token in header. Error codes: 400 (bad request), 429 (rate limited), 500 (server error).\n\nGET /api/arena - List available models. Returns: { models: [{ id, name, provider }] }.\n\nQUESTION: Write a curl command to run an evaluation comparing GPT-4o and Claude on the task 'Explain recursion'.",
    context: "API docs",
    criteria: [
      { name: "Source Relevance", description: "Did it use the correct endpoint and format from docs?" },
      { name: "Synthesis Quality", description: "Is the curl command complete and correct?" },
      { name: "Factual Grounding", description: "Does it match the documented API contract?" },
    ],
  },
  {
    id: "l6-06", level: 6, category: "Retrieval",
    prompt: "Based on the following context, answer the question.\n\nCONTEXT:\nIncident report: Production database failover triggered at 03:42 UTC. Primary DB CPU spiked to 98% due to a runaway query from the analytics service (SELECT * FROM events WHERE created_at > '2026-01-01' — missing index on created_at, table has 450M rows). Failover completed in 12 seconds. 3 API requests returned 500 errors during failover. Analytics service was rate-limited and query was killed. Post-mortem action items: add index, add query timeout, add circuit breaker to analytics service.\n\nQUESTION: Summarise the incident for a non-technical stakeholder and list the preventive measures.",
    context: "Incident report",
    criteria: [
      { name: "Source Relevance", description: "Did it accurately represent the incident?" },
      { name: "Synthesis Quality", description: "Is the non-technical summary clear?" },
      { name: "Factual Grounding", description: "Are all facts from the incident report?" },
    ],
  },
  {
    id: "l6-07", level: 6, category: "Retrieval",
    prompt: "Based on the following context, answer the question.\n\nCONTEXT:\nCompetitor landscape (AI coding assistants, April 2026):\n- Cursor: $100M ARR, AI-native IDE, 500K+ users, backed by a]16z. Strength: deep codebase understanding.\n- GitHub Copilot: 1.8M paid subscribers, integrated in VS Code/JetBrains. Strength: ecosystem reach.\n- Windsurf (Codeium): $150M Series C, 800K users. Strength: free tier and enterprise compliance.\n- Augment Code: $252M raised, focus on large codebases. Strength: context window handling.\n- Tabnine: pivoted to enterprise, SOC2/HIPAA compliance. Strength: on-prem deployment.\n\nQUESTION: If you're building a new AI coding tool for regulated industries (healthcare, finance), which competitor should you study most closely and why?",
    context: "Competitive landscape",
    criteria: [
      { name: "Source Relevance", description: "Did it use the competitive data provided?" },
      { name: "Synthesis Quality", description: "Is the recommendation well-reasoned?" },
      { name: "Factual Grounding", description: "Are all competitor facts accurate from context?" },
    ],
  },
  {
    id: "l6-08", level: 6, category: "Retrieval",
    prompt: "Based on the following context, answer the question.\n\nCONTEXT:\nSEO Performance (last 28 days):\nPage: /blog/ai-agent-comparison — Impressions: 4,200, Clicks: 380, CTR: 9.0%, Avg Position: 4.2\nPage: /blog/llm-pricing-guide — Impressions: 8,100, Clicks: 210, CTR: 2.6%, Avg Position: 12.5\nPage: /blog/cursor-vs-copilot — Impressions: 15,000, Clicks: 1,800, CTR: 12.0%, Avg Position: 3.1\nPage: /docs/getting-started — Impressions: 1,200, Clicks: 95, CTR: 7.9%, Avg Position: 8.3\nPage: /blog/what-is-an-ai-agent — Impressions: 22,000, Clicks: 440, CTR: 2.0%, Avg Position: 18.7\n\nQUESTION: Which page has the highest optimisation potential and what specific changes would you recommend?",
    context: "GSC data",
    criteria: [
      { name: "Source Relevance", description: "Did it analyse the data correctly?" },
      { name: "Synthesis Quality", description: "Is the recommendation specific (not generic SEO advice)?" },
      { name: "Factual Grounding", description: "Are all numbers from the context?" },
    ],
  },
  {
    id: "l6-09", level: 6, category: "Retrieval",
    prompt: "Based on the following context, answer the question.\n\nCONTEXT:\nMeeting notes (Product Review, April 10):\n- Feature A (AI suggestions): Engineering estimates 6 weeks. PM wants to ship in 4. Design has open questions about error states.\n- Feature B (Export to PDF): 2-week estimate. 8 customer requests. No design blockers.\n- Feature C (Dashboard redesign): 10-week estimate. Will improve NPS but no direct revenue impact. CEO is sponsoring.\n- Current sprint capacity: 2 engineers available for the next 6 weeks.\n\nQUESTION: Recommend a prioritised roadmap for the next 6 weeks with justification.",
    context: "Meeting notes",
    criteria: [
      { name: "Source Relevance", description: "Did it use the capacity and estimate constraints?" },
      { name: "Synthesis Quality", description: "Is the roadmap feasible within the constraints?" },
      { name: "Factual Grounding", description: "Are all timelines from the context?" },
    ],
  },
  {
    id: "l6-10", level: 6, category: "Retrieval",
    prompt: "Based on the following context, answer the question.\n\nCONTEXT:\nThe user sent the following message: 'I just bought the Pro plan but I still see the free tier limits. My account email is jane@startup.com. I've tried logging out and back in. This is urgent because I need to run evaluations for a client demo tomorrow morning.'\n\nSystem data: jane@startup.com — Plan: Pro (activated 2 hours ago). Billing: payment confirmed. Known issue: plan upgrade propagation can take up to 4 hours due to cache invalidation. Workaround: user can force-refresh by visiting /settings/plan and clicking 'Sync Plan'.\n\nQUESTION: Draft a support reply to this user.",
    context: "Support ticket",
    criteria: [
      { name: "Source Relevance", description: "Did it use the system data and workaround?" },
      { name: "Synthesis Quality", description: "Is the reply empathetic and actionable?" },
      { name: "Factual Grounding", description: "Does it accurately reference the 4-hour propagation and workaround?" },
    ],
  },
];

export const PROMPT_BANK: EvalPrompt[] = [
  ...L1_BASIC,
  ...L2_ANALYTICAL,
  ...L3_REASONING,
  ...L4_CREATIVE,
  ...L5_TOOL_CALLING,
  ...L6_RETRIEVAL,
];

export const LEVELS = [
  { level: 1, name: "Basic", description: "Factual Q&A, definitions, simple explanations" },
  { level: 2, name: "Analytical", description: "Comparison, trade-off analysis, recommendations" },
  { level: 3, name: "Reasoning", description: "Multi-step problem solving, system design, diagnosis" },
  { level: 4, name: "Creative", description: "Copywriting, outreach, persuasive communication" },
  { level: 5, name: "Tool Calling", description: "Function selection, argument accuracy, tool chaining" },
  { level: 6, name: "Retrieval", description: "Context grounding, synthesis from provided data" },
];

export function getPromptsByLevel(level: number): EvalPrompt[] {
  return PROMPT_BANK.filter((p) => p.level === level);
}
