# AI Agent Eval Arena

Compare LLM responses side-by-side with automated LLM-as-judge scoring.

## What it does

- Send the same task to multiple LLMs (GPT-4o Mini, Claude 3.5 Haiku, Gemini 2.0 Flash, Llama 3.1, Mistral Small)
- All models run in parallel via [OpenRouter](https://openrouter.ai/)
- An LLM judge automatically scores each response on completeness, accuracy, usefulness, and conciseness
- Results are ranked in a leaderboard with detailed score breakdowns

## Tech stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS** for styling
- **OpenRouter API** for unified LLM access
- **LLM-as-judge** evaluation pattern

## Getting started

```bash
npm install
```

Create `.env.local` with your OpenRouter API key:

```
OPENROUTER_API_KEY=your-key-here
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Built by

Ashley Li — [GitHub](https://github.com/ashleyashli)
