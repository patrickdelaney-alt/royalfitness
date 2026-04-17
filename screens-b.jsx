// Screen 4 — Follow people (learn to follow)
function ScreenFollow({ onNext, onBack, onSkip }) {
  const people = [
    { i: 'MR', name: 'Maya Ray', bio: 'Pilates · Laguna Beach', tag: 'Pilates' },
    { i: 'JT', name: 'Julien Tran', bio: 'Marathon training · sub-3 build', tag: 'Running' },
    { i: 'SV', name: 'Sofia Valle', bio: 'Plant-forward cooking', tag: 'Nutrition' },
    { i: 'AL', name: 'Aaron Lim', bio: 'Heavy compound lifts', tag: 'Strength' },
    { i: 'NB', name: 'Nora Bishop', bio: 'Breathwork · sauna', tag: 'Recovery' },
  ];
  const [followed, setFollowed] = React.useState(new Set(['MR', 'SV']));
  const toggle = (k) => {
    const n = new Set(followed);
    n.has(k) ? n.delete(k) : n.add(k);
    setFollowed(n);
  };
  return (
    <div style={{ height: '100%', background: R.bg, display: 'flex', flexDirection: 'column' }}>
      <RTopBar onBack={onBack} step={2} total={6} onSkip={onSkip} />
      <div style={{ padding: '28px 24px 0' }}>
        <div style={{ fontFamily: R.sans, fontSize: 26, fontWeight: 600, color: R.text, letterSpacing: -0.015, lineHeight: 1.15 }}>Follow a few people</div>
        <div style={{ fontFamily: R.sans, fontSize: 14, color: R.muted, marginTop: 8, lineHeight: 1.5 }}>Your feed is what they post — workouts, meals, recovery, things they actually use.</div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 16px 12px' }}>
        {people.map(p => {
          const on = followed.has(p.i);
          return (
            <div key={p.i} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 12px', background: R.surface,
              borderRadius: 16, marginBottom: 8,
              border: `1px solid ${R.border}`,
            }}>
              <RAvatar initials={p.i} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: R.sans, fontSize: 15, fontWeight: 600, color: R.text, letterSpacing: -0.01 }}>{p.name}</div>
                <div style={{ fontFamily: R.sans, fontSize: 13, color: R.muted, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.bio}</div>
              </div>
              <button onClick={() => toggle(p.i)} style={{
                height: 34, padding: '0 16px', borderRadius: 17,
                background: on ? R.brand : 'transparent',
                color: on ? R.surface : R.text,
                border: on ? 'none' : `1px solid ${R.borderStrong}`,
                fontFamily: R.sans, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', letterSpacing: -0.01,
              }}>{on ? 'Following' : 'Follow'}</button>
            </div>
          );
        })}
      </div>
      <div style={{ padding: '0 24px 36px' }}>
        <div style={{ fontFamily: R.sans, fontSize: 12, color: R.subtle, textAlign: 'center', marginBottom: 12 }}>
          Following {followed.size} · you can tap Search anytime to find more
        </div>
        <RPrimaryBtn onClick={onNext}>Continue</RPrimaryBtn>
      </div>
    </div>
  );
}

// Screen 5 — First post (workout) — learn to log
function ScreenFirstPost({ onNext, onBack, onSkip }) {
  const [type, setType] = React.useState('workout');
  const types = [
    { k: 'workout', label: 'Workout' },
    { k: 'wellness', label: 'Wellness' },
    { k: 'meal', label: 'Meal' },
  ];
  const exercises = [
    { name: 'Back squat', detail: '5 × 5 · 185 lb' },
    { name: 'Romanian deadlift', detail: '4 × 8 · 135 lb' },
    { name: 'Walking lunge', detail: '3 × 20 · bw' },
  ];
  return (
    <div style={{ height: '100%', background: R.bg, display: 'flex', flexDirection: 'column' }}>
      <RTopBar onBack={onBack} step={3} total={6} onSkip={onSkip} />
      <div style={{ padding: '24px 24px 0' }}>
        <div style={{ fontFamily: R.sans, fontSize: 26, fontWeight: 600, color: R.text, letterSpacing: -0.015, lineHeight: 1.15 }}>Log your first session</div>
        <div style={{ fontFamily: R.sans, fontSize: 14, color: R.muted, marginTop: 8, lineHeight: 1.5 }}>Post a quick note or log every set. Both count.</div>
      </div>

      {/* type picker */}
      <div style={{ padding: '20px 20px 0', display: 'flex', gap: 6 }}>
        {types.map(t => (
          <button key={t.k} onClick={() => setType(t.k)} style={{
            flex: 1, height: 40, borderRadius: 12,
            background: type === t.k ? R.brand : R.surface2,
            color: type === t.k ? R.surface : R.text,
            border: 'none', fontFamily: R.sans, fontSize: 13, fontWeight: 600,
            letterSpacing: -0.01, cursor: 'pointer',
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ padding: '16px 20px 0', flex: 1, overflow: 'auto' }}>
        {/* composer card */}
        <div style={{ background: R.surface, borderRadius: 18, border: `1px solid ${R.border}`, padding: 16 }}>
          <div style={{ fontFamily: R.sans, fontSize: 11, fontWeight: 600, letterSpacing: 0.16, textTransform: 'uppercase', color: R.muted, marginBottom: 8 }}>Caption</div>
          <div style={{ fontFamily: R.sans, fontSize: 15, color: R.text, lineHeight: 1.5 }}>
            Heavy legs. Felt strong after a rest day.
          </div>
        </div>

        {/* detail toggle */}
        <div style={{
          marginTop: 14, padding: '14px 16px', background: R.surface,
          borderRadius: 18, border: `1px solid ${R.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontFamily: R.sans, fontSize: 14, fontWeight: 600, color: R.text }}>Add exercises</div>
            <div style={{ fontFamily: R.sans, fontSize: 12, color: R.muted, marginTop: 2 }}>Optional · skip for a quick post</div>
          </div>
          <div style={{
            width: 44, height: 26, borderRadius: 13, background: R.brand,
            position: 'relative', padding: 2,
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: 11, background: R.surface,
              position: 'absolute', right: 2, top: 2,
              boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            }} />
          </div>
        </div>

        {/* exercise list */}
        <div style={{ marginTop: 14 }}>
          {exercises.map((e, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px', background: R.surface,
              borderRadius: 14, marginBottom: 6,
              border: `1px solid ${R.border}`,
              borderLeft: `3px solid ${R.brand}`,
            }}>
              <div style={{ fontFamily: R.sans, fontSize: 14, fontWeight: 600, color: R.text }}>{e.name}</div>
              <div style={{ fontFamily: R.sans, fontSize: 12, fontWeight: 500, color: R.muted, fontVariantNumeric: 'tabular-nums' }}>{e.detail}</div>
            </div>
          ))}
          <button style={{
            width: '100%', height: 44, borderRadius: 14,
            background: 'transparent', border: `1px dashed ${R.borderStrong}`,
            color: R.muted, fontFamily: R.sans, fontSize: 13, fontWeight: 500,
            cursor: 'pointer', marginTop: 4,
          }}>+ Add exercise</button>
        </div>
      </div>

      <div style={{ padding: '12px 24px 36px' }}>
        <RPrimaryBtn onClick={onNext}>Post session</RPrimaryBtn>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenFollow, ScreenFirstPost });
