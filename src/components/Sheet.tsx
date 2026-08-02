"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const EXIT_MS = 260;

type SheetProps = {
  open: boolean;
  onClose: () => void;
  /** id of the element naming this dialog, for screen readers */
  labelledBy?: string;
  /** "sheet" = bottom sheet on mobile / centred dialog on desktop. "drawer" = right-hand panel. */
  variant?: "sheet" | "drawer";
  panelClassName?: string;
  children: React.ReactNode;
};

/**
 * Accessible dialog with enter/exit transitions. Stays mounted for the duration of the
 * exit animation so closing never snaps.
 */
export function Sheet({
  open,
  onClose,
  labelledBy,
  variant = "sheet",
  panelClassName = "",
  children,
}: SheetProps) {
  const [portalReady, setPortalReady] = useState(false);
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setPortalReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Drive mount → visible → unmount so both directions animate. Setting state here is
  // required: the panel must commit its closed styles before transitioning to open,
  // and must stay mounted for the length of the exit transition.
  useEffect(() => {
    if (open) {
      // Commit the mounted, closed panel on one frame, then transition it open.
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => {
        setMounted(true);
        raf2 = requestAnimationFrame(() => setVisible(true));
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    }
    const frame = requestAnimationFrame(() => setVisible(false));
    const timer = setTimeout(() => setMounted(false), EXIT_MS);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [open]);

  // Lock background scroll, compensating for the scrollbar so the page doesn't shift.
  useEffect(() => {
    if (!mounted) return;
    const { body, documentElement } = document;
    const gap = window.innerWidth - documentElement.clientWidth;
    const prevOverflow = body.style.overflow;
    const prevPadding = body.style.paddingRight;
    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPadding;
    };
  }, [mounted]);

  // Move focus in on open, hand it back on close.
  useEffect(() => {
    if (!open) return;
    restoreFocusTo.current = document.activeElement as HTMLElement | null;
    const id = requestAnimationFrame(() => panelRef.current?.focus());
    return () => {
      cancelAnimationFrame(id);
      restoreFocusTo.current?.focus?.();
    };
  }, [open]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      // Keep tabbing inside the dialog.
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables?.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );

  if (!portalReady || !mounted) return null;

  const isDrawer = variant === "drawer";

  const positioning = isDrawer
    ? "items-stretch justify-end"
    : "items-end justify-center sm:items-center";

  const panelMotion = isDrawer
    ? visible
      ? "translate-x-0"
      : "translate-x-full"
    : visible
      ? "translate-y-0 sm:scale-100 sm:opacity-100"
      : "translate-y-full sm:translate-y-0 sm:scale-95 sm:opacity-0";

  const panelShape = isDrawer
    ? "h-full w-full max-w-[26rem] rounded-none"
    : "w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl";

  return createPortal(
    <div className={`fixed inset-0 z-[100] flex ${positioning}`} onKeyDown={onKeyDown}>
      <div
        className={`absolute inset-0 bg-ink-900/50 backdrop-blur-[2px] transition-opacity duration-[260ms] ease-out ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={`relative flex max-h-[92dvh] flex-col overflow-hidden bg-white shadow-pop outline-none transition-all duration-[260ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${panelShape} ${panelMotion} ${panelClassName}`}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
