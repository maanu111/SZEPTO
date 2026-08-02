import { inr } from "@/lib/format";
import { formatWeight, type Quote } from "@/lib/shipping";

/**
 * The order bill, with the weight-based shipping maths shown in full so the
 * customer can check it themselves.
 */
export function BillBreakdown({
  quote,
  savings = 0,
  compact = false,
}: {
  quote: Quote;
  savings?: number;
  compact?: boolean;
}) {
  const size = compact ? "text-[11px]" : "text-xs";

  return (
    <div>
      <dl className={`flex flex-col gap-2 ${size}`}>
        <div className="flex justify-between text-ink-700">
          <dt>Item total</dt>
          <dd className="tabular-nums">{inr(quote.itemTotal)}</dd>
        </div>

        {/* Shipping, with the calculation spelled out */}
        <div className="flex items-start justify-between gap-3 text-ink-700">
          <dt className="min-w-0">
            Shipping
            <span className="mt-0.5 block text-[10px] leading-snug text-ink-400">
              <span className="rounded bg-accent-50 px-1 py-px font-bold text-accent-500">
                {formatWeight(quote.weightKg)}
              </span>{" "}
              ×{" "}
              <span className="rounded bg-accent-50 px-1 py-px font-bold text-accent-500">
                {inr(quote.ratePerKg)}/kg
              </span>
            </span>
          </dt>
          <dd className="shrink-0 tabular-nums">{inr(quote.shippingCost)}</dd>
        </div>

        <div className="flex items-start justify-between gap-3 text-ink-700">
          <dt className="min-w-0">
            Service charges
            <span className="mt-0.5 block text-[10px] leading-snug text-ink-400">
              Transport, packaging &amp; handling
            </span>
          </dt>
          <dd className="shrink-0 tabular-nums">{inr(quote.serviceCharge)}</dd>
        </div>

        <div className="mt-1 flex justify-between border-t border-dashed border-ink-200 pt-2.5 text-[15px] font-bold text-ink-900">
          <dt>To pay</dt>
          <dd className="tabular-nums">{inr(quote.total)}</dd>
        </div>
      </dl>

      {savings > 0 && (
        <p className="mt-2 rounded-lg bg-save-50 px-2.5 py-1.5 text-center text-[11px] font-bold text-save-500">
          You save {inr(savings)} on this order
        </p>
      )}
    </div>
  );
}
