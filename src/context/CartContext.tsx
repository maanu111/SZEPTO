"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import type { Product, Variant } from "@/data/catalog";

export type CartLine = {
  /** productId + variantId — the same product in two pack sizes are two lines. */
  key: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  variantId: string;
  variantLabel: string;
  unit: string;
  price: number;
  mrp: number;
  qty: number;
  /** Copied at add time so the bill does not need a second catalog read. */
  weightKg: number;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
};

/** What the "added to cart" banner needs to render. */
export type LastAdded = {
  key: string;
  name: string;
  image: string;
  variantLabel: string;
  qty: number;
  /** Bumped on every add so repeat adds of the same item re-trigger the banner. */
  nonce: number;
};

const STORAGE_KEY = "szepto.cart.v1";
const MAX_QTY = 15;

type State = { lines: CartLine[]; hydrated: boolean };

type Action =
  | { type: "hydrate"; lines: CartLine[] }
  | { type: "add"; line: Omit<CartLine, "qty">; qty: number }
  | { type: "setQty"; key: string; qty: number }
  | { type: "remove"; key: string }
  | { type: "clear" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return { lines: action.lines, hydrated: true };

    case "add": {
      const existing = state.lines.find((l) => l.key === action.line.key);
      if (existing) {
        return {
          lines: state.lines.map((l) =>
            l.key === action.line.key
              ? { ...l, qty: Math.min(MAX_QTY, l.qty + action.qty) }
              : l
          ),
          hydrated: state.hydrated,
        };
      }
      return {
        lines: [...state.lines, { ...action.line, qty: Math.min(MAX_QTY, action.qty) }],
        hydrated: state.hydrated,
      };
    }

    case "setQty": {
      if (action.qty <= 0) {
        return {
          lines: state.lines.filter((l) => l.key !== action.key),
          hydrated: state.hydrated,
        };
      }
      return {
        lines: state.lines.map((l) =>
          l.key === action.key ? { ...l, qty: Math.min(MAX_QTY, action.qty) } : l
        ),
        hydrated: state.hydrated,
      };
    }

    case "remove":
      return { lines: state.lines.filter((l) => l.key !== action.key), hydrated: state.hydrated };

    case "clear":
      return { lines: [], hydrated: state.hydrated };
  }
}

type CartContextValue = {
  lines: CartLine[];
  /** False until localStorage has been read — guards against SSR/client mismatch. */
  hydrated: boolean;
  itemCount: number;
  subtotal: number;
  mrpTotal: number;
  savings: number;
  addItem: (product: Product, variant: Variant, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
  /** Total quantity of a product across every pack size. */
  qtyOfProduct: (productId: string) => number;
  qtyOfVariant: (productId: string, variantId: string) => number;
  lineKey: (productId: string, variantId: string) => string;
  lastAdded: LastAdded | null;
  dismissLastAdded: () => void;
  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  maxQty: number;
};

const CartContext = createContext<CartContextValue | null>(null);

const makeKey = (productId: string, variantId: string) => `${productId}::${variantId}`;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { lines: [], hydrated: false });
  const [hydrated, setHydrated] = useState(false);
  const [lastAdded, setLastAdded] = useState<LastAdded | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const nonce = useRef(0);

  // Read the persisted cart once on mount. This has to happen after the first render:
  // localStorage doesn't exist on the server, so seeding state from it directly would
  // make the server and client markup disagree.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) dispatch({ type: "hydrate", lines: parsed as CartLine[] });
      }
    } catch {
      // Corrupt or unavailable storage: start from an empty cart rather than crashing.
    }
    const frame = requestAnimationFrame(() => setHydrated(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Persist after every change (but not before hydration, or we'd wipe the stored cart).
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.lines));
    } catch {
      // Quota/private mode — the cart still works for this session.
    }
  }, [state.lines, hydrated]);

  const addItem = useCallback((product: Product, variant: Variant, qty = 1) => {
    const key = makeKey(product.id, variant.id);
    dispatch({
      type: "add",
      qty,
      line: {
        key,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: product.image,
        variantId: variant.id,
        variantLabel: variant.label,
        unit: variant.unit,
        price: variant.price,
        mrp: variant.mrp,
        weightKg: variant.weightKg,
        lengthCm: variant.lengthCm,
        widthCm: variant.widthCm,
        heightCm: variant.heightCm,
      },
    });
    nonce.current += 1;
    setLastAdded({
      key,
      name: product.name,
      image: product.image,
      variantLabel: variant.label,
      qty,
      nonce: nonce.current,
    });
  }, []);

  const setQty = useCallback((key: string, qty: number) => dispatch({ type: "setQty", key, qty }), []);
  const removeItem = useCallback((key: string) => dispatch({ type: "remove", key }), []);
  const clearCart = useCallback(() => dispatch({ type: "clear" }), []);
  const dismissLastAdded = useCallback(() => setLastAdded(null), []);
  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  const totals = useMemo(() => {
    let itemCount = 0;
    let subtotal = 0;
    let mrpTotal = 0;
    for (const l of state.lines) {
      itemCount += l.qty;
      subtotal += l.price * l.qty;
      mrpTotal += Math.max(l.mrp, l.price) * l.qty;
    }
    return { itemCount, subtotal, mrpTotal, savings: mrpTotal - subtotal };
  }, [state.lines]);

  const qtyOfProduct = useCallback(
    (productId: string) =>
      state.lines.reduce((sum, l) => (l.productId === productId ? sum + l.qty : sum), 0),
    [state.lines]
  );

  const qtyOfVariant = useCallback(
    (productId: string, variantId: string) =>
      state.lines.find((l) => l.key === makeKey(productId, variantId))?.qty ?? 0,
    [state.lines]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      lines: state.lines,
      hydrated,
      ...totals,
      addItem,
      setQty,
      removeItem,
      clearCart,
      qtyOfProduct,
      qtyOfVariant,
      lineKey: makeKey,
      lastAdded,
      dismissLastAdded,
      cartOpen,
      openCart,
      closeCart,
      maxQty: MAX_QTY,
    }),
    [
      state.lines,
      hydrated,
      totals,
      addItem,
      setQty,
      removeItem,
      clearCart,
      qtyOfProduct,
      qtyOfVariant,
      lastAdded,
      dismissLastAdded,
      cartOpen,
      openCart,
      closeCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
