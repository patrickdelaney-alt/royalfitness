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
          background: "#243F16",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            color: "#FDFAF5",
            fontSize: 48,
            fontWeight: 300,
            letterSpacing: "-1px",
            lineHeight: 1,
          }}
        >
          Royal
        </div>
        <div
          style={{
            color: "rgba(253,250,245,0.65)",
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "4px",
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
