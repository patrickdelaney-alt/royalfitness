"use client";
import { useRouter } from "next/navigation";
import RPrimaryBtn from "@/components/onboarding/RPrimaryBtn";

function FeatureLine({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
      <div style={{ width: 10, height: 10, borderRadius: 5, background: "var(--brand)", marginTop: 8, flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em" }}>{title}</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2, lineHeight: 1.4 }}>{sub}</div>
      </div>
    </div>
  );
}

export default function WelcomePage() {
  const router = useRouter();
  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column", padding: "0 28px" }}>
      <div style={{ paddingTop: 56 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 34, fontWeight: 400, color: "var(--text)", letterSpacing: "-0.5px" }}>
          Royal
        </div>
        <div style={{ marginTop: 14, fontSize: 15, fontWeight: 500, color: "var(--text-muted)", lineHeight: 1.5, maxWidth: 280 }}>
          For people who take their health seriously.
        </div>
        <div style={{ marginTop: 64, display: "flex", flexDirection: "column", gap: 22 }}>
          <FeatureLine title="Log workouts & wellness" sub="As simple or as detailed as you like." />
          <FeatureLine title="Follow people you trust" sub="Real routines, not performance." />
          <FeatureLine title="Earn royalties" sub="On the products you already recommend." />
        </div>
      </div>
      <div style={{ paddingBottom: 36, display: "flex", flexDirection: "column", gap: 10 }}>
        <RPrimaryBtn onClick={() => router.push("/onboarding/account")}>Create account</RPrimaryBtn>
        <button
          onClick={() => router.push("/signin")}
          style={{ height: 44, background: "transparent", border: "none", fontSize: 14, fontWeight: 500, color: "var(--text-muted)", cursor: "pointer", fontFamily: "var(--font-body)" }}
        >I already have an account</button>
      </div>
    </div>
  );
}
