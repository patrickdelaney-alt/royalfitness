"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 12 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M1.5 12s3.5-7 10.5-7 10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke="currentColor"
        strokeWidth="1.75"
      />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M3 3l18 18"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.88 5.09A10.94 10.94 0 0 1 12 5c7 0 10.5 7 10.5 7a17.32 17.32 0 0 1-4.16 4.94M6.61 6.62A17.56 17.56 0 0 0 1.5 12s3.5 7 10.5 7a10.78 10.78 0 0 0 3.17-.47"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface Props {
  appleEnabled: boolean;
  googleEnabled: boolean;
  waitlistGated: boolean;
}

export default function SignUpClient({ appleEnabled, googleEnabled, waitlistGated }: Props) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"apple" | "google" | null>(null);

  async function handleOAuth(provider: "apple" | "google") {
    setOauthLoading(provider);
    await signIn(provider, { callbackUrl: "/feed?welcome=1" });
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = "Name is required.";
    }

    if (username.length < 3) {
      errors.username = "Username must be at least 3 characters.";
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.username = "Only letters, numbers, and underscores allowed.";
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email.";
    }

    if (password.length < 6) {
      errors.password = "Password must be at least 6 characters.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (!validate()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Sign up failed. Please try again.");
        setLoading(false);
        return;
      }

      // Auto sign-in after registration. auth.js v5 beta's signIn() return
      // value is unreliable, so we verify via /api/auth/session with retries
      // to avoid a race condition where the cookie isn't written yet.
      await signIn("credentials", { email, password, redirect: false });

      let session = null;
      for (let i = 0; i < 3; i++) {
        const sessionRes = await fetch("/api/auth/session");
        const data = await sessionRes.json();
        if (data?.user?.id) {
          session = data;
          break;
        }
        await new Promise((r) => setTimeout(r, 300));
      }

      if (session?.user?.id) {
        window.location.href = "/feed?welcome=1";
      } else {
        window.location.href = "/signin?registered=1";
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const hasOAuth = appleEnabled || googleEnabled;

  if (waitlistGated) {
    return (
      <div className="text-center">
        <div className="mb-4 flex items-center justify-center">
          <span
            className="w-3 h-3 rounded-full animate-pulse"
            style={{ background: "var(--brand)" }}
          />
        </div>
        <h2
          className="text-2xl font-normal mb-3"
          style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}
        >
          Signups are invite-only
        </h2>
        <p
          className="text-sm mb-6"
          style={{ color: "var(--text-muted)", lineHeight: 1.65 }}
        >
          Royal is currently in private beta. Join the waitlist and we&apos;ll
          reach out when your spot opens up.
        </p>
        <Link
          href="/waitlist"
          className="btn-primary w-full justify-center block text-center mb-4"
        >
          Join the Waitlist
        </Link>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Already have an account?{" "}
          <Link href="/signin" className="font-bold" style={{ color: "var(--brand)" }}>
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-6 text-center text-2xl font-normal" style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}>
        Create your account
      </h2>

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

      {hasOAuth && (
        <>
          <div className="space-y-3 mb-6">
            {appleEnabled && (
              <button
                type="button"
                onClick={() => handleOAuth("apple")}
                disabled={oauthLoading !== null || loading}
                className="w-full flex items-center justify-center gap-3 text-sm font-semibold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: "#000000",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "12px",
                  minHeight: "44px",
                  paddingLeft: "16px",
                  paddingRight: "16px",
                  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
                  letterSpacing: "-0.01em",
                }}
              >
                <AppleIcon />
                {oauthLoading === "apple" ? "Redirecting…" : "Continue with Apple"}
              </button>
            )}

            {googleEnabled && (
              <button
                type="button"
                onClick={() => handleOAuth("google")}
                disabled={oauthLoading !== null || loading}
                className="w-full flex items-center justify-center gap-3 rounded-xl py-3 text-sm font-semibold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)" }}
              >
                <GoogleIcon />
                {oauthLoading === "google" ? "Redirecting…" : "Continue with Google"}
              </button>
            )}
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-xs text-muted-dim" style={{ background: "var(--surface)" }}>
                or sign up with email
              </span>
            </div>
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-xs font-semibold text-muted-dim uppercase tracking-wider">
            Name
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            className="input-dark"
          />
          {fieldErrors.name && (
            <p className="mt-1 text-xs" style={{ color: "#b91c1c" }}>{fieldErrors.name}</p>
          )}
        </div>

        <div>
          <label htmlFor="username" className="mb-1.5 block text-xs font-semibold text-muted-dim uppercase tracking-wider">
            Username
          </label>
          <input
            id="username"
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="johndoe"
            className="input-dark"
          />
          {fieldErrors.username && (
            <p className="mt-1 text-xs" style={{ color: "#b91c1c" }}>{fieldErrors.username}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-muted-dim uppercase tracking-wider">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="input-dark"
          />
          {fieldErrors.email && (
            <p className="mt-1 text-xs" style={{ color: "#b91c1c" }}>{fieldErrors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-muted-dim uppercase tracking-wider">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="input-dark pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-0 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-muted-dim transition-colors hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="mt-1 text-xs" style={{ color: "#b91c1c" }}>{fieldErrors.password}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || oauthLoading !== null}
          className="w-full rounded-full py-3 text-sm font-medium btn-primary justify-center transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating account…" : "Sign Up"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-sub">
        Already have an account?{" "}
        <Link href="/signin" className="font-bold" style={{ color: "var(--brand)" }}>
          Sign in
        </Link>
      </p>
    </div>
  );
}
