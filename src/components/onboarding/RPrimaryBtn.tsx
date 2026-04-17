"use client";

interface Props {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}

export default function RPrimaryBtn({ children, onClick, disabled, type = "button" }: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%", height: 54, borderRadius: 16,
        background: disabled ? "rgba(31,58,16,0.4)" : "var(--brand)",
        color: "var(--surface)", border: "none",
        fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em",
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: "0 2px 8px rgba(31,58,16,0.18)",
        fontFamily: "var(--font-body)",
        transition: "transform 150ms ease",
      }}
      onMouseDown={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.97)"; }}
      onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
    >{children}</button>
  );
}
