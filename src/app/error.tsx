"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="mb-4 text-4xl">😵</div>
      <h2 className="mb-2 text-lg font-bold text-foreground">
        Something went wrong
      </h2>
      <p className="mb-6 text-sm" style={{ color: "var(--text-muted)" }}>
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white btn-gradient shadow-glow"
      >
        Try again
      </button>
    </div>
  );
}
