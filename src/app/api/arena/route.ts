import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import {
  BENCHMARK_PROMPTS,
  DIFFICULTY_LABELS,
  buildJudgePrompt,
  type Difficulty,
  type BenchmarkPrompt,
} from "@/lib/benchmark";

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

async function judgeResponse(
  task: string,
  responseText: string,
  benchmarkPrompt?: BenchmarkPrompt
) {
  const prompt = benchmarkPrompt
    ? buildJudgePrompt(task, responseText, benchmarkPrompt.evalDimensions)
    : buildJudgePrompt(task, responseText, [
        { id: "completeness", name: "Completeness", description: "Fully addresses all parts of the task" },
        { id: "accuracy", name: "Accuracy", description: "Factual correctness and precision" },
        { id: "usefulness", name: "Usefulness", description: "Actionable and valuable to a real user" },
        { id: "conciseness", name: "Conciseness", description: "Right length — not padded, not truncated" },
      ]);

  const resp = await client.chat.completions.create({
    model: "openai/gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  return JSON.parse(resp.choices[0].message.content ?? "{}");
}

// Single task mode (original)
async function handleSingleTask(task: string, selectedModels: string[]) {
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

  return judgedResults.sort((a, b) => (b.score.total ?? 0) - (a.score.total ?? 0));
}

// Benchmark mode: run a batch of prompts at a specific difficulty
async function handleBenchmark(
  difficulties: Difficulty[],
  selectedModels: string[]
) {
  const validModels = selectedModels.filter((id: string) =>
    AVAILABLE_MODELS.some((m) => m.id === id)
  );

  const prompts = BENCHMARK_PROMPTS.filter((p) =>
    difficulties.includes(p.difficulty)
  );

  const results: {
    promptId: string;
    difficulty: Difficulty;
    type: string;
    prompt: string;
    dimensions: string[];
    modelResults: {
      model: string;
      response: string;
      tokens: number;
      latency: number;
      score: Record<string, number | string>;
    }[];
  }[] = [];

  // Process prompts sequentially to avoid rate limits, models in parallel
  for (const bp of prompts) {
    const modelResults = await Promise.all(
      validModels.map(async (modelId) => {
        const result = await callModel(modelId, bp.prompt);
        const score = await judgeResponse(bp.prompt, result.response, bp);
        return { ...result, score };
      })
    );

    results.push({
      promptId: bp.id,
      difficulty: bp.difficulty,
      type: bp.type,
      prompt: bp.prompt,
      dimensions: bp.evalDimensions.map((d) => d.name),
      modelResults: modelResults.sort(
        (a, b) => (b.score.total ?? 0) - (a.score.total ?? 0)
      ),
    });
  }

  // Aggregate scores by model across all prompts
  const aggregated: Record<
    string,
    { totalScore: number; totalPrompts: number; totalTokens: number; totalLatency: number; wins: number }
  > = {};

  for (const modelId of validModels) {
    aggregated[modelId] = { totalScore: 0, totalPrompts: 0, totalTokens: 0, totalLatency: 0, wins: 0 };
  }

  for (const r of results) {
    const winner = r.modelResults[0];
    if (winner && aggregated[winner.model]) {
      aggregated[winner.model].wins++;
    }
    for (const mr of r.modelResults) {
      if (aggregated[mr.model]) {
        aggregated[mr.model].totalScore += mr.score.total as number;
        aggregated[mr.model].totalPrompts++;
        aggregated[mr.model].totalTokens += mr.tokens;
        aggregated[mr.model].totalLatency += mr.latency;
      }
    }
  }

  const leaderboard = Object.entries(aggregated)
    .map(([model, stats]) => ({
      model,
      avgScore: Math.round((stats.totalScore / stats.totalPrompts) * 10) / 10,
      wins: stats.wins,
      totalPrompts: stats.totalPrompts,
      avgLatency: Math.round((stats.totalLatency / stats.totalPrompts) * 100) / 100,
      avgTokens: Math.round(stats.totalTokens / stats.totalPrompts),
    }))
    .sort((a, b) => b.avgScore - a.avgScore);

  return { results, leaderboard, totalPrompts: prompts.length };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode, task, models: selectedModels, difficulties } = body;

    if (!selectedModels?.length) {
      return NextResponse.json({ error: "Models are required" }, { status: 400 });
    }

    if (mode === "benchmark") {
      if (!difficulties?.length) {
        return NextResponse.json({ error: "Select at least one difficulty level" }, { status: 400 });
      }
      const data = await handleBenchmark(difficulties, selectedModels);
      return NextResponse.json(data);
    }

    // Default: single task mode
    if (!task) {
      return NextResponse.json({ error: "Task is required" }, { status: 400 });
    }
    const results = await handleSingleTask(task, selectedModels);
    return NextResponse.json({ results });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    models: AVAILABLE_MODELS,
    difficulties: DIFFICULTY_LABELS,
    promptCounts: Object.fromEntries(
      (Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map((d) => [
        d,
        BENCHMARK_PROMPTS.filter((p) => p.difficulty === d).length,
      ])
    ),
    totalPrompts: BENCHMARK_PROMPTS.length,
  });
}
