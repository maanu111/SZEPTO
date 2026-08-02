"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Product, Variant } from "@/data/catalog";
import { useCart } from "@/context/CartContext";
import { inr } from "@/lib/format";
import { Sheet } from "./Sheet";
import { CheckIcon, CloseIcon, MinusIcon, PlusIcon } from "./icons";

type Props = {
  product: Product | null;
  open: boolean;
  onClose: () => void;
};

/** Cheapest per-unit variant gets the "BEST VALUE" flag. */
function bestValueId(variants: Variant[]): string | null {
  let best: { id: string; score: number } | null = null;
  for (const v of variants) {
    const magnitude = parseFloat(v.unit) || 1;
    const isKgOrLitre = /\b(kg|l)\b/i.test(v.unit);
    const normalised = magnitude * (isKgOrLitre ? 1000 : 1);
    const score = v.price / normalised;
    if (!best || score < best.score) best = { id: v.id, score };
  }
  return best?.id ?? null;
}

export function VariantModal({ product, open, onClose }: Props) {
  const { addItem, qtyOfVariant } = useCart();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

  // Reset the selection each time a new product opens the modal.
  useEffect(() => {
    if (open && product) {
      const frame = requestAnimationFrame(() => {
        setSelectedId(product.defaultVariantId);
        setQty(1);
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [open, product]);

  if (!product) return null;

  const selected =
    product.variants.find((v) => v.id === selectedId) ?? product.variants[0];
  const bestId = bestValueId(product.variants);
  const inCart = qtyOfVariant(product.id, selected.id);
  const lineTotal = selected.price * qty;
  const lineMrp = selected.mrp * qty;
  const saved = lineMrp - lineTotal;

  const confirm = () => {
    addItem(product, selected, qty);
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} labelledBy="variant-modal-title">
      {/* Header */}
      <div className="flex items-start gap-3 border-b border-ink-100 px-4 py-3.5 sm:px-5">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-ink-50">
          <Image
            src={product.image}
            alt=""
            fill
            sizes="56px"
            className="object-contain p-1.5"
          />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <h2
            id="variant-modal-title"
            className="line-clamp-2 text-[15px] font-semibold leading-snug text-ink-900"
          >
            {product.name}
          </h2>
          <p className="mt-0.5 text-xs text-ink-500">
            Select a pack &middot; {product.variants.length} options
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Options */}
      <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-5">
        <ul className="flex flex-col gap-2.5" role="radiogroup" aria-label="Pack size">
          {product.variants.map((v) => {
            const isSelected = v.id === selected.id;
            const already = qtyOfVariant(product.id, v.id);
            return (
              <li key={v.id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={!v.inStock}
                  onClick={() => {
                    setSelectedId(v.id);
                    setQty(1);
                  }}
                  className={`relative flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
                    isSelected
                      ? "border-accent-500 bg-accent-50 ring-1 ring-accent-500"
                      : "border-ink-200 bg-white hover:border-ink-400"
                  }`}
                >
                  {/* radio dot */}
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      isSelected ? "border-accent-500 bg-accent-500" : "border-ink-200"
                    }`}
                  >
                    {isSelected && <CheckIcon className="h-3 w-3 text-white" strokeWidth={3} />}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-semibold text-ink-900">{v.label}</span>
                      {v.id === bestId && product.variants.length > 1 && (
                        <span className="rounded bg-save-500 px-1.5 py-px text-[9px] font-bold tracking-wide text-white">
                          BEST VALUE
                        </span>
                      )}
                      {already > 0 && (
                        <span className="rounded bg-ink-100 px-1.5 py-px text-[9px] font-bold tracking-wide text-ink-500">
                          {already} IN CART
                        </span>
                      )}
                    </span>
                    <span className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-[15px] font-bold text-ink-900">{inr(v.price)}</span>
                      {v.mrp > v.price && (
                        <>
                          <span className="text-xs text-ink-400 line-through">{inr(v.mrp)}</span>
                          <span className="text-[11px] font-semibold text-save-500">
                            {v.discountPct}% OFF
                          </span>
                        </>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Footer: quantity + add */}
      <div className="border-t border-ink-100 bg-white px-4 pb-[max(0.875rem,env(safe-area-inset-bottom))] pt-3 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 items-center rounded-xl border border-ink-200">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              aria-label="Decrease quantity"
              className="flex h-full w-10 items-center justify-center rounded-l-xl text-ink-700 transition-colors hover:bg-ink-50 disabled:opacity-35 disabled:hover:bg-transparent"
            >
              <MinusIcon className="h-3.5 w-3.5" />
            </button>
            <span
              aria-live="polite"
              className="w-8 text-center text-sm font-bold tabular-nums text-ink-900"
            >
              {qty}
            </span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(15, q + 1))}
              disabled={qty >= 15}
              aria-label="Increase quantity"
              className="flex h-full w-10 items-center justify-center rounded-r-xl text-ink-700 transition-colors hover:bg-ink-50 disabled:opacity-35 disabled:hover:bg-transparent"
            >
              <PlusIcon className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={confirm}
            disabled={!selected.inStock}
            className="flex h-11 flex-1 items-center justify-between gap-2 rounded-xl bg-accent-500 px-4 text-white transition-colors hover:bg-accent-600 active:bg-accent-700 disabled:cursor-not-allowed disabled:bg-ink-200"
          >
            <span className="flex flex-col items-start leading-tight">
              <span className="text-[15px] font-bold tabular-nums">{inr(lineTotal)}</span>
              {saved > 0 && (
                <span className="text-[10px] font-medium text-white/80">
                  Saved {inr(saved)}
                </span>
              )}
            </span>
            <span className="text-sm font-bold">
              {inCart > 0 ? "Add more" : "Add to cart"}
            </span>
          </button>
        </div>
      </div>
    </Sheet>
  );
}
