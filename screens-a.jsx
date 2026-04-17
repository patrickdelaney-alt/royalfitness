// Screen 1 — Welcome
function ScreenWelcome({ onNext }) {
  return (
    <div style={{
      height: '100%', background: R.bg, display: 'flex',
      flexDirection: 'column', padding: '0 28px',
    }}>
      <div style={{ paddingTop: 56 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <RWordmark />
        <div style={{
          marginTop: 14, fontFamily: R.sans, fontSize: 15, fontWeight: 500,
          color: R.muted, lineHeight: 1.5, maxWidth: 280,
        }}>For people who take their health seriously.</div>

        <div style={{ marginTop: 64, display: 'flex', flexDirection: 'column', gap: 22 }}>
          <FeatureLine title="Log workouts &amp; wellness" sub="As simple or as detailed as you like."/>
          <FeatureLine title="Follow people you trust" sub="Real routines, not performance."/>
          <FeatureLine title="Earn royalties" sub="On the products you already recommend."/>
        </div>
      </div>

      <div style={{ paddingBottom: 36, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <RPrimaryBtn onClick={onNext}>Create account</RPrimaryBtn>
        <button style={{
          height: 44, background: 'transparent', border: 'none',
          fontFamily: R.sans, fontSize: 14, fontWeight: 500, color: R.muted,
          cursor: 'pointer',
        }}>I already have an account</button>
      </div>
    </div>
  );
}

function FeatureLine({ title, sub }) {
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <div style={{
        width: 10, height: 10, borderRadius: 5, background: R.brand,
        marginTop: 8, flexShrink: 0,
      }} />
      <div>
        <div style={{ fontFamily: R.sans, fontSize: 16, fontWeight: 600, color: R.text, letterSpacing: -0.01 }}>{title}</div>
        <div style={{ fontFamily: R.sans, fontSize: 13, fontWeight: 400, color: R.muted, marginTop: 2, lineHeight: 1.4 }}>{sub}</div>
      </div>
    </div>
  );
}

// Screen 2 — Create account
function ScreenAccount({ onNext, onBack }) {
  return (
    <div style={{ height: '100%', background: R.bg, display: 'flex', flexDirection: 'column' }}>
      <RTopBar onBack={onBack} step={0} total={6} />
      <div style={{ padding: '28px 24px 0' }}>
        <div style={{ fontFamily: R.sans, fontSize: 26, fontWeight: 600, color: R.text, letterSpacing: -0.015, lineHeight: 1.15 }}>Create your account</div>
        <div style={{ fontFamily: R.sans, fontSize: 14, color: R.muted, marginTop: 8, lineHeight: 1.5 }}>One minute, then you're in.</div>
      </div>
      <div style={{ padding: '28px 24px 0', flex: 1 }}>
        <RInput label="Email" value="patrick@hey.com" />
        <RInput label="Password" value="••••••••••" />
        <div style={{
          fontFamily: R.sans, fontSize: 12, color: R.subtle,
          lineHeight: 1.5, marginTop: 4,
        }}>By continuing you agree to the Terms and Privacy Policy.</div>
      </div>
      <div style={{ padding: '0 24px 36px' }}>
        <RPrimaryBtn onClick={onNext}>Continue</RPrimaryBtn>
      </div>
    </div>
  );
}

// Screen 3 — Profile basics
function ScreenProfile({ onNext, onBack }) {
  return (
    <div style={{ height: '100%', background: R.bg, display: 'flex', flexDirection: 'column' }}>
      <RTopBar onBack={onBack} step={1} total={6} />
      <div style={{ padding: '28px 24px 0' }}>
        <div style={{ fontFamily: R.sans, fontSize: 26, fontWeight: 600, color: R.text, letterSpacing: -0.015, lineHeight: 1.15 }}>A little about you</div>
        <div style={{ fontFamily: R.sans, fontSize: 14, color: R.muted, marginTop: 8, lineHeight: 1.5 }}>How you'll show up on Royal.</div>
      </div>
      <div style={{ padding: '28px 24px 0', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <div style={{ position: 'relative' }}>
            <RAvatar initials="PK" size={96} />
            <div style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 30, height: 30, borderRadius: 15, background: R.brand,
              border: `3px solid ${R.bg}`, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="12" height="12" viewBox="0 0 12 12"><path d="M6 2v8M2 6h8" stroke="#F6F1E4" strokeWidth="1.8" strokeLinecap="round"/></svg>
            </div>
          </div>
        </div>
        <RInput label="Name" value="Patrick K." />
        <RInput label="Username" value="patrick" />
        <RInput label="Bio" value="Early mornings. Real food." />
      </div>
      <div style={{ padding: '0 24px 36px' }}>
        <RPrimaryBtn onClick={onNext}>Continue</RPrimaryBtn>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenWelcome, ScreenAccount, ScreenProfile });
