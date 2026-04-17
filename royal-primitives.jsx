// Royal iOS signup-flow screens
// Each screen renders inside a 402x874 IOSDevice frame provided by the canvas.
// Style tokens inlined from colors_and_type.css (no external CSS inside frames).

const R = {
  bg: '#EEE8DC',
  surface: '#F6F1E4',
  surface2: '#E3DCCB',
  text: '#18190F',
  muted: '#6E6A58',
  subtle: '#908A74',
  brand: '#1F3A10',
  brandMid: '#2E5319',
  brandLight: '#4F7A36',
  brandSoft: '#8FA878',
  mustard: '#BBA24C',
  coral: '#E99B90',
  border: 'rgba(36,63,22,0.10)',
  borderStrong: 'rgba(36,63,22,0.18)',
  sans: '"Plus Jakarta Sans", -apple-system, system-ui, sans-serif',
  serif: '"Cormorant Garamond", Georgia, serif',
};

// ── Reusable bits ──────────────────────────────────────────────────────────

function RPrimaryBtn({ children, onClick, muted = false }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', height: 54, borderRadius: 16,
      background: muted ? R.surface2 : R.brand,
      color: muted ? R.text : R.surface,
      border: 'none', fontFamily: R.sans, fontSize: 16, fontWeight: 600,
      letterSpacing: -0.01, cursor: 'pointer',
      boxShadow: muted ? 'none' : '0 2px 8px rgba(31,58,16,0.18)',
    }}>{children}</button>
  );
}

function RGhostBtn({ children, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', height: 54, borderRadius: 16,
      background: 'transparent', color: R.text,
      border: `1px solid ${R.borderStrong}`,
      fontFamily: R.sans, fontSize: 16, fontWeight: 500,
      cursor: 'pointer',
    }}>{children}</button>
  );
}

function RInput({ label, value, placeholder }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <div style={{
        fontFamily: R.sans, fontSize: 11, fontWeight: 600,
        letterSpacing: 0.16, textTransform: 'uppercase',
        color: R.muted, marginBottom: 8,
      }}>{label}</div>}
      <div style={{
        height: 52, borderRadius: 14, background: R.surface,
        border: `1px solid ${R.border}`, display: 'flex', alignItems: 'center',
        padding: '0 16px',
        fontFamily: R.sans, fontSize: 16, fontWeight: 500,
        color: value ? R.text : R.subtle,
      }}>{value || placeholder}</div>
    </div>
  );
}

function RWordmark() {
  return (
    <div style={{
      fontFamily: R.serif, fontSize: 34, fontWeight: 400,
      color: R.text, letterSpacing: -0.5,
    }}>Royal</div>
  );
}

function REyebrow({ children, gold = false }) {
  return (
    <div style={{
      fontFamily: R.sans, fontSize: 11, fontWeight: 600,
      letterSpacing: 0.18, textTransform: 'uppercase',
      color: gold ? R.mustard : R.muted,
    }}>{children}</div>
  );
}

function RStepDots({ n, i }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {Array.from({ length: n }).map((_, k) => (
        <div key={k} style={{
          width: k === i ? 22 : 6, height: 6, borderRadius: 3,
          background: k === i ? R.brand : k < i ? R.brandSoft : R.borderStrong,
          transition: 'all 200ms',
        }} />
      ))}
    </div>
  );
}

// Top bar for onboarding screens (back chevron + step dots + skip)
function RTopBar({ onBack, step, total, onSkip, hideBack = false }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '56px 20px 0',
    }}>
      <div style={{ width: 48, display: 'flex' }}>
        {!hideBack && (
          <button onClick={onBack} style={{
            width: 36, height: 36, borderRadius: 18, border: `1px solid ${R.border}`,
            background: R.surface, cursor: 'pointer', padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7l6 6" stroke={R.text} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        )}
      </div>
      <RStepDots n={total} i={step} />
      <div style={{ width: 48, textAlign: 'right' }}>
        {onSkip && (
          <button onClick={onSkip} style={{
            border: 'none', background: 'transparent',
            fontFamily: R.sans, fontSize: 14, fontWeight: 500,
            color: R.muted, cursor: 'pointer', padding: 0,
          }}>Skip</button>
        )}
      </div>
    </div>
  );
}

// Placeholder user avatar (initials on a warm tile)
function RAvatar({ initials, size = 44, bg = R.brandSoft, color = R.surface }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 2,
      background: bg, color, display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontFamily: R.sans, fontSize: size * 0.36,
      fontWeight: 600, letterSpacing: -0.02, flexShrink: 0,
    }}>{initials}</div>
  );
}

Object.assign(window, {
  R, RPrimaryBtn, RGhostBtn, RInput, RWordmark, REyebrow,
  RStepDots, RTopBar, RAvatar,
});
