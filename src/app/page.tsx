import Link from "next/link";
import { CategoryScroller } from "@/components/CategoryScroller";
import { CategoryTiles } from "@/components/CategoryTiles";
import { HeroCarousel } from "@/components/HeroCarousel";
import { ProductRail } from "@/components/ProductRail";
import { categories, products, productsByCategory } from "@/data/catalog";

/** Rails shown on the home page, in order. */
const RAILS: { category: string; title: string; subtitle: string }[] = [
  { category: "fruits-vegetables", title: "Fresh fruits & vegetables", subtitle: "Sourced this morning" },
  { category: "dairy-bread-eggs", title: "Dairy, bread & eggs", subtitle: "Your daily basket" },
  { category: "cold-drinks-juices", title: "Cold drinks & juices", subtitle: "Chilled and ready" },
  { category: "kitchenware", title: "Kitchen & appliances", subtitle: "Everything for your kitchen" },
  { category: "beauty-personal-care", title: "Beauty & personal care", subtitle: "Top-rated picks" },
  { category: "meat-fish", title: "Meat & fish", subtitle: "Fresh cuts, cold chain delivered" },
  { category: "home-decor", title: "Home & decor", subtitle: "Small upgrades, big difference" },
];

export default function HomePage() {
  const bestDeals = [...products]
    .filter((p) => p.discountPct >= 10)
    .sort((a, b) => b.discountPct - a.discountPct)
    .slice(0, 12);

  const topRated = [...products].sort((a, b) => b.rating - a.rating).slice(0, 12);

  const multiPack = products.filter((p) => p.variants.length >= 3).slice(0, 12);

  return (
    <div className="mx-auto max-w-[1400px] lg:px-6">
      {/* Shop by category — above the banners */}
      <section className="px-3 pt-4 sm:px-4 lg:px-0">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-base font-bold text-ink-900 sm:text-lg">Shop by category</h2>
          <Link
            href="/category"
            className="text-xs font-bold text-accent-500 transition-colors hover:text-accent-600"
          >
            See all
          </Link>
        </div>
        <CategoryTiles items={categories} />
      </section>

      {/* Hero banners */}
      <div className="px-3 pt-5 sm:px-4 lg:px-0">
        <HeroCarousel />
      </div>

      {/* Inline scrollable category strip, directly under the banners */}
      <section aria-label="Browse categories" className="px-3 pt-4 sm:px-4 lg:px-0">
        <CategoryScroller items={categories} />
      </section>

      <Divider />

      <ProductRail
        title="Best deals of the day"
        subtitle="Biggest savings, while stocks last"
        products={bestDeals}
        priority
      />

      <ProductRail
        title="Buy bigger, save more"
        subtitle="Multiple pack sizes — pick what suits you"
        products={multiPack}
      />

      <Divider />

      {RAILS.map((rail) => {
        const items = productsByCategory(rail.category);
        if (!items.length) return null;
        return (
          <ProductRail
            key={rail.category}
            title={rail.title}
            subtitle={rail.subtitle}
            href={`/category/${rail.category}`}
            products={items}
          />
        );
      })}

      <Divider />

      <ProductRail title="Top rated by customers" subtitle="4★ and above" products={topRated} />
    </div>
  );
}

function Divider() {
  return <hr className="mx-3 my-3 border-ink-100 sm:mx-4 lg:mx-0" />;
}
