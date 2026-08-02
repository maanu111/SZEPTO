"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Category } from "@/data/catalog";
import { ChevronLeft, ChevronRight } from "./icons";

/**
 * Inline, horizontally scrollable category strip.
 * Swipes on touch with a slim visible scrollbar; desktop also gets arrow controls.
 */
export function CategoryScroller({ items }: { items: Category[] }) {
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
  }, [syncArrows, items.length]);

  const scrollBy = (direction: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.max(el.clientWidth * 0.7, 200), behavior: "smooth" });
  };

  return (
    <div className="group/scroller relative">
      <div
        ref={railRef}
        onScroll={syncArrows}
        data-category-scroller
        className="no-scrollbar flex gap-2.5 overflow-x-auto pb-1 sm:gap-3.5"
      >
        {items.map((c) => (
          <Link
            key={c.slug}
            href={`/category/${c.slug}`}
            className="group flex w-[4.25rem] shrink-0 flex-col items-center gap-1.5 sm:w-[5rem]"
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

      {/* Desktop arrows */}
      <button
        type="button"
        onClick={() => scrollBy(-1)}
        aria-label="Scroll categories left"
        className={`absolute -left-3 top-[2.25rem] hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-700 shadow-card transition-opacity hover:border-ink-400 lg:flex ${
          atStart ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => scrollBy(1)}
        aria-label="Scroll categories right"
        className={`absolute -right-3 top-[2.25rem] hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-700 shadow-card transition-opacity hover:border-ink-400 lg:flex ${
          atEnd ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
