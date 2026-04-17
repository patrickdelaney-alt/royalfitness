"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingTopBar from "@/components/onboarding/OnboardingTopBar";
import RPrimaryBtn from "@/components/onboarding/RPrimaryBtn";

const TYPES = ["Workout", "Wellness", "Meal"] as const;
type PostType = typeof TYPES[number];

const DEFAULT_EXERCISES = [
  { name: "Back squat", detail: "5 × 5 · 185 lb" },
  { name: "Romanian deadlift", detail: "4 × 8 · 135 lb" },
  { name: "Walking lunge", detail: "3 × 20 · bw" },
];

export default function FirstPostPage() {
  const router = useRouter();
  const [type, setType] = useState<PostType>("Workout");
  const [caption, setCaption] = useState("Heavy legs. Felt strong after a rest day.");
  const [showExercises, setShowExercises] = useState(true);
  const [loading, setLoading] = useState(false);

  async function handlePost() {
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        type: type.toUpperCase(),
        caption,
        visibility: "PUBLIC",
        tags: [],
      };
      if (type === "Workout" && showExercises) {
        payload.workout = {
          workoutName: "Session",
          isClass: false,
          muscleGroups: [],
          postTiming: "AFTER",
          exercises: DEFAULT_EXERCISES.map(e => ({ name: e.name, sets: [] })),
        };
      }
      if (type === "Wellness") {
        payload.wellness = { activityType: "General", durationMinutes: 30 };
      }
      if (type === "Meal") {
        payload.meal = { mealName: caption || "Meal", mealType: "snack", ingredients: [] };
      }
      await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await fetch("/api/users/me/onboarding", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ step: "catalog" }) });
      router.push("/onboarding/catalog");
    } catch {
      setLoading(false);
    }
  }

  async function handleSkip() {
    await fetch("/api/users/me/onboarding", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ step: "catalog" }) });
    router.push("/onboarding/catalog");
  }

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <OnboardingTopBar step={3} total={6} showBack showSkip onBack={() => router.push("/onboarding/follow")} onSkip={handleSkip} />
      <div style={{ padding: "24px 24px 0" }}>
        <div style={{ fontSize: 26, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.015em", lineHeight: 1.15 }}>Log your first session</div>
        <div style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 8, lineHeight: 1.5 }}>Post a quick note or log every set. Both count.</div>
      </div>

      <div style={{ padding: "20px 20px 0", display: "flex", gap: 6 }}>
        {TYPES.map(t => (
          <button key={t} onClick={() => setType(t)} style={{
            flex: 1, height: 40, borderRadius: 12,
            background: type === t ? "var(--brand)" : "var(--surface-2)",
            color: type === t ? "var(--surface)" : "var(--text)",
            border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer",
            fontFamily: "var(--font-body)",
          }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: "16px 20px 0", flex: 1, overflow: "auto" }}>
        <div style={{ background: "var(--surface)", borderRadius: 18, border: "1px solid var(--border)", padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>Caption</div>
          <textarea
            value={caption}
            onChange={e => setCaption(e.target.value)}
            rows={2}
            placeholder="What did you do?"
            style={{
              width: "100%", fontSize: 15, color: "var(--text)", lineHeight: 1.5,
              background: "transparent", border: "none", outline: "none",
              resize: "none", fontFamily: "var(--font-body)", boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{
          marginTop: 14, padding: "14px 16px", background: "var(--surface)",
          borderRadius: 18, border: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Add exercises</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Optional · skip for a quick post</div>
          </div>
          <div
            onClick={() => setShowExercises(v => !v)}
            style={{
              width: 44, height: 26, borderRadius: 13,
              background: showExercises ? "var(--brand)" : "var(--surface-2)",
              position: "relative", padding: 2, cursor: "pointer",
              transition: "background 200ms",
            }}
          >
            <div style={{
              width: 22, height: 22, borderRadius: 11, background: "var(--surface)",
              position: "absolute", top: 2,
              left: showExercises ? 18 : 2,
              boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
              transition: "left 200ms",
            }} />
          </div>
        </div>

        {showExercises && (
          <div style={{ marginTop: 14 }}>
            {DEFAULT_EXERCISES.map((e, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 14px", background: "var(--surface)",
                borderRadius: 14, marginBottom: 6,
                border: "1px solid var(--border)",
                borderLeft: "3px solid var(--brand)",
              }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{e.name}</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{e.detail}</div>
              </div>
            ))}
            <button style={{
              width: "100%", height: 44, borderRadius: 14,
              background: "transparent", border: "1px dashed rgba(36,63,22,0.18)",
              color: "var(--text-muted)", fontSize: 13, fontWeight: 500,
              cursor: "pointer", marginTop: 4, fontFamily: "var(--font-body)",
            }}>+ Add exercise</button>
          </div>
        )}
      </div>

      <div style={{ padding: "12px 24px 36px" }}>
        <RPrimaryBtn onClick={handlePost} disabled={loading}>{loading ? "Posting…" : "Post session"}</RPrimaryBtn>
      </div>
    </div>
  );
}
