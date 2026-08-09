import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Collapsible } from "@/components/Collapsible";
import { ProductBuyBox } from "@/components/ProductBuyBox";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductRail } from "@/components/ProductRail";
import { ChevronRight, StarIcon } from "@/components/icons";
import { getCategoryBySlug, getProductBySlug, getProductsByCategory } from "@/lib/catalog";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.description,
    openGraph: product.image ? { images: [product.image] } : undefined,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [category, categoryProducts] = await Promise.all([
    getCategoryBySlug(product.category),
    getProductsByCategory(product.category),
  ]);
  const similar = categoryProducts.filter((p) => p.id !== product.id).slice(0, 12);

  const highlights = [
    ["Brand", product.brand],
    ["Pack size", product.unit],
    ["Availability", product.inStock ? `In stock (${product.stock} left)` : "Out of stock"],
    ["Return policy", product.returnPolicy ?? "Non-returnable"],
    ["Warranty", product.warranty ?? "Not applicable"],
  ].filter(([, value]) => Boolean(value)) as [string, string][];

  return (
    <div className="mx-auto max-w-[1400px] px-3 pt-3 sm:px-4 lg:px-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[11px] text-ink-500">
        <Link href="/" className="hover:text-ink-900">
          Home
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0" />
        {category && (
          <>
            <Link href={`/category/${category.slug}`} className="truncate hover:text-ink-900">
              {category.name}
            </Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
          </>
        )}
        <span className="truncate font-semibold text-ink-900">{product.name}</span>
      </nav>

      {/* Main: gallery + buy box */}
      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
        <div className="lg:sticky lg:top-[6rem] lg:self-start">
          <ProductGallery images={product.images} name={product.name} />
        </div>

        <div className="min-w-0">
          <h1 className="text-xl font-bold leading-snug text-ink-900 sm:text-2xl">
            {product.name}
          </h1>

          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-ink-500">
            <span className="rounded bg-accent-50 px-1.5 py-0.5 text-[11px] font-bold text-accent-500">
              {product.unit}
            </span>
            <span>{product.brand}</span>
            {product.rating > 0 && (
              <span className="flex items-center gap-0.5 rounded bg-save-50 px-1.5 py-0.5 font-semibold text-save-500">
                <StarIcon className="h-2.5 w-2.5" />
                {product.rating.toFixed(1)}
                <span className="font-normal text-save-600">
                  ({product.reviews.length} review{product.reviews.length === 1 ? "" : "s"})
                </span>
              </span>
            )}
          </div>

          <hr className="my-4 border-ink-100" />

          <ProductBuyBox product={product} />

          {/* Collapsed by default — the buy decision shouldn't sit under a wall of text */}
          <div className="mt-6">
            <Collapsible title="Product details">
              <dl className="overflow-hidden rounded-xl border border-ink-100">
                {highlights.map(([label, value], i) => (
                  <div
                    key={label}
                    className={`grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3 px-3 py-2.5 text-[13px] sm:grid-cols-[9rem_minmax(0,1fr)] ${
                      i % 2 ? "bg-white" : "bg-ink-50"
                    }`}
                  >
                    <dt className="text-ink-500">{label}</dt>
                    <dd className="font-medium text-ink-900">{value}</dd>
                  </div>
                ))}
              </dl>
            </Collapsible>

            <Collapsible title="About this product">
              <p className="text-[13px] leading-relaxed text-ink-700">{product.description}</p>
              {product.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {product.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-ink-100 px-2.5 py-1 text-[11px] font-medium text-ink-700"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </Collapsible>

            {product.reviews.length > 0 && (
              <Collapsible
                title="Customer reviews"
                meta={`(${product.reviews.length})`}
              >
                <ul className="flex flex-col gap-3">
                  {product.reviews.map((r, i) => (
                    <li
                      key={`${r.reviewerName}-${i}`}
                      className="rounded-xl border border-ink-100 p-3.5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                          {r.reviewerName.slice(0, 1).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-ink-900">
                            {r.reviewerName}
                          </p>
                          <p
                            className="flex items-center gap-0.5"
                            aria-label={`${r.rating} out of 5`}
                          >
                            {Array.from({ length: 5 }, (_, s) => (
                              <StarIcon
                                key={s}
                                className={`h-2.5 w-2.5 ${
                                  s < r.rating ? "text-save-500" : "text-ink-200"
                                }`}
                              />
                            ))}
                          </p>
                        </div>
                      </div>
                      <p className="mt-2.5 text-[13px] leading-relaxed text-ink-700">{r.comment}</p>
                    </li>
                  ))}
                </ul>
              </Collapsible>
            )}
          </div>
        </div>
      </div>

      {/* Similar */}
      {similar.length > 0 && (
        <div className="mt-6 border-t border-ink-100 pt-2">
          <ProductRail
            title="Similar products"
            href={category ? `/category/${category.slug}` : undefined}
            products={similar}
          />
        </div>
      )}
    </div>
  );
}
