"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { CartIcon, GridIcon, HomeIcon, OrdersIcon } from "./icons";

export function BottomNav() {
  const pathname = usePathname();
  const { itemCount, hydrated, openCart } = useCart();

  const isHome = pathname === "/";
  const isCategories = pathname?.startsWith("/category");
  const isOrders = pathname === "/orders" || pathname?.startsWith("/order/");

  const itemClass = (active: boolean) =>
    `flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors ${
      active ? "text-brand-700" : "text-ink-500"
    }`;

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 flex h-[calc(3.5rem+env(safe-area-inset-bottom))] items-start border-t border-ink-100 bg-white pb-[env(safe-area-inset-bottom)] sm:hidden"
    >
      <Link href="/" className={`${itemClass(!!isHome)} h-14`}>
        <HomeIcon className="h-[1.15rem] w-[1.15rem]" strokeWidth={isHome ? 2.2 : 1.8} />
        Home
      </Link>

      <Link href="/category" className={`${itemClass(!!isCategories)} h-14`}>
        <GridIcon className="h-[1.15rem] w-[1.15rem]" strokeWidth={isCategories ? 2.2 : 1.8} />
        Categories
      </Link>

      <Link href="/orders" className={`${itemClass(!!isOrders)} h-14`}>
        <OrdersIcon
          className="h-[1.15rem] w-[1.15rem]"
          strokeWidth={isOrders ? 2.2 : 1.8}
        />
        Orders
      </Link>

      <button type="button" onClick={openCart} className={`${itemClass(false)} relative h-14`}>
        <span className="relative">
          <CartIcon className="h-[1.15rem] w-[1.15rem]" />
          {hydrated && itemCount > 0 && (
            <span
              key={itemCount}
              className="absolute -right-2 -top-1.5 flex h-4 min-w-4 animate-[bump_0.32s_cubic-bezier(0.16,1,0.3,1)] items-center justify-center rounded-full bg-accent-500 px-1 text-[9px] font-bold tabular-nums text-white"
            >
              {itemCount}
            </span>
          )}
        </span>
        Cart
      </button>
    </nav>
  );
}
