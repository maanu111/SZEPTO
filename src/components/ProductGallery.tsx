"use client";

import Image from "next/image";
import { useState } from "react";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const shots = images.length ? images : [];

  if (!shots.length) return null;

  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row">
      {/* Thumbnails */}
      {shots.length > 1 && (
        <div
          className="no-scrollbar flex shrink-0 gap-2 overflow-x-auto sm:flex-col sm:overflow-y-auto"
          role="tablist"
          aria-label={`${name} images`}
        >
          {shots.map((src, i) => (
            <button
              key={src}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Image ${i + 1} of ${shots.length}`}
              onClick={() => setActive(i)}
              className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border bg-ink-50 transition-colors sm:h-16 sm:w-16 ${
                i === active ? "border-brand-600 ring-1 ring-brand-600" : "border-ink-200 hover:border-ink-400"
              }`}
            >
              <Image src={src} alt="" fill sizes="64px" className="object-contain p-1" />
            </button>
          ))}
        </div>
      )}

      {/* Main image */}
      <div className="relative aspect-square flex-1 overflow-hidden rounded-xl border border-ink-100 bg-ink-50">
        <Image
          key={shots[active]}
          src={shots[active]}
          alt={name}
          fill
          sizes="(max-width: 1024px) 100vw, 480px"
          priority
          className="object-contain p-6"
        />
      </div>
    </div>
  );
}
