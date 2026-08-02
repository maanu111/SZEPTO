"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/context/CartContext";
import { inr } from "@/lib/format";
import { useCurrentLocation } from "@/lib/useCurrentLocation";
import { useOrders } from "@/lib/storefront";
import { BoltIcon, CartIcon, ChevronDown, LocationIcon, OrdersIcon } from "./icons";
import { SearchBox, type SearchBoxHandle } from "./SearchBox";

export function Header({ searchRef }: { searchRef?: React.Ref<SearchBoxHandle> }) {
  const { itemCount, subtotal, hydrated, openCart } = useCart();
  const orders = useOrders();
  const { location, status, error, detect } = useCurrentLocation();
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close the address dropdown on outside click / Escape.
  useEffect(() => {
    if (!pickerOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!pickerRef.current?.contains(e.target as Node)) setPickerOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPickerOpen(false);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [pickerOpen]);

  const locating = status === "locating";
  const headline = locating
    ? "Detecting your location…"
    : location
      ? location.label
      : "Set your location";
  const detail = location?.line ?? "Tap to detect your current location";

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-ink-100 bg-white">
        <div className="mx-auto max-w-[1400px] px-3 sm:px-4 lg:px-6">
          {/* ---- Row 1 ---- */}
          <div className="flex h-14 items-center gap-3 lg:h-[4.5rem] lg:gap-6">
            {/* Logo */}
            <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="SZepto home">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-accent-500 lg:h-9 lg:w-9">
                <BoltIcon className="h-4 w-4 text-white lg:h-[1.15rem] lg:w-[1.15rem]" />
              </span>
              <span className="hidden text-xl font-extrabold tracking-tight text-brand-800 sm:inline lg:text-[1.4rem]">
                SZepto
              </span>
            </Link>

            {/* Current location */}
            <div className="relative min-w-0 flex-1 lg:flex-none lg:max-w-xs" ref={pickerRef}>
              <button
                type="button"
                onClick={() => setPickerOpen((v) => !v)}
                aria-expanded={pickerOpen}
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
                  <ChevronDown className="h-3 w-3 shrink-0" />
                </span>
              </button>

              {pickerOpen && (
                <div className="absolute left-0 top-full z-50 mt-1.5 w-[min(24rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-ink-100 bg-white shadow-pop">
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
                        <span className="mt-0.5 block text-[10px] text-ink-400">
                          {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
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
                      {locating
                        ? "Detecting…"
                        : location
                          ? "Update my location"
                          : "Detect my current location"}
                    </button>

                    {error && (
                      <p role="alert" className="mt-2 text-[11px] leading-snug text-red-600">
                        {error}
                      </p>
                    )}
                    {!error && !location && (
                      <p className="mt-2 text-[11px] leading-snug text-ink-500">
                        We use your device location to show accurate delivery details.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Desktop search */}
            <SearchBox ref={searchRef} className="hidden flex-1 lg:block" />

            {/* Desktop orders */}
            <Link
              href="/orders"
              className="hidden h-11 shrink-0 items-center gap-2 rounded-xl border border-ink-200 px-3.5 text-ink-700 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 lg:flex"
            >
              <span className="relative">
                <OrdersIcon className="h-[1.15rem] w-[1.15rem]" />
                {orders.length > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[9px] font-extrabold tabular-nums text-white ring-2 ring-white">
                    {Math.min(orders.length, 99)}
                  </span>
                )}
              </span>
              <span className="text-sm font-bold">Orders</span>
            </Link>

            {/* Cart */}
            <button
              type="button"
              onClick={openCart}
              aria-label={`Open cart, ${itemCount} items`}
              className="relative flex h-9 shrink-0 items-center gap-2 rounded-xl bg-brand-700 px-3 text-white transition-colors hover:bg-brand-800 lg:h-11 lg:px-4"
            >
              <span className="relative">
                <CartIcon className="h-[1.15rem] w-[1.15rem]" />
                {hydrated && itemCount > 0 && (
                  <span
                    key={itemCount}
                    className="absolute -right-2 -top-2 flex h-[1.1rem] min-w-[1.1rem] animate-[bump_0.32s_cubic-bezier(0.16,1,0.3,1)] items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold tabular-nums text-white ring-2 ring-brand-700"
                  >
                    {itemCount}
                  </span>
                )}
              </span>
              <span className="hidden text-sm font-bold tabular-nums sm:inline">
                {hydrated && itemCount > 0 ? inr(subtotal) : "Cart"}
              </span>
            </button>
          </div>

          {/* ---- Row 2: mobile / tablet search ---- */}
          <div className="pb-2.5 lg:hidden">
            <SearchBox ref={searchRef} placeholder="Search for milk, atta, coke and more" />
          </div>
        </div>
      </header>
    </>
  );
}
