"use client";

import { useSyncExternalStore } from "react";
import type { CartLine } from "@/context/CartContext";

/* ------------------------------------------------------------------ *
 * Payment settings consumed by the customer checkout.
 * ------------------------------------------------------------------ */

export type PaymentSettings = {
  /** Data URL of the QR image supplied by the store configuration. */
  qrDataUrl: string | null;
  qrFileName: string | null;
  upiId: string;
  payeeName: string;
  /** Free-text instructions shown next to the QR at checkout. */
  note: string;
  updatedAt: string | null;
};

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  qrDataUrl: null,
  qrFileName: null,
  upiId: "",
  payeeName: "SZepto Retail",
  note: "Scan the QR with any UPI app, pay the exact amount shown, then upload the payment screenshot below.",
  updatedAt: null,
};

const SETTINGS_KEY = "szepto.payment-settings.v1";
const ORDERS_KEY = "szepto.orders.v1";
const MAX_STORED_ORDERS = 25;

/** Fired after a write so other mounted components re-read storage. */
const CHANGE_EVENT = "szepto:storage-change";

/**
 * Snapshot caches.
 *
 * `useSyncExternalStore` compares snapshots by reference, so reading storage on every call
 * would loop forever. Parsed values are cached and only invalidated when something writes.
 */
let settingsCache: PaymentSettings | null = null;
let ordersCache: Order[] | null = null;

function emitChange() {
  settingsCache = null;
  ordersCache = null;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeToStorefront(listener: () => void): () => void {
  // A write in another tab fires `storage`; our own writes fire CHANGE_EVENT.
  const onExternal = () => {
    settingsCache = null;
    ordersCache = null;
    listener();
  };
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", onExternal);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("storage", onExternal);
  };
}

const EMPTY_ORDERS: Order[] = [];

/** Live payment settings. Renders defaults on the server, real values after hydration. */
export function usePaymentSettings(): PaymentSettings {
  return useSyncExternalStore(
    subscribeToStorefront,
    () => (settingsCache ??= loadPaymentSettings()),
    () => DEFAULT_PAYMENT_SETTINGS
  );
}

/** Live order list, newest first. */
export function useOrders(): Order[] {
  return useSyncExternalStore(
    subscribeToStorefront,
    () => (ordersCache ??= loadOrders()),
    () => EMPTY_ORDERS
  );
}

export function loadPaymentSettings(): PaymentSettings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_PAYMENT_SETTINGS;
    return { ...DEFAULT_PAYMENT_SETTINGS, ...(JSON.parse(raw) as Partial<PaymentSettings>) };
  } catch {
    return DEFAULT_PAYMENT_SETTINGS;
  }
}

/* ------------------------------------------------------------------ *
 * Orders
 * ------------------------------------------------------------------ */

export type OrderCustomer = {
  name: string;
  phone: string;
  address: string;
  landmark: string;
  pincode: string;
  city: string;
};

export type Order = {
  id: string;
  placedAt: string;
  customer: OrderCustomer;
  lines: CartLine[];
  itemTotal: number;
  deliveryFee: number;
  handlingFee: number;
  total: number;
  savings: number;
  /** Screenshot of the UPI payment, as a downscaled data URL. */
  paymentProof: string | null;
  paymentRef: string;
  /** Customer's own note confirming they paid and uploaded the right screenshot. */
  paymentNote: string;
  status: "Payment under verification" | "Confirmed" | "Cancelled";
};

const DEMO_ORDER_COUNT = 10;

const DEMO_PRODUCTS: Array<Omit<CartLine, "key" | "qty">> = [
  {
    productId: 16,
    slug: "apple",
    name: "Apple",
    image: "https://cdn.dummyjson.com/product-images/groceries/apple/thumbnail.webp",
    variantId: "apple-v2",
    variantLabel: "500 g",
    unit: "500 g",
    price: 84,
    mrp: 99,
  },
  {
    productId: 23,
    slug: "eggs",
    name: "Eggs",
    image: "https://cdn.dummyjson.com/product-images/groceries/eggs/thumbnail.webp",
    variantId: "eggs-v1",
    variantLabel: "6 pieces",
    unit: "6 pieces",
    price: 69,
    mrp: 79,
  },
  {
    productId: 29,
    slug: "milk",
    name: "Milk",
    image: "https://cdn.dummyjson.com/product-images/groceries/milk/thumbnail.webp",
    variantId: "milk-v2",
    variantLabel: "1 L",
    unit: "1 L",
    price: 67,
    mrp: 72,
  },
  {
    productId: 35,
    slug: "rice",
    name: "Rice",
    image: "https://cdn.dummyjson.com/product-images/groceries/rice/thumbnail.webp",
    variantId: "rice-v2",
    variantLabel: "5 kg",
    unit: "5 kg",
    price: 429,
    mrp: 499,
  },
  {
    productId: 26,
    slug: "juice",
    name: "Juice",
    image: "https://cdn.dummyjson.com/product-images/groceries/juice/thumbnail.webp",
    variantId: "juice-v2",
    variantLabel: "1 L",
    unit: "1 L",
    price: 99,
    mrp: 119,
  },
  {
    productId: 31,
    slug: "nescafe-coffee",
    name: "Nescafe Coffee",
    image: "https://cdn.dummyjson.com/product-images/groceries/nescafe-coffee/thumbnail.webp",
    variantId: "nescafe-coffee-v1",
    variantLabel: "100 g",
    unit: "100 g",
    price: 289,
    mrp: 325,
  },
  {
    productId: 32,
    slug: "potatoes",
    name: "Potatoes",
    image: "https://cdn.dummyjson.com/product-images/groceries/potatoes/thumbnail.webp",
    variantId: "potatoes-v2",
    variantLabel: "1 kg",
    unit: "1 kg",
    price: 48,
    mrp: 60,
  },
  {
    productId: 20,
    slug: "cooking-oil",
    name: "Cooking Oil",
    image: "https://cdn.dummyjson.com/product-images/groceries/cooking-oil/thumbnail.webp",
    variantId: "cooking-oil-v2",
    variantLabel: "1 L",
    unit: "1 L",
    price: 149,
    mrp: 175,
  },
  {
    productId: 36,
    slug: "soft-drinks",
    name: "Soft Drinks",
    image: "https://cdn.dummyjson.com/product-images/groceries/soft-drinks/thumbnail.webp",
    variantId: "soft-drinks-v2",
    variantLabel: "1.25 L",
    unit: "1.25 L",
    price: 78,
    mrp: 95,
  },
];

const DEMO_ORDER_IDS = [
  "SZ-Q7M2KA",
  "SZ-R9D4XP",
  "SZ-H3W8LN",
  "SZ-K6T2FV",
  "SZ-P4N7CJ",
  "SZ-B8X5MR",
  "SZ-V2G9QD",
  "SZ-M5L3YK",
  "SZ-C7R4WH",
  "SZ-N9F2PB",
];

const DEMO_ORDER_AGES_HOURS = [0.5, 5, 26, 51, 96, 168, 264, 384, 552, 744];

const DEMO_ORDER_STATUSES: Order["status"][] = [
  "Payment under verification",
  "Confirmed",
  "Confirmed",
  "Cancelled",
  "Confirmed",
  "Payment under verification",
  "Confirmed",
  "Cancelled",
  "Confirmed",
  "Confirmed",
];

function makeDemoOrders(): Order[] {
  const now = Date.now();
  const addresses: OrderCustomer[] = [
    {
      name: "Aarav Sharma",
      phone: "9876543210",
      address: "42, Lake View Apartments, Indiranagar",
      landmark: "Near Metro Station",
      pincode: "560038",
      city: "Bengaluru",
    },
    {
      name: "Aarav Sharma",
      phone: "9876543210",
      address: "18, Orion Business Park, MG Road",
      landmark: "Opposite Central Mall",
      pincode: "560001",
      city: "Bengaluru",
    },
  ];

  return DEMO_ORDER_IDS.map((id, orderIndex) => {
    const lineCount = (orderIndex % 3) + 1;
    const lines = Array.from({ length: lineCount }, (_, lineIndex) => {
      const product = DEMO_PRODUCTS[(orderIndex * 2 + lineIndex) % DEMO_PRODUCTS.length];
      const qty = ((orderIndex + lineIndex) % 3) + 1;
      return {
        ...product,
        key: `${product.productId}:${product.variantId}`,
        qty,
      };
    });
    const itemTotal = lines.reduce((sum, line) => sum + line.price * line.qty, 0);
    const mrpTotal = lines.reduce((sum, line) => sum + line.mrp * line.qty, 0);
    const deliveryFee = itemTotal >= 499 ? 0 : 35;
    const handlingFee = 9;

    return {
      id,
      placedAt: new Date(now - DEMO_ORDER_AGES_HOURS[orderIndex] * 60 * 60 * 1000).toISOString(),
      customer: addresses[orderIndex % addresses.length],
      lines,
      itemTotal,
      deliveryFee,
      handlingFee,
      total: itemTotal + deliveryFee + handlingFee,
      savings: mrpTotal - itemTotal,
      paymentProof: null,
      paymentRef: `UTR2026${String(810042 + orderIndex * 137)}`,
      paymentNote:
        DEMO_ORDER_STATUSES[orderIndex] === "Cancelled"
          ? "Payment was not completed."
          : "Paid using UPI and submitted for verification.",
      status: DEMO_ORDER_STATUSES[orderIndex],
    };
  });
}

export function loadOrders(): Order[] {
  try {
    const raw = window.localStorage.getItem(ORDERS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    const storedOrders = Array.isArray(parsed) ? (parsed as Order[]) : [];
    if (storedOrders.length >= DEMO_ORDER_COUNT) return storedOrders;

    const storedIds = new Set(storedOrders.map((order) => order.id));
    const demoOrders = makeDemoOrders().filter((order) => !storedIds.has(order.id));
    const orders = [...storedOrders, ...demoOrders]
      .sort((a, b) => Date.parse(b.placedAt) - Date.parse(a.placedAt))
      .slice(0, DEMO_ORDER_COUNT);

    window.localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    return orders;
  } catch {
    return makeDemoOrders();
  }
}

export function saveOrder(order: Order): { ok: true } | { ok: false; error: string } {
  const orders = [order, ...loadOrders()].slice(0, MAX_STORED_ORDERS);
  try {
    window.localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    emitChange();
    return { ok: true };
  } catch {
    // Screenshots are the bulk of the payload — retry keeping proof only on the newest order.
    try {
      const trimmed = orders.map((o, i) => (i === 0 ? o : { ...o, paymentProof: null }));
      window.localStorage.setItem(ORDERS_KEY, JSON.stringify(trimmed));
      emitChange();
      return { ok: true };
    } catch {
      return { ok: false, error: "Could not save the order — browser storage is full." };
    }
  }
}

/** SZ-8H3K2M — short, readable, good enough to quote over the phone. */
export function generateOrderId(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `SZ-${suffix}`;
}
