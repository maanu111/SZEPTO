"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { inr } from "@/lib/format";
import { useOrders } from "@/lib/storefront";
import { CartIcon } from "./icons";

const FREE_DELIVERY_OVER = 499;

/**
 * The bottom strip:
 *   - cart has items → "N items · ₹X — View cart"
 *   - otherwise      → free-delivery nudge
 *
 * Live order status is owned by <LatestOrderStatusDock>, which sits above this and
 * renders nothing when there's no order — this bar is what fills that gap for a
 * first-time visitor.
 */
export function BottomBar() {
  const { lines, itemCount, subtotal, hydrated, openCart, cartOpen } = useCart();
  const { orders } = useOrders();
  const pathname = usePathname();

  // Checkout and order pages carry their own summary / status UI.
  const hidden = pathname?.startsWith("/checkout") || pathname?.startsWith("/order");
  if (!hydrated || hidden) return null;

  if (itemCount > 0) return <CartBar />;

  // The dock is already showing this customer their order; don't crowd it.
  if (orders.length > 0) return null;

  return (
    <Shell>
      <div className="flex h-11 w-full items-center gap-2.5 rounded-xl bg-ink-900 px-3.5 text-white shadow-pop">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-save-500/20 text-save-500">
          <LockIcon />
        </span>
        <span className="text-[12px] font-medium text-white/85">
          Get <span className="font-bold text-white">FREE delivery</span> above{" "}
          {inr(FREE_DELIVERY_OVER)}
        </span>
      </div>
    </Shell>
  );

  function CartBar() {
    const thumbs = lines.slice(0, 3);
    return (
      <Shell>
        <button
          type="button"
          onClick={openCart}
          className={`flex h-14 w-full items-center gap-3 rounded-xl bg-accent-500 px-3 text-white shadow-pop transition-all hover:bg-accent-600 active:scale-[0.99] ${
            cartOpen ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100"
          }`}
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
      </Shell>
    );
  }
}

/** Fixed positioning shared by every state — always clears the mobile tab bar. */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-40 px-3 pb-2 sm:bottom-[env(safe-area-inset-bottom)] sm:pb-3 lg:hidden">
      {children}
    </div>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
      <rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="currentColor" />
      <path
        d="M8.5 10.5V8a3.5 3.5 0 1 1 7 0v2.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
