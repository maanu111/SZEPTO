import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/data/catalog";

/**
 * Grouped category panels: a titled card per group, with a 4-column grid of tiles.
 * Grouping comes from each category's panel heading, set in the admin dashboard.
 */
export function CategoryPanels({ categories }: { categories: Category[] }) {
  const order: string[] = [];
  const byGroup = new Map<string, Category[]>();

  for (const c of categories) {
    if (!byGroup.has(c.group)) {
      byGroup.set(c.group, []);
      order.push(c.group);
    }
    byGroup.get(c.group)!.push(c);
  }

  if (categories.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:items-start lg:gap-4">
      {order.map((group) => (
        <section key={group} className="rounded-2xl border border-ink-100 bg-white p-4">
          <h2 className="mb-3.5 text-base font-bold text-ink-900">{group}</h2>

          <div className="grid grid-cols-4 gap-x-2.5 gap-y-4">
            {byGroup.get(group)!.map((c) => (
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
