"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Product } from "@/data/catalog";
import { ProductCard } from "./ProductCard";
import { ChevronLeft, ChevronRight } from "./icons";

type Props = {
  title: string;
  subtitle?: string;
  href?: string;
  products: Product[];
  priority?: boolean;
};

/** Horizontally scrolling product row. Arrows appear on desktop only; touch just swipes. */
export function ProductRail({ title, subtitle, href, products, priority = false }: Props) {
  const railRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const syncArrows = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    syncArrows();
    const el = railRef.current;
    if (!el) return;
    const observer = new ResizeObserver(syncArrows);
    observer.observe(el);
    return () => observer.disconnect();
  }, [syncArrows, products.length]);

  const scrollBy = (direction: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.max(el.clientWidth * 0.8, 200), behavior: "smooth" });
  };

  if (!products.length) return null;

  return (
    <section className="py-3">
      <div className="mb-3 flex items-end justify-between gap-3 px-3 sm:px-4 lg:px-0">
        <div className="min-w-0">
          <h2 className="truncate text-base font-bold text-ink-900 sm:text-lg">{title}</h2>
          {subtitle && <p className="mt-0.5 truncate text-xs text-ink-500">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {href && (
            <Link
              href={href}
              className="text-xs font-bold text-accent-500 transition-colors hover:text-accent-600"
            >
              See all
            </Link>
          )}
          <div className="hidden items-center gap-1.5 lg:flex">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              disabled={atStart}
              aria-label={`Scroll ${title} left`}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-ink-200 text-ink-700 transition-all hover:border-ink-400 disabled:opacity-30 disabled:hover:border-ink-200"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              disabled={atEnd}
              aria-label={`Scroll ${title} right`}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-ink-200 text-ink-700 transition-all hover:border-ink-400 disabled:opacity-30 disabled:hover:border-ink-200"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={railRef}
        onScroll={syncArrows}
        className="no-scrollbar flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-3 pb-1 sm:gap-3 sm:px-4 lg:px-0"
      >
        {products.map((p, i) => (
          <div key={p.id} className="snap-start">
            <ProductCard product={p} variant="rail" priority={priority && i < 4} />
          </div>
        ))}
      </div>
    </section>
  );
}
