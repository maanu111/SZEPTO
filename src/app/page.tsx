import { CategoryPanels } from "@/components/CategoryPanels";
import { HeroCarousel } from "@/components/HeroCarousel";
import { ProductCard } from "@/components/ProductCard";
import { ProductRail } from "@/components/ProductRail";
import { getHomeData } from "@/lib/catalog";

export const revalidate = 60;

/** Only the first few categories get their own rail; the rest fall into the grid. */
const MAX_RAILS = 3;

export default async function HomePage() {
  const { categories, products, banners } = await getHomeData();

  const railCategories = categories.filter((c) => c.count > 0).slice(0, MAX_RAILS);
  const railSlugs = new Set(railCategories.map((c) => c.slug));
  const rest = products.filter((p) => !railSlugs.has(p.category));

  return (
    <div className="mx-auto max-w-[1400px] lg:px-6">
      <div className="px-3 pt-3 sm:px-4 lg:px-0">
        <HeroCarousel slides={banners} />
      </div>

      <section aria-label="Browse categories" className="px-3 pt-4 sm:px-4 lg:px-0">
        <CategoryPanels categories={categories} />
      </section>

      <Divider />

      {railCategories.map((category, i) => (
        <ProductRail
          key={category.slug}
          title={category.name}
          href={`/category/${category.slug}`}
          products={products.filter((p) => p.category === category.slug)}
          priority={i === 0}
        />
      ))}

      {rest.length > 0 && (
        <>
          <Divider />
          <section className="px-3 pb-6 pt-2 sm:px-4 lg:px-0">
            <h2 className="mb-3 text-base font-bold text-ink-900 sm:text-lg">All products</h2>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {rest.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        </>
      )}

      {products.length === 0 && (
        <div className="px-4 py-24 text-center">
          <p className="text-sm font-semibold text-ink-900">Catalog is empty</p>
          <p className="mt-1 text-xs text-ink-500">Add products from the admin dashboard.</p>
        </div>
      )}
    </div>
  );
}

function Divider() {
  return <hr className="mx-3 my-3 border-ink-100 sm:mx-4 lg:mx-0" />;
}
