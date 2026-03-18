"use client";

/**
 * global-error.tsx catches errors that occur in the ROOT layout itself
 * (e.g. SessionProvider crash, font loading failure, etc.).
 * Unlike error.tsx it must render its own <html>/<body> tags because
 * the root layout is no longer available.
 */

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
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          background: "var(--bg)",
          color: "var(--text)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "1rem",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>😵</div>
        <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>
          Something went wrong
        </h2>
        <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "24px" }}>
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          style={{
            background: "var(--brand)",
            color: "#ffffff",
            border: "none",
            borderRadius: "12px",
            padding: "10px 24px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 0 40px rgba(36,63,22,0.15), 0 8px 24px rgba(24,25,15,0.09)",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
