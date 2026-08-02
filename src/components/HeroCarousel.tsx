"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { productBySlug } from "@/data/catalog";

type Slide = {
  eyebrow: string;
  title: string;
  copy: string;
  cta: string;
  href: string;
  from: string;
  to: string;
  /** Real product photos, composited over the gradient. */
  productSlugs: string[];
};

const SLIDES: Slide[] = [
  {
    eyebrow: "Groceries, delivered fast",
    title: "Fresh fruits & vegetables",
    copy: "Handpicked every morning, at your door before you finish your chai.",
    cta: "Shop fresh",
    href: "/category/fruits-vegetables",
    from: "#0b6b19",
    to: "#63ac1f",
    productSlugs: ["apple", "strawberry", "green-bell-pepper"],
  },
  {
    eyebrow: "Save more on packs",
    title: "Up to 25% off on bigger packs",
    copy: "Bigger pack, better price. Compare pack sizes before you add to cart.",
    cta: "Browse deals",
    href: "/category/atta-rice-oil",
    from: "#5c1478",
    to: "#c9106c",
    productSlugs: ["rice", "cooking-oil", "honey-jar"],
  },
  {
    eyebrow: "Chilled & ready",
    title: "Cold drinks & ice creams",
    copy: "Straight from the freezer, delivered still frozen.",
    cta: "Cool down",
    href: "/category/cold-drinks-juices",
    from: "#0a4f96",
    to: "#2aa0d4",
    productSlugs: ["ice-cream", "soft-drinks", "juice"],
  },
];

const INTERVAL_MS = 5200;

export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => {
    if (paused) return stop();
    timer.current = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), INTERVAL_MS);
    return stop;
  }, [paused, stop]);

  return (
    <section
      aria-label="Offers"
      aria-roledescription="carousel"
      className="relative overflow-hidden rounded-2xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="relative h-44 sm:h-52 lg:h-60">
        {SLIDES.map((s, i) => {
          const shots = s.productSlugs
            .map((slug) => productBySlug(slug))
            .filter((p): p is NonNullable<typeof p> => Boolean(p));

          return (
            <div
              key={s.title}
              aria-hidden={i !== index}
              className={`absolute inset-0 transition-opacity duration-500 ${
                i === index ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
              style={{ background: `linear-gradient(115deg, ${s.from}, ${s.to})` }}
            >
              {/* Product photography */}
              <div className="pointer-events-none absolute inset-y-0 right-0 flex w-[46%] items-center justify-end pr-3 sm:w-[42%] sm:pr-6 lg:pr-10">
                {shots.map((p, n) => (
                  <div
                    key={p.id}
                    className={`relative aspect-square drop-shadow-2xl ${
                      n === 0
                        ? "z-30 h-[68%] sm:h-[74%]"
                        : n === 1
                          ? "z-20 -ml-5 h-[52%] sm:-ml-7 sm:h-[58%]"
                          : "z-10 -ml-5 hidden h-[44%] sm:-ml-7 sm:block sm:h-[48%]"
                    }`}
                  >
                    <Image
                      src={p.image}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 40vw, 220px"
                      priority={i === 0}
                      className="object-contain"
                    />
                  </div>
                ))}
              </div>

              {/* Copy — sits above the art, with a scrim so text stays legible */}
              <div className="relative z-40 flex h-full w-[62%] flex-col justify-center bg-gradient-to-r from-black/25 via-black/10 to-transparent px-5 sm:w-[60%] sm:px-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/80 sm:text-[11px]">
                  {s.eyebrow}
                </p>
                <h2 className="mt-1 max-w-md text-lg font-extrabold leading-tight text-white drop-shadow-sm sm:text-2xl lg:text-[1.75rem]">
                  {s.title}
                </h2>
                <p className="mt-1 hidden max-w-sm text-xs text-white/90 sm:block sm:text-sm">
                  {s.copy}
                </p>
                <Link
                  href={s.href}
                  tabIndex={i === index ? 0 : -1}
                  className="mt-3 w-fit rounded-lg bg-white px-4 py-2 text-xs font-bold text-ink-900 transition-transform hover:scale-105 sm:text-sm"
                >
                  {s.cta}
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-3 left-5 z-50 flex gap-1.5 sm:left-8">
        {SLIDES.map((s, i) => (
          <button
            key={s.title}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Show offer ${i + 1}: ${s.title}`}
            aria-current={i === index}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === index ? "w-5 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
