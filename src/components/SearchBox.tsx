"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useImperativeHandle, useRef, useState } from "react";
import type { Product } from "@/data/catalog";
import { inr } from "@/lib/format";
import { createClient } from "@/lib/supabase";
import { AddToCartButton } from "./AddToCartButton";
import { CloseIcon, SearchIcon } from "./icons";

const SUGGESTIONS = ["Milk", "Apple", "Rice", "Coffee", "Ice cream", "Water", "Eggs", "Juice"];
const MAX_RESULTS = 20;
const DEBOUNCE_MS = 220;

export type SearchBoxHandle = { focus: () => void };

type CategoryLink = { slug: string; name: string; image: string | null };

type Props = {
  placeholder?: string;
  className?: string;
  ref?: React.Ref<SearchBoxHandle>;
};

/** Searches the catalog in Postgres rather than filtering a client-side array. */
async function searchProducts(term: string): Promise<Product[]> {
  const supabase = createClient();
  const pattern = `%${term}%`;

  const { data: rows } = await supabase
    .from("products")
    .select("id, slug, name, brand, unit, image_url, stock")
    .eq("is_active", true)
    .or(`name.ilike.${pattern},brand.ilike.${pattern}`)
    .order("sort_order")
    .limit(MAX_RESULTS);

  const products = rows ?? [];
  if (products.length === 0) return [];

  const { data: variantRows } = await supabase
    .from("product_variants")
    .select("product_id, id, label, unit, price, mrp, weight_kg, in_stock, is_default, sort_order")
    .in(
      "product_id",
      products.map((p) => p.id)
    )
    .order("sort_order");

  return products.map((p) => {
    const variants = (variantRows ?? []).filter((v) => v.product_id === p.id);
    const primary = variants.find((v) => v.is_default) ?? variants[0];

    const mapped = variants.map((v) => ({
      id: v.id,
      label: v.label,
      unit: v.unit,
      price: v.price,
      mrp: Math.max(v.mrp, v.price),
      discountPct: v.mrp > v.price ? Math.floor(((v.mrp - v.price) / v.mrp) * 100) : 0,
      weightKg: Number(v.weight_kg) || 0,
      lengthCm: null,
      widthCm: null,
      heightCm: null,
      inStock: v.in_stock,
    }));

    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      category: "",
      description: "",
      rating: 0,
      stock: p.stock,
      inStock: p.stock > 0,
      unit: p.unit,
      image: p.image_url ?? "",
      images: p.image_url ? [p.image_url] : [],
      price: primary?.price ?? 0,
      mrp: Math.max(primary?.mrp ?? 0, primary?.price ?? 0),
      discountPct: mapped.find((v) => v.id === primary?.id)?.discountPct ?? 0,
      defaultVariantId: primary?.id ?? "",
      hasPacks: mapped.length > 1,
      variants: mapped,
      tags: [],
      warranty: null,
      shipping: null,
      returnPolicy: null,
      reviews: [],
    } satisfies Product;
  });
}

/**
 * Inline search: a real input in the header with a results panel anchored beneath.
 * No separate search route or full-screen takeover.
 */
export function SearchBox({ placeholder = "Search products", className = "", ref }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  // Results are stored with the term they belong to, so "is this stale?" is derived
  // rather than tracked in a second piece of state.
  const [found, setFound] = useState<{ term: string; items: Product[] }>({
    term: "",
    items: [],
  });
  const [categories, setCategories] = useState<CategoryLink[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelId = useId();

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
      inputRef.current?.scrollIntoView({ block: "nearest" });
    },
  }));

  // Close when a click or Escape lands outside the search area.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Categories for the idle panel — fetched once, the first time it opens.
  useEffect(() => {
    if (!open || categories.length > 0) return;
    let cancelled = false;

    createClient()
      .from("categories")
      .select("slug, name, image_url")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        if (cancelled) return;
        setCategories(
          (data ?? []).map((c) => ({ slug: c.slug, name: c.name, image: c.image_url }))
        );
      });

    return () => {
      cancelled = true;
    };
  }, [open, categories.length]);

  const trimmed = query.trim();

  // Anything not matching the current term is stale by definition.
  const results = found.term === trimmed ? found.items : [];
  const searching = trimmed !== "" && found.term !== trimmed;

  // Debounced search so typing doesn't fire a query per keystroke.
  useEffect(() => {
    if (!trimmed) return;

    let cancelled = false;

    const timer = setTimeout(() => {
      searchProducts(trimmed).then((items) => {
        if (cancelled) return;
        setFound({ term: trimmed, items });
      });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmed]);

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <div
        className={`flex h-10 items-center gap-2.5 rounded-xl border bg-ink-50 px-3.5 transition-colors lg:h-11 lg:px-4 ${
          open ? "border-brand-500 bg-white" : "border-ink-200 hover:border-ink-400"
        }`}
      >
        <SearchIcon className="h-4 w-4 shrink-0 text-ink-500" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={open}
          aria-controls={panelId}
          aria-autocomplete="list"
          aria-label="Search products"
          className="h-full w-full bg-transparent text-[13px] text-ink-900 outline-none placeholder:text-ink-400 lg:text-sm"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="shrink-0 text-ink-400 transition-colors hover:text-ink-900"
          >
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div
          id={panelId}
          className="absolute inset-x-0 top-full z-50 mt-1.5 max-h-[min(28rem,70dvh)] overflow-hidden rounded-xl border border-ink-100 bg-white shadow-pop"
        >
          <div className="thin-scrollbar max-h-[min(28rem,70dvh)] overflow-y-auto overscroll-contain p-3">
            {!trimmed ? (
              <>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-400">
                  Popular searches
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setQuery(s);
                        inputRef.current?.focus();
                      }}
                      className="rounded-full border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-700 transition-colors hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700"
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {categories.length > 0 && (
                  <>
                    <p className="mb-2 mt-4 text-[11px] font-bold uppercase tracking-wide text-ink-400">
                      Shop by category
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {categories.map((c) => (
                        <Link
                          key={c.slug}
                          href={`/category/${c.slug}`}
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl border border-ink-100 p-2 transition-colors hover:border-brand-300 hover:bg-brand-50"
                        >
                          <span className="relative h-9 w-9 shrink-0">
                            {c.image && (
                              <Image
                                src={c.image}
                                alt=""
                                fill
                                sizes="36px"
                                className="object-contain"
                              />
                            )}
                          </span>
                          <span className="line-clamp-2 text-[11px] font-medium leading-tight text-ink-900">
                            {c.name}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : searching ? (
              <ul className="flex flex-col gap-2.5 py-1">
                {[0, 1, 2].map((i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="skeleton h-12 w-12 shrink-0 rounded-lg" />
                    <span className="flex-1">
                      <span className="skeleton block h-3 w-2/3 rounded" />
                      <span className="skeleton mt-1.5 block h-3 w-1/3 rounded" />
                    </span>
                  </li>
                ))}
              </ul>
            ) : results.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm font-semibold text-ink-900">No results for “{trimmed}”</p>
                <p className="mt-1 text-xs text-ink-500">Try a different spelling.</p>
              </div>
            ) : (
              <>
                <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-ink-400">
                  {results.length} result{results.length === 1 ? "" : "s"}
                </p>
                <ul className="flex flex-col divide-y divide-ink-100">
                  {results.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 py-2.5">
                      <Link
                        href={`/product/${p.slug}`}
                        onClick={() => setOpen(false)}
                        className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-ink-50"
                      >
                        {p.image && (
                          <Image
                            src={p.image}
                            alt=""
                            fill
                            sizes="48px"
                            className="object-contain p-1"
                          />
                        )}
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/product/${p.slug}`}
                          onClick={() => setOpen(false)}
                          className="line-clamp-1 text-[13px] font-medium text-ink-900 hover:text-brand-700"
                        >
                          {p.name}
                        </Link>
                        <p className="mt-0.5">
                          <span className="rounded bg-accent-50 px-1.5 py-px text-[10px] font-bold text-accent-500">
                            {p.unit}
                          </span>
                        </p>
                        <p className="mt-0.5 flex items-baseline gap-1.5">
                          <span className="text-[13px] font-bold text-ink-900">{inr(p.price)}</span>
                          {p.mrp > p.price && (
                            <span className="text-[11px] text-ink-400 line-through">
                              {inr(p.mrp)}
                            </span>
                          )}
                        </p>
                      </div>
                      <AddToCartButton product={p} size="sm" />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
