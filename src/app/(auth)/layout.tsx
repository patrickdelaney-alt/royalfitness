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
          background: "radial-gradient(ellipse 70% 50% at 50% 55%, rgba(120,117,255,0.12) 0%, rgba(120,117,255,0.04) 45%, transparent 70%)",
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
          background: "radial-gradient(circle, rgba(99,96,232,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      {/* Crown logo + branding */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div
            className="w-12 h-12 rounded-2xl btn-gradient flex items-center justify-center text-2xl"
            style={{
              flexShrink: 0,
              boxShadow: "0 0 40px rgba(120,117,255,0.15), 0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(168,166,255,0.25)",
            }}
          >
            👑
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground leading-none">
              Royal
            </h1>
            <span className="text-xs font-medium text-muted-dim tracking-widest uppercase">
              Beta
            </span>
          </div>
        </div>
        <p className="text-sm text-sub">
          Your workouts, meals &amp; wellness. All in one place. 🔥
        </p>
      </div>

      {/* Dark card */}
      <div
        className="w-full max-w-md rounded-2xl p-8 glass-card relative z-10"
        style={{
          boxShadow: "0 40px 80px rgba(0,0,0,0.55), 0 0 80px rgba(120,117,255,0.10), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
