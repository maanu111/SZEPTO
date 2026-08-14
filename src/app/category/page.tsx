import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getCategories } from "@/lib/catalog";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "All categories",
  description: "Browse every category on Kiranaclick.",
};

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-[1400px] px-3 pt-4 sm:px-4 lg:px-6">
      <h1 className="text-lg font-bold text-ink-900 sm:text-xl">All categories</h1>
      <p className="mt-0.5 text-xs text-ink-500">{categories.length} categories</p>

      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-6">
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`/category/${c.slug}`}
            className="group flex flex-col overflow-hidden rounded-xl border border-ink-100 transition-shadow hover:shadow-card"
          >
            <span
              className="relative flex aspect-[4/3] items-center justify-center"
              style={{ backgroundColor: c.tint }}
            >
              {c.image && (
                <Image
                  src={c.image}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 45vw, 220px"
                  className="object-contain p-4 transition-transform duration-300 group-hover:scale-110"
                />
              )}
            </span>
            <span className="flex flex-1 flex-col p-2.5">
              <span className="line-clamp-2 text-[13px] font-semibold leading-snug text-ink-900">
                {c.name}
              </span>
              <span className="mt-0.5 text-[11px] text-ink-500">{c.count} products</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
