"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import OnboardingTopBar from "@/components/onboarding/OnboardingTopBar";
import RPrimaryBtn from "@/components/onboarding/RPrimaryBtn";
import RAvatar from "@/components/onboarding/RAvatar";

interface Suggestion { id: string; name: string | null; username: string; avatarUrl: string | null; postTypes: string[]; }

function getInitials(name?: string | null) {
  if (!name) return "?";
  return name.trim().split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function FollowPage() {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [followed, setFollowed] = useState(new Set<string>());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/users/suggestions?limit=6").then(r => r.json()).then(d => setSuggestions(d.suggestions ?? []));
  }, []);

  function toggle(id: string) {
    setFollowed(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  async function handleContinue() {
    setLoading(true);
    await Promise.all(
      Array.from(followed).map(id =>
        fetch("/api/social/follow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetUserId: id }) })
      )
    );
    await fetch("/api/users/me/onboarding", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ step: "first-post" }) });
    router.push("/onboarding/first-post");
  }

  async function handleSkip() {
    await fetch("/api/users/me/onboarding", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ step: "first-post" }) });
    router.push("/onboarding/first-post");
  }

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <OnboardingTopBar step={2} total={6} showBack showSkip onBack={() => router.push("/onboarding/profile")} onSkip={handleSkip} />
      <div style={{ padding: "28px 24px 0" }}>
        <div style={{ fontSize: 26, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.015em", lineHeight: 1.15 }}>Follow a few people</div>
        <div style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 8, lineHeight: 1.5 }}>Your feed is what they post — workouts, meals, recovery, things they actually use.</div>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "20px 16px 12px" }}>
        {suggestions.map(p => {
          const on = followed.has(p.id);
          return (
            <div key={p.id} style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "14px 12px", background: "var(--surface)",
              borderRadius: 16, marginBottom: 8, border: "1px solid var(--border)",
            }}>
              <RAvatar initials={getInitials(p.name)} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em" }}>{p.name || p.username}</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>@{p.username}</div>
              </div>
              <button onClick={() => toggle(p.id)} style={{
                height: 34, padding: "0 16px", borderRadius: 17,
                background: on ? "var(--brand)" : "transparent",
                color: on ? "var(--surface)" : "var(--text)",
                border: on ? "none" : "1px solid rgba(36,63,22,0.18)",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                fontFamily: "var(--font-body)",
              }}>{on ? "Following" : "Follow"}</button>
            </div>
          );
        })}
        {suggestions.length === 0 && (
          <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 14, paddingTop: 40 }}>Loading suggestions…</div>
        )}
      </div>
      <div style={{ padding: "0 24px 36px" }}>
        <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", marginBottom: 12 }}>
          Following {followed.size} · you can tap Search anytime to find more
        </div>
        <RPrimaryBtn onClick={handleContinue} disabled={loading}>{loading ? "Saving…" : "Continue"}</RPrimaryBtn>
      </div>
    </div>
  );
}
