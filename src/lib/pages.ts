import { createServerClient } from "@/lib/supabase";

export type ContentPage = {
  slug: string;
  title: string;
  group: string;
  body: string;
};

export type FooterLink = { slug: string; title: string };
export type FooterGroup = { group: string; links: FooterLink[] };

export async function getPage(slug: string): Promise<ContentPage | null> {
  const supabase = createServerClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("pages")
    .select("slug, title, group_name, body")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!data) return null;
  return { slug: data.slug, title: data.title, group: data.group_name, body: data.body };
}

/** Footer columns, in the order the admin set. */
export async function getFooterGroups(): Promise<FooterGroup[]> {
  const supabase = createServerClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("pages")
    .select("slug, title, group_name, sort_order")
    .eq("is_active", true)
    .order("sort_order");

  const order: string[] = [];
  const byGroup = new Map<string, FooterLink[]>();

  for (const p of data ?? []) {
    if (!byGroup.has(p.group_name)) {
      byGroup.set(p.group_name, []);
      order.push(p.group_name);
    }
    byGroup.get(p.group_name)!.push({ slug: p.slug, title: p.title });
  }

  return order.map((group) => ({ group, links: byGroup.get(group)! }));
}
