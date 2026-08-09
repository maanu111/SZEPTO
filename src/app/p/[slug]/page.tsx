import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "@/components/icons";
import { getPage } from "@/lib/pages";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) return { title: "Page not found" };
  return {
    title: page.title,
    description: page.body.slice(0, 155),
  };
}

export default async function ContentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();

  // Blank lines separate paragraphs; a trailing colon reads as a sub-heading.
  const blocks = page.body
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-4 sm:px-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[11px] text-ink-500">
        <Link href="/" className="hover:text-ink-900">
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="truncate font-semibold text-ink-900">{page.title}</span>
      </nav>

      <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
        {page.title}
      </h1>

      <div className="mt-5 flex flex-col gap-4">
        {blocks.map((block, i) => {
          const lines = block.split("\n");
          const isHeading = lines.length > 1 && lines[0].length < 80 && !lines[0].endsWith(".");

          if (isHeading) {
            return (
              <section key={i}>
                <h2 className="text-[15px] font-bold text-ink-900">{lines[0]}</h2>
                <p className="mt-1 whitespace-pre-line text-[14px] leading-relaxed text-ink-700">
                  {lines.slice(1).join("\n")}
                </p>
              </section>
            );
          }

          return (
            <p key={i} className="whitespace-pre-line text-[14px] leading-relaxed text-ink-700">
              {block}
            </p>
          );
        })}

        {blocks.length === 0 && (
          <p className="text-[14px] text-ink-500">This page has no content yet.</p>
        )}
      </div>
    </div>
  );
}
