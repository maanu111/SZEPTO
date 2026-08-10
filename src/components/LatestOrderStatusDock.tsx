"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { inr } from "@/lib/format";
import { statusView } from "@/lib/orderStatus";
import { useOrders } from "@/lib/storefront";
import { CheckIcon, ChevronDown, OrdersIcon, TruckIcon } from "./icons";

export function LatestOrderStatusDock() {
  const pathname = usePathname();
  const { orders } = useOrders();
  const { itemCount, hydrated, cartOpen } = useCart();
  const [expanded, setExpanded] = useState(false);

  const order = orders[0];
  const hidden =
    pathname?.startsWith("/checkout") ||
    pathname?.startsWith("/orders") ||
    pathname?.startsWith("/order/");

  if (!order || hidden || cartOpen) return null;

  const view = statusView(order.status);
  const hasCart = hydrated && itemCount > 0;
  const totalItems = order.lines.reduce((sum, line) => sum + line.qty, 0);
  const placed = new Date(order.placedAt).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <aside
      aria-label="Latest order status"
      className={`pointer-events-none fixed inset-x-0 z-50 px-2.5 transition-[bottom] duration-300 sm:px-4 lg:inset-x-auto lg:right-6 lg:w-[25rem] lg:px-0 ${
        hasCart
          ? "bottom-[calc(7.75rem+env(safe-area-inset-bottom))] sm:bottom-[4.75rem] lg:bottom-6"
          : "bottom-[calc(3.75rem+env(safe-area-inset-bottom))] sm:bottom-3 lg:bottom-6"
      }`}
    >
      <div className="pointer-events-auto relative mx-auto w-full max-w-[27rem] pt-3 lg:max-w-none">
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
          className="absolute left-1/2 top-0 z-10 flex h-7 -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full bg-[#fbf0c4] px-3 text-[11px] font-extrabold text-[#c20e5c] shadow-card transition-opacity hover:opacity-90"
        >
          Order status
          <ChevronDown
            className={`h-3 w-3 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
            strokeWidth={2.5}
          />
        </button>

        <div className="overflow-hidden rounded-[1.35rem] bg-[#c20e5c] text-white shadow-[0_12px_35px_rgba(140,10,66,0.32)]">
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((current) => !current)}
            className="flex min-h-[5.25rem] w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-black/[0.06]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fbf0c4] text-[#c20e5c]">
              {order.status === "confirmed" || order.status === "delivered" ? (
                <CheckIcon className="h-5 w-5" strokeWidth={3} />
              ) : order.status === "shipped" ? (
                <TruckIcon className="h-5 w-5" strokeWidth={2} />
              ) : (
                <OrdersIcon className="h-5 w-5" strokeWidth={2} />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="truncate text-[15px] font-extrabold leading-tight">
                  {view.dockTitle}
                </span>
                <span className="h-2 w-2 shrink-0 rounded-full bg-[#fbf0c4]" />
              </span>
              <span className="mt-1 block truncate text-[12px] font-medium text-[#fbf0c4]/80">
                {view.dockSubtitle}
              </span>
            </span>
            {/* Capped and allowed to shrink: the status must never be squeezed
                out by a long order number. */}
            <span className="min-w-0 max-w-[38%] shrink text-right">
              <span className="block truncate text-[11px] font-bold text-[#fbf0c4]/70">
                {order.code}
              </span>
              <span className="mt-0.5 block whitespace-nowrap text-sm font-extrabold tabular-nums">
                {inr(order.total)}
              </span>
            </span>
          </button>

          <div
            className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="border-t border-[#fbf0c4]/25 px-4 pb-4 pt-3">
                <div className="flex items-center justify-between text-[10px] font-bold text-[#fbf0c4]/75">
                  <span>Order placed</span>
                  <span>{view.label}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#fbf0c4]/25">
                  <div
                    className="h-full rounded-full bg-[#fbf0c4] transition-[width] duration-500"
                    style={{ width: `${view.progress}%` }}
                  />
                </div>

                <div className="mt-3 grid grid-cols-3 divide-x divide-[#c20e5c]/15 rounded-xl bg-[#fbf0c4] py-2.5 text-center">
                  <span>
                    <span className="block text-[10px] font-medium text-[#c20e5c]/60">Placed</span>
                    <span className="mt-0.5 block text-[11px] font-bold text-[#c20e5c]">{placed}</span>
                  </span>
                  <span>
                    <span className="block text-[10px] font-medium text-[#c20e5c]/60">Items</span>
                    <span className="mt-0.5 block text-[11px] font-bold text-[#c20e5c]">
                      {totalItems}
                    </span>
                  </span>
                  <span>
                    <span className="block text-[10px] font-medium text-[#c20e5c]/60">Total</span>
                    <span className="mt-0.5 block text-[11px] font-bold text-[#c20e5c]">
                      {inr(order.total)}
                    </span>
                  </span>
                </div>

                <Link
                  href={`/order/${order.id}`}
                  className="mt-3 flex h-10 items-center justify-center rounded-xl bg-[#fbf0c4] text-xs font-extrabold text-[#c20e5c] transition-opacity hover:opacity-90"
                >
                  View complete order
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
