"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

// Map NextAuth ?error= param values to user-friendly messages
const ERROR_MESSAGES: Record<string, string> = {
  Configuration: "Service error. Please try again later.",
  AccessDenied: "Access denied. Please try again.",
  Verification: "Sign-in link expired. Please request a new one.",
  OAuthSignin: "Could not start sign-in. Please try again.",
  OAuthCallback: "Sign-in was cancelled or failed. Please try again.",
  OAuthCreateAccount: "Could not create account. Please try again.",
  Default: "Something went wrong. Please try again.",
};

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
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
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
}

function SignInForm({ appleEnabled, googleEnabled }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"apple" | "google" | null>(
    null
  );

  // Show friendly message when NextAuth redirects back with ?error=, then
  // immediately clean the param from the URL so a page refresh doesn't repeat it.
  // Also show a success banner when redirected here after registration.
  useEffect(() => {
    const err = searchParams.get("error");
    const registered = searchParams.get("registered");
    if (err) {
      setError(ERROR_MESSAGES[err] ?? ERROR_MESSAGES.Default);
      router.replace("/signin", { scroll: false });
    } else if (registered === "1") {
      setSuccess("Account created! Sign in to get started.");
      router.replace("/signin", { scroll: false });
    }
  }, [searchParams, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // signIn() with redirect:false returns a response object in next-auth v5.
      // Check it first — if it contains an error the credentials were wrong and
      // the session cookie was never set.
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      // next-auth v5 beta: result is { error, status, ok, url } or undefined.
      if (result && !result.ok) {
        setError("Invalid email or password. Please try again.");
        setLoading(false);
        return;
      }

      // Double-check the cookie was actually set by fetching the session.
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();

      if (session?.user?.id) {
        // Cookie is set and verified — full page navigation to pick it up.
        window.location.href = "/feed";
      } else {
        setError("Invalid email or password. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuth(provider: "apple" | "google") {
    setOauthLoading(provider);
    await signIn(provider, { callbackUrl: "/feed" });
  }

  const hasOAuth = appleEnabled || googleEnabled;

  return (
    <div>
      <h2 className="mb-6 text-center text-2xl font-normal" style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}>
        Welcome back
      </h2>

      {success && (
        <div
          className="mb-4 rounded-lg p-3 text-sm border"
          style={{
            background: "rgba(22,163,74,0.08)",
            borderColor: "rgba(22,163,74,0.25)",
            color: "#15803d",
          }}
        >
          {success}
        </div>
      )}

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

      {/* ── OAuth sign-in — only rendered when providers are configured ── */}
      {hasOAuth && (
        <>
          <div className="space-y-3 mb-6">
            {appleEnabled && (
              <button
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
                {oauthLoading === "apple" ? "Redirecting…" : "Sign in with Apple"}
              </button>
            )}

            {googleEnabled && (
              <button
                onClick={() => handleOAuth("google")}
                disabled={oauthLoading !== null || loading}
                className="w-full flex items-center justify-center gap-3 rounded-xl py-3 text-sm font-semibold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)" }}
              >
                <GoogleIcon />
                {oauthLoading === "google" ? "Redirecting…" : "Sign in with Google"}
              </button>
            )}
          </div>

          {/* ── Divider ─────────────────────────────────────────────── */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface" />
            </div>
            <div className="relative flex justify-center">
              <span
                className="px-3 text-xs text-muted-dim"
                style={{ background: "var(--surface)" }}
              >
                or continue with email
              </span>
            </div>
          </div>
        </>
      )}

      {/* ── Credentials form ────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-muted-dim uppercase tracking-wider">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="input-dark"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-muted-dim uppercase tracking-wider">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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
          <div className="mt-1 text-right">
            <Link href="/forgot-password" className="text-xs font-semibold" style={{ color: "var(--brand)" }}>
              Forgot password?
            </Link>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || oauthLoading !== null}
          className="w-full rounded-full py-3 text-sm font-medium btn-primary justify-center transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-sub">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-bold transition-colors"
          style={{ color: "var(--brand)" }}
        >
          Sign up
        </Link>
      </p>

      {/* App Store download */}
      <div className="mt-5">
        <div className="relative mb-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-surface" />
          </div>
        </div>
        <a
          href="https://apps.apple.com/us/app/royal-fitness-wellness/id6759988491"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary w-full justify-center"
        >
          <AppleIcon />
          Download on the App Store
        </a>
      </div>
    </div>
  );
}

// Suspense is handled by the server component (signin/page.tsx) that
// imports this — keeping it there ensures proper SSR suspension handling.
export default function SignInClient(props: Props) {
  return <SignInForm {...props} />;
}
