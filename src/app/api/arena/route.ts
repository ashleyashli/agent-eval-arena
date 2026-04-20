import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const AVAILABLE_MODELS = [
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI" },
  { id: "anthropic/claude-3.5-haiku", name: "Claude 3.5 Haiku", provider: "Anthropic" },
  { id: "google/gemini-2.0-flash-001", name: "Gemini 2.0 Flash", provider: "Google" },
  { id: "meta-llama/llama-3.1-8b-instruct", name: "Llama 3.1 8B", provider: "Meta" },
  { id: "mistralai/mistral-small-3.1-24b-instruct", name: "Mistral Small 3.1", provider: "Mistral" },
];

async function callModel(modelId: string, task: string) {
  const start = Date.now();
  const resp = await client.chat.completions.create({
    model: modelId,
    messages: [{ role: "user", content: task }],
  });
  const latency = (Date.now() - start) / 1000;

  return {
    model: modelId,
    response: resp.choices[0].message.content ?? "",
    tokens: resp.usage?.total_tokens ?? 0,
    latency: Math.round(latency * 100) / 100,
  };
}

async function judgeResponse(task: string, responseText: string) {
  const judgePrompt = `You are an expert evaluator. Score the following AI response on a task.

TASK: ${task}

RESPONSE TO EVALUATE:
${responseText}

Score on these dimensions (1-5 each):
1. Completeness: Does it fully address the task?
2. Accuracy: Is the information correct and specific (not generic)?
3. Usefulness: Would a real user find this actionable?
4. Conciseness: Is it the right length — not too short, not padded?

Return ONLY valid JSON in this exact format:
{
  "completeness": 4,
  "accuracy": 4,
  "usefulness": 4,
  "conciseness": 4,
  "total": 16,
  "one_line_reason": "brief justification"
}`;

  const resp = await client.chat.completions.create({
    model: "openai/gpt-4o-mini",
    messages: [{ role: "user", content: judgePrompt }],
    response_format: { type: "json_object" },
  });

  return JSON.parse(resp.choices[0].message.content ?? "{}");
}

export async function POST(req: NextRequest) {
  try {
    const { task, models: selectedModels } = await req.json();

    if (!task || !selectedModels?.length) {
      return NextResponse.json({ error: "Task and models are required" }, { status: 400 });
    }

    const validModels = selectedModels.filter((id: string) =>
      AVAILABLE_MODELS.some((m) => m.id === id)
    );

    const results = await Promise.all(
      validModels.map((modelId: string) => callModel(modelId, task))
    );

    const judgedResults = await Promise.all(
      results.map(async (r) => {
        const score = await judgeResponse(task, r.response);
        return { ...r, score };
      })
    );

    const ranked = judgedResults.sort((a, b) => (b.score.total ?? 0) - (a.score.total ?? 0));

    return NextResponse.json({ results: ranked });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ models: AVAILABLE_MODELS });
}
