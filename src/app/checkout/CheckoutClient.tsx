"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { PaymentUpload } from "@/components/checkout/PaymentUpload";
import { CartIcon, CheckIcon, ChevronDown, ChevronRight } from "@/components/icons";
import { useCart } from "@/context/CartContext";
import { inr } from "@/lib/format";
import { quoteCart } from "@/lib/shipping";
import {
  generateOrderId,
  saveOrder,
  usePaymentSettings,
  useShippingSettings,
  type Order,
} from "@/lib/storefront";
import { BillBreakdown } from "@/components/BillBreakdown";


type Form = {
  name: string;
  phone: string;
  address: string;
  landmark: string;
  city: string;
  pincode: string;
};

const EMPTY_FORM: Form = {
  name: "",
  phone: "",
  address: "",
  landmark: "",
  city: "Pune",
  pincode: "",
};

type Errors = Partial<Record<keyof Form | "proof" | "confirm", string>>;

function validate(form: Form): Errors {
  const errors: Errors = {};
  if (form.name.trim().length < 2) errors.name = "Enter your full name.";
  if (!/^[6-9]\d{9}$/.test(form.phone.trim()))
    errors.phone = "Enter a valid 10-digit mobile number.";
  if (form.address.trim().length < 10)
    errors.address = "Enter your flat / building and street.";
  if (form.city.trim().length < 2) errors.city = "Enter your city.";
  if (!/^\d{6}$/.test(form.pincode.trim())) errors.pincode = "Enter a valid 6-digit pincode.";
  return errors;
}

export function CheckoutClient() {
  const router = useRouter();
  const { lines, subtotal, savings, itemCount, hydrated, clearCart } = useCart();

  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [touched, setTouched] = useState<Partial<Record<keyof Form, boolean>>>({});
  const settings = usePaymentSettings();
  const [proof, setProof] = useState<string | null>(null);
  const [proofMeta, setProofMeta] = useState<{ name: string; size: number } | null>(null);
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [openStep, setOpenStep] = useState<number | null>(1);

  const toggleStep = (step: number) => setOpenStep((s) => (s === step ? null : step));

  const shippingSettings = useShippingSettings();
  const quote = quoteCart(lines, subtotal, shippingSettings);
  const total = quote.total;

  const fieldErrors = useMemo(() => validate(form), [form]);

  const errors: Errors = { ...fieldErrors };
  if (!proof) errors.proof = "Upload your payment screenshot to continue.";
  if (!confirmed) errors.confirm = "Please confirm your payment before placing the order.";

  const canPlace =
    Object.keys(errors).length === 0 && lines.length > 0 && Boolean(settings.qrDataUrl);

  const addressComplete = Object.keys(fieldErrors).length === 0;
  const addressSummary = addressComplete
    ? `${form.name}, ${form.phone} · ${form.address}, ${form.city} ${form.pincode}`
    : "Name, phone and delivery address";
  const paySummary = settings.qrDataUrl
    ? `Scan & pay ${inr(total)}${settings.upiId ? ` · ${settings.upiId}` : ""}`
    : "No payment QR configured yet";
  const proofSummary = proof
    ? confirmed
      ? "Screenshot uploaded and payment confirmed"
      : "Screenshot uploaded — confirm your payment"
    : "Upload your payment screenshot";

  const showError = (field: keyof Form) =>
    (touched[field] || submitAttempted) && fieldErrors[field];

  const set = (field: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const blur = (field: keyof Form) => () => setTouched((t) => ({ ...t, [field]: true }));

  const copyUpi = async () => {
    if (!settings.upiId) return;
    try {
      await navigator.clipboard.writeText(settings.upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked — the ID is on screen to copy manually.
    }
  };

  const placeOrder = () => {
    setSubmitAttempted(true);
    setSaveError(null);
    if (!canPlace) {
      document
        .querySelector("[data-checkout-error]")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setPlacing(true);
    const order: Order = {
      id: generateOrderId(),
      placedAt: new Date().toISOString(),
      customer: {
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        landmark: form.landmark.trim(),
        city: form.city.trim(),
        pincode: form.pincode.trim(),
      },
      lines,
      itemTotal: subtotal,
      weightKg: quote.weightKg,
      ratePerKg: quote.ratePerKg,
      shippingCost: quote.shippingCost,
      serviceCharge: quote.serviceCharge,
      total,
      savings,
      paymentProof: proof,
      paymentRef: paymentRef.trim(),
      paymentNote: paymentNote.trim(),
      status: "Payment under verification",
    };

    const result = saveOrder(order);
    if (!result.ok) {
      setSaveError(result.error);
      setPlacing(false);
      return;
    }

    clearCart();
    router.push(`/order/${order.id}`);
  };

  /* ---------------- empty / loading states ---------------- */

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-10 lg:px-6">
        <div className="skeleton h-8 w-48 rounded-lg" />
        <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="skeleton h-96 rounded-xl" />
          <div className="skeleton h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-ink-50 text-ink-400">
          <CartIcon className="h-7 w-7" />
        </span>
        <h1 className="mt-4 text-lg font-bold text-ink-900">Your cart is empty</h1>
        <p className="mt-1 text-sm text-ink-500">
          Add a few items to get started.
        </p>
        <Link
          href="/"
          className="mt-5 rounded-xl bg-accent-500 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-accent-600"
        >
          Start shopping
        </Link>
      </div>
    );
  }

  /* ---------------- checkout ---------------- */

  return (
    <div className="mx-auto max-w-[1400px] px-3 pt-3 sm:px-4 lg:px-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[11px] text-ink-500">
        <Link href="/" className="hover:text-ink-900">
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-semibold text-ink-900">Checkout</span>
      </nav>

      <h1 className="mt-2 text-xl font-bold text-ink-900 sm:text-2xl">Checkout</h1>
      <p className="mt-0.5 text-xs text-ink-500">
        {itemCount} item{itemCount === 1 ? "" : "s"} in your order
      </p>

      <div className="mt-5 grid items-start gap-5 pb-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-6">
        {/* ---------------- left: steps ---------------- */}
        <div className="flex min-w-0 flex-col gap-4">
          {/* Step 1 — address */}
          <Section
            step={1}
            title="Delivery details"
            open={openStep === 1}
            onToggle={() => toggleStep(1)}
            complete={addressComplete}
            summary={addressSummary}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Full name"
                value={form.name}
                onChange={set("name")}
                onBlur={blur("name")}
                error={showError("name")}
                autoComplete="name"
                placeholder="Priya Sharma"
              />
              <Field
                label="Mobile number"
                value={form.phone}
                onChange={set("phone")}
                onBlur={blur("phone")}
                error={showError("phone")}
                autoComplete="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="9876543210"
              />
              <Field
                className="sm:col-span-2"
                label="Flat, building & street"
                value={form.address}
                onChange={set("address")}
                onBlur={blur("address")}
                error={showError("address")}
                autoComplete="street-address"
                placeholder="Flat 402, Rohan Nilay, Baner Road"
              />
              <Field
                className="sm:col-span-2"
                label="Landmark"
                optional
                value={form.landmark}
                onChange={set("landmark")}
                onBlur={blur("landmark")}
                placeholder="Opposite D-Mart"
              />
              <Field
                label="City"
                value={form.city}
                onChange={set("city")}
                onBlur={blur("city")}
                error={showError("city")}
                autoComplete="address-level2"
              />
              <Field
                label="Pincode"
                value={form.pincode}
                onChange={set("pincode")}
                onBlur={blur("pincode")}
                error={showError("pincode")}
                autoComplete="postal-code"
                inputMode="numeric"
                maxLength={6}
                placeholder="411007"
              />
            </div>
            <ContinueButton
              label="Continue to payment"
              onClick={() => setOpenStep(2)}
              disabled={!addressComplete}
            />
          </Section>

          {/* Step 2 — pay */}
          <Section
            step={2}
            title="Pay by UPI"
            open={openStep === 2}
            onToggle={() => toggleStep(2)}
            complete={Boolean(proof)}
            summary={paySummary}
          >
            {settings.qrDataUrl ? (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="mx-auto w-full max-w-[15rem] shrink-0 sm:mx-0">
                  <div className="relative aspect-square overflow-hidden rounded-xl border border-ink-200 bg-white p-2">
                    <Image
                      src={settings.qrDataUrl}
                      alt="Scan this QR code to pay"
                      fill
                      sizes="240px"
                      className="object-contain p-1"
                      unoptimized
                    />
                  </div>
                  <p className="mt-2 text-center text-[11px] text-ink-500">
                    Scan with any UPI app
                  </p>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="rounded-xl bg-brand-50 px-3.5 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700">
                      Amount to pay
                    </p>
                    <p className="mt-0.5 text-2xl font-extrabold tabular-nums text-brand-800">
                      {inr(total)}
                    </p>
                    <p className="mt-1 text-[11px] text-brand-700">
                      Pay this exact amount.
                    </p>
                  </div>

                  {settings.payeeName && (
                    <Row label="Pay to" value={settings.payeeName} />
                  )}
                  {settings.upiId && (
                    <div className="mt-2.5 flex items-center justify-between gap-2 rounded-lg border border-ink-200 px-3 py-2">
                      <span className="min-w-0">
                        <span className="block text-[10px] font-bold uppercase tracking-wide text-ink-400">
                          UPI ID
                        </span>
                        <span className="block truncate text-[13px] font-semibold text-ink-900">
                          {settings.upiId}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={copyUpi}
                        className="shrink-0 rounded-lg border border-ink-200 px-2.5 py-1.5 text-[11px] font-bold text-ink-700 transition-colors hover:border-brand-500 hover:text-brand-700"
                      >
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                  )}

                  {settings.note && (
                    <p className="mt-3 rounded-lg bg-ink-50 px-3 py-2.5 text-[12px] leading-relaxed text-ink-700">
                      {settings.note}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4">
                <p className="text-[13px] font-bold text-amber-900">
                  UPI payment is temporarily unavailable
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-amber-800">
                  Please try again later.
                </p>
              </div>
            )}
            {settings.qrDataUrl && (
              <ContinueButton label="I've paid — upload proof" onClick={() => setOpenStep(3)} />
            )}
          </Section>

          {/* Step 3 — proof */}
          <Section
            step={3}
            title="Upload payment proof"
            open={openStep === 3}
            onToggle={() => toggleStep(3)}
            complete={Boolean(proof) && confirmed}
            summary={proofSummary}
          >
            <p className="-mt-1 mb-3 text-[12px] leading-relaxed text-ink-500">
              Upload a screenshot of your successful payment.
            </p>

            <PaymentUpload
              value={proof}
              fileMeta={proofMeta}
              onChange={(dataUrl, meta) => {
                setProof(dataUrl);
                setProofMeta(meta);
              }}
            />
            {submitAttempted && errors.proof && (
              <p data-checkout-error role="alert" className="mt-2 text-[11px] font-medium text-red-600">
                {errors.proof}
              </p>
            )}

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold text-ink-700">
                  Transaction ID <span className="font-normal text-ink-400">(optional)</span>
                </span>
                <input
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. 412345678901"
                  className="h-10 w-full rounded-lg border border-ink-200 px-3 text-[13px] text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-500"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold text-ink-700">
                  Note <span className="font-normal text-ink-400">(optional)</span>
                </span>
                <input
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="Paid from GPay ending 4432"
                  className="h-10 w-full rounded-lg border border-ink-200 px-3 text-[13px] text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-500"
                />
              </label>
            </div>

            {/* Explicit confirmation */}
            <label
              className={`mt-3 flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition-colors ${
                confirmed ? "border-save-500 bg-save-50" : "border-ink-200 hover:border-ink-400"
              }`}
            >
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="sr-only"
              />
              <span
                className={`mt-px flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border-2 transition-colors ${
                  confirmed ? "border-save-500 bg-save-500" : "border-ink-200"
                }`}
                aria-hidden="true"
              >
                {confirmed && <CheckIcon className="h-3 w-3 text-white" strokeWidth={3.5} />}
              </span>
              <span className="text-[12px] leading-relaxed text-ink-700">
                I&apos;ve paid <span className="font-bold text-ink-900">{inr(total)}</span> and uploaded
                the correct screenshot.
              </span>
            </label>
            {submitAttempted && errors.confirm && (
              <p role="alert" className="mt-1.5 text-[11px] font-medium text-red-600">
                {errors.confirm}
              </p>
            )}
          </Section>
        </div>

        {/* ---------------- right: summary ---------------- */}
        <aside className="lg:sticky lg:top-[6rem]">
          <div className="overflow-hidden rounded-xl border border-ink-100">
            <h2 className="border-b border-ink-100 px-4 py-3 text-sm font-bold text-ink-900">
              Order summary
            </h2>

            <ul className="thin-scrollbar max-h-64 divide-y divide-ink-100 overflow-y-auto px-4">
              {lines.map((l) => (
                <li key={l.key} className="flex items-center gap-2.5 py-2.5">
                  <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-ink-50">
                    <Image src={l.image} alt="" fill sizes="44px" className="object-contain p-1" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 block text-[12px] font-medium text-ink-900">
                      {l.name}
                    </span>
                    <span className="mt-0.5 block">
                      <span className="rounded bg-accent-50 px-1.5 py-px text-[10px] font-bold text-accent-500">{l.variantLabel}</span>
                      <span className="ml-1 text-[11px] text-ink-500">× {l.qty}</span>
                    </span>
                  </span>
                  <span className="shrink-0 text-[12px] font-bold tabular-nums text-ink-900">
                    {inr(l.price * l.qty)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="border-t border-ink-100 px-4 py-3">
              <BillBreakdown quote={quote} savings={savings} />
            </div>
          </div>

          {saveError && (
            <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[12px] font-medium text-red-700">
              {saveError}
            </p>
          )}

          {/* Desktop CTA */}
          <button
            type="button"
            onClick={placeOrder}
            disabled={placing}
            className="mt-3 hidden h-12 w-full items-center justify-center rounded-xl bg-accent-500 text-sm font-bold text-white transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:bg-ink-200 lg:flex"
          >
            {placing ? "Placing order…" : `Place order · ${inr(total)}`}
          </button>
          {!canPlace && submitAttempted && (
            <p className="mt-1.5 hidden text-center text-[11px] text-ink-500 lg:block">
              Complete the steps above.
            </p>
          )}
        </aside>
      </div>

      {/* Mobile CTA — sits above the bottom tab bar, which is only rendered below `sm` */}
      <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-40 border-t border-ink-100 bg-white px-3 pb-3 pt-3 sm:bottom-0 sm:pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <button
          type="button"
          onClick={placeOrder}
          disabled={placing}
          className="flex h-12 w-full items-center justify-between rounded-xl bg-accent-500 px-4 text-white transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:bg-ink-200"
        >
          <span className="flex flex-col items-start leading-tight">
            <span className="text-[15px] font-bold tabular-nums">{inr(total)}</span>
            <span className="text-[10px] text-white/80">TOTAL</span>
          </span>
          <span className="text-sm font-bold">{placing ? "Placing order…" : "Place order →"}</span>
        </button>
      </div>
    </div>
  );
}

/* ---------------- small building blocks ---------------- */

/**
 * Collapsible checkout step. Only one is open at a time, so the page never looks
 * like a wall of fields — completed steps collapse to a one-line summary.
 */
function Section({
  step,
  title,
  open,
  onToggle,
  complete,
  summary,
  children,
}: {
  step: number;
  title: string;
  open: boolean;
  onToggle: () => void;
  complete?: boolean;
  summary?: string;
  children: React.ReactNode;
}) {
  const panelId = `checkout-step-${step}`;

  return (
    <section
      className={`overflow-hidden rounded-xl border transition-colors ${
        open ? "border-ink-200" : "border-ink-100"
      }`}
    >
      <h2>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full items-center gap-2.5 p-4 text-left transition-colors hover:bg-ink-50"
        >
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white transition-colors ${
              complete ? "bg-save-500" : "bg-brand-700"
            }`}
          >
            {complete ? <CheckIcon className="h-3 w-3" strokeWidth={3.5} /> : step}
          </span>

          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-ink-900">{title}</span>
            {!open && summary && (
              <span className="mt-0.5 block truncate text-[11px] text-ink-500">{summary}</span>
            )}
          </span>

          <ChevronDown
            className={`h-4 w-4 shrink-0 text-ink-500 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
      </h2>

      {/* 0fr → 1fr animates to the content's natural height */}
      <div
        id={panelId}
        className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4">{children}</div>
        </div>
      </div>
    </section>
  );
}

/** Advances the accordion to the next step. */
function ContinueButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mt-4 h-10 w-full rounded-lg bg-brand-700 text-[13px] font-bold text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-ink-200 sm:w-auto sm:px-6"
    >
      {label}
    </button>
  );
}

function Field({
  label,
  optional,
  error,
  className = "",
  ...props
}: {
  label: string;
  optional?: boolean;
  error?: string | false;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[11px] font-semibold text-ink-700">
        {label} {optional && <span className="font-normal text-ink-400">(optional)</span>}
      </span>
      <input
        {...props}
        aria-invalid={Boolean(error)}
        className={`h-10 w-full rounded-lg border px-3 text-[13px] text-ink-900 outline-none transition-colors placeholder:text-ink-400 ${
          error ? "border-red-400 bg-red-50 focus:border-red-500" : "border-ink-200 focus:border-brand-500"
        }`}
      />
      {error && (
        <span data-checkout-error role="alert" className="mt-1 block text-[11px] font-medium text-red-600">
          {error}
        </span>
      )}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-2.5 rounded-lg border border-ink-200 px-3 py-2">
      <span className="block text-[10px] font-bold uppercase tracking-wide text-ink-400">
        {label}
      </span>
      <span className="block truncate text-[13px] font-semibold text-ink-900">{value}</span>
    </div>
  );
}
