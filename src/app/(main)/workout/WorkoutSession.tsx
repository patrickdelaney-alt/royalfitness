"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { HiArrowLeft, HiPlus, HiTrash, HiCheck, HiPlay, HiPause, HiFlag } from "react-icons/hi";
import toast from "react-hot-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WorkoutExercise {
  id: string;
  name: string;
  checked: boolean;
}

interface ActiveWorkoutSession {
  startTime: number;
  pausedAt: number | null;
  totalPausedMs: number;
  workoutName: string;
  notes: string;
  exercises: WorkoutExercise[];
}

// ─── localStorage helpers ────────────────────────────────────────────────────

const STORAGE_KEY = "activeWorkout";

function loadSession(): ActiveWorkoutSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ActiveWorkoutSession;
  } catch {
    return null;
  }
}

function saveSession(session: ActiveWorkoutSession) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

function newSession(): ActiveWorkoutSession {
  return {
    startTime: Date.now(),
    pausedAt: null,
    totalPausedMs: 0,
    workoutName: "",
    notes: "",
    exercises: [],
  };
}

function calcElapsed(session: ActiveWorkoutSession): number {
  const end = session.pausedAt ?? Date.now();
  return Math.max(0, end - session.startTime - session.totalPausedMs);
}

function formatTime(ms: number): string {
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function WorkoutSession() {
  const router = useRouter();
  const [session, setSession] = useState<ActiveWorkoutSession | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [showAbandon, setShowAbandon] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Init: load or create session ─────────────────────────────────────────
  useEffect(() => {
    const existing = loadSession();
    if (existing) {
      setSession(existing);
      setElapsed(calcElapsed(existing));
    } else {
      const s = newSession();
      saveSession(s);
      setSession(s);
      setElapsed(0);
    }
  }, []);

  // ── Tick ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session) return;

    if (intervalRef.current) clearInterval(intervalRef.current);

    if (!session.pausedAt) {
      intervalRef.current = setInterval(() => {
        setElapsed(calcElapsed(session));
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [session]);

  // ── Persist any mutation ──────────────────────────────────────────────────
  const update = useCallback((updater: (prev: ActiveWorkoutSession) => ActiveWorkoutSession) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      saveSession(next);
      return next;
    });
  }, []);

  // ── Pause / Resume ───────────────────────────────────────────────────────
  const togglePause = () => {
    if (!session) return;
    if (session.pausedAt) {
      // Resume
      const pausedDuration = Date.now() - session.pausedAt;
      update((s) => ({
        ...s,
        pausedAt: null,
        totalPausedMs: s.totalPausedMs + pausedDuration,
      }));
    } else {
      // Pause
      update((s) => ({ ...s, pausedAt: Date.now() }));
    }
  };

  // ── Exercise helpers ─────────────────────────────────────────────────────
  const addExercise = () => {
    const id = uid();
    update((s) => ({
      ...s,
      exercises: [...s.exercises, { id, name: "", checked: false }],
    }));
    // Focus the new input on next render
    setTimeout(() => {
      const inputs = document.querySelectorAll<HTMLInputElement>("[data-exercise-input]");
      inputs[inputs.length - 1]?.focus();
    }, 50);
  };

  const updateExerciseName = (id: string, name: string) => {
    update((s) => ({
      ...s,
      exercises: s.exercises.map((ex) => (ex.id === id ? { ...ex, name } : ex)),
    }));
  };

  const toggleExercise = (id: string) => {
    update((s) => ({
      ...s,
      exercises: s.exercises.map((ex) =>
        ex.id === id ? { ...ex, checked: !ex.checked } : ex
      ),
    }));
  };

  const removeExercise = (id: string) => {
    update((s) => ({
      ...s,
      exercises: s.exercises.filter((ex) => ex.id !== id),
    }));
  };

  // ── Finish & Log ─────────────────────────────────────────────────────────
  const finishWorkout = () => {
    if (!session) return;

    // Capture elapsed before any state changes
    const finalMs = calcElapsed(session);

    // Write directly to localStorage — bypassing update() (which is async) so
    // the state-updater callback never overwrites _finalElapsedMs before navigation.
    const frozenSession: ActiveWorkoutSession = {
      ...session,
      pausedAt: session.pausedAt ?? Date.now(),
    };
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...frozenSession, _finalElapsedMs: finalMs })
    );

    toast.success("Great workout! Logging your session...", {
      icon: "🏁",
      style: {
        background: "#1a1b2e",
        color: "#ffffff",
        border: "1px solid rgba(120,117,255,0.4)",
      },
    });

    setTimeout(() => {
      router.push("/create?type=WORKOUT&fromSession=1");
    }, 600);
  };

  // ── Abandon ──────────────────────────────────────────────────────────────
  const abandonWorkout = () => {
    clearSession();
    router.push("/create");
  };

  if (!session) return null;

  const isPaused = !!session.pausedAt;
  const checkedCount = session.exercises.filter((e) => e.checked).length;
  const totalCount = session.exercises.length;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#0b0c14", color: "#ffffff" }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-4 pt-4 pb-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <button
          onClick={() => setShowAbandon(true)}
          className="p-2 rounded-xl transition-colors"
          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)" }}
        >
          <HiArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span
            className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
            style={{
              background: isPaused
                ? "rgba(255,255,255,0.06)"
                : "rgba(239,68,68,0.15)",
              color: isPaused ? "rgba(255,255,255,0.4)" : "#f87171",
              border: isPaused ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(239,68,68,0.3)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: isPaused ? "rgba(255,255,255,0.3)" : "#ef4444",
                animation: isPaused ? "none" : "pulse 1.5s infinite",
              }}
            />
            {isPaused ? "PAUSED" : "LIVE"}
          </span>
        </div>

        <button
          onClick={() => setShowAbandon(true)}
          className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors"
          style={{ color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.04)" }}
        >
          End
        </button>
      </div>

      {/* ── Timer ── */}
      <div className="flex flex-col items-center py-8 px-4">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>
          Workout Duration
        </p>
        <div
          className="font-bold tabular-nums"
          style={{
            fontSize: "clamp(52px, 15vw, 72px)",
            letterSpacing: "-2px",
            background: isPaused
              ? "rgba(255,255,255,0.25)"
              : "linear-gradient(135deg, #6360e8 0%, #9b98ff 50%, #a78bfa 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            lineHeight: 1,
          }}
        >
          {formatTime(elapsed)}
        </div>

        {/* Pause / Resume */}
        <button
          onClick={togglePause}
          className="mt-6 flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-sm transition-all active:scale-95"
          style={{
            background: isPaused
              ? "linear-gradient(135deg, #6360e8, #9b98ff)"
              : "rgba(255,255,255,0.07)",
            color: isPaused ? "#ffffff" : "rgba(255,255,255,0.6)",
            border: isPaused ? "none" : "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {isPaused ? (
            <>
              <HiPlay className="w-4 h-4" /> Resume
            </>
          ) : (
            <>
              <HiPause className="w-4 h-4" /> Pause
            </>
          )}
        </button>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto px-4 pb-40 space-y-5">

        {/* Workout Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            Workout Name
          </label>
          <input
            type="text"
            value={session.workoutName}
            onChange={(e) => update((s) => ({ ...s, workoutName: e.target.value }))}
            placeholder="e.g. Push Day, Leg Day..."
            className="w-full rounded-xl px-4 py-3 text-sm font-medium outline-none transition-colors placeholder:text-white/20"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#ffffff",
            }}
          />
        </div>

        {/* Caption */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            Caption
          </label>
          <textarea
            value={session.notes}
            onChange={(e) => update((s) => ({ ...s, notes: e.target.value }))}
            placeholder="What's on your mind? Share your goals, energy, or what you crushed today..."
            rows={3}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none transition-colors placeholder:text-white/20"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#ffffff",
            }}
          />
        </div>

        {/* Exercises Checklist */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>
              Exercises
            </label>
            {totalCount > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{
                background: "rgba(120,117,255,0.10)",
                color: "#a8a6ff",
                border: "1px solid rgba(120,117,255,0.2)",
              }}>
                {checkedCount}/{totalCount} done
              </span>
            )}
          </div>

          <div className="space-y-2">
            {session.exercises.map((ex) => (
              <div
                key={ex.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                style={{
                  background: ex.checked
                    ? "rgba(120,117,255,0.08)"
                    : "rgba(255,255,255,0.04)",
                  border: ex.checked
                    ? "1px solid rgba(120,117,255,0.25)"
                    : "1px solid rgba(255,255,255,0.07)",
                }}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleExercise(ex.id)}
                  className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-all active:scale-90"
                  style={{
                    background: ex.checked
                      ? "linear-gradient(135deg, #6360e8, #9b98ff)"
                      : "rgba(255,255,255,0.06)",
                    border: ex.checked ? "none" : "1.5px solid rgba(255,255,255,0.15)",
                  }}
                >
                  {ex.checked && <HiCheck className="w-3.5 h-3.5 text-white" />}
                </button>

                {/* Name input */}
                <input
                  data-exercise-input
                  type="text"
                  value={ex.name}
                  onChange={(e) => updateExerciseName(ex.id, e.target.value)}
                  placeholder="Exercise name..."
                  className="flex-1 bg-transparent outline-none text-sm font-medium placeholder:text-white/20"
                  style={{
                    color: ex.checked ? "rgba(255,255,255,0.45)" : "#ffffff",
                    textDecoration: ex.checked ? "line-through" : "none",
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addExercise();
                  }}
                />

                {/* Delete */}
                <button
                  onClick={() => removeExercise(ex.id)}
                  className="flex-shrink-0 p-1 rounded-lg transition-colors opacity-40 hover:opacity-80"
                  style={{ color: "#f87171" }}
                >
                  <HiTrash className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add exercise button */}
          <button
            onClick={addExercise}
            className="mt-2 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
            style={{
              border: "1.5px dashed rgba(120,117,255,0.30)",
              color: "#a8a6ff",
              background: "rgba(120,117,255,0.04)",
            }}
          >
            <HiPlus className="w-4 h-4" />
            Add Exercise
          </button>
        </div>

        {/* Progress bar (only if exercises added) */}
        {totalCount > 0 && (
          <div>
            <div
              className="w-full h-1.5 rounded-full overflow-hidden"
              style={{ background: "rgba(255,255,255,0.07)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(checkedCount / totalCount) * 100}%`,
                  background: checkedCount === totalCount
                    ? "linear-gradient(90deg, #22c55e, #4ade80)"
                    : "linear-gradient(90deg, #6360e8, #9b98ff)",
                }}
              />
            </div>
            {checkedCount === totalCount && totalCount > 0 && (
              <p className="text-center text-xs font-semibold mt-2" style={{ color: "#4ade80" }}>
                All exercises complete! 🔥
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Sticky Finish Button ── */}
      <div
        className="fixed bottom-16 left-0 right-0 px-4 pb-4 pt-4"
        style={{
          background: "linear-gradient(to top, #0b0c14 70%, transparent)",
        }}
      >
        <button
          onClick={finishWorkout}
          className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.97]"
          style={{
            background: "linear-gradient(135deg, #6360e8, #9b98ff)",
            color: "#ffffff",
            boxShadow: "0 0 40px rgba(120,117,255,0.15), 0 8px 24px rgba(0,0,0,0.5)",
          }}
        >
          <HiFlag className="w-5 h-5" />
          Finish &amp; Log Workout
        </button>
      </div>

      {/* ── Abandon Confirm Modal ── */}
      {showAbandon && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={() => setShowAbandon(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 space-y-4"
            style={{
              background: "#13141f",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="text-3xl mb-2">⚠️</div>
              <h2 className="text-lg font-bold mb-1">End this workout?</h2>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                Your session data will be lost. This cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAbandon(false)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.7)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                Keep Going
              </button>
              <button
                onClick={abandonWorkout}
                className="flex-1 py-3 rounded-xl text-sm font-semibold"
                style={{
                  background: "rgba(239,68,68,0.15)",
                  color: "#f87171",
                  border: "1px solid rgba(239,68,68,0.3)",
                }}
              >
                End Workout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
