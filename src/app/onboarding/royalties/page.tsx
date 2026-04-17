"use client";
import { useRouter } from "next/navigation";
import OnboardingTopBar from "@/components/onboarding/OnboardingTopBar";
import RPrimaryBtn from "@/components/onboarding/RPrimaryBtn";
import RAvatar from "@/components/onboarding/RAvatar";

function HowLine({ n, text }: { n: number; text: string }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "8px 0" }}>
      <div style={{
        width: 22, height: 22, borderRadius: 11, background: "var(--brand)",
        color: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 700, flexShrink: 0,
      }}>{n}</div>
      <div style={{ fontSize: 14, color: "var(--text)" }}>{text}</div>
    </div>
  );
}

export default function RoyaltiesPage() {
  const router = useRouter();

  async function handleContinue() {
    await fetch("/api/users/me/onboarding", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ step: "done" }) });
    router.push("/onboarding/done");
  }

  async function handleSkip() {
    await fetch("/api/users/me/onboarding", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ step: "done" }) });
    router.push("/onboarding/done");
  }

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <OnboardingTopBar step={5} total={6} showBack showSkip onBack={() => router.push("/onboarding/catalog")} onSkip={handleSkip} />
      <div style={{ padding: "24px 24px 0" }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "#BBA24C" }}>Earn royalties</div>
        <div style={{ marginTop: 10, fontSize: 26, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.015em", lineHeight: 1.15 }}>Share a catalog item, get paid</div>
        <div style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 8, lineHeight: 1.5 }}>Attach a catalog item to any post. When someone uses your link or code, you earn royalties.</div>
      </div>

      <div style={{ padding: "22px 20px 0", flex: 1, overflow: "auto" }}>
        <div style={{ background: "var(--surface)", borderRadius: 20, border: "1px solid var(--border)", overflow: "hidden" }}>
          <div style={{ padding: "14px 16px 10px", display: "flex", alignItems: "center", gap: 10 }}>
            <RAvatar initials="PK" size={36} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>patrick</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Just now · Morning run</div>
            </div>
          </div>
          <div style={{ padding: "0 16px 12px", fontSize: 14, color: "var(--text)", lineHeight: 1.55 }}>
            Easy 5-miler. Half an LMNT before, felt dialed in.
          </div>
          <div style={{
            height: 180,
            background: "linear-gradient(135deg, #8FA878 0%, #4F7A36 100%)",
            display: "flex", alignItems: "flex-end", padding: 12,
          }}>
            <div style={{
              padding: "4px 10px", borderRadius: 10,
              background: "rgba(246,241,228,0.9)",
              fontSize: 11, fontWeight: 600, color: "var(--brand)",
            }}>📍 Silverlake Reservoir</div>
          </div>
          <div style={{
            margin: 12, padding: "12px 14px",
            background: "rgba(187,162,76,0.10)",
            border: "1px solid rgba(187,162,76,0.35)",
            borderRadius: 14, display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: "var(--surface)", border: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-display)", fontSize: 18, color: "var(--text-muted)", flexShrink: 0,
            }}>L</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#BBA24C" }}>Earning royalties</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginTop: 2 }}>LMNT Electrolyte · royal.to/lmnt</div>
            </div>
            <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
              <path d="M2 2l6 6-6 6" stroke="var(--text)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <div style={{ marginTop: 20, padding: "0 4px" }}>
          <HowLine n={1} text="Someone taps your catalog item" />
          <HowLine n={2} text="They use your link or code" />
          <HowLine n={3} text="You earn — tracked in Royalties" />
        </div>
      </div>

      <div style={{ padding: "12px 24px 36px" }}>
        <RPrimaryBtn onClick={handleContinue}>I get it</RPrimaryBtn>
      </div>
    </div>
  );
}
