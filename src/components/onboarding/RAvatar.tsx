interface Props { initials: string; size?: number; }

export default function RAvatar({ initials, size = 44 }: Props) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 2,
      background: "#8FA878", color: "var(--surface)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36, fontWeight: 600,
      letterSpacing: "-0.02em", flexShrink: 0,
      fontFamily: "var(--font-body)",
    }}>{initials}</div>
  );
}
