"use client";

import type { Product } from "@/data/catalog";
import { useCart } from "@/context/CartContext";
import { useVariantModal } from "@/context/VariantModalContext";
import { MinusIcon, PlusIcon } from "./icons";

type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, { box: string; text: string; icon: string; step: string }> = {
  sm: { box: "h-8 w-[4.5rem]", text: "text-xs", icon: "h-3 w-3", step: "w-7" },
  md: { box: "h-9 w-[5.25rem]", text: "text-sm", icon: "h-3.5 w-3.5", step: "w-8" },
  lg: { box: "h-12 w-full", text: "text-base", icon: "h-4 w-4", step: "w-12" },
};

type Props = {
  product: Product;
  size?: Size;
  /** Force the multi-pack modal even for single-pack products (used on the detail page). */
  className?: string;
};

/**
 * Zepto-style ADD control.
 *
 * - Product has multiple packs → opens the pack modal so the customer picks one.
 * - Single pack → adds straight to cart and turns into a −/qty/+ stepper.
 *
 * For multi-pack products the stepper shows the *total across all packs* and the
 * + button reopens the modal, so quantities of different packs never get conflated.
 */
export function AddToCartButton({ product, size = "md", className = "" }: Props) {
  const { addItem, qtyOfProduct, qtyOfVariant, setQty, lineKey, maxQty } = useCart();
  const { openVariants } = useVariantModal();
  const s = SIZES[size];

  const totalQty = qtyOfProduct(product.id);
  const defaultVariant =
    product.variants.find((v) => v.id === product.defaultVariantId) ?? product.variants[0];

  if (!product.inStock) {
    return (
      <span
        className={`${s.box} ${s.text} flex items-center justify-center rounded-lg border border-ink-200 font-semibold text-ink-400 ${className}`}
      >
        Sold out
      </span>
    );
  }

  // Nothing in the cart yet → plain ADD.
  if (totalQty === 0) {
    return (
      <button
        type="button"
        onClick={() => (product.hasPacks ? openVariants(product) : addItem(product, defaultVariant))}
        aria-label={
          product.hasPacks ? `Choose a pack of ${product.name}` : `Add ${product.name} to cart`
        }
        className={`${s.box} ${s.text} relative flex items-center justify-center rounded-lg border border-accent-500 bg-accent-50 font-bold uppercase tracking-wide text-accent-500 transition-all duration-150 hover:bg-accent-100 active:scale-95 ${className}`}
      >
        Add
        {product.hasPacks && (
          <span className="absolute -bottom-[7px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-white px-1 text-[8px] font-semibold tracking-normal text-ink-400">
            {product.variants.length} options
          </span>
        )}
      </button>
    );
  }

  // In cart → stepper.
  const singleKey = lineKey(product.id, defaultVariant.id);
  const singleQty = qtyOfVariant(product.id, defaultVariant.id);

  const decrease = () => {
    if (product.hasPacks) {
      openVariants(product);
      return;
    }
    setQty(singleKey, singleQty - 1);
  };

  const increase = () => {
    if (product.hasPacks) {
      openVariants(product);
      return;
    }
    setQty(singleKey, singleQty + 1);
  };

  return (
    <div
      className={`${s.box} ${s.text} flex items-stretch overflow-hidden rounded-lg bg-accent-500 font-bold text-white ${className}`}
    >
      <button
        type="button"
        onClick={decrease}
        aria-label={product.hasPacks ? `Edit packs of ${product.name}` : `Remove one ${product.name}`}
        className={`${s.step} flex shrink-0 items-center justify-center transition-colors hover:bg-accent-600 active:bg-accent-700`}
      >
        <MinusIcon className={s.icon} />
      </button>
      <span
        key={totalQty}
        aria-live="polite"
        className="flex flex-1 animate-[bump_0.32s_cubic-bezier(0.16,1,0.3,1)] items-center justify-center tabular-nums"
      >
        {totalQty}
      </span>
      <button
        type="button"
        onClick={increase}
        disabled={totalQty >= maxQty && !product.hasPacks}
        aria-label={product.hasPacks ? `Add another pack of ${product.name}` : `Add one more ${product.name}`}
        className={`${s.step} flex shrink-0 items-center justify-center transition-colors hover:bg-accent-600 active:bg-accent-700 disabled:opacity-50`}
      >
        <PlusIcon className={s.icon} />
      </button>
    </div>
  );
}
