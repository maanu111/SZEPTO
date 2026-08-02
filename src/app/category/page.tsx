import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ProductRail } from "@/components/ProductRail";
import { categories, productsByCategory } from "@/data/catalog";

export const metadata: Metadata = {
  title: "All categories",
  description: "Browse every category on SZepto — groceries, fresh produce, beauty and more.",
};

export default function CategoriesPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-3 pt-4 sm:px-4 lg:px-6">
      <h1 className="text-lg font-bold text-ink-900 sm:text-xl">All categories</h1>
      <p className="mt-0.5 text-xs text-ink-500">
        {categories.length} categories
      </p>

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

      <div className="mt-6 border-t border-ink-100">
        {categories.slice(0, 4).map((c) => (
          <ProductRail
            key={c.slug}
            title={c.name}
            href={`/category/${c.slug}`}
            products={productsByCategory(c.slug)}
          />
        ))}
      </div>
    </div>
  );
}
