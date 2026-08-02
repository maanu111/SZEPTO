import { CategoryScroller } from "@/components/CategoryScroller";
import { HeroCarousel } from "@/components/HeroCarousel";
import { ProductCard } from "@/components/ProductCard";
import { ProductRail } from "@/components/ProductRail";
import { categories, products, productsByCategory } from "@/data/catalog";

/**
 * Only a few category rails sit up top — enough to give the page shape without
 * turning the whole home page into an endless list of rails. Everything else
 * lands in the plain product grid below.
 */
const FEATURED_CATEGORIES = ["fruits-vegetables", "dairy-bread-eggs", "cold-drinks-juices"];

const RAIL_COPY: Record<string, { title: string; subtitle: string }> = {
  "fruits-vegetables": { title: "Fresh fruits & vegetables", subtitle: "Sourced this morning" },
  "dairy-bread-eggs": { title: "Dairy, bread & eggs", subtitle: "Your daily basket" },
  "cold-drinks-juices": { title: "Cold drinks & juices", subtitle: "Chilled and ready" },
};

export default function HomePage() {
  // Products already shown in a rail above shouldn't repeat in the grid below.
  const featuredIds = new Set(
    FEATURED_CATEGORIES.flatMap((slug) => productsByCategory(slug).map((p) => p.id))
  );
  const rest = products.filter((p) => !featuredIds.has(p.id));

  return (
    <div className="mx-auto max-w-[1400px] lg:px-6">
      {/* Hero banners */}
      <div className="px-3 pt-3 sm:px-4 lg:px-0">
        <HeroCarousel />
      </div>

      {/* Inline scrollable category strip, directly under the banners */}
      <section aria-label="Browse categories" className="px-3 pt-4 sm:px-4 lg:px-0">
        <CategoryScroller items={categories} />
      </section>

      <Divider />

      {/* A few category rails */}
      {FEATURED_CATEGORIES.map((slug) => {
        const items = productsByCategory(slug);
        if (!items.length) return null;
        const copy = RAIL_COPY[slug];
        return (
          <ProductRail
            key={slug}
            title={copy.title}
            subtitle={copy.subtitle}
            href={`/category/${slug}`}
            products={items}
            priority={slug === FEATURED_CATEGORIES[0]}
          />
        );
      })}

      <Divider />

      {/* Everything else, as a plain product grid */}
      <section className="px-3 pb-6 pt-2 sm:px-4 lg:px-0">
        <h2 className="mb-3 text-base font-bold text-ink-900 sm:text-lg">All products</h2>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {rest.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}

function Divider() {
  return <hr className="mx-3 my-3 border-ink-100 sm:mx-4 lg:mx-0" />;
}
