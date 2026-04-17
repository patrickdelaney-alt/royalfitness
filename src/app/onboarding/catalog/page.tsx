"use client";
import { useRouter } from "next/navigation";
import OnboardingTopBar from "@/components/onboarding/OnboardingTopBar";
import RPrimaryBtn from "@/components/onboarding/RPrimaryBtn";

const DEMO_ITEMS = [
  { name: "LMNT Electrolyte", kind: "Referral link", code: "royal.to/lmnt", pct: "15%" },
  { name: "Hyperice Normatec 3", kind: "Discount code", code: "ROYAL20", pct: "$50" },
  { name: "Oura Ring", kind: "Referral link", code: "royal.to/oura", pct: "$40" },
];

export default function CatalogPage() {
  const router = useRouter();

  async function handleContinue() {
    await fetch("/api/users/me/onboarding", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ step: "royalties" }) });
    router.push("/onboarding/royalties");
  }

  async function handleSkip() {
    await fetch("/api/users/me/onboarding", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ step: "royalties" }) });
    router.push("/onboarding/royalties");
  }

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <OnboardingTopBar step={4} total={6} showBack showSkip onBack={() => router.push("/onboarding/first-post")} onSkip={handleSkip} />
      <div style={{ padding: "24px 24px 0" }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "#BBA24C" }}>Your catalog</div>
        <div style={{ marginTop: 10, fontSize: 26, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.015em", lineHeight: 1.15 }}>Add things you actually use</div>
        <div style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 8, lineHeight: 1.5 }}>Referral links, discount codes, and products. This is what you&apos;ll share to earn royalties.</div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "20px 20px 0" }}>
        <div style={{
          padding: "18px 16px", background: "var(--surface)",
          borderRadius: 18, border: "1px solid var(--border)",
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: "var(--brand)", color: "var(--surface)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, fontWeight: 400, lineHeight: 1,
          }}>+</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Paste a link or code</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>We&apos;ll pull the product details automatically</div>
          </div>
        </div>

        <div style={{ marginTop: 22 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10 }}>
            In your catalog · {DEMO_ITEMS.length}
          </div>
          {DEMO_ITEMS.map((item, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 14px", background: "var(--surface)",
              borderRadius: 14, marginBottom: 8, border: "1px solid var(--border)",
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: "var(--surface-2)", border: "1px solid var(--border)",
                flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-display)", fontSize: 18, color: "var(--text-muted)",
              }}>{item.name[0]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 3 }}>
                  <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)" }}>{item.kind}</span>
                  <span style={{ width: 2, height: 2, borderRadius: 1, background: "var(--text-muted)", opacity: 0.5 }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#BBA24C" }}>{item.code}</span>
                </div>
              </div>
              <div style={{
                padding: "4px 10px", borderRadius: 10,
                background: "rgba(187,162,76,0.15)",
                fontSize: 11, fontWeight: 700, color: "#BBA24C",
                fontVariantNumeric: "tabular-nums",
              }}>{item.pct}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "12px 24px 36px" }}>
        <RPrimaryBtn onClick={handleContinue}>Continue</RPrimaryBtn>
      </div>
    </div>
  );
}
