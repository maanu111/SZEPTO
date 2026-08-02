// Pulls real product data (titles, photos, descriptions, ratings, reviews) from DummyJSON
// and bakes it into a typed catalog module so the app has no runtime data dependency.
import fs from "node:fs";
import path from "node:path";

const OUT = process.argv[2];
const USD_TO_INR = 83;
const SRC_CATEGORIES = ["groceries", "beauty", "fragrances", "home-decoration", "kitchen-accessories"];

// ---- Store taxonomy: which source product lands in which storefront category ----
const CATEGORIES = [
  { slug: "fruits-vegetables", name: "Fruits & Vegetables", short: "Fruits & Veg", tint: "#E8F6EC" },
  { slug: "dairy-bread-eggs", name: "Dairy, Bread & Eggs", short: "Dairy & Eggs", tint: "#FFF6E5" },
  { slug: "meat-fish", name: "Meat, Fish & Eggs", short: "Meat & Fish", tint: "#FDECEC" },
  { slug: "atta-rice-oil", name: "Atta, Rice, Oil & Dals", short: "Atta & Rice", tint: "#FDF3E3" },
  { slug: "cold-drinks-juices", name: "Cold Drinks & Juices", short: "Drinks", tint: "#E8F1FD" },
  { slug: "tea-coffee-health", name: "Tea, Coffee & Health Drinks", short: "Tea & Coffee", tint: "#F3EDE6" },
  { slug: "ice-cream-desserts", name: "Ice Creams & Desserts", short: "Ice Cream", tint: "#FDEBF3" },
  { slug: "pet-care", name: "Pet Care", short: "Pet Care", tint: "#EDF0FB" },
  { slug: "home-cleaning", name: "Home & Cleaning", short: "Cleaning", tint: "#E9F5F6" },
  { slug: "beauty-personal-care", name: "Beauty & Personal Care", short: "Beauty", tint: "#F7ECFB" },
  { slug: "home-decor", name: "Home & Decor", short: "Decor", tint: "#F0F1F4" },
  { slug: "kitchenware", name: "Kitchen & Appliances", short: "Kitchen", tint: "#EFF3EC" },
];

// sourceId -> [storefront category, display unit, optional pack-variant plan]
// Pack plans drive the "choose a pack" modal: [label, unit, priceMultiplier, extraDiscount%]
const PACK_LOOSE = [
  ["250 g", "250 g", 0.28, 0], ["500 g", "500 g", 0.52, 2],
  ["1 kg", "1 kg", 1, 5], ["2 kg", "2 kg", 1.9, 10],
];
const PACK_PIECE = [
  ["1 pack", "1 pack", 1, 0], ["Pack of 2", "2 packs", 1.92, 5], ["Pack of 4", "4 packs", 3.7, 12],
];
const PACK_BOTTLE = [
  ["250 ml", "250 ml", 0.3, 0], ["500 ml", "500 ml", 0.55, 3],
  ["1 L", "1 L", 1, 6], ["Pack of 6 x 1 L", "6 L", 5.6, 14],
];
const PACK_MILK = [
  ["500 ml", "500 ml", 0.55, 0], ["1 L", "1 L", 1, 4], ["Pack of 6 x 1 L", "6 L", 5.7, 12],
];

const MAP = {
  16: ["fruits-vegetables", "1 kg", PACK_LOOSE],
  21: ["fruits-vegetables", "500 g", PACK_LOOSE],
  25: ["fruits-vegetables", "250 g", PACK_LOOSE],
  26: ["fruits-vegetables", "100 g", PACK_LOOSE],
  30: ["fruits-vegetables", "4 pcs", PACK_LOOSE],
  31: ["fruits-vegetables", "500 g", PACK_LOOSE],
  33: ["fruits-vegetables", "200 g", PACK_LOOSE],
  35: ["fruits-vegetables", "1 kg", PACK_LOOSE],
  37: ["fruits-vegetables", "1 kg", PACK_LOOSE],
  40: ["fruits-vegetables", "200 g", PACK_LOOSE],

  23: ["dairy-bread-eggs", "6 pcs", [["6 pcs", "6 pcs", 1, 0], ["12 pcs", "12 pcs", 1.9, 6], ["30 pcs tray", "30 pcs", 4.5, 14]]],
  32: ["dairy-bread-eggs", "1 L", PACK_MILK],
  27: ["dairy-bread-eggs", "500 g", PACK_PIECE],

  17: ["meat-fish", "500 g", PACK_LOOSE],
  19: ["meat-fish", "1 kg", PACK_LOOSE],
  24: ["meat-fish", "500 g", PACK_LOOSE],

  20: ["atta-rice-oil", "1 L", PACK_BOTTLE],
  38: ["atta-rice-oil", "5 kg", [["1 kg", "1 kg", 0.22, 0], ["5 kg", "5 kg", 1, 8], ["10 kg", "10 kg", 1.92, 15]]],

  29: ["cold-drinks-juices", "1 L", PACK_BOTTLE],
  39: ["cold-drinks-juices", "750 ml", [["750 ml", "750 ml", 1, 0], ["1.25 L", "1.25 L", 1.55, 5], ["Pack of 6", "6 bottles", 5.6, 15]]],
  42: ["cold-drinks-juices", "1 L", [["1 L", "1 L", 1, 0], ["Pack of 6", "6 L", 5.5, 10], ["Pack of 12", "12 L", 10.5, 18]]],

  34: ["tea-coffee-health", "100 g", [["50 g", "50 g", 0.55, 0], ["100 g", "100 g", 1, 5], ["200 g", "200 g", 1.9, 12]]],
  36: ["tea-coffee-health", "1 kg", [["500 g", "500 g", 0.55, 0], ["1 kg", "1 kg", 1, 8], ["2 kg", "2 kg", 1.9, 15]]],

  28: ["ice-cream-desserts", "700 ml", [["100 ml cup", "100 ml", 0.25, 0], ["700 ml tub", "700 ml", 1, 6], ["Party pack 1.5 L", "1.5 L", 2, 14]]],

  18: ["pet-care", "1 kg", PACK_LOOSE],
  22: ["pet-care", "1.2 kg", PACK_LOOSE],

  41: ["home-cleaning", "100 pulls", PACK_PIECE],
};

const DEFAULT_MAP = {
  beauty: ["beauty-personal-care", "1 unit", PACK_PIECE],
  fragrances: ["beauty-personal-care", "100 ml", PACK_PIECE],
  "home-decoration": ["home-decor", "1 unit", PACK_PIECE],
  "kitchen-accessories": ["kitchenware", "1 unit", PACK_PIECE],
};

// ---- helpers ----
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Prices that look like real shelf prices: ...9 / ...5 endings, never ...0. */
function prettyInr(n) {
  if (n < 100) return Math.max(9, Math.round(n / 5) * 5 - 1);
  if (n < 1000) return Math.round(n / 10) * 10 - 1;
  return Math.round(n / 50) * 50 - 1;
}

async function fetchCategory(slug) {
  const url = `https://dummyjson.com/products/category/${slug}?limit=50`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} for ${slug}`);
  return (await res.json()).products;
}

const raw = [];
for (const c of SRC_CATEGORIES) raw.push(...(await fetchCategory(c)));
console.log(`fetched ${raw.length} source products`);

const products = [];
for (const p of raw) {
  const mapped = MAP[p.id] ?? DEFAULT_MAP[p.category];
  if (!mapped) {
    console.log(`skip ${p.id} ${p.title}`);
    continue;
  }
  const [category, unit, packPlan] = mapped;

  const baseInr = prettyInr(p.price * USD_TO_INR);
  // discountPercentage from the source drives a believable struck-through MRP
  const disc = Math.max(4, Math.min(45, Math.round(p.discountPercentage ?? 10)));
  const baseMrp = prettyInr(baseInr / (1 - disc / 100));

  const variants = packPlan.map(([label, vUnit, mult, extra], i) => {
    const price = prettyInr(baseInr * mult * (1 - extra / 100));
    const mrp = prettyInr(baseMrp * mult);
    return {
      id: `${slugify(p.title)}-v${i + 1}`,
      label,
      unit: vUnit,
      price,
      mrp: Math.max(mrp, price + 1),
      discountPct: Math.max(0, Math.round((1 - price / Math.max(mrp, price + 1)) * 100)),
      inStock: p.stock > 0,
    };
  });

  // The variant matching the card's default unit is the one pre-selected in the modal.
  const defaultIdx = Math.max(0, variants.findIndex((v) => v.unit === unit));

  products.push({
    id: p.id,
    slug: slugify(p.title),
    name: p.title,
    brand: p.brand ?? "SZepto Select",
    category,
    description: p.description,
    rating: Number(p.rating.toFixed(1)),
    stock: p.stock,
    inStock: p.stock > 0,
    unit,
    image: p.thumbnail,
    images: p.images?.length ? p.images : [p.thumbnail],
    price: variants[defaultIdx].price,
    mrp: variants[defaultIdx].mrp,
    discountPct: variants[defaultIdx].discountPct,
    defaultVariantId: variants[defaultIdx].id,
    hasPacks: variants.length > 1,
    variants,
    tags: p.tags ?? [],
    warranty: p.warrantyInformation ?? null,
    shipping: p.shippingInformation ?? null,
    returnPolicy: p.returnPolicy ?? null,
    reviews: (p.reviews ?? []).map((r) => ({
      rating: r.rating,
      comment: r.comment,
      reviewerName: r.reviewerName,
      date: r.date,
    })),
  });
}

// Category tile art = first product photo in that category
const categories = CATEGORIES.map((c) => {
  const first = products.find((p) => p.category === c.slug);
  return { ...c, image: first?.image ?? null, count: products.filter((p) => p.category === c.slug).length };
}).filter((c) => c.count > 0);

const banner = (s) => `/* ${s} */`;
const ts = `${banner("AUTO-GENERATED by scripts/gen-catalog.mjs — do not edit by hand.")}
${banner("Product data & photography: DummyJSON (https://dummyjson.com). Prices localised to INR.")}

export type Variant = {
  id: string;
  label: string;
  unit: string;
  price: number;
  mrp: number;
  discountPct: number;
  inStock: boolean;
};

export type Review = {
  rating: number;
  comment: string;
  reviewerName: string;
  date: string;
};

export type Product = {
  id: number;
  slug: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  rating: number;
  stock: number;
  inStock: boolean;
  unit: string;
  image: string;
  images: string[];
  price: number;
  mrp: number;
  discountPct: number;
  defaultVariantId: string;
  hasPacks: boolean;
  variants: Variant[];
  tags: string[];
  warranty: string | null;
  shipping: string | null;
  returnPolicy: string | null;
  reviews: Review[];
};

export type Category = {
  slug: string;
  name: string;
  short: string;
  tint: string;
  image: string | null;
  count: number;
};

export const categories: Category[] = ${JSON.stringify(categories, null, 2)};

export const products: Product[] = ${JSON.stringify(products, null, 2)};

export const productBySlug = (slug: string) => products.find((p) => p.slug === slug);

export const productsByCategory = (categorySlug: string) =>
  products.filter((p) => p.category === categorySlug);

export const categoryBySlug = (slug: string) => categories.find((c) => c.slug === slug);
`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, ts);
console.log(`wrote ${products.length} products / ${categories.length} categories -> ${OUT}`);
for (const c of categories) console.log(`  ${String(c.count).padStart(3)}  ${c.name}`);
