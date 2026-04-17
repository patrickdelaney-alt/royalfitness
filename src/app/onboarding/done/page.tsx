"use client";
import OnboardingTopBar from "@/components/onboarding/OnboardingTopBar";
import RPrimaryBtn from "@/components/onboarding/RPrimaryBtn";

export default function DonePage() {
  async function handleGoToFeed() {
    await fetch("/api/users/me/onboarding", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ step: "done" }) });
    window.location.href = "/feed";
  }

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <OnboardingTopBar step={5} total={6} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 32px" }}>
        <div style={{
          width: 88, height: 88, borderRadius: 44, background: "var(--brand)",
          display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 32,
        }}>
          <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
            <path d="M8 19l7 7 15-15" stroke="var(--surface)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 44, fontWeight: 400, color: "var(--text)", letterSpacing: "-0.015em", lineHeight: 1.05 }}>
          You&apos;re in.
        </div>
        <div style={{ marginTop: 14, fontSize: 15, color: "var(--text-muted)", lineHeight: 1.55, maxWidth: 300 }}>
          Post what you actually do. Share what you actually use. The rest is details.
        </div>
      </div>
      <div style={{ padding: "0 24px 36px" }}>
        <RPrimaryBtn onClick={handleGoToFeed}>Go to feed</RPrimaryBtn>
      </div>
    </div>
  );
}
