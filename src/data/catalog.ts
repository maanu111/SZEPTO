/**
 * Catalog shapes shared by every storefront component.
 *
 * These used to carry a hard-coded catalog. Data now lives in Supabase — see
 * `@/lib/catalog` for the queries that produce these objects.
 */

export type Variant = {
  id: string;
  label: string;
  unit: string;
  price: number;
  mrp: number;
  discountPct: number;
  /** Billable weight, drives the export shipping charge. */
  weightKg: number;
  inStock: boolean;
};

export type Review = {
  rating: number;
  comment: string;
  reviewerName: string;
  date: string;
};

export type Product = {
  id: string;
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
  /** Heading of the home-page panel this category sits under. */
  group: string;
  tint: string;
  image: string | null;
  count: number;
};

export type Banner = {
  eyebrow: string;
  title: string;
  copy: string;
  cta: string;
  href: string;
  from: string;
  to: string;
  /** Uploaded artwork — when set, shown instead of the gradient+product composite. */
  imageUrl: string | null;
  imageFit: "right" | "cover";
  /** Resolved product photos composited onto the slide (legacy). */
  images: string[];
};
