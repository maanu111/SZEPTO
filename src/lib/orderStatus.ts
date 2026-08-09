import type { OrderStatus } from "@/lib/storefront";

/**
 * One source of truth for how an order status is presented.
 *
 * The lifecycle is linear — placed → payment verified → shipped → delivered —
 * with `cancelled` sitting outside it. Every surface (order detail, orders
 * list, the floating dock) reads from here so a status can never be labelled
 * two different ways on two different pages.
 */

/** The happy path, in order. `cancelled` is deliberately not a step. */
export const ORDER_STEPS = ["pending", "confirmed", "shipped", "delivered"] as const;

export const STEP_LABELS: Record<(typeof ORDER_STEPS)[number], string> = {
  pending: "Placed",
  confirmed: "Verified",
  shipped: "Shipped",
  delivered: "Delivered",
};

export type StatusView = {
  /** Short word for chips and badges. */
  label: string;
  /** Headline on the status panel. */
  title: string;
  /** One line of plain reassurance under the headline. */
  message: string;
  /** Subtitle used by the compact floating dock. */
  dockSubtitle: string;
  chip: string;
  panel: string;
  /** How far along the 4-step bar, 0–100. */
  progress: number;
};

const VIEWS: Record<OrderStatus, StatusView> = {
  pending: {
    label: "Placed",
    title: "Payment verification in progress",
    message: "The store has received your screenshot and will verify the payment shortly.",
    dockSubtitle: "We received your payment proof",
    chip: "bg-amber-50 text-amber-800",
    panel: "border-amber-200 bg-amber-50",
    progress: 25,
  },
  confirmed: {
    label: "Verified",
    title: "Payment verified",
    message: "Your payment is confirmed and the store is packing this order.",
    dockSubtitle: "Your order is being packed",
    chip: "bg-save-50 text-save-600",
    panel: "border-save-500/20 bg-save-50",
    progress: 50,
  },
  shipped: {
    label: "Shipped",
    title: "On the way",
    message: "This order has left the store and is on its way to your address.",
    dockSubtitle: "Out for delivery to your address",
    chip: "bg-brand-50 text-brand-700",
    panel: "border-brand-200 bg-brand-50",
    progress: 75,
  },
  delivered: {
    label: "Delivered",
    title: "Delivered",
    message: "This order was delivered. Thanks for shopping with us.",
    dockSubtitle: "Delivered to your address",
    chip: "bg-save-50 text-save-600",
    panel: "border-save-500/20 bg-save-50",
    progress: 100,
  },
  cancelled: {
    label: "Cancelled",
    title: "Order cancelled",
    message: "This order was cancelled. Contact the store if you need help with the payment.",
    dockSubtitle: "View the order for more information",
    chip: "bg-red-50 text-red-700",
    panel: "border-red-200 bg-red-50",
    progress: 100,
  },
};

export function statusView(status: OrderStatus): StatusView {
  return VIEWS[status] ?? VIEWS.pending;
}

/** How many of the four steps are complete. Cancelled stops wherever it stopped. */
export function completedSteps(status: OrderStatus): number {
  if (status === "cancelled") return 1;
  const index = ORDER_STEPS.indexOf(status as (typeof ORDER_STEPS)[number]);
  return index < 0 ? 1 : index + 1;
}

/** Cancelling is only fair before the goods have physically left the store. */
export function canCancel(status: OrderStatus): boolean {
  return status === "pending" || status === "confirmed";
}
