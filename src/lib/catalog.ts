import type { Banner, Category, Product, Review, Variant } from "@/data/catalog";
import type { ProductRow, VariantRow } from "@/lib/database.types";
import { createServerClient } from "@/lib/supabase";
import { discountPct } from "@/lib/format";

const PRODUCT_COLUMNS =
  "id, slug, name, brand, description, rating, stock, unit, image_url, images, tags, warranty, shipping_info, return_policy, category_id, is_active, sort_order";

const FALLBACK_IMAGE = "";

function toVariant(row: VariantRow): Variant {
  const price = row.price;
  const mrp = Math.max(row.mrp, price);
  return {
    id: row.id,
    label: row.label,
    unit: row.unit,
    price,
    mrp,
    discountPct: discountPct(price, mrp),
    weightKg: Number(row.weight_kg) || 0,
    lengthCm: row.length_cm === null ? null : Number(row.length_cm),
    widthCm: row.width_cm === null ? null : Number(row.width_cm),
    heightCm: row.height_cm === null ? null : Number(row.height_cm),
    inStock: row.in_stock,
  };
}

function toProduct(
  row: ProductRow,
  variantRows: VariantRow[],
  reviews: Review[],
  categorySlug: string
): Product {
  const variants = variantRows.map(toVariant);
  const fallback: Variant = {
    id: `${row.id}-default`,
    label: row.unit,
    unit: row.unit,
    price: 0,
    mrp: 0,
    discountPct: 0,
    weightKg: 0.5,
    lengthCm: null,
    widthCm: null,
    heightCm: null,
    inStock: false,
  };

  const list = variants.length ? variants : [fallback];
  const primary = list.find((v) => variantRows.find((r) => r.id === v.id)?.is_default) ?? list[0];

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    category: categorySlug,
    description: row.description,
    rating: Number(row.rating) || 0,
    stock: row.stock,
    inStock: row.stock > 0 && list.some((v) => v.inStock),
    unit: row.unit,
    image: row.image_url ?? FALLBACK_IMAGE,
    images: row.images?.length ? row.images : row.image_url ? [row.image_url] : [],
    price: primary.price,
    mrp: primary.mrp,
    discountPct: primary.discountPct,
    defaultVariantId: primary.id,
    hasPacks: list.length > 1,
    variants: list,
    tags: row.tags ?? [],
    warranty: row.warranty,
    shipping: row.shipping_info,
    returnPolicy: row.return_policy,
    reviews,
  };
}

/**
 * Loads products with their variants and reviews.
 *
 * Three flat queries rather than nested selects — PostgREST embedding needs
 * relationship metadata, and joining in JS here is simpler and just as quick.
 */
async function loadProducts(filter?: { categorySlug?: string; slugs?: string[] }) {
  const supabase = createServerClient();
  if (!supabase) return { products: [], categories: [] };

  const { data: categoryRows } = await supabase
    .from("categories")
    .select("id, slug, name, short_name, group_name, tint, image_url, sort_order, is_active")
    .order("sort_order");

  const categories = categoryRows ?? [];
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  let query = supabase.from("products").select(PRODUCT_COLUMNS).eq("is_active", true);

  if (filter?.categorySlug) {
    const match = categories.find((c) => c.slug === filter.categorySlug);
    if (!match) return { products: [], categories };
    query = query.eq("category_id", match.id);
  }
  if (filter?.slugs) query = query.in("slug", filter.slugs);

  const { data: productRows } = await query.order("sort_order");
  const products = productRows ?? [];
  if (products.length === 0) return { products: [], categories };

  const ids = products.map((p) => p.id);

  const [{ data: variantRows }, { data: reviewRows }] = await Promise.all([
    supabase.from("product_variants").select("*").in("product_id", ids).order("sort_order"),
    supabase.from("product_reviews").select("*").in("product_id", ids),
  ]);

  const variantsByProduct = new Map<string, VariantRow[]>();
  for (const v of variantRows ?? []) {
    const list = variantsByProduct.get(v.product_id) ?? [];
    list.push(v);
    variantsByProduct.set(v.product_id, list);
  }

  const reviewsByProduct = new Map<string, Review[]>();
  for (const r of reviewRows ?? []) {
    const list = reviewsByProduct.get(r.product_id) ?? [];
    list.push({
      rating: r.rating,
      comment: r.comment,
      reviewerName: r.reviewer_name,
      date: r.created_at,
    });
    reviewsByProduct.set(r.product_id, list);
  }

  const mapped = products.map((p) =>
    toProduct(
      p as ProductRow,
      variantsByProduct.get(p.id) ?? [],
      reviewsByProduct.get(p.id) ?? [],
      categoryById.get(p.category_id ?? "")?.slug ?? ""
    )
  );

  return { products: mapped, categories };
}

export async function getCategories(): Promise<Category[]> {
  const supabase = createServerClient();
  if (!supabase) return [];

  const [{ data: rows }, { data: productRows }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, slug, name, short_name, group_name, tint, image_url, sort_order")
      .eq("is_active", true)
      .order("sort_order"),
    supabase.from("products").select("category_id").eq("is_active", true),
  ]);

  const counts = new Map<string, number>();
  for (const p of productRows ?? []) {
    if (p.category_id) counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1);
  }

  return (rows ?? []).map((c) => ({
    slug: c.slug,
    name: c.name,
    short: c.short_name,
    group: c.group_name,
    tint: c.tint,
    image: c.image_url,
    count: counts.get(c.id) ?? 0,
  }));
}

export async function getAllProducts(): Promise<Product[]> {
  const { products } = await loadProducts();
  return products;
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  const { products } = await loadProducts({ categorySlug });
  return products;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { products } = await loadProducts({ slugs: [slug] });
  return products[0] ?? null;
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const categories = await getCategories();
  return categories.find((c) => c.slug === slug) ?? null;
}

/** Home hero slides, with each slide's product photos already resolved. */
export async function getBanners(): Promise<Banner[]> {
  const supabase = createServerClient();
  if (!supabase) return [];

  const { data: rows } = await supabase
    .from("banners")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  const banners = rows ?? [];
  if (banners.length === 0) return [];

  // Only resolve product slugs for legacy gradient-style banners without an image_url
  const legacyBanners = banners.filter((b) => !b.image_url);
  const slugs = Array.from(new Set(legacyBanners.flatMap((b) => b.product_slugs ?? [])));
  const { data: productRows } = slugs.length
    ? await supabase.from("products").select("slug, image_url").in("slug", slugs)
    : { data: [] };

  const imageBySlug = new Map((productRows ?? []).map((p) => [p.slug, p.image_url]));

  return banners.map((b) => ({
    eyebrow: b.eyebrow ?? "",
    title: b.title ?? "",
    copy: b.body ?? "",
    cta: b.cta_label ?? "Shop now",
    href: b.cta_href ?? "/",
    from: b.color_from ?? "#5c1478",
    to: b.color_to ?? "#c9106c",
    imageUrl: b.image_url ?? null,
    imageFit: (b.image_fit ?? "cover") as "cover" | "right",
    images: b.image_url
      ? []
      : (b.product_slugs ?? [])
          .map((s: string) => imageBySlug.get(s))
          .filter((url: string | null | undefined): url is string => Boolean(url)),
  }));
}

/** Everything the home page needs, in one pass. */
export async function getHomeData() {
  const [categories, products, banners] = await Promise.all([
    getCategories(),
    getAllProducts(),
    getBanners(),
  ]);
  return { categories, products, banners };
}
