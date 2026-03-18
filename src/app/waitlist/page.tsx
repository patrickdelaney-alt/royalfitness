"use client";

import { FormEvent, useMemo, useState } from "react";

type SubmitState = "idle" | "loading" | "success" | "error";

export default function WaitlistPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  const isDisabled = useMemo(
    () => status === "loading" || !email.trim(),
    [email, status]
  );

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          source: "web_waitlist_page",
        }),
      });

      const data = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        setStatus("error");
        setMessage(data.error ?? "We couldn't save your request. Please try again.");
        return;
      }

      setStatus("success");
      setMessage(data.message ?? "You're on the waitlist! We'll be in touch soon.");
      setEmail("");
      setName("");
    } catch {
      setStatus("error");
      setMessage("We couldn't save your request. Please try again.");
    }
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4"
      style={{ background: "#0b0c14", color: "#ffffff" }}
    >
      <div className="mb-10 text-center">
        <div className="mb-4 flex items-center justify-center gap-3">
          <div
            className="btn-gradient flex h-14 w-14 items-center justify-center rounded-2xl text-3xl shadow-glow"
            style={{ flexShrink: 0 }}
          >
            👑
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-extrabold leading-none tracking-tight">Royal</h1>
            <span
              className="text-xs font-medium uppercase tracking-widest"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              Coming Soon
            </span>
          </div>
        </div>
      </div>

      <div
        className="w-full max-w-sm rounded-2xl p-8 text-center"
        style={{
          background: "#13141f",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 40px 80px rgba(0,0,0,0.5), 0 0 60px rgba(120,117,255,0.07)",
        }}
      >
        <div className="mb-5 text-5xl">🏆</div>

        <h2 className="mb-3 text-xl font-bold">Join the waitlist</h2>

        <p className="mb-6 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
          We&apos;re putting the finishing touches on something special. Drop your email
          below and we&apos;ll let you know the moment you can get in.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3 text-left">
          <div>
            <label htmlFor="name" className="mb-1 block text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
              Name (optional)
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
              style={{
                background: "#0f1020",
                borderColor: "rgba(255,255,255,0.12)",
                color: "#ffffff",
              }}
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
              style={{
                background: "#0f1020",
                borderColor: "rgba(255,255,255,0.12)",
                color: "#ffffff",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isDisabled}
            className="mt-2 w-full rounded-lg px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, #7875ff 0%, #9b6dff 100%)",
              color: "#ffffff",
            }}
          >
            {status === "loading" ? "Saving…" : "Join waitlist"}
          </button>
        </form>

        {message && (
          <p
            className="mt-3 text-xs"
            style={{
              color: status === "error" ? "#fca5a5" : "#a8a6ff",
            }}
          >
            {message}
          </p>
        )}
      </div>

      <p className="mt-8 text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
        &copy; {new Date().getFullYear()} RoyalWellness
      </p>
    </div>
  );
}
