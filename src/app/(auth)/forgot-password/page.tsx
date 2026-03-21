"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong. Please try again.");
      } else {
        setSubmitted(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center">
        <h2
          className="mb-4 text-2xl font-normal"
          style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}
        >
          Check your email
        </h2>
        <p
          className="mb-6 text-sm"
          style={{ color: "var(--text-muted)", lineHeight: 1.65 }}
        >
          If an account exists for <strong>{email}</strong>, we sent a password
          reset link. Check your inbox and follow the link — it expires in 1 hour.
        </p>
        <Link
          href="/signin"
          className="text-sm font-semibold"
          style={{ color: "var(--brand)" }}
        >
          &larr; Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2
        className="mb-2 text-center text-2xl font-normal"
        style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}
      >
        Reset Password
      </h2>
      <p
        className="mb-6 text-center text-sm"
        style={{ color: "var(--text-muted)", lineHeight: 1.65 }}
      >
        Enter your email and we&apos;ll send you a reset link.
      </p>

      {error && (
        <div
          className="mb-4 rounded-lg p-3 text-sm border"
          style={{
            background: "rgba(220,38,38,0.07)",
            borderColor: "rgba(220,38,38,0.20)",
            color: "#b91c1c",
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-xs font-semibold text-muted-dim uppercase tracking-wider"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="input-dark"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full py-3 text-sm font-medium btn-primary justify-center transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Sending…" : "Send Reset Link"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-sub">
        <Link href="/signin" className="font-semibold" style={{ color: "var(--brand)" }}>
          &larr; Back to Sign In
        </Link>
      </p>
    </div>
  );
}
