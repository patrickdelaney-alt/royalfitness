export default function WaitlistPage() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      {/* Logo */}
      <div className="mb-10 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="text-left">
            <h1
              className="text-3xl font-light tracking-tight leading-none"
              style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}
            >
              Royal
            </h1>
            <span
              className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: "var(--text-muted)" }}
            >
              Coming Soon
            </span>
          </div>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm card-shell">
        <div className="card-core text-center">
          <h2 className="text-xl font-normal mb-3" style={{ fontFamily: "var(--font-display)" }}>You&apos;re on the waitlist</h2>

          <p
            className="text-sm leading-relaxed mb-6"
            style={{ color: "var(--text-muted)", lineHeight: 1.65 }}
          >
            We&apos;re putting the finishing touches on something special. We&apos;ll
            let you know the moment you can get in.
          </p>

          <div className="eyebrow inline-flex">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: "var(--brand)" }}
            />
            Launching soon
          </div>
        </div>
      </div>

      <p
        className="mt-8 text-xs"
        style={{ color: "var(--text-muted)" }}
      >
        &copy; {new Date().getFullYear()} RoyalWellness
      </p>
    </div>
  );
}
