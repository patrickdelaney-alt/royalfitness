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
          background: "#0b0c14",
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "1rem",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>😵</div>
        <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>
          Something went wrong
        </h2>
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.45)", marginBottom: "24px" }}>
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          style={{
            background: "linear-gradient(135deg, #6360e8, #9b98ff)",
            color: "#ffffff",
            border: "none",
            borderRadius: "12px",
            padding: "10px 24px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 0 40px rgba(120,117,255,0.15), 0 8px 24px rgba(0,0,0,0.5)",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
