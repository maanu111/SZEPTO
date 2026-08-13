"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronRight, LogoutIcon, OrdersIcon } from "@/components/icons";
import { inr } from "@/lib/format";
import { statusView } from "@/lib/orderStatus";
import { signOutCustomer, updateCustomerProfile, useCustomer } from "@/lib/customer";
import { forgetMyOrders, useOrders } from "@/lib/storefront";
import { detectAddress } from "@/lib/useCurrentLocation";
import { useIsMounted } from "@/lib/useIsMounted";

type Draft = {
  name: string;
  whatsapp: string;
  address: string;
  landmark: string;
  city: string;
  pincode: string;
};

export function ProfileClient() {
  const router = useRouter();
  const { customer, loading } = useCustomer();
  const { orders } = useOrders();
  const ready = useIsMounted() && !loading;

  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const [detected, setDetected] = useState<{ latitude: number; longitude: number } | null>(null);

  // Seed the form from the account the first time it arrives, and again if the
  // account itself changes. Derived during render rather than in an effect, so
  // there is no flash of an empty form and no second render pass.
  const [seededFor, setSeededFor] = useState<string | null>(null);
  if (customer && seededFor !== customer.id) {
    setSeededFor(customer.id);
    setDraft({
      name: customer.name,
      whatsapp: customer.whatsapp,
      address: customer.address,
      landmark: customer.landmark,
      city: customer.city,
      pincode: customer.pincode,
    });
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-2xl px-3 py-6 sm:px-4">
        <div className="skeleton h-8 w-40 rounded-lg" />
        <div className="mt-4 flex flex-col gap-4">
          <div className="skeleton h-28 rounded-2xl" />
          <div className="skeleton h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="mx-auto flex min-h-[26rem] max-w-md flex-col items-center justify-center px-4 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ink-50 text-ink-400">
          <OrdersIcon className="h-8 w-8" />
        </span>
        <h1 className="mt-4 text-lg font-bold text-ink-900">No account yet</h1>
        <p className="mt-1 max-w-sm text-sm leading-relaxed text-ink-500">
          Your account is created automatically when you place your first order — there is nothing
          to sign up for.
        </p>
        <Link
          href="/"
          className="mt-5 flex h-11 items-center justify-center rounded-xl bg-accent-500 px-6 text-sm font-bold text-white transition-colors hover:bg-accent-600"
        >
          Start shopping
        </Link>
      </div>
    );
  }

  const d = draft ?? {
    name: customer.name,
    whatsapp: customer.whatsapp,
    address: customer.address,
    landmark: customer.landmark,
    city: customer.city,
    pincode: customer.pincode,
  };
  const set = (k: keyof Draft, v: string) => setDraft({ ...d, [k]: v });

  const dirty =
    d.name !== customer.name ||
    d.whatsapp !== customer.whatsapp ||
    d.address !== customer.address ||
    d.landmark !== customer.landmark ||
    d.city !== customer.city ||
    d.pincode !== customer.pincode;

  const useMyLocation = async () => {
    setLocating(true);
    setError(null);
    const result = await detectAddress();
    setLocating(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDraft({
      ...d,
      address: result.address || d.address,
      city: result.city || d.city,
      pincode: result.pincode || d.pincode,
    });
    setDetected({ latitude: result.latitude, longitude: result.longitude });
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    const result = await updateCustomerProfile(customer.id, {
      ...d,
      // Only claim the address was detected when it actually was, this visit.
      ...(detected
        ? { locationSource: "gps" as const, latitude: detected.latitude, longitude: detected.longitude }
        : {}),
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error ?? "Could not save.");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  const recent = orders.slice(0, 3);
  const spent = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="mx-auto w-full max-w-2xl px-3 pb-10 pt-4 sm:px-4 sm:pt-6">
      <h1 className="text-xl font-extrabold tracking-tight text-ink-900 sm:text-2xl">My profile</h1>
      <p className="mt-0.5 text-xs text-ink-500">
        Created {new Date(customer.createdAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </p>

      {/* Summary */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Stat label="Orders" value={String(orders.length)} />
        <Stat label="Spent" value={inr(spent)} />
        <Stat
          label="Address"
          value={customer.locationSource === "gps" ? "Detected" : "Typed in"}
          className="col-span-2 sm:col-span-1"
        />
      </div>

      {/* Account details */}
      <section className="mt-4 rounded-2xl border border-ink-100 bg-white p-4">
        <h2 className="text-sm font-extrabold text-ink-900">Your details</h2>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Name">
            <input
              value={d.name}
              onChange={(e) => set("name", e.target.value)}
              className="input"
              placeholder="Your full name"
            />
          </Field>

          <Field label="Mobile number" hint="Can't be changed">
            <input value={customer.phone} readOnly disabled className="input opacity-60" />
          </Field>

          <Field label="WhatsApp" hint="Optional">
            <input
              value={d.whatsapp}
              onChange={(e) => set("whatsapp", e.target.value)}
              className="input"
              placeholder="If different from your mobile"
            />
          </Field>

          <Field label="Pincode">
            <input
              value={d.pincode}
              onChange={(e) => set("pincode", e.target.value)}
              className="input"
              inputMode="numeric"
              placeholder="411007"
            />
          </Field>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wide text-ink-400">
            Delivery address
          </span>
          <button
            type="button"
            onClick={useMyLocation}
            disabled={locating}
            className="text-[11px] font-bold text-brand-700 transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            {locating ? "Detecting…" : "Use my current location"}
          </button>
        </div>

        <textarea
          value={d.address}
          onChange={(e) => set("address", e.target.value)}
          rows={2}
          className="input mt-1.5 h-auto py-2.5"
          placeholder="Flat / building and street"
        />

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Landmark" hint="Optional">
            <input
              value={d.landmark}
              onChange={(e) => set("landmark", e.target.value)}
              className="input"
              placeholder="Near…"
            />
          </Field>
          <Field label="City">
            <input
              value={d.city}
              onChange={(e) => set("city", e.target.value)}
              className="input"
              placeholder="Pune"
            />
          </Field>
        </div>

        {error && <p className="mt-3 text-xs font-semibold text-red-600">{error}</p>}

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={!dirty || saving}
            className="flex h-11 items-center justify-center rounded-xl bg-accent-500 px-5 text-sm font-bold text-white transition-colors hover:bg-accent-600 disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          {saved && <span className="text-xs font-bold text-save-600">Saved</span>}
          {dirty && !saving && !saved && (
            <span className="text-xs text-ink-400">Unsaved changes</span>
          )}
        </div>
      </section>

      {/* Recent orders */}
      <section className="mt-4 overflow-hidden rounded-2xl border border-ink-100 bg-white">
        <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3.5">
          <h2 className="text-sm font-extrabold text-ink-900">Recent orders</h2>
          <Link href="/orders" className="text-[11px] font-bold text-brand-700">
            View all
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="px-4 py-8 text-center text-xs text-ink-500">No orders yet.</p>
        ) : (
          <ul className="divide-y divide-ink-100">
            {recent.map((order) => {
              const view = statusView(order.status);
              return (
                <li key={order.id}>
                  <Link
                    href={`/order/${order.id}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-ink-50"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-bold text-ink-900">
                        {order.code}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-ink-500">
                        {new Date(order.placedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}{" "}
                        &middot; {order.lines.length} item{order.lines.length === 1 ? "" : "s"}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${view.chip}`}
                    >
                      {view.label}
                    </span>
                    <span className="shrink-0 text-[13px] font-bold tabular-nums text-ink-900">
                      {inr(order.total)}
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-ink-300" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Sign out */}
      <section className="mt-4 rounded-2xl border border-ink-100 bg-white p-4">
        {confirmingSignOut ? (
          <>
            <p className="text-[13px] font-bold text-ink-900">Sign out of this device?</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-500">
              Your orders stay with the store, but this browser will stop showing them. Placing a
              new order starts a fresh account.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  signOutCustomer();
                  forgetMyOrders();
                  router.push("/");
                }}
                className="h-10 flex-1 rounded-xl bg-red-600 text-xs font-bold text-white transition-colors hover:bg-red-700"
              >
                Yes, sign out
              </button>
              <button
                type="button"
                onClick={() => setConfirmingSignOut(false)}
                className="h-10 flex-1 rounded-xl border border-ink-200 bg-white text-xs font-bold text-ink-700 transition-colors hover:border-ink-400"
              >
                Stay signed in
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingSignOut(true)}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-ink-200 text-xs font-bold text-ink-600 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600"
          >
            <LogoutIcon className="h-4 w-4" />
            Sign out
          </button>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-ink-100 bg-white px-3 py-2.5 ${className}`}>
      <p className="text-[10px] font-bold uppercase tracking-wide text-ink-400">{label}</p>
      <p className="mt-0.5 truncate text-[15px] font-extrabold text-ink-900">{value}</p>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 flex items-baseline gap-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wide text-ink-400">{label}</span>
        {hint && <span className="text-[10px] text-ink-400">{hint}</span>}
      </span>
      {children}
    </label>
  );
}
