import type { CSSProperties, ReactNode } from "react";

interface ModalSheetProps {
  onClose: () => void;
  children: ReactNode;
  /** Tailwind max-width class for desktop centering. Defaults to sm:max-w-md */
  maxWidthClass?: string;
  zIndex?: number;
  /** Extra className added to the inner sheet card */
  sheetClassName?: string;
  sheetStyle?: CSSProperties;
}

/**
 * Full-screen overlay modal that slides up from the bottom on mobile and
 * centers on desktop. Safe-area and home-indicator clearance are handled
 * by BottomCtaBar inside — never add pb-[fixedCtaBottomOffset] to this wrapper.
 *
 * Usage:
 *   <ModalSheet onClose={handleClose}>
 *     <ModalSheetBody>…scrollable content…</ModalSheetBody>
 *     <BottomCtaBar>…pinned action buttons…</BottomCtaBar>
 *   </ModalSheet>
 */
export function ModalSheet({
  onClose,
  children,
  maxWidthClass = "sm:max-w-md",
  zIndex = 50,
  sheetClassName = "",
  sheetStyle,
}: ModalSheetProps) {
  return (
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center"
      style={{ zIndex }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: "rgba(24,25,15,0.5)" }}
      />

      {/* Sheet */}
      <div
        className={`relative w-full ${maxWidthClass} flex flex-col max-h-[calc(100dvh-1rem)] rounded-t-2xl sm:rounded-2xl overflow-hidden ${sheetClassName}`}
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-lg)",
          ...sheetStyle,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

interface ModalSheetBodyProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * Scrollable body region inside a ModalSheet.
 * Pair with BottomCtaBar for a pinned footer.
 */
export function ModalSheetBody({ children, className = "", style }: ModalSheetBodyProps) {
  return (
    <div
      className={`flex-1 overflow-y-auto overscroll-y-contain ${className}`}
      style={{ WebkitOverflowScrolling: "touch", ...style }}
    >
      {children}
    </div>
  );
}
