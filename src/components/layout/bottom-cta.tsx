import type { CSSProperties, ReactNode } from "react";
import { sheetBottomPadding } from "@/components/layout/bottom-inset";

interface BottomCtaBarProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function BottomCtaBar({ children, className = "", style }: BottomCtaBarProps) {
  return (
    <div
      className={`px-4 pt-3 shrink-0 ${className}`.trim()}
      style={{
        borderTop: "1px solid rgba(36,63,22,0.08)",
        background: "var(--surface)",
        paddingBottom: sheetBottomPadding,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

interface BottomCtaRowProps {
  children: ReactNode;
  className?: string;
}

export function BottomCtaRow({ children, className = "" }: BottomCtaRowProps) {
  return <div className={`flex flex-wrap gap-2 ${className}`.trim()}>{children}</div>;
}
