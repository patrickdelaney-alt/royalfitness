"use client";

import { useState, useEffect } from "react";
import { HiFire, HiClock, HiTrendingUp, HiEmojiHappy } from "react-icons/hi";
import Link from "next/link";

// Muscle group display config
const MUSCLE_META: Record<string, { label: string; color: string }> = {
  chest:     { label: "Chest",     color: "#243F16" },
  back:      { label: "Back",      color: "#528531" },
  legs:      { label: "Legs",      color: "#528531" },
  shoulders: { label: "Shoulders", color: "#9A7B2E" },
  arms:      { label: "Arms",      color: "#C9A84C" },
  core:      { label: "Core",      color: "#f87171" },
  glutes:    { label: "Glutes",    color: "#C9A84C" },
  cardio:    { label: "Cardio",    color: "#528531" },
};

function getMuscleColor(mg: string): string {
  return MUSCLE_META[mg]?.color ?? "#528531";
}

function getMuscleLabel(mg: string): string {
  return MUSCLE_META[mg]?.label ?? mg.charAt(0).toUpperCase() + mg.slice(1);
}

interface WeeklyWorkoutDay {
  date: string;
  dayName: string;
  workoutCount: number;
  muscleGroups: string[];
  isToday: boolean;
}

interface Stats {
  workoutCount: number;
  totalSets: number;
  totalVolume: number;
  wellnessMinutes: number;
  mealsPosted: number;
  avgMoodAfter: number | null;
  currentStreak: number;
  workoutStreak: number;
  weeklyWorkouts: WeeklyWorkoutDay[];
  muscleGroupCounts: Record<string, number>;
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
  // Handle both "YYYY-MM-DD" and full ISO strings; use noon to avoid day-shift
  const d = new Date(dateStr.length === 10 ? dateStr + "T12:00:00" : dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Weekly workout bar chart component
function WeeklyWorkoutChart({ days }: { days: WeeklyWorkoutDay[] }) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const maxCount = Math.max(...days.map((d) => d.workoutCount), 1);

  return (
    <div>
      {/* Bar chart */}
      <div className="flex items-end justify-between gap-1 h-20 mb-2">
        {days.map((day, i) => {
          const isToday = day.isToday;
          const isSelected = selectedDay === i;
          const heightPct = day.workoutCount > 0
            ? Math.max((day.workoutCount / maxCount) * 100, 20)
            : 0;

          return (
            <button
              key={day.date}
              onClick={() => setSelectedDay(isSelected ? null : i)}
              className="flex-1 flex flex-col items-center gap-1 group"
            >
              <div className="w-full flex items-end justify-center" style={{ height: 64 }}>
                {day.workoutCount > 0 ? (
                  <div
                    className="w-full rounded-t-md transition-all"
                    style={{
                      height: `${heightPct}%`,
                      background: isSelected || isToday
                        ? "linear-gradient(180deg, #528531 0%, #243F16 100%)"
                        : "linear-gradient(180deg, rgba(82,133,49,0.7) 0%, rgba(36,63,22,0.5) 100%)",
                      boxShadow: isSelected ? "0 0 12px rgba(82,133,49,0.5)" : "none",
                    }}
                  />
                ) : (
                  <div
                    className="w-full rounded-t-sm"
                    style={{ height: 4, background: "rgba(36,63,22,0.04)" }}
                  />
                )}
              </div>
              <span
                className="text-xs font-medium"
                style={{
                  color: isToday
                    ? "#528531"
                    : isSelected
                    ? "var(--text)"
                    : "var(--text-muted)",
                }}
              >
                {day.dayName}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected day detail */}
      {selectedDay !== null && days[selectedDay] && (
        <div
          className="mt-3 p-3 rounded-xl text-sm"
          style={{ background: "rgba(36,63,22,0.04)", border: "1px solid rgba(36,63,22,0.10)" }}
        >
          <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
            {formatDate(days[selectedDay].date)} —{" "}
            <span className="font-semibold" style={{ color: "var(--text)" }}>
              {days[selectedDay].workoutCount}{" "}
              {days[selectedDay].workoutCount === 1 ? "workout" : "workouts"}
            </span>
          </p>
          {days[selectedDay].muscleGroups.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {days[selectedDay].muscleGroups.map((mg) => (
                <span
                  key={mg}
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    background: `${getMuscleColor(mg)}22`,
                    color: getMuscleColor(mg),
                    border: `1px solid ${getMuscleColor(mg)}44`,
                  }}
                >
                  {getMuscleLabel(mg)}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Rest day
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Muscle group breakdown bars
function MuscleGroupBreakdown({
  counts,
}: {
  counts: Record<string, number>;
}) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) {
    return (
      <p className="text-xs text-center py-4" style={{ color: "var(--text-muted)" }}>
        No muscle group data yet
      </p>
    );
  }
  const max = entries[0][1];

  return (
    <div className="space-y-2.5">
      {entries.map(([mg, count]) => {
        const pct = (count / max) * 100;
        const color = getMuscleColor(mg);
        return (
          <div key={mg} className="flex items-center gap-3">
            <span
              className="text-xs font-medium w-20 flex-shrink-0"
              style={{ color: "var(--text)" }}
            >
              {getMuscleLabel(mg)}
            </span>
            <div
              className="flex-1 h-2 rounded-full overflow-hidden"
              style={{ background: "rgba(36,63,22,0.07)" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: color }}
              />
            </div>
            <span
              className="text-xs font-bold w-5 text-right flex-shrink-0"
              style={{ color }}
            >
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function StatsPage() {
  const [period, setPeriod] = useState<"week" | "month" | "year">("week");
  const [stats, setStats] = useState<Stats | null>(null);
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [leaderboardError, setLeaderboardError] = useState(false);
  const [lbPeriod, setLbPeriod] = useState<"all" | "week" | "month" | "year">("all");
  const [loading, setLoading] = useState(true);
  const [activeBoard, setActiveBoard] = useState<"workoutCount" | "wellnessMinutes" | "mealsLogged">("workoutCount");

  // Steps state
  const [stepsEntries, setStepsEntries] = useState<StepsEntry[]>([]);
  const [stepsCount, setStepsCount] = useState("");
  const [stepsDate, setStepsDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [stepsSubmitting, setStepsSubmitting] = useState(false);
  const [stepsError, setStepsError] = useState("");
  const [showStepsForm, setShowStepsForm] = useState(false);

  // Load personal stats (responds to period selector)
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const res = await fetch(`/api/stats?period=${period}&tz=${encodeURIComponent(tz)}`);
        if (res.ok) setStats(await res.json());
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [period]);

  // Load leaderboard independently (responds to its own lbPeriod selector)
  useEffect(() => {
    setLeaderboard(null);
    setLeaderboardError(false);
    async function loadLeaderboard() {
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const res = await fetch(
          `/api/stats/leaderboard?period=${lbPeriod}&tz=${encodeURIComponent(tz)}`
        );
        if (res.ok) {
          setLeaderboard(await res.json());
        } else {
          setLeaderboardError(true);
        }
      } catch {
        setLeaderboardError(true);
      }
    }
    loadLeaderboard();
  }, [lbPeriod]);

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
    <div className="max-w-lg mx-auto px-4 pt-4 pb-8" style={{ color: "var(--text)" }}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Stats</h1>
        <Link
          href="/achievements"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
          style={{
            background: "linear-gradient(135deg, rgba(36,63,22,0.10) 0%, rgba(82,133,49,0.10) 100%)",
            border: "1px solid rgba(82,133,49,0.25)",
            color: "var(--brand-light)",
          }}
        >
          🏅 Badges
        </Link>
      </div>

      {/* Period selector */}
      <div className="flex gap-2 mb-5 p-1 rounded-xl" style={{ background: "rgba(36,63,22,0.04)" }}>
        {(["week", "month", "year"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
            style={
              period === p
                ? { background: "var(--brand)", color: "#ffffff" }
                : { background: "transparent", color: "var(--text-muted)" }
            }
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl h-20 animate-pulse" style={{ background: "rgba(36,63,22,0.04)" }} />
          ))}
        </div>
      ) : stats ? (
        <>
          {/* Streaks */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="rounded-xl p-4 text-center" style={{ background: "var(--surface)", border: "1px solid rgba(36,63,22,0.10)" }}>
              <HiFire className="w-6 h-6 mx-auto mb-1" style={{ color: "var(--brand-light)" }} />
              <p className="text-2xl font-bold">{stats.currentStreak}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Day Streak</p>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ background: "var(--surface)", border: "1px solid rgba(36,63,22,0.10)" }}>
              <HiTrendingUp className="w-6 h-6 mx-auto mb-1" style={{ color: "var(--brand-light)" }} />
              <p className="text-2xl font-bold">{stats.workoutStreak}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Workout Streak</p>
            </div>
          </div>

          {/* Weekly Workout Tracker */}
          <div className="mb-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>
              Workouts This Week
            </h2>
            <div
              className="rounded-xl p-4"
              style={{ background: "var(--surface)", border: "1px solid rgba(36,63,22,0.10)" }}
            >
              {stats.weeklyWorkouts && stats.weeklyWorkouts.length > 0 ? (
                <WeeklyWorkoutChart days={stats.weeklyWorkouts} />
              ) : (
                <p className="text-xs text-center py-4" style={{ color: "var(--text-muted)" }}>
                  No workouts logged yet
                </p>
              )}
            </div>
          </div>

          {/* Muscle Group Breakdown */}
          <div className="mb-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>
              Muscle Groups · {periodLabel}
            </h2>
            <div
              className="rounded-xl p-4"
              style={{ background: "var(--surface)", border: "1px solid rgba(36,63,22,0.10)" }}
            >
              <MuscleGroupBreakdown counts={stats.muscleGroupCounts ?? {}} />
            </div>
          </div>

          {/* Stats grid */}
          <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>
            {periodLabel}
          </h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl p-4" style={{ background: "var(--surface)", border: "1px solid rgba(36,63,22,0.10)" }}>
              <div className="flex items-center gap-2 mb-2">
                <HiFire className="w-4 h-4" style={{ color: "var(--brand-light)" }} />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>Workouts</span>
              </div>
              <p className="text-xl font-bold">{stats.workoutCount}</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: "var(--surface)", border: "1px solid rgba(36,63,22,0.10)" }}>
              <div className="flex items-center gap-2 mb-2">
                <HiClock className="w-4 h-4" style={{ color: "#528531" }} />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>Wellness Min</span>
              </div>
              <p className="text-xl font-bold">{stats.wellnessMinutes}</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: "var(--surface)", border: "1px solid rgba(36,63,22,0.10)" }}>
              <div className="flex items-center gap-2 mb-2">
                <HiTrendingUp className="w-4 h-4" style={{ color: "#9A7B2E" }} />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>Total Volume</span>
              </div>
              <p className="text-xl font-bold">
                {stats.totalVolume > 999
                  ? `${(stats.totalVolume / 1000).toFixed(1)}k`
                  : stats.totalVolume}{" "}
                <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>lbs</span>
              </p>
            </div>
            <div className="rounded-xl p-4" style={{ background: "var(--surface)", border: "1px solid rgba(36,63,22,0.10)" }}>
              <div className="flex items-center gap-2 mb-2">
                <HiEmojiHappy className="w-4 h-4" style={{ color: "#C9A84C" }} />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>Avg Mood</span>
              </div>
              <p className="text-xl font-bold">
                {stats.avgMoodAfter !== null ? `${stats.avgMoodAfter}/10` : "--"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="rounded-xl p-4" style={{ background: "var(--surface)", border: "1px solid rgba(36,63,22,0.10)" }}>
              <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Total Sets</p>
              <p className="text-xl font-bold">{stats.totalSets}</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: "var(--surface)", border: "1px solid rgba(36,63,22,0.10)" }}>
              <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Meals Logged</p>
              <p className="text-xl font-bold">{stats.mealsPosted}</p>
            </div>
          </div>

          {/* Steps section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                Steps
              </h2>
              <button
                onClick={() => setShowStepsForm((v) => !v)}
                className="text-xs font-medium"
                style={{ color: "var(--brand-light)" }}
              >
                {showStepsForm ? "Cancel" : "Log steps"}
              </button>
            </div>

            <div className="rounded-xl p-4 mb-3" style={{ background: "var(--surface)", border: "1px solid rgba(36,63,22,0.10)" }}>
              <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Last 7 days</p>
              <p className="text-2xl font-bold">{totalStepsWeek.toLocaleString()}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>steps</p>
            </div>

            {showStepsForm && (
              <div className="p-4 rounded-xl mb-3 space-y-3" style={{ background: "rgba(36,63,22,0.04)", border: "1px solid rgba(36,63,22,0.10)" }}>
                {stepsError && (
                  <p className="text-xs" style={{ color: "#f87171" }}>{stepsError}</p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Date</label>
                    <input
                      type="date"
                      value={stepsDate}
                      onChange={(e) => setStepsDate(e.target.value)}
                      className="input-dark w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Steps</label>
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
                  style={{ color: "var(--text)" }}
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
                      <span className="text-xs w-16 flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                        {formatDate(e.date)}
                      </span>
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(36,63,22,0.10)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: "var(--brand)" }}
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
          <>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                Friends Leaderboard
              </h2>
              {/* Leaderboard period selector */}
              <div className="flex gap-1">
                {([
                  { key: "all" as const, label: "All" },
                  { key: "week" as const, label: "Wk" },
                  { key: "month" as const, label: "Mo" },
                  { key: "year" as const, label: "Yr" },
                ]).map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setLbPeriod(p.key)}
                    className="px-2 py-1 rounded-lg text-xs font-semibold transition-all"
                    style={
                      lbPeriod === p.key
                        ? { background: "var(--brand)", color: "#ffffff" }
                        : { background: "rgba(36,63,22,0.04)", color: "var(--text-muted)" }
                    }
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {leaderboardError ? (
              <p className="text-center text-sm py-6" style={{ color: "var(--text-muted)" }}>
                Could not load leaderboard
              </p>
            ) : leaderboard ? (
              <>
                <div className="flex gap-2 mb-3">
                  {([
                    { key: "workoutCount" as const, label: "Workouts" },
                    { key: "wellnessMinutes" as const, label: "Wellness min" },
                    { key: "mealsLogged" as const, label: "Meals" },
                  ]).map((b) => (
                    <button
                      key={b.key}
                      onClick={() => setActiveBoard(b.key)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                      style={
                        activeBoard === b.key
                          ? { background: "var(--brand)", color: "#ffffff" }
                          : { background: "rgba(36,63,22,0.04)", color: "var(--text-muted)" }
                      }
                    >
                      {b.label}
                    </button>
                  ))}
                </div>

                {boardEntries.length === 0 ? (
                  <p className="text-center text-sm py-6" style={{ color: "var(--text-muted)" }}>
                    Follow friends to see the leaderboard
                  </p>
                ) : (
                  <>
                    <div className="space-y-2">
                      {boardEntries.map((entry, idx) => (
                        <div
                          key={entry.userId}
                          className="flex items-center gap-3 p-3 rounded-xl"
                          style={{ background: "var(--surface)", border: "1px solid rgba(36,63,22,0.10)" }}
                        >
                          <span
                            className="w-6 text-center text-sm font-bold"
                            style={{
                              color: idx === 0 ? "var(--brand-light)" : idx === 1 ? "var(--text-muted)" : idx === 2 ? "#f59e0b" : "var(--text-muted)",
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
                          <span className="text-sm font-bold" style={{ color: entry.value > 0 ? "var(--text)" : "var(--text-muted)" }}>
                            {activeBoard === "wellnessMinutes" ? `${entry.value}m` : entry.value}
                          </span>
                        </div>
                      ))}
                    </div>
                    {boardEntries.length === 1 && (
                      <p className="text-center text-xs mt-3" style={{ color: "var(--text-muted)" }}>
                        Follow friends to compare stats
                      </p>
                    )}
                  </>
                )}
              </>
            ) : null}
          </>
        </>
      ) : (
        <p className="text-center text-sm py-12" style={{ color: "var(--text-muted)" }}>
          Failed to load stats
        </p>
      )}
    </div>
  );
}
