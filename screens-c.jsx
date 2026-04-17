// Screen 6 — Add to catalog (referral links / codes / products)
function ScreenCatalog({ onNext, onBack, onSkip }) {
  const items = [
    { name: 'LMNT Electrolyte', kind: 'Referral link', code: 'royal.to/lmnt', pct: '15%' },
    { name: 'Hyperice Normatec 3', kind: 'Discount code', code: 'ROYAL20', pct: '$50' },
    { name: 'Oura Ring', kind: 'Referral link', code: 'royal.to/oura', pct: '$40' },
  ];
  return (
    <div style={{ height: '100%', background: R.bg, display: 'flex', flexDirection: 'column' }}>
      <RTopBar onBack={onBack} step={4} total={6} onSkip={onSkip} />
      <div style={{ padding: '24px 24px 0' }}>
        <REyebrow gold>Your catalog</REyebrow>
        <div style={{ marginTop: 10, fontFamily: R.sans, fontSize: 26, fontWeight: 600, color: R.text, letterSpacing: -0.015, lineHeight: 1.15 }}>Add things you actually use</div>
        <div style={{ fontFamily: R.sans, fontSize: 14, color: R.muted, marginTop: 8, lineHeight: 1.5 }}>Referral links, discount codes, and products. This is what you'll share to earn royalties.</div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '20px 20px 0' }}>
        {/* add-item tile */}
        <div style={{
          padding: '18px 16px', background: R.surface,
          borderRadius: 18, border: `1px solid ${R.border}`,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: R.brand, color: R.surface,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: R.sans, fontSize: 24, fontWeight: 400, lineHeight: 1,
          }}>+</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: R.sans, fontSize: 14, fontWeight: 600, color: R.text }}>Paste a link or code</div>
            <div style={{ fontFamily: R.sans, fontSize: 12, color: R.muted, marginTop: 2 }}>We'll pull the product details automatically</div>
          </div>
        </div>

        {/* existing items */}
        <div style={{ marginTop: 22 }}>
          <REyebrow>In your catalog · 3</REyebrow>
          <div style={{ marginTop: 10 }}>
            {items.map((it, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', background: R.surface,
                borderRadius: 14, marginBottom: 8,
                border: `1px solid ${R.border}`,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10, background: R.surface2,
                  border: `1px solid ${R.border}`, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: R.serif, fontSize: 18, color: R.muted,
                }}>{it.name[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: R.sans, fontSize: 14, fontWeight: 600, color: R.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.name}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 3 }}>
                    <span style={{ fontFamily: R.sans, fontSize: 11, fontWeight: 500, color: R.muted }}>{it.kind}</span>
                    <span style={{ width: 2, height: 2, borderRadius: 1, background: R.subtle }} />
                    <span style={{ fontFamily: R.sans, fontSize: 11, fontWeight: 600, color: R.mustard, letterSpacing: 0.01 }}>{it.code}</span>
                  </div>
                </div>
                <div style={{
                  padding: '4px 10px', borderRadius: 10,
                  background: 'rgba(187,162,76,0.15)',
                  fontFamily: R.sans, fontSize: 11, fontWeight: 700,
                  color: R.mustard, fontVariantNumeric: 'tabular-nums',
                }}>{it.pct}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 24px 36px' }}>
        <RPrimaryBtn onClick={onNext}>Continue</RPrimaryBtn>
      </div>
    </div>
  );
}

// Screen 7 — Share from catalog to feed → earn royalties
function ScreenRoyalties({ onNext, onBack, onSkip }) {
  return (
    <div style={{ height: '100%', background: R.bg, display: 'flex', flexDirection: 'column' }}>
      <RTopBar onBack={onBack} step={5} total={6} onSkip={onSkip} />
      <div style={{ padding: '24px 24px 0' }}>
        <REyebrow gold>Earn royalties</REyebrow>
        <div style={{ marginTop: 10, fontFamily: R.sans, fontSize: 26, fontWeight: 600, color: R.text, letterSpacing: -0.015, lineHeight: 1.15 }}>Share a catalog item, get paid</div>
        <div style={{ fontFamily: R.sans, fontSize: 14, color: R.muted, marginTop: 8, lineHeight: 1.5 }}>Attach a catalog item to any post. When someone uses your link or code, you earn royalties.</div>
      </div>

      {/* post preview with attached royalty */}
      <div style={{ padding: '22px 20px 0', flex: 1, overflow: 'auto' }}>
        <div style={{
          background: R.surface, borderRadius: 20,
          border: `1px solid ${R.border}`, overflow: 'hidden',
        }}>
          <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <RAvatar initials="PK" size={36} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: R.sans, fontSize: 13, fontWeight: 600, color: R.text }}>patrick</div>
              <div style={{ fontFamily: R.sans, fontSize: 11, color: R.muted }}>Just now · Morning run</div>
            </div>
          </div>
          <div style={{ padding: '0 16px 12px', fontFamily: R.sans, fontSize: 14, color: R.text, lineHeight: 1.55 }}>
            Easy 5-miler. Half an LMNT before, felt dialed in.
          </div>
          <div style={{
            height: 180, background: `linear-gradient(135deg, ${R.brandSoft} 0%, ${R.brandLight} 100%)`,
            display: 'flex', alignItems: 'flex-end', padding: 12,
          }}>
            <div style={{
              padding: '4px 10px', borderRadius: 10,
              background: 'rgba(246,241,228,0.9)',
              fontFamily: R.sans, fontSize: 11, fontWeight: 600, color: R.brand,
            }}>📍 Silverlake Reservoir</div>
          </div>

          {/* attached catalog item (royalty chip) */}
          <div style={{
            margin: 12, padding: '12px 14px',
            background: 'rgba(187,162,76,0.10)',
            border: `1px solid rgba(187,162,76,0.35)`,
            borderRadius: 14,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, background: R.surface,
              border: `1px solid ${R.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: R.serif, fontSize: 18, color: R.muted, flexShrink: 0,
            }}>L</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: R.sans, fontSize: 10, fontWeight: 700, letterSpacing: 0.15, textTransform: 'uppercase', color: R.mustard }}>Earning royalties</div>
              <div style={{ fontFamily: R.sans, fontSize: 13, fontWeight: 600, color: R.text, marginTop: 2 }}>LMNT Electrolyte · royal.to/lmnt</div>
            </div>
            <svg width="10" height="16" viewBox="0 0 10 16"><path d="M2 2l6 6-6 6" stroke={R.text} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
          </div>
        </div>

        {/* explainer */}
        <div style={{ marginTop: 20, padding: '0 4px' }}>
          <HowLine n="1" t="Someone taps your catalog item" />
          <HowLine n="2" t="They use your link or code" />
          <HowLine n="3" t="You earn — tracked in Royalties" />
        </div>
      </div>

      <div style={{ padding: '12px 24px 36px' }}>
        <RPrimaryBtn onClick={onNext}>I get it</RPrimaryBtn>
      </div>
    </div>
  );
}

function HowLine({ n, t }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px 0' }}>
      <div style={{
        width: 22, height: 22, borderRadius: 11, background: R.brand,
        color: R.surface, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: R.sans, fontSize: 11, fontWeight: 700, flexShrink: 0,
      }}>{n}</div>
      <div style={{ fontFamily: R.sans, fontSize: 14, color: R.text }}>{t}</div>
    </div>
  );
}

// Screen 8 — Done
function ScreenDone({ onFinish, onBack }) {
  return (
    <div style={{ height: '100%', background: R.bg, display: 'flex', flexDirection: 'column' }}>
      <RTopBar onBack={onBack} step={5} total={6} hideBack />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 32px' }}>
        <div style={{
          width: 88, height: 88, borderRadius: 44, background: R.brand,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 32,
        }}>
          <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
            <path d="M8 19l7 7 15-15" stroke={R.surface} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div style={{ fontFamily: R.serif, fontSize: 44, fontWeight: 400, color: R.text, letterSpacing: -0.015, lineHeight: 1.05 }}>You're in.</div>
        <div style={{ marginTop: 14, fontFamily: R.sans, fontSize: 15, color: R.muted, lineHeight: 1.55, maxWidth: 300 }}>
          Post what you actually do. Share what you actually use. The rest is details.
        </div>
      </div>
      <div style={{ padding: '0 24px 36px' }}>
        <RPrimaryBtn onClick={onFinish}>Go to feed</RPrimaryBtn>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenCatalog, ScreenRoyalties, ScreenDone });
