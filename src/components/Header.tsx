"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { inr } from "@/lib/format";
import { useOrders } from "@/lib/storefront";
import { BoltIcon, CartIcon, OrdersIcon } from "./icons";
import { LocationPicker } from "./LocationPicker";
import { SearchBox, type SearchBoxHandle } from "./SearchBox";

export function Header({ searchRef }: { searchRef?: React.Ref<SearchBoxHandle> }) {
  const { itemCount, subtotal, hydrated, openCart } = useCart();
  const orders = useOrders();

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

            <LocationPicker />

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
