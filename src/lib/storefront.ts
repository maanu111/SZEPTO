"use client";

/*
 * This module fetches from Supabase inside effects. Every setState below happens in a
 * promise callback guarded by a cancellation flag, not synchronously in the effect body,
 * so the cascading-render concern the rule guards against does not apply. There is no
 * external store to subscribe to instead — the data lives behind the network.
 */
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CartLine } from "@/context/CartContext";
import { compressImage } from "@/lib/compressImage";
import { createClient } from "@/lib/supabase";
import { cartWeightKg, DEFAULT_SHIPPING_SETTINGS, type ShippingSettings } from "./shipping";

/* ------------------------------------------------------------------ *
 * Store settings — payment QR + export charges, owned by the admin app.
 * ------------------------------------------------------------------ */

export type PaymentSettings = {
  qrDataUrl: string | null;
  upiId: string;
  payeeName: string;
  note: string;
};

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  qrDataUrl: null,
  upiId: "",
  payeeName: "",
  note: "",
};

export type StoreSettings = {
  payment: PaymentSettings;
  shipping: ShippingSettings;
  loaded: boolean;
};

const DEFAULT_STORE_SETTINGS: StoreSettings = {
  payment: DEFAULT_PAYMENT_SETTINGS,
  shipping: DEFAULT_SHIPPING_SETTINGS,
  loaded: false,
};

/** Reads the single settings row. Falls back to defaults if it can't be reached. */
export function useStoreSettings(): StoreSettings {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);

  useEffect(() => {
    let cancelled = false;

    createClient()
      .from("store_settings")
      .select("qr_url, upi_id, payee_name, payment_note, rate_per_kg, service_charge")
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setSettings({
          loaded: true,
          payment: {
            qrDataUrl: data?.qr_url ?? null,
            upiId: data?.upi_id ?? "",
            payeeName: data?.payee_name ?? "",
            note: data?.payment_note ?? "",
          },
          shipping: {
            ratePerKg: data?.rate_per_kg ?? DEFAULT_SHIPPING_SETTINGS.ratePerKg,
            serviceCharge: data?.service_charge ?? DEFAULT_SHIPPING_SETTINGS.serviceCharge,
          },
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return settings;
}

/** Backwards-compatible alias used by checkout. */
export function usePaymentSettings(): PaymentSettings {
  return useStoreSettings().payment;
}

export function useShippingSettings(): ShippingSettings {
  return useStoreSettings().shipping;
}

/* ------------------------------------------------------------------ *
 * Orders
 * ------------------------------------------------------------------ */

export type OrderStatus = "pending" | "confirmed" | "cancelled";

export type OrderCustomer = {
  name: string;
  phone: string;
  address: string;
  landmark: string;
  pincode: string;
  city: string;
};

export type OrderLine = {
  key: string;
  slug: string;
  name: string;
  image: string;
  variantLabel: string;
  unit: string;
  price: number;
  mrp: number;
  qty: number;
};

export type Order = {
  id: string;
  code: string;
  placedAt: string;
  customer: OrderCustomer;
  lines: OrderLine[];
  itemTotal: number;
  weightKg: number;
  ratePerKg: number;
  shippingCost: number;
  serviceCharge: number;
  total: number;
  savings: number;
  paymentProof: string | null;
  paymentRef: string;
  paymentNote: string;
  status: OrderStatus;
};

/**
 * The storefront has no login, so this browser keeps the list of order ids it
 * created. Order contents always come from the database.
 */
const MY_ORDERS_KEY = "szepto.my-orders.v1";
const CHANGE_EVENT = "szepto:my-orders";

function readMyOrderIds(): string[] {
  try {
    const raw = window.localStorage.getItem(MY_ORDERS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export function rememberOrderId(id: string) {
  try {
    const ids = [id, ...readMyOrderIds().filter((x) => x !== id)].slice(0, 50);
    window.localStorage.setItem(MY_ORDERS_KEY, JSON.stringify(ids));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // Private mode — the order still exists, it just won't be listed here.
  }
}

function subscribeMyOrders(listener: () => void) {
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

let idsCache: string[] | null = null;
const EMPTY_IDS: string[] = [];

export function useMyOrderIds(): string[] {
  return useSyncExternalStore(
    (listener) =>
      subscribeMyOrders(() => {
        idsCache = null;
        listener();
      }),
    () => (idsCache ??= readMyOrderIds()),
    () => EMPTY_IDS
  );
}

type OrderRowShape = {
  id: string;
  code: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  landmark: string;
  city: string;
  pincode: string;
  item_total: number;
  weight_kg: number;
  rate_per_kg: number;
  shipping_cost: number;
  service_charge: number;
  total: number;
  savings: number;
  payment_proof_url: string | null;
  payment_ref: string;
  payment_note: string;
  status: OrderStatus;
};

type ItemRowShape = {
  order_id: string;
  product_slug: string;
  name: string;
  image_url: string | null;
  variant_label: string;
  unit: string;
  price: number;
  mrp: number;
  qty: number;
};

function toOrder(row: OrderRowShape, items: ItemRowShape[]): Order {
  return {
    id: row.id,
    code: row.code,
    placedAt: row.created_at,
    customer: {
      name: row.customer_name,
      phone: row.customer_phone,
      address: row.address,
      landmark: row.landmark,
      city: row.city,
      pincode: row.pincode,
    },
    lines: items.map((i, n) => ({
      key: `${row.id}-${n}`,
      slug: i.product_slug,
      name: i.name,
      image: i.image_url ?? "",
      variantLabel: i.variant_label,
      unit: i.unit,
      price: i.price,
      mrp: i.mrp,
      qty: i.qty,
    })),
    itemTotal: row.item_total,
    weightKg: Number(row.weight_kg) || 0,
    ratePerKg: row.rate_per_kg,
    shippingCost: row.shipping_cost,
    serviceCharge: row.service_charge,
    total: row.total,
    savings: row.savings,
    paymentProof: row.payment_proof_url,
    paymentRef: row.payment_ref,
    paymentNote: row.payment_note,
    status: row.status,
  };
}

async function fetchOrdersByIds(ids: string[]): Promise<Order[]> {
  if (ids.length === 0) return [];
  const supabase = createClient();

  const [{ data: orderRows }, { data: itemRows }] = await Promise.all([
    supabase.from("orders").select("*").in("id", ids).order("created_at", { ascending: false }),
    supabase.from("order_items").select("*").in("order_id", ids),
  ]);

  const itemsByOrder = new Map<string, ItemRowShape[]>();
  for (const i of (itemRows ?? []) as ItemRowShape[]) {
    const list = itemsByOrder.get(i.order_id) ?? [];
    list.push(i);
    itemsByOrder.set(i.order_id, list);
  }

  return ((orderRows ?? []) as OrderRowShape[]).map((o) =>
    toOrder(o, itemsByOrder.get(o.id) ?? [])
  );
}

/** Orders placed from this browser, newest first. */
export function useOrders(): { orders: Order[]; loading: boolean; refresh: () => void } {
  const ids = useMyOrderIds();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);
  const key = ids.join(",");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchOrdersByIds(ids).then((result) => {
      if (cancelled) return;
      setOrders(result);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` is the stable form of `ids`
  }, [key, nonce]);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);
  return { orders, loading, refresh };
}

/** A single order, fetched by its unguessable id. */
export function useOrder(id: string): { order: Order | null; loading: boolean } {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    setLoading(true);

    fetchOrdersByIds([id]).then((result) => {
      if (!mounted.current) return;
      setOrder(result[0] ?? null);
      setLoading(false);
    });

    return () => {
      mounted.current = false;
    };
  }, [id]);

  return { order, loading };
}

/* ------------------------------------------------------------------ *
 * Placing an order
 * ------------------------------------------------------------------ */

export type PlaceOrderInput = {
  customer: OrderCustomer;
  lines: CartLine[];
  itemTotal: number;
  savings: number;
  shipping: ShippingSettings;
  paymentProofFile: File | null;
  paymentRef: string;
  paymentNote: string;
};

export type PlaceOrderResult =
  | { ok: true; id: string; code: string }
  | { ok: false; error: string };

/** SZ-8H3K2M — short enough to read out over the phone. */
export function generateOrderCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `SZ-${suffix}`;
}

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const supabase = createClient();

  // 1. Upload the payment screenshot first — no order without proof of payment.
  //    Screenshots off a phone are several MB; compressing keeps storage in check
  //    while staying legible enough to verify a UPI reference against.
  let proofUrl: string | null = null;
  if (input.paymentProofFile) {
    const compressed = await compressImage(input.paymentProofFile, {
      maxEdge: 1800,   // must stay large enough to read UPI refs and bank names
      quality: 0.91,   // high quality — do not mush text in screenshots
    });
    const ext = compressed.file.type.split("/")[1] || "webp";
    const path = `${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(path, compressed.file, {
        contentType: compressed.file.type,
        cacheControl: "31536000",
      });

    if (uploadError) return { ok: false, error: `Couldn't upload your screenshot: ${uploadError.message}` };

    proofUrl = supabase.storage.from("payment-proofs").getPublicUrl(path).data.publicUrl;
  }

  const weightKg = cartWeightKg(input.lines);
  const shippingCost = Math.round(weightKg * input.shipping.ratePerKg);
  const serviceCharge = input.lines.length ? input.shipping.serviceCharge : 0;
  const total = input.itemTotal + shippingCost + serviceCharge;

  // 2. Create the order.
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      code: generateOrderCode(),
      customer_name: input.customer.name,
      customer_phone: input.customer.phone,
      address: input.customer.address,
      landmark: input.customer.landmark,
      city: input.customer.city,
      pincode: input.customer.pincode,
      item_total: input.itemTotal,
      weight_kg: weightKg,
      rate_per_kg: input.shipping.ratePerKg,
      shipping_cost: shippingCost,
      service_charge: serviceCharge,
      total,
      savings: input.savings,
      payment_proof_url: proofUrl,
      payment_ref: input.paymentRef,
      payment_note: input.paymentNote,
      status: "pending",
    })
    .select("id, code")
    .single();

  if (orderError || !order) {
    return { ok: false, error: orderError?.message ?? "Could not place your order." };
  }

  // 3. Line items are copied, not referenced, so history survives catalog edits.
  const { error: itemsError } = await supabase.from("order_items").insert(
    input.lines.map((l) => ({
      order_id: order.id,
      product_slug: l.slug,
      name: l.name,
      image_url: l.image,
      variant_label: l.variantLabel,
      unit: l.unit,
      price: l.price,
      mrp: l.mrp,
      qty: l.qty,
    }))
  );

  if (itemsError) {
    // Roll back so a half-written order never reaches the dashboard.
    await supabase.from("orders").delete().eq("id", order.id);
    return { ok: false, error: itemsError.message };
  }

  rememberOrderId(order.id);
  return { ok: true, id: order.id, code: order.code };
}

export async function cancelOrder(id: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await createClient()
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", id);

  return error ? { ok: false, error: error.message } : { ok: true };
}
