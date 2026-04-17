"use client";

interface Props {
  step: number;
  total: number;
  showBack?: boolean;
  showSkip?: boolean;
  onBack?: () => void;
  onSkip?: () => void;
}

export default function OnboardingTopBar({ step, total, showBack, showSkip, onBack, onSkip }: Props) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "56px 20px 0" }}>
      <div style={{ width: 48, display: "flex" }}>
        {showBack && (
          <button
            onClick={onBack}
            style={{
              width: 36, height: 36, borderRadius: 18,
              border: "1px solid var(--border)", background: "var(--surface)",
              cursor: "pointer", padding: 0, display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
              <path d="M7 1L1 7l6 6" stroke="var(--text)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {Array.from({ length: total }).map((_, k) => (
          <div
            key={k}
            style={{
              height: 6,
              width: k === step ? 22 : 6,
              borderRadius: 3,
              background: k === step ? "var(--brand)" : k < step ? "#8FA878" : "rgba(36,63,22,0.18)",
              transition: "width 200ms ease, background 200ms ease",
            }}
          />
        ))}
      </div>
      <div style={{ width: 48, textAlign: "right" }}>
        {showSkip && (
          <button
            onClick={onSkip}
            style={{
              border: "none", background: "transparent",
              fontSize: 14, fontWeight: 500, color: "var(--text-muted)",
              cursor: "pointer", padding: 0, fontFamily: "var(--font-body)",
            }}
          >Skip</button>
        )}
      </div>
    </div>
  );
}
