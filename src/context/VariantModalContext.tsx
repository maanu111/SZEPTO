"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { Product } from "@/data/catalog";
import { VariantModal } from "@/components/VariantModal";

type Value = { openVariants: (product: Product) => void };

const VariantModalContext = createContext<Value | null>(null);

/**
 * One modal instance for the whole app; any product card can drive it.
 * The product is kept after close so the exit animation still has content to render.
 */
export function VariantModalProvider({ children }: { children: React.ReactNode }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);

  const openVariants = useCallback((next: Product) => {
    setProduct(next);
    setOpen(true);
  }, []);

  const value = useMemo(() => ({ openVariants }), [openVariants]);

  return (
    <VariantModalContext.Provider value={value}>
      {children}
      {/* Keyed by product so the pack selection resets on its own for each new product. */}
      <VariantModal
        key={product?.id ?? "none"}
        product={product}
        open={open}
        onClose={() => setOpen(false)}
      />
    </VariantModalContext.Provider>
  );
}

export function useVariantModal() {
  const ctx = useContext(VariantModalContext);
  if (!ctx) throw new Error("useVariantModal must be used inside <VariantModalProvider>");
  return ctx;
}
