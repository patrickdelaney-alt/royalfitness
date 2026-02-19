import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#2563EB",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Crown */}
        <svg width="80" height="52" viewBox="0 0 160 100" fill="none">
          <path
            d="M10 90 L20 35 L50 65 L80 10 L110 65 L140 35 L150 90 Z"
            fill="white"
            strokeWidth="4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <circle cx="80" cy="10" r="8" fill="white" />
          <circle cx="20" cy="35" r="7" fill="white" />
          <circle cx="140" cy="35" r="7" fill="white" />
          <rect x="10" y="88" width="140" height="12" rx="4" fill="white" />
        </svg>
        <div
          style={{
            color: "white",
            fontSize: 38,
            fontWeight: 800,
            letterSpacing: "-1px",
            lineHeight: 1,
            marginTop: 6,
          }}
        >
          Royal
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.80)",
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "4px",
            marginTop: 2,
          }}
        >
          FITNESS
        </div>
      </div>
    ),
    { ...size }
  );
}
