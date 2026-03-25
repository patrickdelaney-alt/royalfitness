"use client";

import { type CSSProperties, type ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { fixedCtaBottomOffset, sheetBottomPadding } from "@/components/layout/bottom-inset";

interface BottomSheetShellProps {
  onClose: () => void;
  children?: ReactNode;
  panelClassName?: string;
  panelStyle?: CSSProperties;
  header?: ReactNode;
  headerClassName?: string;
  headerStyle?: CSSProperties;
  bodyClassName?: string;
  bodyStyle?: CSSProperties;
  footer?: ReactNode;
  footerClassName?: string;
  footerStyle?: CSSProperties;
  backdropClassName?: string;
  backdropStyle?: CSSProperties;
  lockBodyScroll?: boolean;
  closeOnBackdropClick?: boolean;
  rootClassName?: string;
  rootStyle?: CSSProperties;
}

export default function BottomSheetShell({
  onClose,
  children,
  panelClassName,
  panelStyle,
  header,
  headerClassName,
  headerStyle,
  bodyClassName,
  bodyStyle,
  footer,
  footerClassName,
  footerStyle,
  backdropClassName,
  backdropStyle,
  lockBodyScroll = false,
  closeOnBackdropClick = true,
  rootClassName,
  rootStyle,
}: BottomSheetShellProps) {
  useEffect(() => {
    if (!lockBodyScroll) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [lockBodyScroll]);

  if (typeof window === "undefined") return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center pb-[var(--fixed-cta-bottom-offset)] sm:items-center sm:pb-0 ${rootClassName ?? ""}`}
      style={{
        ["--fixed-cta-bottom-offset" as string]: fixedCtaBottomOffset,
        ...rootStyle,
      }}
      onClick={closeOnBackdropClick ? onClose : undefined}
    >
      <div
        className={`absolute inset-0 ${backdropClassName ?? ""}`}
        style={backdropStyle}
      />

      <div
        className={`relative w-full flex max-h-[92dvh] flex-col ${panelClassName ?? ""}`}
        style={panelStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {header ? (
          <div className={`flex-shrink-0 ${headerClassName ?? ""}`} style={headerStyle}>
            {header}
          </div>
        ) : null}

        <div
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain ${bodyClassName ?? ""}`}
          style={{ WebkitOverflowScrolling: "touch", ...bodyStyle }}
        >
          {children}
        </div>

        {footer ? (
          <div
            className={`flex-shrink-0 ${footerClassName ?? ""}`}
            style={{ paddingBottom: sheetBottomPadding, ...footerStyle }}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
