"use client";

import { useState } from "react";
import type { Product } from "@/data/catalog";
import { useCart } from "@/context/CartContext";
import { inr } from "@/lib/format";
import { BoltIcon, CheckIcon, MinusIcon, PlusIcon } from "./icons";

/**
 * Detail-page purchase panel. Packs are laid out inline here (there's room for them),
 * so the modal isn't needed on this screen.
 */
export function ProductBuyBox({ product }: { product: Product }) {
  const { addItem, qtyOfVariant, setQty, lineKey, openCart, maxQty } = useCart();
  const [selectedId, setSelectedId] = useState(product.defaultVariantId);

  const selected =
    product.variants.find((v) => v.id === selectedId) ?? product.variants[0];
  const key = lineKey(product.id, selected.id);
  const inCart = qtyOfVariant(product.id, selected.id);
  const saved = selected.mrp - selected.price;

  return (
    <div className="flex flex-col">
      {/* Price block */}
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="text-2xl font-extrabold text-ink-900">{inr(selected.price)}</span>
        {selected.mrp > selected.price && (
          <>
            <span className="text-base text-ink-400 line-through">{inr(selected.mrp)}</span>
            <span className="rounded bg-save-50 px-1.5 py-0.5 text-xs font-bold text-save-500">
              {selected.discountPct}% OFF
            </span>
          </>
        )}
      </div>
      <p className="mt-1 text-xs text-ink-500">Inclusive of all taxes</p>

      {/* Pack picker */}
      {product.variants.length > 1 && (
        <fieldset className="mt-5">
          <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-400">
            Select pack &middot; {product.variants.length} options
          </legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {product.variants.map((v) => {
              const isSelected = v.id === selected.id;
              const already = qtyOfVariant(product.id, v.id);
              return (
                <button
                  key={v.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={!v.inStock}
                  onClick={() => setSelectedId(v.id)}
                  className={`relative flex flex-col items-start rounded-xl border p-2.5 text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
                    isSelected
                      ? "border-accent-500 bg-accent-50 ring-1 ring-accent-500"
                      : "border-ink-200 hover:border-ink-400"
                  }`}
                >
                  {isSelected && (
                    <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent-500 text-white">
                      <CheckIcon className="h-2.5 w-2.5" strokeWidth={3.5} />
                    </span>
                  )}
                  <span className="text-[13px] font-semibold text-ink-900">{v.label}</span>
                  <span className="mt-0.5 text-sm font-bold text-ink-900">{inr(v.price)}</span>
                  {v.mrp > v.price && (
                    <span className="text-[11px] text-ink-400 line-through">{inr(v.mrp)}</span>
                  )}
                  {already > 0 && (
                    <span className="mt-1 rounded bg-ink-100 px-1.5 py-px text-[9px] font-bold text-ink-500">
                      {already} IN CART
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* Actions */}
      <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
        {inCart === 0 ? (
          <button
            type="button"
            onClick={() => addItem(product, selected)}
            disabled={!selected.inStock}
            className="flex h-12 flex-1 items-center justify-center rounded-xl bg-accent-500 text-sm font-bold text-white transition-colors hover:bg-accent-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-ink-200"
          >
            {selected.inStock ? "Add to cart" : "Sold out"}
          </button>
        ) : (
          <div className="flex h-12 flex-1 items-stretch overflow-hidden rounded-xl bg-accent-500 text-white">
            <button
              type="button"
              onClick={() => setQty(key, inCart - 1)}
              aria-label="Decrease quantity"
              className="flex w-12 items-center justify-center transition-colors hover:bg-accent-600"
            >
              <MinusIcon className="h-4 w-4" />
            </button>
            <span className="flex flex-1 items-center justify-center text-sm font-bold tabular-nums">
              {inCart} in cart
            </span>
            <button
              type="button"
              onClick={() => setQty(key, inCart + 1)}
              disabled={inCart >= maxQty}
              aria-label="Increase quantity"
              className="flex w-12 items-center justify-center transition-colors hover:bg-accent-600 disabled:opacity-50"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            if (inCart === 0) addItem(product, selected);
            openCart();
          }}
          disabled={!selected.inStock}
          className="flex h-12 flex-1 items-center justify-center rounded-xl border border-accent-500 text-sm font-bold text-accent-500 transition-colors hover:bg-accent-50 disabled:cursor-not-allowed disabled:border-ink-200 disabled:text-ink-400"
        >
          Buy now
        </button>
      </div>

      {saved > 0 && (
        <p className="mt-2.5 rounded-lg bg-save-50 px-3 py-2 text-xs font-semibold text-save-500">
          You save {inr(saved)} on this pack
        </p>
      )}

      {/* Delivery promise */}
      <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-ink-100 bg-ink-50 px-3 py-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          <BoltIcon className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-bold leading-tight text-ink-900">Delivery</p>
          <p className="text-[11px] leading-tight text-ink-500">
            {product.shipping ?? "Free delivery on orders over ₹499"}
          </p>
        </div>
      </div>
    </div>
  );
}
