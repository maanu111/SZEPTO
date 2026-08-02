/** ₹1,299 — no decimals, matches how Indian grocery apps print shelf prices. */
export function inr(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

/** Percentage saved off MRP, floored — never advertise a discount larger than reality. */
export function discountPct(price: number, mrp: number): number {
  if (mrp <= price) return 0;
  return Math.floor(((mrp - price) / mrp) * 100);
}
