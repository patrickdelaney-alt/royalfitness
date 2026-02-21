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
        if (statsRes.ok) setStats(await statsRes.json());
        if (lbRes.ok) setLeaderboard(await lbRes.json());
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [period]);

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
    <div className="max-w-lg mx-auto px-4 pt-4 pb-8" style={{ color: "#ffffff" }}>
      <h1 className="text-xl font-bold mb-4">Stats</h1>

      {/* Period selector */}
      <div className="flex gap-2 mb-5 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
        {(["week", "month", "year"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
            style={
              period === p
                ? { background: "linear-gradient(135deg, #6d6af5 0%, #8b88f8 100%)", color: "#ffffff" }
                : { background: "transparent", color: "rgba(255,255,255,0.4)" }
            }
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl h-20 animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
          ))}
        </div>
      ) : stats ? (
        <>
          {/* Streaks */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="rounded-xl p-4 text-center" style={{ background: "#13141f", border: "1px solid rgba(255,255,255,0.08)" }}>
              <HiFire className="w-6 h-6 mx-auto mb-1" style={{ color: "#8b88f8" }} />
              <p className="text-2xl font-bold">{stats.currentStreak}</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Day Streak</p>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ background: "#13141f", border: "1px solid rgba(255,255,255,0.08)" }}>
              <HiTrendingUp className="w-6 h-6 mx-auto mb-1" style={{ color: "#8b88f8" }} />
              <p className="text-2xl font-bold">{stats.workoutStreak}</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Workout Streak</p>
            </div>
          </div>

          {/* Stats grid */}
          <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
            {periodLabel}
          </h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl p-4" style={{ background: "#13141f", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-2 mb-2">
                <HiFire className="w-4 h-4" style={{ color: "#8b88f8" }} />
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Workouts</span>
              </div>
              <p className="text-xl font-bold">{stats.workoutCount}</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: "#13141f", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-2 mb-2">
                <HiClock className="w-4 h-4" style={{ color: "#a78bfa" }} />
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Wellness Min</span>
              </div>
              <p className="text-xl font-bold">{stats.wellnessMinutes}</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: "#13141f", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-2 mb-2">
                <HiTrendingUp className="w-4 h-4" style={{ color: "#34d399" }} />
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Total Volume</span>
              </div>
              <p className="text-xl font-bold">
                {stats.totalVolume > 999
                  ? `${(stats.totalVolume / 1000).toFixed(1)}k`
                  : stats.totalVolume}{" "}
                <span className="text-xs font-normal" style={{ color: "rgba(255,255,255,0.4)" }}>lbs</span>
              </p>
            </div>
            <div className="rounded-xl p-4" style={{ background: "#13141f", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-2 mb-2">
                <HiEmojiHappy className="w-4 h-4" style={{ color: "#fbbf24" }} />
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Avg Mood</span>
              </div>
              <p className="text-xl font-bold">
                {stats.avgMoodAfter !== null ? `${stats.avgMoodAfter}/10` : "--"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="rounded-xl p-4" style={{ background: "#13141f", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Total Sets</p>
              <p className="text-xl font-bold">{stats.totalSets}</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: "#13141f", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Meals Logged</p>
              <p className="text-xl font-bold">{stats.mealsPosted}</p>
            </div>
          </div>

          {/* Steps section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.35)" }}>
                Steps
              </h2>
              <button
                onClick={() => setShowStepsForm((v) => !v)}
                className="text-xs font-medium"
                style={{ color: "#8b88f8" }}
              >
                {showStepsForm ? "Cancel" : "Log steps"}
              </button>
            </div>

            <div className="rounded-xl p-4 mb-3" style={{ background: "#13141f", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Last 7 days</p>
              <p className="text-2xl font-bold">{totalStepsWeek.toLocaleString()}</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>steps</p>
            </div>

            {showStepsForm && (
              <div className="p-4 rounded-xl mb-3 space-y-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {stepsError && (
                  <p className="text-xs" style={{ color: "#f87171" }}>{stepsError}</p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Date</label>
                    <input
                      type="date"
                      value={stepsDate}
                      onChange={(e) => setStepsDate(e.target.value)}
                      className="input-dark w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Steps</label>
                    <input
                      type="number"
                      value={stepsCount}
                      onChange={(e) => setStepsCount(e.target.value)}
                      placeholder="e.g. 8000"
                      className="input-dark w-full"
                    />
                  </div>
                </div>
                <button
                  onClick={handleLogSteps}
                  disabled={stepsSubmitting}
                  className="w-full py-2 rounded-xl text-sm font-semibold btn-gradient disabled:opacity-50"
                  style={{ color: "#ffffff" }}
                >
                  {stepsSubmitting ? "Logging..." : "Log Steps"}
                </button>
              </div>
            )}

            {stepsEntries.length > 0 && (
              <div className="space-y-2">
                {stepsEntries.map((e) => {
                  const pct = Math.min((e.count / 10000) * 100, 100);
                  return (
                    <div key={e.id} className="flex items-center gap-3">
                      <span className="text-xs w-16 flex-shrink-0" style={{ color: "rgba(255,255,255,0.4)" }}>
                        {formatDate(e.date)}
                      </span>
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: "linear-gradient(to right, #6d6af5, #8b88f8)" }}
                        />
                      </div>
                      <span className="text-xs font-medium w-16 text-right">{e.count.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Leaderboard */}
          {leaderboard && (
            <>
              <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
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
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={
                      activeBoard === b.key
                        ? { background: "linear-gradient(135deg, #6d6af5 0%, #8b88f8 100%)", color: "#ffffff" }
                        : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }
                    }
                  >
                    {b.label}
                  </button>
                ))}
              </div>

              {boardEntries.length === 0 ? (
                <p className="text-center text-sm py-6" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Follow friends to see the leaderboard
                </p>
              ) : (
                <div className="space-y-2">
                  {boardEntries.map((entry, idx) => (
                    <div
                      key={entry.userId}
                      className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: "#13141f", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      <span
                        className="w-6 text-center text-sm font-bold"
                        style={{
                          color: idx === 0 ? "#8b88f8" : idx === 1 ? "rgba(255,255,255,0.5)" : idx === 2 ? "#f59e0b" : "rgba(255,255,255,0.3)",
                        }}
                      >
                        {idx + 1}
                      </span>
                      {entry.avatarUrl ? (
                        <img src={entry.avatarUrl} alt={entry.username} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold btn-gradient">
                          {initials(entry.name)}
                        </div>
                      )}
                      <span className="flex-1 text-sm font-medium truncate">{entry.username}</span>
                      <span className="text-sm font-bold">{entry.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <p className="text-center text-sm py-12" style={{ color: "rgba(255,255,255,0.3)" }}>
          Failed to load stats
        </p>
      )}
    </div>
  );
}
