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

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className={`fixed right-3 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_6px_20px_rgba(37,211,102,0.4)] transition-transform hover:scale-105 active:scale-95 sm:right-5 lg:h-14 lg:w-14 ${
        onCheckout
          ? "bottom-[calc(5.5rem+env(safe-area-inset-bottom))] sm:bottom-6"
          : hasCartBar
            ? "bottom-[calc(8.5rem+env(safe-area-inset-bottom))] sm:bottom-[5.5rem] lg:bottom-24"
            : "bottom-[calc(4.5rem+env(safe-area-inset-bottom))] sm:bottom-5 lg:bottom-6"
      }`}
    >
      <WhatsAppIcon className="h-6 w-6 lg:h-7 lg:w-7" />
    </a>
  );
}
