"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { inr } from "@/lib/format";
import { Sheet } from "./Sheet";
import { BoltIcon, CartIcon, CloseIcon, MinusIcon, PlusIcon, TrashIcon } from "./icons";

const DELIVERY_FEE = 25;
const FREE_DELIVERY_OVER = 499;
const HANDLING_FEE = 9;

export function CartDrawer() {
  const { lines, cartOpen, closeCart, setQty, removeItem, subtotal, savings, itemCount } = useCart();

  const deliveryFee = subtotal >= FREE_DELIVERY_OVER || subtotal === 0 ? 0 : DELIVERY_FEE;
  const handling = subtotal === 0 ? 0 : HANDLING_FEE;
  const total = subtotal + deliveryFee + handling;
  const toFreeDelivery = Math.max(0, FREE_DELIVERY_OVER - subtotal);

  return (
    <Sheet open={cartOpen} onClose={closeCart} labelledBy="cart-title" variant="drawer">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-ink-100 px-4 py-3.5">
        <h2 id="cart-title" className="flex-1 text-base font-bold text-ink-900">
          My Cart
          {itemCount > 0 && (
            <span className="ml-1.5 text-xs font-medium text-ink-500">({itemCount} items)</span>
          )}
        </h2>
        <button
          type="button"
          onClick={closeCart}
          aria-label="Close cart"
          className="flex h-8 w-8 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>

      {lines.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-ink-50 text-ink-400">
            <CartIcon className="h-7 w-7" />
          </span>
          <p className="mt-4 text-sm font-bold text-ink-900">Your cart is empty</p>
          <p className="mt-1 text-xs text-ink-500">Add items worth ₹499 for free delivery.</p>
          <button
            type="button"
            onClick={closeCart}
            className="mt-5 rounded-xl bg-accent-500 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent-600"
          >
            Start shopping
          </button>
        </div>
      ) : (
        <>
          {/* Free-delivery nudge */}
          <div className="border-b border-ink-100 bg-brand-50 px-4 py-2.5">
            {toFreeDelivery > 0 ? (
              <>
                <p className="text-[11px] font-medium text-brand-800">
                  Add <span className="font-bold">{inr(toFreeDelivery)}</span> more for free delivery
                </p>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-brand-200">
                  <div
                    className="h-full rounded-full bg-brand-600 transition-[width] duration-300"
                    style={{ width: `${Math.min(100, (subtotal / FREE_DELIVERY_OVER) * 100)}%` }}
                  />
                </div>
              </>
            ) : (
              <p className="flex items-center gap-1.5 text-[11px] font-bold text-save-500">
                <BoltIcon className="h-3 w-3" /> Free delivery unlocked
              </p>
            )}
          </div>

          {/* Lines */}
          <ul className="thin-scrollbar min-h-0 flex-1 divide-y divide-ink-100 overflow-y-auto px-4">
            {lines.map((line) => (
              <li key={line.key} className="flex gap-3 py-3">
                <Link
                  href={`/product/${line.slug}`}
                  onClick={closeCart}
                  className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-ink-50"
                >
                  <Image src={line.image} alt="" fill sizes="64px" className="object-contain p-1.5" />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <Link
                    href={`/product/${line.slug}`}
                    onClick={closeCart}
                    className="line-clamp-2 text-[13px] font-medium leading-snug text-ink-900 hover:text-brand-700"
                  >
                    {line.name}
                  </Link>
                  <p className="mt-0.5 text-[11px] text-ink-500">{line.variantLabel}</p>

                  <div className="mt-auto flex items-end justify-between gap-2 pt-1.5">
                    <div>
                      <p className="text-[13px] font-bold leading-tight text-ink-900">
                        {inr(line.price * line.qty)}
                      </p>
                      {line.mrp > line.price && (
                        <p className="text-[11px] leading-tight text-ink-400 line-through">
                          {inr(line.mrp * line.qty)}
                        </p>
                      )}
                    </div>

                    <div className="flex h-8 items-stretch overflow-hidden rounded-lg bg-accent-500 text-white">
                      <button
                        type="button"
                        onClick={() =>
                          line.qty === 1 ? removeItem(line.key) : setQty(line.key, line.qty - 1)
                        }
                        aria-label={line.qty === 1 ? `Remove ${line.name}` : `Decrease ${line.name}`}
                        className="flex w-7 items-center justify-center transition-colors hover:bg-accent-600"
                      >
                        {line.qty === 1 ? (
                          <TrashIcon className="h-3.5 w-3.5" />
                        ) : (
                          <MinusIcon className="h-3 w-3" />
                        )}
                      </button>
                      <span className="flex w-7 items-center justify-center text-xs font-bold tabular-nums">
                        {line.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQty(line.key, line.qty + 1)}
                        aria-label={`Increase ${line.name}`}
                        className="flex w-7 items-center justify-center transition-colors hover:bg-accent-600"
                      >
                        <PlusIcon className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Bill */}
          <div className="border-t border-ink-100 px-4 py-3">
            <dl className="flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between text-ink-700">
                <dt>Item total</dt>
                <dd className="tabular-nums">{inr(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-ink-700">
                <dt>Delivery fee</dt>
                <dd className="tabular-nums">
                  {deliveryFee === 0 ? (
                    <span className="font-semibold text-save-500">FREE</span>
                  ) : (
                    inr(deliveryFee)
                  )}
                </dd>
              </div>
              <div className="flex justify-between text-ink-700">
                <dt>Handling charge</dt>
                <dd className="tabular-nums">{inr(handling)}</dd>
              </div>
              <div className="mt-1.5 flex justify-between border-t border-dashed border-ink-200 pt-2 text-[15px] font-bold text-ink-900">
                <dt>To pay</dt>
                <dd className="tabular-nums">{inr(total)}</dd>
              </div>
            </dl>
            {savings > 0 && (
              <p className="mt-2 rounded-lg bg-save-50 px-2.5 py-1.5 text-center text-[11px] font-bold text-save-500">
                You save {inr(savings)} on this order
              </p>
            )}
          </div>

          {/* CTA */}
          <div className="border-t border-ink-100 px-4 pb-[max(0.875rem,env(safe-area-inset-bottom))] pt-3">
            <Link
              href="/checkout"
              onClick={closeCart}
              className="flex h-12 items-center justify-between rounded-xl bg-accent-500 px-4 text-white transition-colors hover:bg-accent-600"
            >
              <span className="flex flex-col items-start leading-tight">
                <span className="text-[15px] font-bold tabular-nums">{inr(total)}</span>
                <span className="text-[10px] text-white/80">TOTAL</span>
              </span>
              <span className="text-sm font-bold">Proceed to checkout →</span>
            </Link>
          </div>
        </>
      )}
    </Sheet>
  );
}
