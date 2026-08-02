"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Category } from "@/data/catalog";
import { ChevronLeft, ChevronRight } from "./icons";

/**
 * Inline, horizontally scrollable category strip.
 *
 * Scrollability is signalled three ways so it's never a hidden interaction:
 * a slim always-visible scrollbar, edge fades, and arrow buttons on pointer devices.
 */
export function CategoryScroller({ items }: { items: Category[] }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  const sync = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
    setOverflowing(el.scrollWidth > el.clientWidth + 4);
  }, []);

  useEffect(() => {
    sync();
    const el = railRef.current;
    if (!el) return;
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => observer.disconnect();
  }, [sync, items.length]);

  const scrollBy = (direction: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.max(el.clientWidth * 0.7, 200), behavior: "smooth" });
  };

  return (
    <div className="relative">
      {/* Edge fades hint at more content in both directions */}
      {overflowing && !atStart && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-white to-transparent"
        />
      )}
      {overflowing && !atEnd && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-white to-transparent"
        />
      )}

      <div
        ref={railRef}
        onScroll={sync}
        className="category-rail flex gap-3 overflow-x-auto pb-2.5 sm:gap-4"
      >
        {items.map((c) => (
          <Link
            key={c.slug}
            href={`/category/${c.slug}`}
            className="group flex w-[4.25rem] shrink-0 flex-col items-center gap-1.5 sm:w-20"
          >
            <span className="relative flex aspect-square w-full items-center justify-center transition-transform duration-200 group-hover:scale-105">
              {c.image && (
                <Image src={c.image} alt="" fill sizes="80px" className="object-contain" />
              )}
            </span>
            <span className="line-clamp-2 text-center text-[10px] font-medium leading-tight text-ink-700 sm:text-[11px]">
              {c.short}
            </span>
          </Link>
        ))}
      </div>

      {/* Arrows — pointer devices only; touch users get the scrollbar and fades */}
      {overflowing && (
        <>
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            disabled={atStart}
            aria-label="Scroll categories left"
            className="absolute -left-3 top-9 z-20 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-700 shadow-card transition-all hover:border-ink-400 disabled:opacity-30 disabled:hover:border-ink-200 lg:flex"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            disabled={atEnd}
            aria-label="Scroll categories right"
            className="absolute -right-3 top-9 z-20 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-700 shadow-card transition-all hover:border-ink-400 disabled:opacity-30 disabled:hover:border-ink-200 lg:flex"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
}
