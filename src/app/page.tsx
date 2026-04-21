"use client";

import { useState, useEffect } from "react";

interface ModelOption {
  id: string;
  name: string;
  provider: string;
}

interface DifficultyInfo {
  name: string;
  description: string;
}

interface Score {
  total: number;
  one_line_reason: string;
  [key: string]: number | string;
}

interface Result {
  model: string;
  response: string;
  tokens: number;
  latency: number;
  score: Score;
}

interface BenchmarkModelResult {
  model: string;
  response: string;
  tokens: number;
  latency: number;
  score: Score;
}

interface BenchmarkResult {
  promptId: string;
  difficulty: string;
  type: string;
  prompt: string;
  dimensions: string[];
  modelResults: BenchmarkModelResult[];
}

interface LeaderboardEntry {
  model: string;
  avgScore: number;
  wins: number;
  totalPrompts: number;
  avgLatency: number;
  avgTokens: number;
}

const PRESET_TASKS = [
  "Compare Cursor, Windsurf, and GitHub Copilot in 5 bullet points. Be specific.",
  "Explain how an AI agent differs from a chatbot. Give 3 concrete examples.",
  "Write a cold outreach message to a startup CEO as a PM candidate. Keep it under 100 words.",
  "What are the top 3 risks of deploying LLMs in production? Be specific about mitigations.",
];

function ScoreBar({ label, value, max = 5 }: { label: string; value: number; max?: number }) {
  const colors: Record<number, string> = { 1: "bg-red-500", 2: "bg-orange-500", 3: "bg-yellow-500", 4: "bg-emerald-500", 5: "bg-emerald-600" };
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-28 text-zinc-500 shrink-0 truncate">{label}</span>
      <div className="flex gap-0.5">
        {Array.from({ length: max }, (_, i) => (
          <div key={i} className={`h-2.5 w-5 rounded-sm ${i < value ? colors[value] ?? "bg-emerald-600" : "bg-zinc-200 dark:bg-zinc-700"}`} />
        ))}
      </div>
      <span className="text-zinc-700 dark:text-zinc-300 font-mono text-xs">{value}/{max}</span>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const styles: Record<number, string> = { 1: "bg-amber-400 text-amber-950", 2: "bg-zinc-300 text-zinc-800", 3: "bg-orange-300 text-orange-900" };
  return (
    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${styles[rank] ?? "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"}`}>
      #{rank}
    </span>
  );
}

function DifficultyBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    L1: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
    L2: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    L3: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
    L4: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
    L5: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    L6: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-bold ${colors[level] ?? "bg-zinc-100 text-zinc-600"}`}>{level}</span>;
}

export default function Home() {
  const [models, setModels] = useState<ModelOption[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [task, setTask] = useState("");
  const [mode, setMode] = useState<"single" | "benchmark">("single");
  const [difficulties, setDifficulties] = useState<Record<string, DifficultyInfo>>({});
  const [selectedDiffs, setSelectedDiffs] = useState<string[]>([]);
  const [promptCounts, setPromptCounts] = useState<Record<string, number>>({});

  // Single mode results
  const [results, setResults] = useState<Result[]>([]);

  // Benchmark mode results
  const [benchResults, setBenchResults] = useState<BenchmarkResult[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [totalPrompts, setTotalPrompts] = useState(0);

  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/arena")
      .then((r) => r.json())
      .then((data) => {
        setModels(data.models);
        setSelected(data.models.slice(0, 3).map((m: ModelOption) => m.id));
        setDifficulties(data.difficulties);
        setPromptCounts(data.promptCounts);
      });
  }, []);

  useEffect(() => {
    if (!loading) return;
    const start = Date.now();
    const interval = setInterval(() => setElapsed(Math.round((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [loading]);

  const toggleModel = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));
  };

  const toggleDiff = (d: string) => {
    setSelectedDiffs((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const selectedPromptCount = selectedDiffs.reduce((sum, d) => sum + (promptCounts[d] ?? 0), 0);

  const runArena = async () => {
    setLoading(true);
    setResults([]);
    setBenchResults([]);
    setLeaderboard([]);
    setError("");
    setElapsed(0);

    try {
      if (mode === "single") {
        if (!task.trim() || selected.length < 2) return;
        const resp = await fetch("/api/arena", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "single", task, models: selected }),
        });
        const data = await resp.json();
        if (data.error) throw new Error(data.error);
        setResults(data.results);
      } else {
        if (selectedDiffs.length === 0 || selected.length < 2) return;
        setProgress(`Running ${selectedPromptCount} prompts across ${selected.length} models...`);
        const resp = await fetch("/api/arena", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "benchmark", models: selected, difficulties: selectedDiffs }),
        });
        const data = await resp.json();
        if (data.error) throw new Error(data.error);
        setBenchResults(data.results);
        setLeaderboard(data.leaderboard);
        setTotalPrompts(data.totalPrompts);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
      setProgress("");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">AI Agent Eval Arena</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Compare LLMs with structured benchmarks and automated judging</p>
          </div>
          <a href="https://github.com/ashleyashli/agent-eval-arena" target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors">
            Built by Ashley Li
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Mode Toggle */}
        <div className="flex gap-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-1.5 w-fit">
          <button onClick={() => setMode("single")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === "single" ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "text-zinc-500 hover:text-zinc-700"}`}>
            Single Task
          </button>
          <button onClick={() => setMode("benchmark")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === "benchmark" ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "text-zinc-500 hover:text-zinc-700"}`}>
            Benchmark (60 prompts)
          </button>
        </div>

        {/* Single Task Input */}
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

        {/* Benchmark Difficulty Selection */}
        {mode === "benchmark" && (
          <section className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Select difficulty levels <span className="text-zinc-400 font-normal">({selectedPromptCount} prompts selected)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(difficulties).map(([key, info]) => (
                <button key={key} onClick={() => toggleDiff(key)} className={`flex items-start gap-3 p-4 rounded-lg border text-left transition-all ${selectedDiffs.includes(key) ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600" : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"}`}>
                  <DifficultyBadge level={key} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{info.name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{info.description}</p>
                    <p className="text-xs text-zinc-400 mt-1">{promptCounts[key]} prompts</p>
                  </div>
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
        <button
          onClick={runArena}
          disabled={loading || selected.length < 2 || (mode === "single" ? !task.trim() : selectedDiffs.length === 0)}
          className="w-full py-3.5 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-300 disabled:text-zinc-500 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-500 transition-colors text-sm"
        >
          {loading
            ? `Running ${mode === "benchmark" ? "Benchmark" : "Arena"}... ${elapsed}s`
            : mode === "benchmark"
              ? `Run Benchmark (${selectedPromptCount} prompts × ${selected.length} models)`
              : `Run Arena (${selected.length} models)`}
        </button>

        {loading && progress && (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-300">
            {progress}
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-300">{error}</div>
        )}

        {/* Single Task Results */}
        {mode === "single" && results.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Leaderboard</h2>
            <div className="space-y-4">
              {results.map((r, i) => {
                const modelInfo = models.find((m) => m.id === r.model);
                const scoreDims = Object.entries(r.score).filter(([k]) => !["total", "one_line_reason"].includes(k));
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
                        <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{r.score.total}<span className="text-sm font-normal text-zinc-400">/{scoreDims.length * 5}</span></p>
                        <p className="text-xs text-zinc-500">{r.latency}s · {r.tokens} tokens</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                      {scoreDims.map(([key, val]) => (
                        <ScoreBar key={key} label={key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ")} value={val as number} />
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
        {mode === "benchmark" && leaderboard.length > 0 && (
          <section className="space-y-8">
            {/* Aggregate Leaderboard */}
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                Benchmark Leaderboard
                <span className="text-sm font-normal text-zinc-400 ml-2">({totalPrompts} prompts)</span>
              </h2>
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                      <th className="px-4 py-3 text-left font-medium text-zinc-500">Rank</th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-500">Model</th>
                      <th className="px-4 py-3 text-right font-medium text-zinc-500">Avg Score</th>
                      <th className="px-4 py-3 text-right font-medium text-zinc-500">Wins</th>
                      <th className="px-4 py-3 text-right font-medium text-zinc-500">Avg Latency</th>
                      <th className="px-4 py-3 text-right font-medium text-zinc-500">Avg Tokens</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry, i) => {
                      const modelInfo = models.find((m) => m.id === entry.model);
                      return (
                        <tr key={entry.model} className={`border-b border-zinc-100 dark:border-zinc-800 ${i === 0 ? "bg-amber-50 dark:bg-amber-950/30" : ""}`}>
                          <td className="px-4 py-3"><RankBadge rank={i + 1} /></td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-zinc-900 dark:text-zinc-100">{modelInfo?.name ?? entry.model}</p>
                            <p className="text-xs text-zinc-500">{modelInfo?.provider}</p>
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">{entry.avgScore}</td>
                          <td className="px-4 py-3 text-right font-mono text-zinc-700 dark:text-zinc-300">{entry.wins}/{entry.totalPrompts}</td>
                          <td className="px-4 py-3 text-right font-mono text-zinc-500">{entry.avgLatency}s</td>
                          <td className="px-4 py-3 text-right font-mono text-zinc-500">{entry.avgTokens}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Per-prompt breakdown */}
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-4">Per-Prompt Results</h2>
              <div className="space-y-3">
                {benchResults.map((br) => (
                  <details key={br.promptId} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden group">
                    <summary className="px-6 py-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 select-none">
                      <div className="flex items-center gap-3">
                        <DifficultyBadge level={br.difficulty} />
                        <span className="text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">{br.type}</span>
                        <span className="text-sm text-zinc-700 dark:text-zinc-300 truncate">{br.prompt.slice(0, 80)}...</span>
                        <span className="ml-auto text-xs text-zinc-400 shrink-0">
                          Winner: {models.find((m) => m.id === br.modelResults[0]?.model)?.name ?? br.modelResults[0]?.model}
                        </span>
                      </div>
                    </summary>
                    <div className="px-6 pb-4 space-y-3 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">{br.prompt}</p>
                      <p className="text-xs text-zinc-400">Eval dimensions: {br.dimensions.join(", ")}</p>
                      {br.modelResults.map((mr, j) => {
                        const mi = models.find((m) => m.id === mr.model);
                        const scoreDims = Object.entries(mr.score).filter(([k]) => !["total", "one_line_reason"].includes(k));
                        return (
                          <div key={mr.model} className={`p-4 rounded-lg border ${j === 0 ? "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20" : "border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30"}`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <RankBadge rank={j + 1} />
                                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{mi?.name ?? mr.model}</span>
                              </div>
                              <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{mr.score.total}<span className="text-zinc-400 font-normal">/{scoreDims.length * 5}</span></span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                              {scoreDims.map(([key, val]) => (
                                <ScoreBar key={key} label={key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ")} value={val as number} />
                              ))}
                            </div>
                            <p className="text-xs text-zinc-500 italic mt-2">{mr.score.one_line_reason}</p>
                            <details className="mt-2">
                              <summary className="text-xs text-zinc-400 cursor-pointer hover:text-zinc-600 select-none">Show response</summary>
                              <div className="mt-2 p-3 rounded bg-white dark:bg-zinc-900 text-xs text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap max-h-48 overflow-y-auto">{mr.response}</div>
                            </details>
                          </div>
                        );
                      })}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
