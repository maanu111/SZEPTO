"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import type { Category } from "@/data/catalog";

/**
 * Category rail beside the product grid.
 * Narrow icon rail on phones, full labelled list from `lg`.
 */
export function CategorySidebar({
  categories,
  activeSlug,
}: {
  categories: Category[];
  activeSlug: string;
}) {
  const activeRef = useRef<HTMLAnchorElement>(null);

  // Keep the selected category in view when arriving on a deep link.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [activeSlug]);

  return (
    <aside
      aria-label="Categories"
      className="sticky top-[6.5rem] z-10 h-[calc(100dvh-6.5rem)] w-[4.75rem] shrink-0 border-r border-ink-100 bg-white lg:top-[5.5rem] lg:h-[calc(100dvh-6.5rem)] lg:w-56 lg:rounded-xl lg:border lg:border-ink-100"
    >
      <p className="hidden border-b border-ink-100 px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-ink-400 lg:block">
        All categories
      </p>
      <nav className="thin-scrollbar h-full overflow-y-auto overscroll-contain pb-4 lg:h-[calc(100%-2.75rem)]">
        <ul className="flex flex-col lg:py-1.5">
          {categories.map((c) => {
            const active = c.slug === activeSlug;
            return (
              <li key={c.slug}>
                <Link
                  ref={active ? activeRef : undefined}
                  href={`/category/${c.slug}`}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex flex-col items-center gap-1 px-1.5 py-2.5 text-center transition-colors lg:flex-row lg:gap-2.5 lg:px-3 lg:py-2 lg:text-left ${
                    active ? "bg-brand-50 text-brand-800" : "text-ink-700 hover:bg-ink-50"
                  }`}
                >
                  <span
                    className={`absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r bg-brand-600 transition-opacity ${
                      active ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  <span
                    className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg lg:h-9 lg:w-9"
                    style={{ backgroundColor: c.tint }}
                  >
                    {c.image && (
                      <Image
                        src={c.image}
                        alt=""
                        fill
                        sizes="44px"
                        priority={active}
                        className="object-contain p-1.5"
                      />
                    )}
                  </span>
                  <span
                    className={`line-clamp-2 text-[10px] leading-tight lg:line-clamp-1 lg:text-[13px] ${
                      active ? "font-bold" : "font-medium"
                    }`}
                  >
                    <span className="lg:hidden">{c.short}</span>
                    <span className="hidden lg:inline">{c.name}</span>
                  </span>
                  <span className="ml-auto hidden text-[11px] tabular-nums text-ink-400 lg:inline">
                    {c.count}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
