export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Atmospheric radial glow */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 70% 50% at 50% 55%, rgba(36,63,22,0.07) 0%, rgba(36,63,22,0.02) 45%, transparent 70%)",
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
          background: "radial-gradient(circle, rgba(36,63,22,0.05) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      {/* Royal wordmark branding */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="text-center">
            <h1
              className="text-3xl font-light tracking-tight leading-none"
              style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}
            >
              Royal
            </h1>
          </div>
        </div>
        <p className="text-sm" style={{ color: "var(--text-muted)", lineHeight: 1.65 }}>
          <span style={{ color: "var(--text)" }}>Earn royalties</span>{" "}
          for your workouts &amp; wellness.{" "}
          <span style={{ opacity: 0.82 }}>Coming soon to the App Store.</span>
        </p>
      </div>

      {/* Double-bezel card */}
      <div className="w-full max-w-md card-shell relative z-10">
        <div className="card-core">
          {children}
        </div>
      </div>
    </div>
  );
}
