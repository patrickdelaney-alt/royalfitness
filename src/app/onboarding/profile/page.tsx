"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import OnboardingTopBar from "@/components/onboarding/OnboardingTopBar";
import RInput from "@/components/onboarding/RInput";
import RPrimaryBtn from "@/components/onboarding/RPrimaryBtn";
import RAvatar from "@/components/onboarding/RAvatar";

function getInitials(name: string) {
  return name.trim().split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";
}

export default function ProfilePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "error">("idle");
  const [debouncedUsername, setDebouncedUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedUsername(username), 500);
    return () => clearTimeout(t);
  }, [username]);

  useEffect(() => {
    if (debouncedUsername.length < 3 || !/^[a-zA-Z0-9_]+$/.test(debouncedUsername)) {
      if (debouncedUsername.length > 0) setUsernameStatus("error");
      return;
    }
    let cancelled = false;
    setUsernameStatus("checking");
    fetch(`/api/users/check-username?username=${encodeURIComponent(debouncedUsername)}`)
      .then(r => r.json())
      .then(d => { if (!cancelled) setUsernameStatus(d.available ? "available" : "taken"); })
      .catch(() => { if (!cancelled) setUsernameStatus("idle"); });
    return () => { cancelled = true; };
  }, [debouncedUsername]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = await res.json();
    if (data.url) setAvatarUrl(data.url);
  }

  async function handleContinue() {
    if (!name.trim()) { setError("Name is required."); return; }
    if (username.length < 3) { setError("Username must be at least 3 characters."); return; }
    if (usernameStatus === "taken") { setError("Username is taken."); return; }
    setLoading(true); setError("");
    try {
      await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, bio, ...(avatarUrl && { avatarUrl }) }),
      });
      await fetch("/api/users/me/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "follow" }),
      });
      router.push("/onboarding/follow");
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <OnboardingTopBar step={1} total={6} showBack onBack={() => router.push("/onboarding/account")} />
      <div style={{ padding: "28px 24px 0" }}>
        <div style={{ fontSize: 26, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.015em", lineHeight: 1.15 }}>A little about you</div>
        <div style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 8, lineHeight: 1.5 }}>How you&apos;ll show up on Royal.</div>
      </div>
      <div style={{ padding: "28px 24px 0", flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <div style={{ position: "relative", cursor: "pointer" }} onClick={() => fileRef.current?.click()}>
            {avatarUrl
              ? <img src={avatarUrl} alt="" style={{ width: 96, height: 96, borderRadius: 48, objectFit: "cover" }} />
              : <RAvatar initials={getInitials(name) || "?"} size={96} />
            }
            <div style={{
              position: "absolute", bottom: 0, right: 0,
              width: 30, height: 30, borderRadius: 15, background: "var(--brand)",
              border: "3px solid var(--bg)", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="12" height="12" viewBox="0 0 12 12">
                <path d="M6 2v8M2 6h8" stroke="var(--surface)" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
        </div>
        <RInput label="Name" value={name} onChange={setName} placeholder="Your name" />
        <RInput label="Username" value={username} onChange={v => { setUsername(v); setUsernameStatus("idle"); }} placeholder="yourhandle" />
        {usernameStatus === "checking" && <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: -12, marginBottom: 12 }}>Checking…</p>}
        {usernameStatus === "available" && <p style={{ fontSize: 12, color: "#16a34a", marginTop: -12, marginBottom: 12 }}>✓ Available</p>}
        {usernameStatus === "taken" && <p style={{ fontSize: 12, color: "#b91c1c", marginTop: -12, marginBottom: 12 }}>Username taken</p>}
        {usernameStatus === "error" && <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: -12, marginBottom: 12 }}>Letters, numbers, underscores only</p>}
        <RInput label="Bio" value={bio} onChange={setBio} placeholder="Early mornings. Real food." />
        {error && <p style={{ fontSize: 13, color: "#b91c1c" }}>{error}</p>}
      </div>
      <div style={{ padding: "0 24px 36px" }}>
        <RPrimaryBtn onClick={handleContinue} disabled={loading}>{loading ? "Saving…" : "Continue"}</RPrimaryBtn>
      </div>
    </div>
  );
}
