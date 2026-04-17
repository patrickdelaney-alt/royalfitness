"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import OnboardingTopBar from "@/components/onboarding/OnboardingTopBar";
import RInput from "@/components/onboarding/RInput";
import RPrimaryBtn from "@/components/onboarding/RPrimaryBtn";

export default function AccountPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    setError("");
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email."); return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters."); return;
    }
    setLoading(true);
    try {
      const tempUsername = "user_" + Math.random().toString(36).slice(2, 9);
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name: "", username: tempUsername }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Sign up failed."); setLoading(false); return; }

      await signIn("credentials", { email, password, redirect: false });

      for (let i = 0; i < 4; i++) {
        const s = await fetch("/api/auth/session").then(r => r.json());
        if (s?.user?.id) break;
        await new Promise(r => setTimeout(r, 350));
      }
      await fetch("/api/users/me/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "profile" }),
      });
      router.push("/onboarding/profile");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <OnboardingTopBar step={0} total={6} showBack onBack={() => router.push("/onboarding/welcome")} />
      <div style={{ padding: "28px 24px 0" }}>
        <div style={{ fontSize: 26, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.015em", lineHeight: 1.15 }}>Create your account</div>
        <div style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 8, lineHeight: 1.5 }}>One minute, then you&apos;re in.</div>
      </div>
      <div style={{ padding: "28px 24px 0", flex: 1 }}>
        <RInput label="Email" value={email} onChange={setEmail} placeholder="you@example.com" type="email" />
        <RInput label="Password" value={password} onChange={setPassword} placeholder="At least 6 characters" type="password" />
        {error && <p style={{ fontSize: 13, color: "#b91c1c", marginBottom: 8 }}>{error}</p>}
        <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5, marginTop: 4 }}>
          By continuing you agree to the Terms and Privacy Policy.
        </div>
      </div>
      <div style={{ padding: "0 24px 36px" }}>
        <RPrimaryBtn onClick={handleContinue} disabled={loading}>{loading ? "Creating account…" : "Continue"}</RPrimaryBtn>
      </div>
    </div>
  );
}
