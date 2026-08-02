"use client";

import { useState } from "react";
import type { Product } from "@/data/catalog";
import { useCart } from "@/context/CartContext";
import { inr, unitPrice } from "@/lib/format";
import { BoltIcon, MinusIcon, PlusIcon } from "./icons";

/**
 * Detail-page purchase panel. Packs are laid out inline here (there's room for them),
 * so the modal isn't needed on this screen.
 */
export function ProductBuyBox({ product }: { product: Product }) {
  const { addItem, qtyOfVariant, setQty, lineKey, openCart, maxQty } = useCart();
  const [selectedId, setSelectedId] = useState(product.defaultVariantId);

  const selected = product.variants.find((v) => v.id === selectedId) ?? product.variants[0];
  const key = lineKey(product.id, selected.id);
  const inCart = qtyOfVariant(product.id, selected.id);
  const saved = selected.mrp - selected.price;

  return (
    <div className="flex flex-col">
      {/* Pack pills */}
      {product.variants.length > 1 && (
        <fieldset className="mb-5">
          <legend className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-400">
            Select pack
          </legend>
          <div className="flex flex-wrap gap-2.5">
            {product.variants.map((v) => {
              const isSelected = v.id === selected.id;
              const per = unitPrice(v.price, v.unit);
              return (
                <div key={v.id} className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    disabled={!v.inStock}
                    onClick={() => setSelectedId(v.id)}
                    className={`rounded-xl border px-3.5 py-2 text-[13px] font-bold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${
                      isSelected
                        ? "border-ink-900 bg-ink-900 text-white"
                        : "border-ink-200 bg-white text-ink-700 hover:border-ink-900"
                    }`}
                  >
                    {v.label}
                  </button>
                  {per && <span className="text-[10px] text-ink-400">({per})</span>}
                </div>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* Price */}
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
      <p className="mt-1 text-[11px] text-ink-500">Inclusive of all taxes</p>

      {saved > 0 && (
        <p className="mt-2.5 w-fit rounded-lg bg-save-50 px-2.5 py-1 text-[11px] font-bold text-save-500">
          You save {inr(saved)}
        </p>
      )}

      {/* Actions */}
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {inCart === 0 ? (
          <button
            type="button"
            onClick={() => addItem(product, selected)}
            disabled={!selected.inStock}
            className="flex h-11 items-center justify-center rounded-xl border-2 border-accent-500 bg-white text-[13px] font-bold uppercase tracking-wide text-accent-500 transition-colors hover:bg-accent-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:border-ink-200 disabled:text-ink-400"
          >
            {selected.inStock ? "Add to cart" : "Sold out"}
          </button>
        ) : (
          <div className="flex h-11 items-stretch overflow-hidden rounded-xl bg-accent-500 text-white">
            <button
              type="button"
              onClick={() => setQty(key, inCart - 1)}
              aria-label="Decrease quantity"
              className="flex w-10 shrink-0 items-center justify-center transition-colors hover:bg-accent-600"
            >
              <MinusIcon className="h-3.5 w-3.5" />
            </button>
            <span className="flex flex-1 items-center justify-center text-[13px] font-bold tabular-nums">
              {inCart}
            </span>
            <button
              type="button"
              onClick={() => setQty(key, inCart + 1)}
              disabled={inCart >= maxQty}
              aria-label="Increase quantity"
              className="flex w-10 shrink-0 items-center justify-center transition-colors hover:bg-accent-600 disabled:opacity-50"
            >
              <PlusIcon className="h-3.5 w-3.5" />
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
          className="flex h-11 items-center justify-center rounded-xl bg-accent-500 text-[13px] font-bold uppercase tracking-wide text-white transition-colors hover:bg-accent-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-ink-200"
        >
          Buy now
        </button>
      </div>

      {/* Delivery */}
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
