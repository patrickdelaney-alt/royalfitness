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

const DEMO_CAPTIONS: Record<PostType, string> = {
  Workout: "Heavy legs. Felt strong after a rest day.",
  Wellness: "20 min cold plunge + sauna. Recovery week.",
  Meal: "Overnight oats with collagen and blueberries.",
};

export default function FirstPostPage() {
  const router = useRouter();
  const [type, setType] = useState<PostType>("Workout");
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    setLoading(true);
    await fetch("/api/users/me/onboarding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: "catalog" }),
    });
    router.push("/onboarding/catalog");
  }

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <OnboardingTopBar step={3} total={6} showBack onBack={() => router.push("/onboarding/follow")} onSkip={handleContinue} showSkip />
      <div style={{ padding: "24px 24px 0" }}>
        <div style={{ fontSize: 26, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.015em", lineHeight: 1.15 }}>This is how you log</div>
        <div style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 8, lineHeight: 1.5 }}>A quick caption or every rep — both work. Here&apos;s what a post looks like.</div>
      </div>

      {/* Type picker — visual only, switches the demo */}
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

      {/* Demo post preview — not a form, nothing submits */}
      <div style={{ padding: "16px 20px 0", flex: 1, overflow: "auto" }}>
        <div style={{ background: "var(--surface)", borderRadius: 18, border: "1px solid var(--border)", padding: 16, pointerEvents: "none", userSelect: "none" }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>Caption</div>
          <div style={{ fontSize: 15, color: "var(--text)", lineHeight: 1.5, minHeight: 44 }}>
            {DEMO_CAPTIONS[type]}
          </div>
        </div>

        {type === "Workout" && (
          <>
            <div style={{
              marginTop: 14, padding: "14px 16px", background: "var(--surface)",
              borderRadius: 18, border: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              pointerEvents: "none",
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Exercises</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Optional — or keep it as a caption-only post</div>
              </div>
              <div style={{
                width: 44, height: 26, borderRadius: 13,
                background: "var(--brand)",
                position: "relative", padding: 2,
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 11, background: "var(--surface)",
                  position: "absolute", top: 2, left: 18,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                }} />
              </div>
            </div>

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
            </div>
          </>
        )}

        {type === "Wellness" && (
          <div style={{
            marginTop: 14, padding: "14px 16px", background: "var(--surface)",
            borderRadius: 18, border: "1px solid var(--border)",
            pointerEvents: "none",
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Activity</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>Recovery · 40 min</div>
          </div>
        )}

        {type === "Meal" && (
          <div style={{
            marginTop: 14, padding: "14px 16px", background: "var(--surface)",
            borderRadius: 18, border: "1px solid var(--border)",
            pointerEvents: "none",
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Breakfast</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>Oats · collagen · blueberries</div>
          </div>
        )}
      </div>

      <div style={{ padding: "12px 24px 36px" }}>
        <RPrimaryBtn onClick={handleContinue} disabled={loading}>Got it</RPrimaryBtn>
      </div>
    </div>
  );
}
