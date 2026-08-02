"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { inr } from "@/lib/format";
import { CartIcon } from "./icons";

/**
 * Persistent "N items · ₹X — View cart" bar on small screens, where the header cart
 * button is too small to act as the primary route into the cart.
 */
export function StickyCartBar() {
  const { lines, itemCount, subtotal, hydrated, openCart, cartOpen } = useCart();
  const pathname = usePathname();

  // The checkout page has its own summary; a floating bar there would just be noise.
  const hidden = pathname?.startsWith("/checkout") || pathname?.startsWith("/order");

  if (!hydrated || itemCount === 0 || hidden) return null;

  const thumbs = lines.slice(0, 3);

  return (
    <div
      className={`fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-40 px-3 pb-2 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] sm:bottom-[env(safe-area-inset-bottom)] sm:pb-3 lg:hidden ${
        cartOpen ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <button
        type="button"
        onClick={openCart}
        className="flex h-14 w-full items-center gap-3 rounded-xl bg-accent-500 px-3 text-white shadow-pop transition-colors hover:bg-accent-600 active:scale-[0.99]"
      >
        <span className="flex -space-x-2">
          {thumbs.map((l) => (
            <span
              key={l.key}
              className="relative h-8 w-8 overflow-hidden rounded-lg bg-white ring-2 ring-accent-500"
            >
              <Image src={l.image} alt="" fill sizes="32px" className="object-contain p-0.5" />
            </span>
          ))}
          {lines.length > 3 && (
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-600 text-[10px] font-bold ring-2 ring-accent-500">
              +{lines.length - 3}
            </span>
          )}
        </span>

        <span className="flex min-w-0 flex-1 flex-col items-start leading-tight">
          <span className="text-[13px] font-bold tabular-nums">
            {itemCount} item{itemCount === 1 ? "" : "s"}
          </span>
          <span className="text-[11px] tabular-nums text-white/85">{inr(subtotal)}</span>
        </span>

        <span className="flex shrink-0 items-center gap-1.5 text-sm font-bold">
          View cart
          <CartIcon className="h-4 w-4" />
        </span>
      </button>
    </div>
  );
}
