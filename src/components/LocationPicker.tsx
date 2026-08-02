"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useCurrentLocation } from "@/lib/useCurrentLocation";
import { useIsMounted } from "@/lib/useIsMounted";
import { ChevronDown, LocationIcon } from "./icons";

const PANEL_WIDTH = 320;
const GAP = 8;
const EDGE = 12;

/**
 * Header location control.
 *
 * The panel is portalled to <body> and positioned with `fixed` coordinates measured from
 * the trigger, so it can never be clipped by the header, never sits under other layers,
 * and never affects the header's layout while opening.
 */
export function LocationPicker() {
  const { location, status, error, detect } = useCurrentLocation();
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const portalReady = useIsMounted();

  const place = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const maxLeft = window.innerWidth - PANEL_WIDTH - EDGE;
    setCoords({
      top: rect.bottom + GAP,
      left: Math.max(EDGE, Math.min(rect.left, maxLeft)),
    });
  };

  // Measure before paint so the panel never flashes in the wrong spot.
  useLayoutEffect(() => {
    if (!open) return;
    place();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!panelRef.current?.contains(target) && !triggerRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  const locating = status === "locating";
  const headline = locating
    ? "Detecting location…"
    : location
      ? location.label
      : "Set your location";
  const detail = location?.line ?? "Tap to detect your location";

  return (
    <div className="min-w-0 flex-1 lg:max-w-xs lg:flex-none">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="flex w-full min-w-0 flex-col items-start rounded-lg px-1 py-1 text-left transition-colors hover:bg-ink-50 lg:px-2"
      >
        <span className="flex max-w-full items-center gap-1 text-[13px] font-extrabold leading-tight text-ink-900 lg:text-[15px]">
          <span className="truncate">{headline}</span>
          {locating && (
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600"
            />
          )}
        </span>
        <span className="flex w-full min-w-0 items-center gap-0.5 text-[11px] leading-tight text-ink-500 lg:text-xs">
          <LocationIcon className="h-3 w-3 shrink-0" />
          <span className="truncate">{detail}</span>
          <ChevronDown
            className={`h-3 w-3 shrink-0 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </span>
      </button>

      {portalReady &&
        open &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label="Delivery location"
            style={{
              top: coords.top,
              left: coords.left,
              width: `min(${PANEL_WIDTH}px, calc(100vw - ${EDGE * 2}px))`,
            }}
            className="fixed z-[95] overflow-hidden rounded-xl border border-ink-100 bg-white shadow-pop"
          >
            <p className="border-b border-ink-100 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-ink-400">
              Delivery location
            </p>

            {location && (
              <div className="flex items-start gap-2.5 border-b border-ink-100 bg-brand-50 px-3 py-2.5">
                <LocationIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold text-ink-900">
                    {location.label}
                  </span>
                  <span className="block text-[11px] leading-snug text-ink-500">
                    {location.line}
                  </span>
                </span>
              </div>
            )}

            <div className="p-3">
              <button
                type="button"
                onClick={detect}
                disabled={locating}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-700 px-3 py-2.5 text-[12px] font-bold text-white transition-colors hover:bg-brand-800 disabled:opacity-60"
              >
                <LocationIcon className="h-3.5 w-3.5" />
                {locating ? "Detecting…" : location ? "Update location" : "Detect my location"}
              </button>

              {error && (
                <p role="alert" className="mt-2 text-[11px] leading-snug text-red-600">
                  {error}
                </p>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
