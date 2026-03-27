import { Suspense } from "react";
import WaitlistForm from "./WaitlistForm";
import { FaApple } from "react-icons/fa";

export const metadata = {
  title: "Join the Waitlist — Royal",
  description: "Be first to track your fitness journey with Royal.",
};

export default function WaitlistPage() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4 py-12"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      {/* Logo */}
      <div className="mb-10 text-center">
        <div className="flex items-center justify-center gap-3 mb-1">
          <div className="text-center">
            <h1
              className="text-3xl font-light tracking-tight leading-none"
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
          </div>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm card-shell">
        <div className="card-core">
          <Suspense>
            <WaitlistForm />
          </Suspense>
        </div>
      </div>

      {/* App Store CTA */}
      <div className="mt-5 w-full max-w-sm">
        <a
          href="https://apps.apple.com/us/app/royal-fitness-wellness/id6759988491"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary w-full justify-center"
        >
          <FaApple size={17} />
          Download on the App Store
        </a>
      </div>

      <p className="mt-6 text-xs" style={{ color: "var(--text-muted)" }}>
        &copy; {new Date().getFullYear()} RoyalWellness
      </p>
    </div>
  );
}
