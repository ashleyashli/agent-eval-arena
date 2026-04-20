"use client";

import { useState, useEffect } from "react";

interface ModelOption {
  id: string;
  name: string;
  provider: string;
}

interface Score {
  completeness: number;
  accuracy: number;
  usefulness: number;
  conciseness: number;
  total: number;
  one_line_reason: string;
}

interface Result {
  model: string;
  response: string;
  tokens: number;
  latency: number;
  score: Score;
}

const PRESET_TASKS = [
  "Compare Cursor, Windsurf, and GitHub Copilot in 5 bullet points. Be specific.",
  "Explain how an AI agent differs from a chatbot. Give 3 concrete examples.",
  "Write a cold outreach message to a startup CEO as a PM candidate. Keep it under 100 words.",
  "What are the top 3 risks of deploying LLMs in production? Be specific about mitigations.",
];

const SCORE_COLORS: Record<string, string> = {
  "1": "bg-red-500",
  "2": "bg-orange-500",
  "3": "bg-yellow-500",
  "4": "bg-emerald-500",
  "5": "bg-emerald-600",
};

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-28 text-zinc-500 shrink-0">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-2.5 w-5 rounded-sm ${i <= value ? SCORE_COLORS[String(value)] : "bg-zinc-200 dark:bg-zinc-700"}`}
          />
        ))}
      </div>
      <span className="text-zinc-700 dark:text-zinc-300 font-mono text-xs">{value}/5</span>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const styles: Record<number, string> = {
    1: "bg-amber-400 text-amber-950",
    2: "bg-zinc-300 text-zinc-800",
    3: "bg-orange-300 text-orange-900",
  };
  return (
    <span
      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${styles[rank] ?? "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"}`}
    >
      #{rank}
    </span>
  );
}

export default function Home() {
  const [models, setModels] = useState<ModelOption[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [task, setTask] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/arena")
      .then((r) => r.json())
      .then((data) => {
        setModels(data.models);
        setSelected(data.models.slice(0, 3).map((m: ModelOption) => m.id));
      });
  }, []);

  useEffect(() => {
    if (!loading) return;
    const start = Date.now();
    const interval = setInterval(() => setElapsed(Math.round((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [loading]);

  const toggleModel = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const runArena = async () => {
    if (!task.trim() || selected.length < 2) return;
    setLoading(true);
    setResults([]);
    setError("");
    setElapsed(0);

    try {
      const resp = await fetch("/api/arena", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, models: selected }),
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      setResults(data.results);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              AI Agent Eval Arena
            </h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              Compare LLMs side-by-side with automated judging
            </p>
          </div>
          <a
            href="https://github.com/ashleyashli/agent-eval-arena"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            Built by Ashley Li
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Task Input */}
        <section className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Task prompt
          </label>
          <textarea
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="Enter a task for the models to compete on..."
            rows={3}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
          />
          <div className="flex flex-wrap gap-2">
            {PRESET_TASKS.map((t, i) => (
              <button
                key={i}
                onClick={() => setTask(t)}
                className="text-xs px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                {t.slice(0, 50)}...
              </button>
            ))}
          </div>
        </section>

        {/* Model Selection */}
        <section className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Select models (min 2)
          </label>
          <div className="flex flex-wrap gap-3">
            {models.map((m) => (
              <button
                key={m.id}
                onClick={() => toggleModel(m.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                  selected.includes(m.id)
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-600"
                    : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400"
                }`}
              >
                <span className="font-semibold">{m.name}</span>
                <span className="ml-1.5 text-xs opacity-60">{m.provider}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Run Button */}
        <button
          onClick={runArena}
          disabled={loading || selected.length < 2 || !task.trim()}
          className="w-full py-3.5 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-300 disabled:text-zinc-500 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-500 transition-colors text-sm"
        >
          {loading ? `Running Arena... ${elapsed}s` : `Run Arena (${selected.length} models)`}
        </button>

        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Leaderboard</h2>
            <div className="space-y-4">
              {results.map((r, i) => {
                const modelInfo = models.find((m) => m.id === r.model);
                return (
                  <div
                    key={r.model}
                    className={`bg-white dark:bg-zinc-900 rounded-xl border p-6 space-y-4 ${
                      i === 0
                        ? "border-amber-300 dark:border-amber-700 ring-1 ring-amber-200 dark:ring-amber-800"
                        : "border-zinc-200 dark:border-zinc-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <RankBadge rank={i + 1} />
                        <div>
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {modelInfo?.name ?? r.model}
                          </p>
                          <p className="text-xs text-zinc-500">{modelInfo?.provider}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                          {r.score.total}<span className="text-sm font-normal text-zinc-400">/20</span>
                        </p>
                        <p className="text-xs text-zinc-500">
                          {r.latency}s · {r.tokens} tokens
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                      <ScoreBar label="Completeness" value={r.score.completeness} />
                      <ScoreBar label="Accuracy" value={r.score.accuracy} />
                      <ScoreBar label="Usefulness" value={r.score.usefulness} />
                      <ScoreBar label="Conciseness" value={r.score.conciseness} />
                    </div>

                    <p className="text-xs text-zinc-500 italic">{r.score.one_line_reason}</p>

                    <details className="group">
                      <summary className="text-xs font-medium text-zinc-500 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300 select-none">
                        Show full response
                      </summary>
                      <div className="mt-3 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                        {r.response}
                      </div>
                    </details>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
