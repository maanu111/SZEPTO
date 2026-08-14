"use client";

import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useSupportSettings } from "@/lib/storefront";
import { WhatsAppIcon } from "./icons";

/**
 * WhatsApp support, floating above the page.
 *
 * The number and the opening message both come from store settings, so the
 * admin can point support at a different phone or reword the greeting without a
 * deploy. With no number configured the button simply does not appear — better
 * than a support link that goes nowhere.
 */
export function SupportButton() {
  const { whatsappNumber, whatsappMessage } = useSupportSettings();
  const { itemCount, hydrated, cartOpen } = useCart();
  const pathname = usePathname();

  if (!whatsappNumber.trim() || cartOpen) return null;

  // wa.me wants digits only — no +, spaces or dashes.
  const digits = whatsappNumber.replace(/\D/g, "");
  if (digits.length < 8) return null;

  const href = `https://wa.me/${digits}${
    whatsappMessage.trim() ? `?text=${encodeURIComponent(whatsappMessage.trim())}` : ""
  }`;

  // Checkout has its own pinned action bar; a floating button would sit on it.
  const onCheckout = pathname?.startsWith("/checkout");
  const hasCartBar = hydrated && itemCount > 0;

  /*
   * Sit clear of the order-status dock.
   *
   * The dock publishes its measured height as `--order-dock-h`, which is 0 when
   * it isn't showing. Reading that instead of hard-coding an offset keeps the
   * button clear even when the dock is expanded — which is one tap away, and
   * roughly doubles its height.
   */
  const base = onCheckout
    ? "calc(5.5rem + env(safe-area-inset-bottom))"
    : hasCartBar
      ? "calc(8.5rem + env(safe-area-inset-bottom))"
      : "calc(4.5rem + env(safe-area-inset-bottom))";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      // Above the dock's own layer, so it is never painted behind it.
      style={{ bottom: `calc(${base} + var(--order-dock-h, 0px))` }}
      className="fixed right-3 z-[55] flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_6px_20px_rgba(37,211,102,0.4)] transition-[transform,bottom] duration-200 hover:scale-105 active:scale-95 sm:right-5 lg:h-14 lg:w-14"
    >
      <WhatsAppIcon className="h-6 w-6 lg:h-7 lg:w-7" />
    </a>
  );
}
