import Link from "next/link";
import { getFooterGroups } from "@/lib/pages";

/** Footer columns are whatever the admin has published under each heading. */
export async function SiteFooter() {
  const groups = await getFooterGroups();

  return (
    <footer className="mt-8 border-t border-ink-100 bg-ink-50 pb-[calc(9rem+env(safe-area-inset-bottom))] sm:pb-24 lg:pb-0">
      <div className="mx-auto max-w-[1400px] px-4 py-8 lg:px-6">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <p className="text-lg font-extrabold text-brand-800">SZepto</p>
          </div>

          {groups.map((group) => (
            <div key={group.group}>
              <p className="text-xs font-bold uppercase tracking-wide text-ink-900">
                {group.group}
              </p>
              <ul className="mt-2.5 flex flex-col gap-1.5">
                {group.links.map((link) => (
                  <li key={link.slug}>
                    <Link
                      href={`/p/${link.slug}`}
                      className="text-xs text-ink-500 transition-colors hover:text-ink-900"
                    >
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
