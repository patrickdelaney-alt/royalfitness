import { redirect } from "next/navigation";
import { safeAuth } from "@/lib/safe-auth";
import Link from "next/link";
import { FaApple } from "react-icons/fa";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  const session = await safeAuth();
  if (session) redirect("/feed");

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      {/* Atmospheric radial glow */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 70% 50% at 50% 55%, rgba(36,63,22,0.07) 0%, rgba(36,63,22,0.02) 45%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      {/* Accent top-left */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "-10%",
          left: "-15%",
          width: "50%",
          height: "50%",
          background:
            "radial-gradient(circle, rgba(36,63,22,0.05) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Royal wordmark */}
      <div className="mb-10 text-center relative z-10">
        <h1
          className="text-4xl font-light tracking-tight leading-none"
          style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}
        >
          Royal
        </h1>
        <span
          className="text-xs font-semibold tracking-widest uppercase"
          style={{ color: "var(--text-muted)" }}
        >
          Wellness
        </span>
        <p
          className="mt-3 text-sm"
          style={{ color: "var(--text-muted)", lineHeight: 1.65 }}
        >
          Earn royalties for your workouts &amp; wellness.
        </p>
      </div>

      {/* CTA card */}
      <div className="w-full max-w-sm card-shell relative z-10">
        <div className="card-core">
          <div className="text-center mb-5">
            <h2
              className="text-xl font-normal mb-1.5"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Download the App
            </h2>
            <p className="text-sm" style={{ color: "var(--text-muted)", lineHeight: 1.65 }}>
              Track workouts, nutrition &amp; wellness — and earn rewards for every rep.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <a
              href="https://apps.apple.com/us/app/royal-fitness-wellness/id6759988491"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full justify-center"
            >
              <FaApple size={17} />
              Download on the App Store
            </a>

            <Link href="/waitlist" className="btn-secondary w-full justify-center">
              Join the Waitlist
            </Link>
          </div>
        </div>
      </div>

      {/* Sign-in nudge */}
      <p className="mt-6 text-xs relative z-10" style={{ color: "var(--text-muted)" }}>
        Already have an account?{" "}
        <Link
          href="/signin"
          style={{
            color: "var(--brand)",
            textDecoration: "underline",
            textUnderlineOffset: "3px",
          }}
        >
          Sign in
        </Link>
      </p>

      <p className="mt-4 text-xs relative z-10" style={{ color: "var(--text-muted)" }}>
        &copy; {new Date().getFullYear()} RoyalWellness
      </p>
    </div>
  );
}
