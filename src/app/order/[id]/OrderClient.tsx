"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CheckIcon, ChevronLeft, OrdersIcon } from "@/components/icons";
import { inr } from "@/lib/format";
import { updateOrderStatus, useOrders, type Order } from "@/lib/storefront";
import { useIsMounted } from "@/lib/useIsMounted";

function statusMeta(status: Order["status"]) {
  if (status === "Confirmed") {
    return {
      chip: "bg-save-50 text-save-600",
      panel: "border-save-500/20 bg-save-50",
      title: "Payment verified",
      message: "Your payment is confirmed and the store is preparing this order.",
    };
  }
  if (status === "Cancelled") {
    return {
      chip: "bg-red-50 text-red-700",
      panel: "border-red-200 bg-red-50",
      title: "Order cancelled",
      message: "This order was cancelled. Contact the store if you need help with the payment.",
    };
  }
  return {
    chip: "bg-amber-50 text-amber-800",
    panel: "border-amber-200 bg-amber-50",
    title: "Payment verification in progress",
    message: "The store has received your screenshot and will verify the payment shortly.",
  };
}

function OrderProgress({ status }: { status: Order["status"] }) {
  const finalLabel = status === "Cancelled" ? "Cancelled" : "Payment verified";
  const completed = status === "Payment under verification" ? 2 : 3;

  return (
    <ol className="mt-4 grid grid-cols-3" aria-label="Order progress">
      {["Order placed", "Payment submitted", finalLabel].map((label, index) => {
        const done = index < completed;
        const cancelled = status === "Cancelled" && index === 2;
        return (
          <li key={label} className="relative flex min-w-0 flex-col items-center text-center">
            {index > 0 && (
              <span
                aria-hidden="true"
                className={`absolute right-1/2 top-3 h-0.5 w-full ${
                  done ? (cancelled ? "bg-red-400" : "bg-save-500") : "bg-ink-200"
                }`}
              />
            )}
            <span
              className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                done
                  ? cancelled
                    ? "border-red-500 bg-red-500 text-white"
                    : "border-save-500 bg-save-500 text-white"
                  : "border-ink-200 bg-white text-ink-400"
              }`}
            >
              {done ? <CheckIcon className="h-3 w-3" strokeWidth={3.5} /> : index + 1}
            </span>
            <span
              className={`mt-1.5 px-1 text-[10px] font-bold leading-tight sm:text-[11px] ${
                done ? (cancelled ? "text-red-700" : "text-ink-700") : "text-ink-400"
              }`}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function OrderClient({ orderId }: { orderId: string }) {
  const orders = useOrders();
  const order = orders.find((item) => item.id === orderId) ?? null;
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  // Orders live in localStorage, so nothing is known until after hydration.
  const ready = useIsMounted();

  if (!ready) {
    return (
      <div className="mx-auto max-w-2xl px-3 py-6 sm:px-4">
        <div className="skeleton h-8 w-44 rounded-lg" />
        <div className="mt-4 flex flex-col gap-4">
          <div className="skeleton h-32 rounded-2xl" />
          <div className="skeleton h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto flex min-h-[28rem] max-w-md flex-col items-center justify-center px-4 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ink-50 text-ink-400">
          <OrdersIcon className="h-8 w-8" />
        </span>
        <h1 className="mt-4 text-lg font-bold text-ink-900">Order not found</h1>
        <p className="mt-1 text-sm leading-relaxed text-ink-500">
          We could not find <span className="font-semibold text-ink-700">{orderId}</span> in this
          browser&apos;s order history.
        </p>
        <Link
          href="/orders"
          className="mt-5 flex h-11 items-center justify-center rounded-xl bg-accent-500 px-6 text-sm font-bold text-white"
        >
          View my orders
        </Link>
      </div>
    );
  }

  const status = statusMeta(order.status);
  const placed = new Date(order.placedAt).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const itemCount = order.lines.reduce((sum, line) => sum + line.qty, 0);

  return (
    <div className="mx-auto w-full max-w-2xl px-3 pb-10 pt-4 sm:px-4 sm:pt-6">
      <Link
        href="/orders"
        className="inline-flex items-center gap-1 text-xs font-bold text-ink-500 transition-colors hover:text-brand-700"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        My orders
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="break-all text-xl font-extrabold tracking-tight text-ink-900 sm:text-2xl">
            {order.id}
          </h1>
          <p className="mt-0.5 text-xs text-ink-500">Placed {placed}</p>
        </div>
        <span
          className={`w-fit shrink-0 rounded-full px-3 py-1.5 text-[11px] font-extrabold ${status.chip}`}
        >
          {order.status}
        </span>
      </div>

      {/* 1 — status */}
      <section className={`mt-4 rounded-2xl border p-4 ${status.panel}`}>
        <h2 className="text-sm font-extrabold text-ink-900">{status.title}</h2>
        <p className="mt-1 text-xs leading-relaxed text-ink-600">{status.message}</p>
        <OrderProgress status={order.status} />
      </section>

      {/* 2 — items */}
      <section className="mt-4 overflow-hidden rounded-2xl border border-ink-100 bg-white">
        <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3.5">
          <h2 className="text-sm font-extrabold text-ink-900">Items</h2>
          <span className="text-[11px] font-semibold text-ink-500">
            {itemCount} item{itemCount === 1 ? "" : "s"} &middot; {inr(order.total)}
          </span>
        </div>
        <ul className="divide-y divide-ink-100 px-4">
          {order.lines.map((line) => (
            <li key={line.key} className="flex items-center gap-3 py-3">
              <Link
                href={`/product/${line.slug}`}
                className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-ink-50"
              >
                <Image src={line.image} alt="" fill sizes="56px" className="object-contain p-1.5" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/product/${line.slug}`}
                  className="line-clamp-2 text-[13px] font-semibold leading-snug text-ink-900 hover:text-brand-700"
                >
                  {line.name}
                </Link>
                <p className="mt-0.5">
                  <span className="rounded bg-accent-50 px-1.5 py-px text-[10px] font-bold text-accent-500">
                    {line.variantLabel}
                  </span>
                  <span className="ml-1 text-[11px] text-ink-500">Qty {line.qty}</span>
                </p>
              </div>
              <p className="shrink-0 text-[13px] font-bold tabular-nums text-ink-900">
                {inr(line.price * line.qty)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* 3 — delivery address */}
      <section className="mt-4 rounded-2xl border border-ink-100 bg-white p-4">
        <h2 className="text-sm font-extrabold text-ink-900">Delivery address</h2>
        <p className="mt-2.5 text-[13px] font-bold text-ink-900">{order.customer.name}</p>
        <a
          href={`tel:${order.customer.phone}`}
          className="mt-0.5 block text-xs font-medium text-brand-700"
        >
          {order.customer.phone}
        </a>
        <p className="mt-2 text-xs leading-relaxed text-ink-600">
          {order.customer.address}
          {order.customer.landmark && `, ${order.customer.landmark}`}
          <br />
          {order.customer.city} &middot; {order.customer.pincode}
        </p>
      </section>

      {/* 4 — cancel, only while the order is still in progress */}
      {order.status === "Payment under verification" && (
        <div className="mt-4">
          {confirmingCancel ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="text-[13px] font-bold text-red-800">Cancel this order?</p>
              <p className="mt-1 text-xs leading-relaxed text-red-700">
                This can&apos;t be undone. Contact the store about any refund.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    updateOrderStatus(order.id, "Cancelled");
                    setConfirmingCancel(false);
                  }}
                  className="h-10 flex-1 rounded-xl bg-red-600 text-xs font-bold text-white transition-colors hover:bg-red-700"
                >
                  Yes, cancel order
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingCancel(false)}
                  className="h-10 flex-1 rounded-xl border border-ink-200 bg-white text-xs font-bold text-ink-700 transition-colors hover:border-ink-400"
                >
                  Keep order
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingCancel(true)}
              className="flex h-11 w-full items-center justify-center rounded-xl border border-red-200 text-xs font-bold text-red-600 transition-colors hover:border-red-400 hover:bg-red-50"
            >
              Cancel order
            </button>
          )}
        </div>
      )}
    </div>
  );
}
