import type { CartLine } from "@/context/CartContext";

/**
 * Export shipping is billed on total consignment weight, so every pack size has to
 * resolve to a weight in kilograms.
 *
 * Mass and volume units convert directly (1 L of a grocery liquid ≈ 1 kg). Count-based
 * packs have no intrinsic weight, so they use a conservative per-item estimate.
 */
const PER_PIECE_KG = 0.15;
const PER_PACK_KG = 0.5;
const FALLBACK_KG = 0.5;

export function unitWeightKg(unit: string): number {
  const match = unit.match(/([\d.]+)\s*(kg|g|l|ml|pcs|pc|pack|packs|pulls)/i);
  if (!match) return FALLBACK_KG;

  const qty = parseFloat(match[1]);
  if (!qty || Number.isNaN(qty)) return FALLBACK_KG;

  switch (match[2].toLowerCase()) {
    case "kg":
      return qty;
    case "g":
      return qty / 1000;
    case "l":
      return qty;
    case "ml":
      return qty / 1000;
    case "pcs":
    case "pc":
      return qty * PER_PIECE_KG;
    case "pack":
    case "packs":
      return qty * PER_PACK_KG;
    case "pulls":
      return 0.3;
    default:
      return FALLBACK_KG;
  }
}

/** Total billable weight of a cart, rounded to 2 decimals to avoid float noise. */
export function cartWeightKg(lines: CartLine[]): number {
  const total = lines.reduce((sum, l) => sum + unitWeightKg(l.unit) * l.qty, 0);
  return Math.round(total * 100) / 100;
}

export type ShippingSettings = {
  /** Fixed export rate charged per kilogram. */
  ratePerKg: number;
  /** Single combined charge: transport, packaging and handling. */
  serviceCharge: number;
};

export const DEFAULT_SHIPPING_SETTINGS: ShippingSettings = {
  ratePerKg: 300,
  serviceCharge: 250,
};

export type Quote = {
  itemTotal: number;
  weightKg: number;
  ratePerKg: number;
  shippingCost: number;
  serviceCharge: number;
  total: number;
};

/** The full bill for a cart: goods + weight-based shipping + one service charge. */
export function quoteCart(
  lines: CartLine[],
  itemTotal: number,
  settings: ShippingSettings
): Quote {
  const weightKg = cartWeightKg(lines);
  const shippingCost = Math.round(weightKg * settings.ratePerKg);
  const serviceCharge = lines.length ? settings.serviceCharge : 0;

  return {
    itemTotal,
    weightKg,
    ratePerKg: settings.ratePerKg,
    shippingCost,
    serviceCharge,
    total: itemTotal + shippingCost + serviceCharge,
  };
}

/** "3.5 kg" / "850 g" — reads naturally at both ends of the scale. */
export function formatWeight(kg: number): string {
  if (kg < 1) return `${Math.round(kg * 1000)} g`;
  return `${Number(kg.toFixed(2))} kg`;
}
