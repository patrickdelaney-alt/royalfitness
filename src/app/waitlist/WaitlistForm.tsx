"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

type State = "idle" | "loading" | "success" | "already" | "error";

export default function WaitlistForm() {
  const searchParams = useSearchParams();
  // ?gated=1 means the user tried to sign in via OAuth but isn't approved yet
  const isGated = searchParams.get("gated") === "1";

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [state, setState] = useState<State>(isGated ? "already" : "idle");
  const [emailError, setEmailError] = useState("");

  function validateEmail(value: string): boolean {
    if (!value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
      setEmailError("Please enter a valid email address.");
      return false;
    }
    setEmailError("");
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateEmail(email)) return;

    setState("loading");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          firstName: firstName.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setEmailError(data.error || "Something went wrong.");
        setState("idle");
        return;
      }

      setState(data.already ? "already" : "success");
    } catch {
      setState("error");
    }
  }

  // ── Success / already-on-list / gated states ──────────────────────
  if (state === "success") {
    return (
      <div className="text-center">
        <div className="mb-4 flex items-center justify-center">
          <span
            className="w-3 h-3 rounded-full animate-pulse"
            style={{ background: "var(--brand)" }}
          />
        </div>
        <h2
          className="text-xl font-normal mb-3"
          style={{ fontFamily: "var(--font-display)" }}
        >
          You&apos;re on the list
          {firstName.trim() ? `, ${firstName.trim()}` : ""}!
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)", lineHeight: 1.65 }}>
          We&apos;ll send you a note the moment your spot opens up. Stay ready.
        </p>
      </div>
    );
  }

  if (state === "already") {
    return (
      <div className="text-center">
        <div className="mb-4 flex items-center justify-center">
          <span
            className="w-3 h-3 rounded-full animate-pulse"
            style={{ background: "var(--gold)" }}
          />
        </div>
        <h2
          className="text-xl font-normal mb-3"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {isGated ? "Not approved yet" : "Already on the list"}
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)", lineHeight: 1.65 }}>
          {isGated
            ? "Your email is on our waitlist. We\u2019ll reach out as soon as you\u2019re approved — hang tight."
            : "Looks like you\u2019re already signed up. We haven\u2019t forgotten you \u2014 we\u2019ll be in touch soon."}
        </p>
      </div>
    );
  }

  // ── Form (idle / loading / error) ────────────────────────────────
  return (
    <>
      <div className="text-center mb-6">
        <h2
          className="text-xl font-normal mb-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Join the Waitlist
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)", lineHeight: 1.65 }}>
          Be first to track your fitness journey with Royal. We&apos;ll notify
          you the moment doors open.
        </p>
      </div>

      {state === "error" && (
        <div
          className="mb-4 rounded-lg px-3 py-2.5 text-sm border"
          style={{
            background: "rgba(220,38,38,0.07)",
            borderColor: "rgba(220,38,38,0.20)",
            color: "#b91c1c",
          }}
        >
          Something went wrong. Please try again.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        {/* First name (optional) */}
        <div>
          <label
            htmlFor="wl-firstname"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            First name <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span>
          </label>
          <input
            id="wl-firstname"
            type="text"
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Alex"
            className="input-dark w-full"
            disabled={state === "loading"}
          />
        </div>

        {/* Email (required) */}
        <div>
          <label
            htmlFor="wl-email"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Email
          </label>
          <input
            id="wl-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError("");
            }}
            placeholder="you@example.com"
            className="input-dark w-full"
            disabled={state === "loading"}
          />
          {emailError && (
            <p className="mt-1 text-xs" style={{ color: "#b91c1c" }}>
              {emailError}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={state === "loading"}
          className="btn-primary w-full justify-center mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {state === "loading" ? "Saving your spot…" : "Request Early Access"}
        </button>
      </form>
    </>
  );
}
