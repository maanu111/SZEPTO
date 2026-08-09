"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { ChevronLeft, ChevronRight, OrdersIcon } from "@/components/icons";
import { inr } from "@/lib/format";
import { statusView } from "@/lib/orderStatus";
import { useOrders, type Order } from "@/lib/storefront";

/** Enough to fill a desktop screen without a wall of cards on mobile. */
const PER_PAGE = 8;

type Filter = "all" | "active" | "shipped" | "delivered" | "cancelled";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

function matchesFilter(order: Order, filter: Filter) {
  if (filter === "all") return true;
  // "Active" is everything still being worked on, before it leaves the store.
  if (filter === "active") return order.status === "pending" || order.status === "confirmed";
  return order.status === filter;
}

function formatPlacedAt(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function OrdersClient() {
  const { orders } = useOrders();
  const [filter, setFilter] = useState<Filter>("all");
  const [requestedPage, setPage] = useState(1);
  const ready = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const filtered = useMemo(
    () => orders.filter((order) => matchesFilter(order, filter)),
    [orders, filter]
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  // Clamp on read rather than correcting state in an effect: a live order
  // update can shrink the list under the reader at any moment, and rendering
  // the last valid page is the right answer without a second render pass.
  const page = Math.min(requestedPage, pageCount);

  const visible = useMemo(
    () => filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    [filtered, page]
  );

  if (!ready) {
    return (
      <div className="mx-auto max-w-4xl px-3 py-6 sm:px-4 lg:px-6">
        <div className="skeleton h-9 w-40 rounded-lg" />
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="skeleton h-64 rounded-2xl" />
          <div className="skeleton h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-3 pb-8 pt-5 sm:px-4 sm:pt-7 lg:px-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-600">
            Account
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
            My orders
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {orders.length
              ? `${orders.length} order${orders.length === 1 ? "" : "s"} placed from this device`
              : "Your placed orders will appear here."}
          </p>
        </div>
        <Link
          href="/"
          className="hidden h-10 shrink-0 items-center rounded-xl border border-ink-200 px-4 text-xs font-bold text-ink-700 transition-colors hover:border-brand-400 hover:text-brand-700 sm:flex"
        >
          Continue shopping
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="mt-8 flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-ink-50/60 px-5 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-brand-700 shadow-card">
            <OrdersIcon className="h-8 w-8" />
          </span>
          <h2 className="mt-4 text-lg font-bold text-ink-900">No orders yet</h2>
          <p className="mt-1 max-w-sm text-sm leading-relaxed text-ink-500">
            Once you complete checkout, you can track payment status and review every order here.
          </p>
          <Link
            href="/"
            className="mt-5 flex h-11 items-center justify-center rounded-xl bg-accent-500 px-6 text-sm font-bold text-white transition-colors hover:bg-accent-600"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <>
          <div
            className="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1"
            role="tablist"
            aria-label="Filter orders"
          >
            {FILTERS.map((item) => {
              const active = item.key === filter;
              const count = orders.filter((order) => matchesFilter(order, item.key)).length;
              return (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setFilter(item.key);
                    setPage(1);
                  }}
                  className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-xs font-bold transition-colors ${
                    active
                      ? "border-brand-700 bg-brand-700 text-white"
                      : "border-ink-200 bg-white text-ink-600 hover:border-brand-300 hover:text-brand-700"
                  }`}
                >
                  {item.label}
                  <span className={active ? "text-white/70" : "text-ink-400"}>{count}</span>
                </button>
              );
            })}
          </div>

          {filtered.length ? (
            <div className="mt-4 grid items-start gap-3 md:grid-cols-2">
              {visible.map((order) => {
                const itemCount = order.lines.reduce((sum, line) => sum + line.qty, 0);
                return (
                  <article
                    key={order.id}
                    className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card"
                  >
                    <div className="flex items-start justify-between gap-3 border-b border-ink-100 px-4 py-3.5">
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold tracking-tight text-ink-900">
                          {order.id}
                        </p>
                        <p className="mt-0.5 text-[11px] text-ink-500">
                          {formatPlacedAt(order.placedAt)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${
                          statusView(order.status).chip
                        }`}
                      >
                        {statusView(order.status).label}
                      </span>
                    </div>

                    <div className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex shrink-0 -space-x-2">
                          {order.lines.slice(0, 3).map((line) => (
                            <span
                              key={line.key}
                              className="relative h-12 w-12 overflow-hidden rounded-xl border-2 border-white bg-ink-50"
                            >
                              <Image
                                src={line.image}
                                alt=""
                                fill
                                sizes="48px"
                                className="object-contain p-1"
                              />
                            </span>
                          ))}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold text-ink-900">
                            {order.lines[0]?.name}
                            {order.lines.length > 1 && ` + ${order.lines.length - 1} more`}
                          </p>
                          <p className="mt-0.5 text-[11px] text-ink-500">
                            {itemCount} item{itemCount === 1 ? "" : "s"}
                          </p>
                        </div>
                        <p className="shrink-0 text-base font-extrabold tabular-nums text-ink-900">
                          {inr(order.total)}
                        </p>
                      </div>

                      <div className="mt-3 rounded-xl bg-ink-50 px-3 py-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-ink-400">
                          Delivering to
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-ink-600">
                          {order.customer.address}
                          {order.customer.landmark && `, ${order.customer.landmark}`},{" "}
                          {order.customer.city} {order.customer.pincode}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/order/${order.id}`}
                      className="flex h-12 items-center justify-between border-t border-ink-100 px-4 text-[13px] font-bold text-brand-700 transition-colors hover:bg-brand-50"
                    >
                      View complete order
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-ink-200 py-14 text-center">
              <p className="text-sm font-bold text-ink-900">No {filter} orders</p>
              <button
                type="button"
                onClick={() => setFilter("all")}
                className="mt-2 text-xs font-bold text-brand-700"
              >
                Show all orders
              </button>
            </div>
          )}

          {pageCount > 1 && (
            <nav
              aria-label="Orders pages"
              className="mt-5 flex items-center justify-between gap-3"
            >
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex h-10 items-center gap-1 rounded-xl border border-ink-200 px-3.5 text-xs font-bold text-ink-700 transition-colors enabled:hover:border-brand-400 enabled:hover:text-brand-700 disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Prev
              </button>

              <div className="flex items-center gap-1.5">
                {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-current={n === page ? "page" : undefined}
                    onClick={() => setPage(n)}
                    className={`h-9 min-w-9 rounded-lg px-2 text-xs font-bold tabular-nums transition-colors ${
                      n === page
                        ? "bg-brand-700 text-white"
                        : "border border-ink-200 text-ink-600 hover:border-brand-300 hover:text-brand-700"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={page === pageCount}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                className="flex h-10 items-center gap-1 rounded-xl border border-ink-200 px-3.5 text-xs font-bold text-ink-700 transition-colors enabled:hover:border-brand-400 enabled:hover:text-brand-700 disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
