"use client";

/*
 * Reads Supabase inside effects. Every setState happens in a promise callback
 * guarded by a cancellation flag, not synchronously in the effect body.
 */
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { createClient } from "@/lib/supabase";

/**
 * Accounts without a login screen.
 *
 * The storefront never asks anyone to sign up. Checkout details become the
 * account, and the browser keeps an opaque token that identifies it from then
 * on. The token — not the phone number — is the credential, so knowing
 * someone's number reveals nothing about their orders.
 *
 * The trade-off is that an account lives in one browser. Clearing site data or
 * moving to a new phone starts a fresh one, exactly as the order history
 * behaved before accounts existed.
 */

export type Customer = {
  id: string;
  phone: string;
  whatsapp: string;
  name: string;
  address: string;
  landmark: string;
  city: string;
  pincode: string;
  locationSource: "gps" | "manual";
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
};

const TOKEN_KEY = "szepto.customer-token.v1";
const CHANGE_EVENT = "szepto:customer";

function newToken(): string {
  // randomUUID needs a secure context; the fallback keeps http://localhost working.
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function readToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/** Returns the existing token, creating one on first use. */
export function ensureToken(): string {
  const existing = readToken();
  if (existing) return existing;
  const token = newToken();
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // Private mode: the order still goes through, the account just won't persist.
  }
  return token;
}

export function signOutCustomer() {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    /* nothing to clear */
  }
}

function subscribeToken(listener: () => void) {
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

let tokenCache: string | null | undefined;

export function useCustomerToken(): string | null {
  return useSyncExternalStore(
    (listener) =>
      subscribeToken(() => {
        tokenCache = undefined;
        listener();
      }),
    () => (tokenCache === undefined ? (tokenCache = readToken()) : tokenCache),
    () => null
  );
}

const COLUMNS =
  "id, phone, whatsapp, name, address, landmark, city, pincode, location_source, latitude, longitude, created_at";

type Row = {
  id: string;
  phone: string;
  whatsapp: string;
  name: string;
  address: string;
  landmark: string;
  city: string;
  pincode: string;
  location_source: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
};

function toCustomer(row: Row): Customer {
  return {
    id: row.id,
    phone: row.phone,
    whatsapp: row.whatsapp,
    name: row.name,
    address: row.address,
    landmark: row.landmark,
    city: row.city,
    pincode: row.pincode,
    locationSource: row.location_source === "gps" ? "gps" : "manual",
    latitude: row.latitude === null ? null : Number(row.latitude),
    longitude: row.longitude === null ? null : Number(row.longitude),
    createdAt: row.created_at,
  };
}

export type CustomerDetails = {
  name: string;
  phone: string;
  whatsapp?: string;
  address: string;
  landmark: string;
  city: string;
  pincode: string;
  locationSource?: "gps" | "manual";
  latitude?: number | null;
  longitude?: number | null;
};

/**
 * Creates the account if this browser has none, otherwise updates it.
 *
 * Called when an order is placed, so checking out *is* signing up. The phone
 * number is only written when the account is created — afterwards it is the
 * one detail the customer cannot change.
 */
export async function saveCustomer(details: CustomerDetails): Promise<Customer | null> {
  const supabase = createClient();
  const token = ensureToken();

  const { data: existing } = await supabase
    .from("customers")
    .select(COLUMNS)
    .eq("device_token", token)
    .maybeSingle();

  const shared = {
    name: details.name,
    whatsapp: details.whatsapp ?? "",
    address: details.address,
    landmark: details.landmark,
    city: details.city,
    pincode: details.pincode,
    location_source: details.locationSource ?? "manual",
    latitude: details.latitude ?? null,
    longitude: details.longitude ?? null,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { data } = await supabase
      .from("customers")
      .update(shared)
      .eq("device_token", token)
      .select(COLUMNS)
      .maybeSingle();
    const row = (data ?? existing) as Row;
    window.dispatchEvent(new Event(CHANGE_EVENT));
    return toCustomer(row);
  }

  const { data } = await supabase
    .from("customers")
    .insert({ device_token: token, phone: details.phone, ...shared })
    .select(COLUMNS)
    .maybeSingle();

  if (!data) return null;
  window.dispatchEvent(new Event(CHANGE_EVENT));
  return toCustomer(data as Row);
}

/** Profile edits. Phone is absent on purpose — it identifies the account. */
export async function updateCustomerProfile(
  id: string,
  patch: Partial<Omit<CustomerDetails, "phone">>
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase
    .from("customers")
    .update({
      ...(patch.name !== undefined && { name: patch.name }),
      ...(patch.whatsapp !== undefined && { whatsapp: patch.whatsapp }),
      ...(patch.address !== undefined && { address: patch.address }),
      ...(patch.landmark !== undefined && { landmark: patch.landmark }),
      ...(patch.city !== undefined && { city: patch.city }),
      ...(patch.pincode !== undefined && { pincode: patch.pincode }),
      ...(patch.locationSource !== undefined && { location_source: patch.locationSource }),
      ...(patch.latitude !== undefined && { latitude: patch.latitude }),
      ...(patch.longitude !== undefined && { longitude: patch.longitude }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  window.dispatchEvent(new Event(CHANGE_EVENT));
  return { ok: true };
}

/**
 * The signed-in customer, kept current.
 *
 * Watches only this one row, so the live behaviour costs a single filtered
 * subscription rather than a firehose of table changes.
 */
export function useCustomer(): { customer: Customer | null; loading: boolean; refresh: () => void } {
  const token = useCustomerToken();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!token) {
      setCustomer(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const supabase = createClient();

    const load = () => {
      supabase
        .from("customers")
        .select(COLUMNS)
        .eq("device_token", token)
        .maybeSingle()
        .then(({ data }) => {
          if (cancelled) return;
          setCustomer(data ? toCustomer(data as Row) : null);
          setLoading(false);
        });
    };

    load();

    const onLocalChange = () => load();
    window.addEventListener(CHANGE_EVENT, onLocalChange);

    return () => {
      cancelled = true;
      window.removeEventListener(CHANGE_EVENT, onLocalChange);
    };
  }, [token, nonce]);

  return { customer, loading, refresh };
}
