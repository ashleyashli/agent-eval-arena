import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { PROMPT_BANK, LEVELS, type EvalPrompt } from "@/lib/prompt-bank";

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

async function callModel(modelId: string, prompt: EvalPrompt) {
  const start = Date.now();
  const params: Record<string, unknown> = {
    model: modelId,
    messages: [{ role: "user", content: prompt.prompt }],
  };

  if (prompt.tools?.length) {
    params.tools = prompt.tools;
    params.tool_choice = "auto";
  }

  const resp = await client.chat.completions.create(params as Parameters<typeof client.chat.completions.create>[0]);
  const latency = (Date.now() - start) / 1000;
  const msg = resp.choices[0].message;

  return {
    model: modelId,
    response: msg.content ?? "",
    toolCalls: msg.tool_calls?.map((tc) => ({
      name: tc.function.name,
      arguments: tc.function.arguments,
    })) ?? [],
    tokens: resp.usage?.total_tokens ?? 0,
    latency: Math.round(latency * 100) / 100,
  };
}

async function judgeResponse(prompt: EvalPrompt, responseText: string, toolCalls: { name: string; arguments: string }[]) {
  const criteriaText = prompt.criteria
    .map((c, i) => `${i + 1}. ${c.name}: ${c.description}`)
    .join("\n");

  const criteriaKeys = prompt.criteria.map((c) => c.name.toLowerCase().replace(/[^a-z]/g, "_"));

  const toolCallInfo = toolCalls.length > 0
    ? `\n\nTOOL CALLS MADE BY THE MODEL:\n${toolCalls.map((tc) => `- ${tc.name}(${tc.arguments})`).join("\n")}`
    : "\n\nNO TOOL CALLS WERE MADE.";

  const hasTools = prompt.tools && prompt.tools.length > 0;

  const judgePrompt = `You are an expert evaluator. Score the following AI response on a task.

TASK: ${prompt.prompt}
CATEGORY: ${prompt.category} (Level ${prompt.level})
${hasTools ? `\nAVAILABLE TOOLS: ${prompt.tools!.map((t) => t.function.name).join(", ")}${toolCallInfo}` : ""}

RESPONSE TO EVALUATE:
${responseText || "(No text response — model only made tool calls)"}

Score on these dimensions (1-5 each):
${criteriaText}

Return ONLY valid JSON in this exact format:
{
${criteriaKeys.map((k) => `  "${k}": <1-5>`).join(",\n")},
  "total": <sum of all scores>,
  "one_line_reason": "<brief justification>"
}`;

  const resp = await client.chat.completions.create({
    model: "openai/gpt-4o-mini",
    messages: [{ role: "user", content: judgePrompt }],
    response_format: { type: "json_object" },
  });

  return JSON.parse(resp.choices[0].message.content ?? "{}");
}

// ─── Single prompt evaluation (original) ────────────────────────────────────
async function runSingleEval(task: string, selectedModels: string[]) {
  const freePrompt: EvalPrompt = {
    id: "custom",
    level: 0,
    category: "Custom",
    prompt: task,
    criteria: [
      { name: "Completeness", description: "Does it fully address the task?" },
      { name: "Accuracy", description: "Is the information correct and specific?" },
      { name: "Usefulness", description: "Would a real user find this actionable?" },
      { name: "Conciseness", description: "Is it the right length — not too short, not padded?" },
    ],
  };

  const results = await Promise.all(
    selectedModels.map((modelId) => callModel(modelId, freePrompt))
  );

  const judgedResults = await Promise.all(
    results.map(async (r) => {
      const score = await judgeResponse(freePrompt, r.response, r.toolCalls);
      return { ...r, score, promptId: "custom", level: 0, category: "Custom" };
    })
  );

  return judgedResults.sort((a, b) => (b.score.total ?? 0) - (a.score.total ?? 0));
}

// ─── Batch evaluation (new) ─────────────────────────────────────────────────
async function runBatchEval(selectedModels: string[], levels: number[]) {
  const prompts = PROMPT_BANK.filter((p) => levels.includes(p.level));
  const allResults: Record<string, {
    model: string;
    totalScore: number;
    maxScore: number;
    promptCount: number;
    byLevel: Record<number, { score: number; max: number; count: number }>;
    details: Array<{
      promptId: string;
      level: number;
      category: string;
      prompt: string;
      response: string;
      toolCalls: { name: string; arguments: string }[];
      tokens: number;
      latency: number;
      score: Record<string, unknown>;
    }>;
  }> = {};

  for (const modelId of selectedModels) {
    allResults[modelId] = {
      model: modelId,
      totalScore: 0,
      maxScore: 0,
      promptCount: 0,
      byLevel: {},
      details: [],
    };
  }

  for (const prompt of prompts) {
    const maxPerPrompt = prompt.criteria.length * 5;

    const modelResults = await Promise.all(
      selectedModels.map(async (modelId) => {
        try {
          const result = await callModel(modelId, prompt);
          const score = await judgeResponse(prompt, result.response, result.toolCalls);
          return { modelId, result, score, success: true };
        } catch {
          return {
            modelId,
            result: { model: modelId, response: "ERROR", toolCalls: [], tokens: 0, latency: 0 },
            score: { total: 0, one_line_reason: "API call failed" },
            success: false,
          };
        }
      })
    );

    for (const { modelId, result, score } of modelResults) {
      const entry = allResults[modelId];
      const scoreTotal = score.total ?? 0;

      entry.totalScore += scoreTotal;
      entry.maxScore += maxPerPrompt;
      entry.promptCount += 1;

      if (!entry.byLevel[prompt.level]) {
        entry.byLevel[prompt.level] = { score: 0, max: 0, count: 0 };
      }
      entry.byLevel[prompt.level].score += scoreTotal;
      entry.byLevel[prompt.level].max += maxPerPrompt;
      entry.byLevel[prompt.level].count += 1;

      entry.details.push({
        promptId: prompt.id,
        level: prompt.level,
        category: prompt.category,
        prompt: prompt.prompt.slice(0, 100),
        response: result.response.slice(0, 300),
        toolCalls: result.toolCalls,
        tokens: result.tokens,
        latency: result.latency,
        score,
      });
    }
  }

  const leaderboard = Object.values(allResults)
    .map((entry) => ({
      ...entry,
      scorePercent: entry.maxScore > 0 ? Math.round((entry.totalScore / entry.maxScore) * 100) : 0,
      byLevel: Object.fromEntries(
        Object.entries(entry.byLevel).map(([lvl, data]) => [
          lvl,
          { ...data, percent: data.max > 0 ? Math.round((data.score / data.max) * 100) : 0 },
        ])
      ),
    }))
    .sort((a, b) => b.scorePercent - a.scorePercent);

  return {
    leaderboard,
    meta: {
      totalPrompts: prompts.length,
      levels: levels.map((l) => LEVELS.find((lv) => lv.level === l)!),
      models: selectedModels.length,
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { task, models: selectedModels, mode, levels } = body;

    const validModels = (selectedModels ?? []).filter((id: string) =>
      AVAILABLE_MODELS.some((m) => m.id === id)
    );

    if (!validModels.length) {
      return NextResponse.json({ error: "At least one valid model is required" }, { status: 400 });
    }

    if (mode === "batch") {
      const selectedLevels = (levels ?? [1, 2, 3, 4, 5, 6]) as number[];
      const result = await runBatchEval(validModels, selectedLevels);
      return NextResponse.json(result);
    }

    if (!task) {
      return NextResponse.json({ error: "Task is required for single mode" }, { status: 400 });
    }

    const results = await runSingleEval(task, validModels);
    return NextResponse.json({ results });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    models: AVAILABLE_MODELS,
    levels: LEVELS,
    promptCount: PROMPT_BANK.length,
  });
}
