"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { inr } from "@/lib/format";
import { useCustomer } from "@/lib/customer";
import { useOrders } from "@/lib/storefront";
import { CartIcon, OrdersIcon, UserIcon } from "./icons";
import { SearchBox, type SearchBoxHandle } from "./SearchBox";

export function Header({ searchRef }: { searchRef?: React.Ref<SearchBoxHandle> }) {
  const { itemCount, subtotal, hydrated, openCart } = useCart();
  const { orders } = useOrders();
  const { customer } = useCustomer();

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-ink-100 bg-white">
        <div className="mx-auto max-w-[1400px] px-3 sm:px-4 lg:px-6">
          {/* Row 1 — logo on the left, actions on the right, nothing between. */}
          <div className="flex h-14 items-center justify-between gap-3 lg:h-[4.5rem] lg:gap-4">
            {/* The wordmark is part of the artwork, so no text beside it */}
            <Link
              href="/"
              className="flex shrink-0 items-center"
              aria-label="Kiranaclick home"
            >
              <Image
                src="/logo.png"
                alt="Kiranaclick"
                width={816}
                height={442}
                priority
                className="h-10 w-auto lg:h-14"
              />
            </Link>

            {/* Right: orders, cart, then the account */}
            <div className="flex min-w-0 items-center justify-end gap-2 lg:gap-3">
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
                <span className="hidden text-sm font-bold tabular-nums lg:inline">
                  {hydrated && itemCount > 0 ? inr(subtotal) : "Cart"}
                </span>
              </button>

              <Link
                href="/profile"
                aria-label={customer ? `Profile, ${customer.name || "account"}` : "My profile"}
                className="flex h-9 shrink-0 items-center gap-2 rounded-xl border border-ink-200 px-1 transition-colors hover:border-brand-300 hover:bg-brand-50 lg:h-11 lg:pl-1.5 lg:pr-3"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-[11px] font-extrabold text-brand-700 lg:h-8 lg:w-8 lg:text-xs">
                  {(customer?.name || "").trim().charAt(0).toUpperCase() || (
                    <UserIcon className="h-4 w-4" />
                  )}
                </span>
                <span className="hidden min-w-0 flex-col leading-tight lg:flex">
                  <span className="truncate text-[10px] font-bold uppercase tracking-wide text-ink-400">
                    {customer ? "Account" : "Profile"}
                  </span>
                  <span className="max-w-[7rem] truncate text-[12px] font-bold text-ink-800">
                    {customer?.name?.trim() || "Guest"}
                  </span>
                </span>
              </Link>
            </div>
          </div>

          {/* Desktop search moves under the bar, so the logo keeps the centre */}
          <div className="hidden pb-2.5 lg:block">
            <SearchBox ref={searchRef} placeholder="Search products" />
          </div>

          {/* ---- Row 2: mobile / tablet search ---- */}
          <div className="pb-2.5 lg:hidden">
            <SearchBox ref={searchRef} placeholder="Search products" />
          </div>
        </div>
      </header>
    </>
  );
}
