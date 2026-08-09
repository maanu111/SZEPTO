"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Banner } from "@/data/catalog";

const INTERVAL_MS = 5200;

export function HeroCarousel({ slides }: { slides: Banner[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => {
    if (paused || slides.length < 2) return stop();
    timer.current = setInterval(() => setIndex((i) => (i + 1) % slides.length), INTERVAL_MS);
    return stop;
  }, [paused, stop, slides.length]);

  if (slides.length === 0) return null;

  const active = Math.min(index, slides.length - 1);

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
      {/* Banner container — same dimensions the admin live-preview uses */}
      <div className="relative h-44 sm:h-52 lg:h-60">
        {slides.map((s, i) => (
          <div
            key={i}
            aria-hidden={i !== active}
            className={`absolute inset-0 transition-opacity duration-500 ${
              i === active ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            {s.imageUrl ? (
              /* ── Image-only banner ───────────────────────────────────── */
              <Link href={s.href || "/"} tabIndex={i === active ? 0 : -1} className="block h-full w-full">
                <Image
                  src={s.imageUrl}
                  alt={s.title || `Banner ${i + 1}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1400px"
                  priority={i === 0}
                  className={s.imageFit === "cover" ? "object-cover" : "object-contain"}
                />
              </Link>
            ) : (
              /* ── Legacy gradient + text banner ───────────────────────── */
              <div
                className="h-full w-full"
                style={{ background: `linear-gradient(115deg, ${s.from}, ${s.to})` }}
              >
                {/* Product photography */}
                <div className="pointer-events-none absolute inset-y-0 right-0 flex w-[46%] items-center justify-end pr-3 sm:w-[42%] sm:pr-6 lg:pr-10">
                  {s.images.slice(0, 3).map((src, n) => (
                    <div
                      key={src}
                      className={`relative aspect-square drop-shadow-2xl ${
                        n === 0
                          ? "z-30 h-[68%] sm:h-[74%]"
                          : n === 1
                          ? "z-20 -ml-5 h-[52%] sm:-ml-7 sm:h-[58%]"
                          : "z-10 -ml-5 hidden h-[44%] sm:-ml-7 sm:block sm:h-[48%]"
                      }`}
                    >
                      <Image
                        src={src}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 40vw, 220px"
                        priority={i === 0}
                        className="object-contain"
                      />
                    </div>
                  ))}
                </div>

                {/* Copy */}
                <div className="relative z-40 flex h-full w-[62%] flex-col justify-center bg-gradient-to-r from-black/25 via-black/10 to-transparent px-5 sm:w-[60%] sm:px-8">
                  {s.eyebrow && (
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/80 sm:text-[11px]">
                      {s.eyebrow}
                    </p>
                  )}
                  <h2 className="mt-1 max-w-md text-lg font-extrabold leading-tight text-white drop-shadow-sm sm:text-2xl lg:text-[1.75rem]">
                    {s.title}
                  </h2>
                  {s.copy && (
                    <p className="mt-1 hidden max-w-sm text-xs text-white/90 sm:block sm:text-sm">
                      {s.copy}
                    </p>
                  )}
                  <Link
                    href={s.href}
                    tabIndex={i === active ? 0 : -1}
                    className="mt-3 w-fit rounded-lg bg-white px-4 py-2 text-xs font-bold text-ink-900 transition-transform hover:scale-105 sm:text-sm"
                  >
                    {s.cta}
                  </Link>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Dot navigation */}
      {slides.length > 1 && (
        <div className="absolute bottom-3 left-5 z-50 flex gap-1.5 sm:left-8">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show slide ${i + 1}`}
              aria-current={i === active}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === active ? "w-5 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
