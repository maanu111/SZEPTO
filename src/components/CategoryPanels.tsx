import Image from "next/image";
import Link from "next/link";
import { categoryBySlug, type Category } from "@/data/catalog";

/**
 * Grouped category panels: a titled white card per group, with a fixed 4-column grid of
 * tiles inside. Every category is visible at once — nothing hidden behind a slider.
 */
const GROUPS: { title: string; slugs: string[] }[] = [
  {
    title: "Grocery & Kitchen",
    slugs: [
      "fruits-vegetables",
      "dairy-bread-eggs",
      "atta-rice-oil",
      "meat-fish",
      "cold-drinks-juices",
      "tea-coffee-health",
      "ice-cream-desserts",
    ],
  },
  {
    title: "Household & Lifestyle",
    slugs: ["beauty-personal-care", "home-cleaning", "kitchenware", "home-decor", "pet-care"],
  },
];

export function CategoryPanels() {
  const groups = GROUPS.map((g) => ({
    title: g.title,
    items: g.slugs.map((slug) => categoryBySlug(slug)).filter((c): c is Category => Boolean(c)),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:items-start lg:gap-4">
      {groups.map((group) => (
        <section key={group.title} className="rounded-2xl border border-ink-100 bg-white p-4">
          <h2 className="mb-3.5 text-base font-bold text-ink-900">{group.title}</h2>

          <div className="grid grid-cols-4 gap-x-2.5 gap-y-4">
            {group.items.map((c) => (
              <Link
                key={c.slug}
                href={`/category/${c.slug}`}
                className="group flex flex-col items-center gap-2"
              >
                <span className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-[#f6f4f9] transition-colors group-hover:bg-ink-100">
                  {c.image && (
                    <Image
                      src={c.image}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 22vw, 130px"
                      className="object-contain p-2.5 transition-transform duration-200 group-hover:scale-105"
                    />
                  )}
                </span>
                {/* Full category name, wrapped — matches the reference layout */}
                <span className="line-clamp-2 text-center text-[11px] font-medium leading-tight text-ink-900">
                  {c.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
