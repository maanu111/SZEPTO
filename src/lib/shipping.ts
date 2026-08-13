import type { CartLine } from "@/context/CartContext";

/**
 * Export shipping is billed on the *chargeable* weight of the consignment, which
 * is not simply what the goods weigh.
 *
 * A carrier sells space as much as it sells lift. A big, light carton — cereal,
 * kitchen rolls, an oversized but half-empty box — occupies room that heavier
 * freight would have paid for, so carriers bill whichever is greater:
 *
 *   actual weight     the real mass of the goods
 *   volumetric weight (length x width x height) / divisor
 *
 * The divisor is the carrier's, not ours; 5000 is the usual air-freight figure
 * and a stricter carrier uses 4000. The admin sets it in Shipping settings.
 */

/** Fallbacks for packs that have no intrinsic mass in their label. */
const PER_PIECE_KG = 0.15;
const PER_PACK_KG = 0.5;
const FALLBACK_KG = 0.5;

/** Litres of a grocery liquid are close enough to kilograms for freight. */
const LITRE_TO_KG = 1;

/**
 * Weight implied by a pack label such as "500 g", "1.5 L" or "6 bottles".
 *
 * Only used when the admin has not recorded a real weight for the variant —
 * an explicit figure always wins over a guess parsed from text.
 */
export function unitWeightKg(unit: string): number {
  const match = unit.match(
    /([\d.]+)\s*(kg|kgs|g|gm|gms|grams?|l|ltr|litres?|liters?|ml|pcs|pc|pieces?|packs?|bottles?|cans?|jars?|boxes|box|dozens?|pulls)/i
  );
  if (!match) return FALLBACK_KG;

  const qty = parseFloat(match[1]);
  if (!qty || Number.isNaN(qty)) return FALLBACK_KG;

  switch (match[2].toLowerCase()) {
    case "kg":
    case "kgs":
      return qty;
    case "g":
    case "gm":
    case "gms":
    case "gram":
    case "grams":
      return qty / 1000;
    case "l":
    case "ltr":
    case "litre":
    case "litres":
    case "liter":
    case "liters":
      return qty * LITRE_TO_KG;
    case "ml":
      return (qty / 1000) * LITRE_TO_KG;
    case "pcs":
    case "pc":
    case "piece":
    case "pieces":
      return qty * PER_PIECE_KG;
    case "dozen":
    case "dozens":
      return qty * 12 * PER_PIECE_KG;
    case "pack":
    case "packs":
    case "box":
    case "boxes":
      return qty * PER_PACK_KG;
    case "bottle":
    case "bottles":
    case "can":
    case "cans":
    case "jar":
    case "jars":
      // A bottle's own label carries no volume, so assume a standard 1 L unit.
      return qty * LITRE_TO_KG;
    case "pulls":
      return 0.3;
    default:
      return FALLBACK_KG;
  }
}

export type Dimensions = {
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
};

/** (L x W x H) / divisor, or 0 when the carton size is unknown. */
export function volumetricWeightKg(dims: Dimensions, divisor: number): number {
  const { lengthCm: l, widthCm: w, heightCm: h } = dims;
  if (!l || !w || !h || divisor <= 0) return 0;
  return (l * w * h) / divisor;
}

/**
 * What one unit of a line is billed at: the greater of what it weighs and what
 * it displaces.
 */
export function chargeableUnitKg(
  line: Pick<CartLine, "unit"> & Partial<Dimensions> & { weightKg?: number | null },
  divisor: number
): number {
  const actual = line.weightKg && line.weightKg > 0 ? line.weightKg : unitWeightKg(line.unit);
  const volumetric = volumetricWeightKg(
    {
      lengthCm: line.lengthCm ?? null,
      widthCm: line.widthCm ?? null,
      heightCm: line.heightCm ?? null,
    },
    divisor
  );
  return Math.max(actual, volumetric);
}

/** Total chargeable weight of a cart, rounded to 2 dp to avoid float noise. */
export function cartWeightKg(lines: CartLine[], divisor = DEFAULT_DIVISOR): number {
  const total = lines.reduce((sum, l) => sum + chargeableUnitKg(l, divisor) * l.qty, 0);
  return Math.round(total * 100) / 100;
}

/** True when volume, not mass, is what the customer is paying for. */
export function isVolumetric(
  line: Pick<CartLine, "unit"> & Partial<Dimensions> & { weightKg?: number | null },
  divisor: number
): boolean {
  const actual = line.weightKg && line.weightKg > 0 ? line.weightKg : unitWeightKg(line.unit);
  return (
    volumetricWeightKg(
      {
        lengthCm: line.lengthCm ?? null,
        widthCm: line.widthCm ?? null,
        heightCm: line.heightCm ?? null,
      },
      divisor
    ) > actual
  );
}

const DEFAULT_DIVISOR = 5000;

export type ShippingSettings = {
  /** Fixed export rate charged per kilogram. */
  ratePerKg: number;
  /** Single combined charge: transport, packaging and handling. */
  serviceCharge: number;
  /** Carrier divisor for volumetric weight. */
  volumetricDivisor: number;
};

export const DEFAULT_SHIPPING_SETTINGS: ShippingSettings = {
  ratePerKg: 300,
  serviceCharge: 250,
  volumetricDivisor: DEFAULT_DIVISOR,
};

export type Quote = {
  itemTotal: number;
  weightKg: number;
  ratePerKg: number;
  shippingCost: number;
  serviceCharge: number;
  total: number;
  /** True when at least one line is billed on volume rather than mass. */
  hasVolumetric: boolean;
};

/** The full bill for a cart: goods + weight-based shipping + one service charge. */
export function quoteCart(
  lines: CartLine[],
  itemTotal: number,
  settings: ShippingSettings
): Quote {
  const divisor = settings.volumetricDivisor || DEFAULT_DIVISOR;
  const weightKg = cartWeightKg(lines, divisor);
  const shippingCost = Math.round(weightKg * settings.ratePerKg);
  const serviceCharge = lines.length ? settings.serviceCharge : 0;

  return {
    itemTotal,
    weightKg,
    ratePerKg: settings.ratePerKg,
    shippingCost,
    serviceCharge,
    total: itemTotal + shippingCost + serviceCharge,
    hasVolumetric: lines.some((l) => isVolumetric(l, divisor)),
  };
}

/** "3.5 kg" / "850 g" — reads naturally at both ends of the scale. */
export function formatWeight(kg: number): string {
  if (kg < 1) return `${Math.round(kg * 1000)} g`;
  return `${Number(kg.toFixed(2))} kg`;
}
