import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CategorySidebar } from "@/components/CategorySidebar";
import { ProductCard } from "@/components/ProductCard";
import { ChevronRight } from "@/components/icons";
import { getCategories, getCategoryBySlug, getProductsByCategory } from "@/lib/catalog";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Category not found" };
  return {
    title: category.name,
    description: `Buy ${category.name.toLowerCase()} online at Kiranaclick.`,
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [category, categories, items] = await Promise.all([
    getCategoryBySlug(slug),
    getCategories(),
    getProductsByCategory(slug),
  ]);

  if (!category) notFound();

  return (
    <div className="mx-auto max-w-[1400px] lg:px-6">
      <div className="flex items-stretch gap-0 lg:gap-5 lg:pt-4">
        <CategorySidebar categories={categories} activeSlug={slug} />

        <div className="min-w-0 flex-1 px-3 pt-3 sm:px-4 lg:px-0 lg:pt-0">
          <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1 text-[11px] text-ink-500">
            <Link href="/" className="hover:text-ink-900">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/category" className="hover:text-ink-900">
              Categories
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="truncate font-semibold text-ink-900">{category.name}</span>
          </nav>

          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h1 className="text-lg font-bold text-ink-900 sm:text-xl">{category.name}</h1>
            <span className="shrink-0 text-xs text-ink-500">
              {items.length} product{items.length === 1 ? "" : "s"}
            </span>
          </div>

          {items.length === 0 ? (
            <p className="rounded-xl border border-dashed border-ink-200 py-16 text-center text-sm text-ink-500">
              Nothing here yet.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 pb-6 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {items.map((p, i) => (
                <ProductCard key={p.id} product={p} priority={i < 6} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
