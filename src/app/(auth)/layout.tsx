export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Crown logo + branding */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div
            className="w-12 h-12 rounded-2xl btn-gradient flex items-center justify-center text-2xl shadow-glow"
            style={{ flexShrink: 0 }}
          >
            👑
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground leading-none">
              RoyalWellness
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

      {/* Card */}
      <div
        className="w-full max-w-md rounded-2xl p-8 border"
        style={{
          background: "#ffffff",
          borderColor: "#e5e7eb",
          boxShadow: "0 4px 32px rgba(0,0,0,0.08)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
