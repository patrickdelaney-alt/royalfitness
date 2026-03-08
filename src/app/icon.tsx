import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #6360e8, #9b98ff)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 0,
        }}
      >
        {/* Crown SVG */}
        <svg
          width="160"
          height="100"
          viewBox="0 0 160 100"
          fill="none"
          style={{ marginBottom: 8 }}
        >
          <path
            d="M10 90 L20 35 L50 65 L80 10 L110 65 L140 35 L150 90 Z"
            fill="white"
            stroke="white"
            strokeWidth="4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <circle cx="80" cy="10" r="8" fill="white" />
          <circle cx="20" cy="35" r="7" fill="white" />
          <circle cx="140" cy="35" r="7" fill="white" />
          <rect x="10" y="88" width="140" height="12" rx="4" fill="white" />
        </svg>
        {/* Wordmark */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "baseline",
            gap: 0,
          }}
        >
          <span
            style={{
              color: "white",
              fontSize: 96,
              fontWeight: 800,
              letterSpacing: "-3px",
              lineHeight: 1,
            }}
          >
            Royal
          </span>
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.80)",
            fontSize: 36,
            fontWeight: 600,
            letterSpacing: "10px",
            textTransform: "uppercase",
            marginTop: 4,
          }}
        >
          FITNESS
        </div>
      </div>
    ),
    { ...size }
  );
}
