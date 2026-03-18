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
          background: "#243F16",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 0,
        }}
      >
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
              color: "#FDFAF5",
              fontSize: 120,
              fontWeight: 300,
              letterSpacing: "-3px",
              lineHeight: 1,
            }}
          >
            Royal
          </span>
        </div>
        <div
          style={{
            color: "rgba(253,250,245,0.65)",
            fontSize: 36,
            fontWeight: 600,
            letterSpacing: "10px",
            textTransform: "uppercase",
            marginTop: 8,
          }}
        >
          FITNESS
        </div>
      </div>
    ),
    { ...size }
  );
}
