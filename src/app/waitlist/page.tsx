export default function WaitlistPage() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4"
      style={{ background: "#0b0c14", color: "#ffffff" }}
    >
      {/* Logo */}
      <div className="mb-10 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div
            className="w-14 h-14 rounded-2xl btn-gradient flex items-center justify-center text-3xl shadow-glow"
            style={{ flexShrink: 0 }}
          >
            👑
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-extrabold tracking-tight leading-none">
              RoyalWellness
            </h1>
            <span
              className="text-xs font-medium tracking-widest uppercase"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              Coming Soon
            </span>
          </div>
        </div>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-sm rounded-2xl p-8 text-center"
        style={{
          background: "#13141f",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow:
            "0 40px 80px rgba(0,0,0,0.5), 0 0 60px rgba(120,117,255,0.07)",
        }}
      >
        <div className="text-5xl mb-5">🏆</div>

        <h2 className="text-xl font-bold mb-3">You&apos;re on the waitlist</h2>

        <p
          className="text-sm leading-relaxed mb-6"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          We&apos;re putting the finishing touches on something special. We&apos;ll
          let you know the moment you can get in.
        </p>

        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold"
          style={{
            background: "rgba(120,117,255,0.10)",
            color: "#a8a6ff",
            border: "1px solid rgba(120,117,255,0.25)",
          }}
        >
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: "#7875ff" }}
          />
          Launching soon
        </div>
      </div>

      <p
        className="mt-8 text-xs"
        style={{ color: "rgba(255,255,255,0.2)" }}
      >
        &copy; {new Date().getFullYear()} RoyalWellness
      </p>
    </div>
  );
}
