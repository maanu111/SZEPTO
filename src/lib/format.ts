/** ₹1,299 — no decimals, matches how Indian grocery apps print shelf prices. */
export function inr(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

/**
 * Normalised unit price, e.g. "₹280/kg" for a 500 g pack at ₹140.
 * Returns null when the pack size can't be parsed into a comparable quantity.
 */
export function unitPrice(price: number, unit: string): string | null {
  const match = unit.match(/([\d.]+)\s*(kg|g|l|ml|pcs|pc|pack|packs|pulls)/i);
  if (!match) return null;

  const qty = parseFloat(match[1]);
  if (!qty || Number.isNaN(qty)) return null;
  const measure = match[2].toLowerCase();

  if (measure === "kg") return `${inr(price / qty)}/kg`;
  if (measure === "g") return `${inr(price / (qty / 1000))}/kg`;
  if (measure === "l") return `${inr(price / qty)}/L`;
  if (measure === "ml") return `${inr(price / (qty / 1000))}/L`;
  if (measure === "pcs" || measure === "pc") return `${inr(price / qty)}/pc`;
  if (measure === "pack" || measure === "packs") return qty > 1 ? `${inr(price / qty)}/pack` : null;
  return null;
}

/** Percentage saved off MRP, floored — never advertise a discount larger than reality. */
export function discountPct(price: number, mrp: number): number {
  if (mrp <= price) return 0;
  return Math.floor(((mrp - price) / mrp) * 100);
}
