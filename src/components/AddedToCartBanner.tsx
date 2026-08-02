"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/context/CartContext";
import { inr } from "@/lib/format";
import { CheckIcon } from "./icons";

const VISIBLE_MS = 2800;
const EXIT_MS = 260;

/**
 * Small confirmation banner that slides in whenever something is added to the cart,
 * and offers a one-tap route into the cart.
 */
export function AddedToCartBanner() {
  const { lastAdded } = useCart();
  if (!lastAdded) return null;
  // Keyed by nonce so re-adding the same item remounts and replays the animation.
  return <Banner key={lastAdded.nonce} lastAdded={lastAdded} />;
}

function Banner({ lastAdded }: { lastAdded: NonNullable<ReturnType<typeof useCart>["lastAdded"]> }) {
  const { dismissLastAdded, itemCount, subtotal, openCart } = useCart();
  // Mounts already visible; the enter animation is a CSS keyframe, not a transition.
  const [visible, setVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    hideTimer.current = setTimeout(() => setVisible(false), VISIBLE_MS);
    clearTimer.current = setTimeout(dismissLastAdded, VISIBLE_MS + EXIT_MS);
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (clearTimer.current) clearTimeout(clearTimer.current);
    };
  }, [dismissLastAdded]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none fixed inset-x-0 bottom-[calc(7.5rem+env(safe-area-inset-bottom))] z-[90] flex justify-center px-3 transition-all duration-[260ms] ease-[cubic-bezier(0.16,1,0.3,1)] sm:bottom-[calc(5.5rem+env(safe-area-inset-bottom))] lg:inset-x-auto lg:right-6 lg:bottom-6 lg:justify-end lg:px-0 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      }`}
    >
      <div className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border border-ink-100 bg-white p-2.5 shadow-pop">
        <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-ink-50">
          <Image src={lastAdded.image} alt="" fill sizes="44px" className="object-contain p-1" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-save-500 text-white ring-2 ring-white">
            <CheckIcon className="h-2.5 w-2.5" strokeWidth={3.5} />
          </span>
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold leading-tight text-ink-900">
            Added to cart
            {lastAdded.qty > 1 && (
              <span className="ml-1 font-medium text-ink-500">× {lastAdded.qty}</span>
            )}
          </p>
          <p className="line-clamp-1 text-[11px] leading-tight text-ink-500">
            {lastAdded.name} &middot; {lastAdded.variantLabel}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setVisible(false);
            dismissLastAdded();
            setTimeout(openCart, EXIT_MS);
          }}
          className="shrink-0 rounded-lg bg-accent-500 px-3 py-2 text-[11px] font-bold leading-tight text-white transition-colors hover:bg-accent-600"
        >
          View cart
          <span className="ml-1 tabular-nums opacity-80">
            {itemCount} &middot; {inr(subtotal)}
          </span>
        </button>
      </div>
    </div>
  );
}
