"use client";

import { useState, useEffect } from "react";

interface ModelOption {
  id: string;
  name: string;
  provider: string;
}

interface LevelInfo {
  level: number;
  name: string;
  description: string;
}

interface Score {
  total: number;
  one_line_reason: string;
  [key: string]: unknown;
}

interface SingleResult {
  model: string;
  response: string;
  tokens: number;
  latency: number;
  score: Score;
}

interface LevelBreakdown {
  score: number;
  max: number;
  count: number;
  percent: number;
}

interface BenchmarkEntry {
  model: string;
  totalScore: number;
  maxScore: number;
  scorePercent: number;
  promptCount: number;
  byLevel: Record<string, LevelBreakdown>;
  details: Array<{
    promptId: string;
    level: number;
    category: string;
    prompt: string;
    response: string;
    toolCalls: { name: string; arguments: string }[];
    tokens: number;
    latency: number;
    score: Score;
  }>;
}

interface BenchmarkResult {
  leaderboard: BenchmarkEntry[];
  meta: {
    totalPrompts: number;
    levels: LevelInfo[];
    models: number;
  };
}

const PRESET_TASKS = [
  "Compare Cursor, Windsurf, and GitHub Copilot in 5 bullet points. Be specific.",
  "Explain how an AI agent differs from a chatbot. Give 3 concrete examples.",
  "Write a cold outreach message to a startup CEO as a PM candidate. Under 100 words.",
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
    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${styles[rank] ?? "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"}`}>
      #{rank}
    </span>
  );
}

function PercentBar({ percent, color }: { percent: number; color: string }) {
  return (
    <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2.5">
      <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${percent}%` }} />
    </div>
  );
}

export default function Home() {
  const [models, setModels] = useState<ModelOption[]>([]);
  const [levels, setLevels] = useState<LevelInfo[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<number[]>([]);
  const [task, setTask] = useState("");
  const [mode, setMode] = useState<"single" | "benchmark">("single");
  const [singleResults, setSingleResults] = useState<SingleResult[]>([]);
  const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/arena")
      .then((r) => r.json())
      .then((data) => {
        setModels(data.models);
        setLevels(data.levels);
        setSelected(data.models.slice(0, 3).map((m: ModelOption) => m.id));
        setSelectedLevels(data.levels.map((l: LevelInfo) => l.level));
      });
  }, []);

  useEffect(() => {
    if (!loading) return;
    const start = Date.now();
    const interval = setInterval(() => setElapsed(Math.round((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [loading]);

  const toggleModel = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]);
  };

  const toggleLevel = (lvl: number) => {
    setSelectedLevels((prev) => prev.includes(lvl) ? prev.filter((l) => l !== lvl) : [...prev, lvl]);
  };

  const runArena = async () => {
    if (mode === "single" && (!task.trim() || selected.length < 2)) return;
    if (mode === "benchmark" && (selected.length < 2 || selectedLevels.length === 0)) return;

    setLoading(true);
    setSingleResults([]);
    setBenchmarkResult(null);
    setError("");
    setElapsed(0);

    try {
      const body = mode === "single"
        ? { task, models: selected, mode: "single" }
        : { models: selected, mode: "batch", levels: selectedLevels };

      const resp = await fetch("/api/arena", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error);

      if (mode === "single") {
        setSingleResults(data.results);
      } else {
        setBenchmarkResult(data);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const promptCount = selectedLevels.length * 10;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              AI Agent Eval Arena
            </h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              Compare LLMs with structured benchmarks and automated judging
            </p>
          </div>
          <a href="https://github.com/ashleyashli/agent-eval-arena" target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors">
            Built by Ashley Li
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Mode Toggle */}
        <div className="flex gap-2">
          <button onClick={() => setMode("single")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === "single" ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"}`}>
            Single Prompt
          </button>
          <button onClick={() => setMode("benchmark")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === "benchmark" ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"}`}>
            Full Benchmark
            <span className="ml-1.5 text-xs opacity-60">(60 prompts)</span>
          </button>
        </div>

        {/* Single Mode: Task Input */}
        {mode === "single" && (
          <section className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Task prompt</label>
            <textarea value={task} onChange={(e) => setTask(e.target.value)} placeholder="Enter a task for the models to compete on..." rows={3} className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none" />
            <div className="flex flex-wrap gap-2">
              {PRESET_TASKS.map((t, i) => (
                <button key={i} onClick={() => setTask(t)} className="text-xs px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                  {t.slice(0, 50)}...
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Benchmark Mode: Level Selection */}
        {mode === "benchmark" && (
          <section className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Difficulty levels</label>
              <span className="text-xs text-zinc-500">{promptCount} prompts selected</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {levels.map((l) => (
                <button key={l.level} onClick={() => toggleLevel(l.level)} className={`p-3 rounded-lg border text-left transition-all ${selectedLevels.includes(l.level) ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600" : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"}`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${selectedLevels.includes(l.level) ? "bg-emerald-500 text-white" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400"}`}>
                      L{l.level}
                    </span>
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{l.name}</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">{l.description}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Model Selection */}
        <section className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Select models (min 2)</label>
          <div className="flex flex-wrap gap-3">
            {models.map((m) => (
              <button key={m.id} onClick={() => toggleModel(m.id)} className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${selected.includes(m.id) ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-600" : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400"}`}>
                <span className="font-semibold">{m.name}</span>
                <span className="ml-1.5 text-xs opacity-60">{m.provider}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Run Button */}
        <button onClick={runArena} disabled={loading || selected.length < 2 || (mode === "single" && !task.trim()) || (mode === "benchmark" && selectedLevels.length === 0)} className="w-full py-3.5 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-300 disabled:text-zinc-500 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-500 transition-colors text-sm">
          {loading
            ? `Running ${mode === "benchmark" ? "Benchmark" : "Arena"}... ${elapsed}s`
            : mode === "benchmark"
              ? `Run Full Benchmark (${promptCount} prompts × ${selected.length} models = ${promptCount * selected.length} evaluations)`
              : `Run Arena (${selected.length} models)`
          }
        </button>

        {loading && mode === "benchmark" && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="flex items-center gap-3">
              <div className="animate-spin h-5 w-5 border-2 border-emerald-500 border-t-transparent rounded-full" />
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Running {promptCount * selected.length} evaluations...
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {promptCount} prompts × {selected.length} models + judge scoring. This takes 2-5 minutes.
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Single Mode Results */}
        {mode === "single" && singleResults.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Leaderboard</h2>
            <div className="space-y-4">
              {singleResults.map((r, i) => {
                const modelInfo = models.find((m) => m.id === r.model);
                const scoreKeys = Object.keys(r.score).filter((k) => !["total", "one_line_reason"].includes(k));
                return (
                  <div key={r.model} className={`bg-white dark:bg-zinc-900 rounded-xl border p-6 space-y-4 ${i === 0 ? "border-amber-300 dark:border-amber-700 ring-1 ring-amber-200 dark:ring-amber-800" : "border-zinc-200 dark:border-zinc-800"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <RankBadge rank={i + 1} />
                        <div>
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100">{modelInfo?.name ?? r.model}</p>
                          <p className="text-xs text-zinc-500">{modelInfo?.provider}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{r.score.total}<span className="text-sm font-normal text-zinc-400">/{scoreKeys.length * 5}</span></p>
                        <p className="text-xs text-zinc-500">{r.latency}s · {r.tokens} tokens</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                      {scoreKeys.map((key) => (
                        <ScoreBar key={key} label={key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} value={r.score[key] as number} />
                      ))}
                    </div>
                    <p className="text-xs text-zinc-500 italic">{r.score.one_line_reason}</p>
                    <details className="group">
                      <summary className="text-xs font-medium text-zinc-500 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300 select-none">Show full response</summary>
                      <div className="mt-3 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">{r.response}</div>
                    </details>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Benchmark Results */}
        {benchmarkResult && (
          <section className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Benchmark Leaderboard</h2>
              <p className="text-sm text-zinc-500 mt-1">
                {benchmarkResult.meta.totalPrompts} prompts × {benchmarkResult.meta.models} models · Scored by LLM-as-judge
              </p>
            </div>

            {/* Overall Rankings */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Overall Score</h3>
              </div>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {benchmarkResult.leaderboard.map((entry, i) => {
                  const modelInfo = models.find((m) => m.id === entry.model);
                  const barColor = i === 0 ? "bg-amber-400" : i === 1 ? "bg-zinc-400" : i === 2 ? "bg-orange-400" : "bg-zinc-300";
                  return (
                    <div key={entry.model} className="px-6 py-4 flex items-center gap-4">
                      <RankBadge rank={i + 1} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{modelInfo?.name ?? entry.model}</p>
                          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{entry.scorePercent}%</p>
                        </div>
                        <PercentBar percent={entry.scorePercent} color={barColor} />
                        <p className="text-xs text-zinc-500 mt-1">{entry.totalScore}/{entry.maxScore} points across {entry.promptCount} prompts</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Per-Level Breakdown */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Score by Difficulty Level</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500">Model</th>
                      {benchmarkResult.meta.levels.map((l) => (
                        <th key={l.level} className="text-center px-4 py-3 text-xs font-medium text-zinc-500">
                          L{l.level} {l.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {benchmarkResult.leaderboard.map((entry) => {
                      const modelInfo = models.find((m) => m.id === entry.model);
                      return (
                        <tr key={entry.model}>
                          <td className="px-6 py-3 font-medium text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                            {modelInfo?.name ?? entry.model}
                          </td>
                          {benchmarkResult.meta.levels.map((l) => {
                            const data = entry.byLevel[String(l.level)];
                            const pct = data?.percent ?? 0;
                            const color = pct >= 80 ? "text-emerald-600 dark:text-emerald-400" : pct >= 60 ? "text-yellow-600 dark:text-yellow-400" : "text-red-500";
                            return (
                              <td key={l.level} className={`text-center px-4 py-3 font-mono font-bold ${color}`}>
                                {data ? `${pct}%` : "—"}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detailed Results (collapsed) */}
            <details className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <summary className="px-6 py-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 select-none">
                View all {benchmarkResult.meta.totalPrompts * benchmarkResult.meta.models} individual evaluations
              </summary>
              <div className="border-t border-zinc-200 dark:border-zinc-800 max-h-[600px] overflow-y-auto">
                {benchmarkResult.leaderboard.map((entry) => {
                  const modelInfo = models.find((m) => m.id === entry.model);
                  return (
                    <div key={entry.model} className="border-b border-zinc-200 dark:border-zinc-800 last:border-0">
                      <div className="px-6 py-3 bg-zinc-50 dark:bg-zinc-800/50 sticky top-0">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{modelInfo?.name ?? entry.model}</p>
                      </div>
                      <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                        {entry.details.map((d) => (
                          <div key={d.promptId} className="px-6 py-3 flex items-start gap-4">
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${d.level <= 2 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" : d.level <= 4 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"}`}>
                              L{d.level}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate">{d.prompt}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">{d.score.total}pts</span>
                                <span className="text-xs text-zinc-500">{d.latency}s · {d.tokens}tok</span>
                                {d.toolCalls.length > 0 && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                    {d.toolCalls.length} tool call{d.toolCalls.length > 1 ? "s" : ""}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </details>
          </section>
        )}
      </main>
    </div>
  );
}
