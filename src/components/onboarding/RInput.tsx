"use client";

interface Props {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}

export default function RInput({ label, value, onChange, placeholder, type = "text" }: Props) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <div style={{
          fontSize: 11, fontWeight: 600, letterSpacing: "0.16em",
          textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8,
          fontFamily: "var(--font-body)",
        }}>{label}</div>
      )}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", height: 52, borderRadius: 14,
          background: "var(--surface)", border: "1px solid var(--border)",
          padding: "0 16px", fontSize: 16, fontWeight: 500,
          color: "var(--text)", fontFamily: "var(--font-body)",
          outline: "none", boxSizing: "border-box",
        }}
      />
    </div>
  );
}
