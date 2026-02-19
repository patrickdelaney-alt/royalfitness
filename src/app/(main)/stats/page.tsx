"use client";

import { useState, useEffect } from "react";
import { HiFire, HiClock, HiTrendingUp, HiEmojiHappy } from "react-icons/hi";

interface Stats {
  workoutCount: number;
  totalSets: number;
  totalVolume: number;
  wellnessMinutes: number;
  mealsPosted: number;
  avgMoodAfter: number | null;
  currentStreak: number;
  workoutStreak: number;
  period: string;
}

interface LeaderboardEntry {
  userId: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
  value: number;
}

interface Leaderboard {
  period: string;
  workoutCount: LeaderboardEntry[];
  wellnessMinutes: LeaderboardEntry[];
  mealsLogged: LeaderboardEntry[];
}

interface StepsEntry {
  id: string;
  date: string;
  count: number;
  source: string;
}

function initials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function StatsPage() {
  const [period, setPeriod] = useState<"week" | "month" | "year">("week");
  const [stats, setStats] = useState<Stats | null>(null);
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeBoard, setActiveBoard] = useState<"workoutCount" | "wellnessMinutes" | "mealsLogged">("workoutCount");

  // Steps state
  const [stepsEntries, setStepsEntries] = useState<StepsEntry[]>([]);
  const [stepsCount, setStepsCount] = useState("");
  const [stepsDate, setStepsDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [stepsSubmitting, setStepsSubmitting] = useState(false);
  const [stepsError, setStepsError] = useState("");
  const [showStepsForm, setShowStepsForm] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [statsRes, lbRes] = await Promise.all([
          fetch(`/api/stats?period=${period}`),
          fetch(`/api/stats/leaderboard?period=${period}`),
        ]);

        if (statsRes.ok) {
          setStats(await statsRes.json());
        }
        if (lbRes.ok) {
          setLeaderboard(await lbRes.json());
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [period]);

  // Load steps entries
  useEffect(() => {
    fetch("/api/steps")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setStepsEntries(data.slice(0, 14));
      })
      .catch(() => {});
  }, []);

  const handleLogSteps = async () => {
    const count = parseInt(stepsCount);
    if (!stepsCount || isNaN(count) || count <= 0) {
      setStepsError("Enter a valid step count");
      return;
    }
    setStepsSubmitting(true);
    setStepsError("");
    try {
      const res = await fetch("/api/steps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: stepsDate, count, source: "manual" }),
      });
      if (!res.ok) {
        const d = await res.json();
        setStepsError(d.error || "Failed to log steps");
        return;
      }
      const entry = await res.json();
      setStepsEntries((prev) => {
        const filtered = prev.filter((e) => e.date.split("T")[0] !== stepsDate);
        return [entry, ...filtered].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14);
      });
      setStepsCount("");
      setShowStepsForm(false);
    } catch {
      setStepsError("Something went wrong");
    } finally {
      setStepsSubmitting(false);
    }
  };

  const totalStepsWeek = stepsEntries
    .filter((e) => {
      const d = new Date(e.date);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      return d >= cutoff;
    })
    .reduce((sum, e) => sum + e.count, 0);

  const periodLabel = period === "week" ? "This Week" : period === "month" ? "This Month" : "This Year";

  const boardEntries = leaderboard?.[activeBoard] ?? [];

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-8">
      <h1 className="text-xl font-bold text-foreground mb-4">Stats</h1>

      {/* Period selector */}
      <div className="flex gap-2 mb-5">
        {(["week", "month", "year"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === p
                ? "bg-primary text-white"
                : "bg-gray-100 text-muted hover:bg-gray-200"
            }`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-xl border border-border h-20 animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <>
          {/* Streaks */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <HiFire className="w-6 h-6 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{stats.currentStreak}</p>
              <p className="text-xs text-muted">Day Streak</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <HiTrendingUp className="w-6 h-6 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{stats.workoutStreak}</p>
              <p className="text-xs text-muted">Workout Streak</p>
            </div>
          </div>

          {/* Stats grid */}
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
            {periodLabel}
          </h2>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <HiFire className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted">Workouts</span>
              </div>
              <p className="text-xl font-bold text-foreground">{stats.workoutCount}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <HiClock className="w-4 h-4 text-purple-500" />
                <span className="text-xs text-muted">Wellness Min</span>
              </div>
              <p className="text-xl font-bold text-foreground">{stats.wellnessMinutes}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <HiTrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-xs text-muted">Total Volume</span>
              </div>
              <p className="text-xl font-bold text-foreground">
                {stats.totalVolume > 999
                  ? `${(stats.totalVolume / 1000).toFixed(1)}k`
                  : stats.totalVolume}{" "}
                <span className="text-xs font-normal text-muted">lbs</span>
              </p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <HiEmojiHappy className="w-4 h-4 text-yellow-500" />
                <span className="text-xs text-muted">Avg Mood</span>
              </div>
              <p className="text-xl font-bold text-foreground">
                {stats.avgMoodAfter !== null ? `${stats.avgMoodAfter}/10` : "--"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-xs text-muted mb-1">Total Sets</p>
              <p className="text-xl font-bold text-foreground">{stats.totalSets}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-xs text-muted mb-1">Meals Logged</p>
              <p className="text-xl font-bold text-foreground">{stats.mealsPosted}</p>
            </div>
          </div>

          {/* Steps section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">
                Steps
              </h2>
              <button
                onClick={() => setShowStepsForm((v) => !v)}
                className="text-xs text-primary font-medium hover:text-primary-dark"
              >
                {showStepsForm ? "Cancel" : "Log steps"}
              </button>
            </div>

            {/* Summary card */}
            <div className="bg-card rounded-xl border border-border p-4 mb-3">
              <p className="text-xs text-muted mb-1">Last 7 days</p>
              <p className="text-2xl font-bold text-foreground">
                {totalStepsWeek.toLocaleString()}
              </p>
              <p className="text-xs text-muted">steps</p>
            </div>

            {/* Log form */}
            {showStepsForm && (
              <div className="p-4 border border-border rounded-xl bg-gray-50/50 mb-3 space-y-3">
                {stepsError && <p className="text-xs text-red-600">{stepsError}</p>}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-muted mb-1">Date</label>
                    <input
                      type="date"
                      value={stepsDate}
                      onChange={(e) => setStepsDate(e.target.value)}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">Steps</label>
                    <input
                      type="number"
                      value={stepsCount}
                      onChange={(e) => setStepsCount(e.target.value)}
                      placeholder="e.g. 8000"
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                </div>
                <button
                  onClick={handleLogSteps}
                  disabled={stepsSubmitting}
                  className="w-full py-2 rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-50"
                >
                  {stepsSubmitting ? "Logging..." : "Log Steps"}
                </button>
              </div>
            )}

            {/* Steps history */}
            {stepsEntries.length > 0 && (
              <div className="space-y-1.5">
                {stepsEntries.map((e) => {
                  const pct = Math.min((e.count / 10000) * 100, 100);
                  return (
                    <div key={e.id} className="flex items-center gap-3">
                      <span className="text-xs text-muted w-16 flex-shrink-0">
                        {formatDate(e.date)}
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-foreground w-16 text-right">
                        {e.count.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Leaderboard */}
          {leaderboard && (
            <>
              <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
                Friends Leaderboard
              </h2>

              <div className="flex gap-2 mb-3">
                {([
                  { key: "workoutCount" as const, label: "Workouts" },
                  { key: "wellnessMinutes" as const, label: "Wellness" },
                  { key: "mealsLogged" as const, label: "Meals" },
                ]).map((b) => (
                  <button
                    key={b.key}
                    onClick={() => setActiveBoard(b.key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      activeBoard === b.key
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-muted hover:bg-gray-200"
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>

              {boardEntries.length === 0 ? (
                <p className="text-center text-muted text-sm py-6">
                  Follow friends to see the leaderboard
                </p>
              ) : (
                <div className="space-y-2">
                  {boardEntries.map((entry, idx) => (
                    <div
                      key={entry.userId}
                      className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
                    >
                      <span
                        className={`w-6 text-center text-sm font-bold ${
                          idx === 0
                            ? "text-primary"
                            : idx === 1
                            ? "text-gray-500"
                            : idx === 2
                            ? "text-amber-600"
                            : "text-muted"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      {entry.avatarUrl ? (
                        <img
                          src={entry.avatarUrl}
                          alt={entry.username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                          {initials(entry.name)}
                        </div>
                      )}
                      <span className="flex-1 text-sm font-medium text-foreground truncate">
                        {entry.username}
                      </span>
                      <span className="text-sm font-bold text-foreground">{entry.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <p className="text-center text-muted text-sm py-12">Failed to load stats</p>
      )}
    </div>
  );
}
