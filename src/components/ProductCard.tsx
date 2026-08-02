"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/data/catalog";
import { inr } from "@/lib/format";
import { AddToCartButton } from "./AddToCartButton";
import { BoltIcon, StarIcon } from "./icons";

type Props = {
  product: Product;
  /** Rail cards get a fixed width; grid cards stretch to the column. */
  variant?: "grid" | "rail";
  priority?: boolean;
};

export function ProductCard({ product, variant = "grid", priority = false }: Props) {
  const width = variant === "rail" ? "w-[9.5rem] shrink-0 sm:w-[10.5rem]" : "w-full";
  const showDiscount = product.discountPct >= 5 && product.mrp > product.price;

  return (
    <div
      className={`${width} group relative flex flex-col rounded-xl border border-ink-100 bg-white p-2 transition-shadow duration-200 hover:shadow-card sm:p-2.5`}
    >
      {/* Image + discount flag */}
      <Link
        href={`/product/${product.slug}`}
        className="relative block aspect-square overflow-hidden rounded-lg bg-ink-50"
        tabIndex={-1}
        aria-hidden="true"
      >
        {showDiscount && (
          <span className="absolute left-0 top-0 z-10 rounded-br-lg rounded-tl-lg bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold leading-tight text-white">
            {product.discountPct}%
            <br />
            OFF
          </span>
        )}
        <Image
          src={product.image}
          alt=""
          fill
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 180px"
          priority={priority}
          className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
        />
      </Link>

      {/* Delivery time */}
      <p className="mt-2 flex items-center gap-0.5 text-[10px] font-semibold text-ink-500">
        <BoltIcon className="h-2.5 w-2.5 text-brand-500" />
        FAST
      </p>

      {/* Name */}
      <h3 className="mt-1">
        <Link
          href={`/product/${product.slug}`}
          className="line-clamp-2 text-[13px] font-medium leading-snug text-ink-900 outline-offset-2 hover:text-brand-700"
        >
          {product.name}
        </Link>
      </h3>

      {/* Unit + rating */}
      <div className="mt-1 flex items-center gap-1.5">
        <span className="rounded bg-accent-50 px-1.5 py-px text-[11px] font-bold text-accent-500">
          {product.unit}
        </span>
        {product.rating > 0 && (
          <span className="flex items-center gap-0.5 rounded bg-save-50 px-1 py-px text-[10px] font-semibold text-save-500">
            <StarIcon className="h-2 w-2" />
            {product.rating.toFixed(1)}
          </span>
        )}
      </div>

      {/* Price + ADD — mt-auto keeps this row baseline-aligned across a whole grid */}
      <div className="mt-auto flex items-end justify-between gap-1 pt-2">
        <div className="min-w-0">
          <p className="text-[13px] font-bold leading-tight text-ink-900">{inr(product.price)}</p>
          {product.mrp > product.price && (
            <p className="text-[11px] leading-tight text-ink-400 line-through">{inr(product.mrp)}</p>
          )}
        </div>
        <AddToCartButton product={product} size="sm" />
      </div>
    </div>
  );
}
