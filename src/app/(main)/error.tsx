"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[MainError]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 text-4xl">😵</div>
      <h2 className="mb-2 text-lg font-bold text-foreground">
        Something went wrong
      </h2>
      <p
        className="mb-6 text-sm"
        style={{ color: "rgba(255,255,255,0.45)" }}
      >
        We couldn&apos;t load this page. Please try again.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white btn-gradient shadow-glow"
        >
          Try again
        </button>
        <Link
          href="/feed"
          className="rounded-xl px-6 py-2.5 text-sm font-semibold transition-colors"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.7)",
          }}
        >
          Go to Feed
        </Link>
      </div>
    </div>
  );
}
