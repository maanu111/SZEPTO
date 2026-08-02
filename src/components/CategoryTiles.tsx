import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/data/catalog";

/** Category grid — compact, image sits directly on the page with no tile background. */
export function CategoryTiles({ items }: { items: Category[] }) {
  return (
    <div className="grid grid-cols-4 gap-x-2 gap-y-3 sm:grid-cols-6 sm:gap-x-3 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12">
      {items.map((c) => (
        <Link
          key={c.slug}
          href={`/category/${c.slug}`}
          className="group flex flex-col items-center gap-1"
        >
          <span className="relative aspect-square w-full max-w-[3.75rem] sm:max-w-[4.25rem]">
            {c.image && (
              <Image
                src={c.image}
                alt=""
                fill
                sizes="68px"
                className="object-contain transition-transform duration-200 group-hover:scale-110"
              />
            )}
          </span>
          <span className="line-clamp-2 text-center text-[10px] font-medium leading-tight text-ink-700 sm:text-[11px]">
            {c.short}
          </span>
        </Link>
      ))}
    </div>
  );
}
