"use client";

import { useRef } from "react";
import { CartProvider } from "@/context/CartContext";
import { VariantModalProvider } from "@/context/VariantModalContext";
import { AddedToCartBanner } from "./AddedToCartBanner";
import { BottomNav } from "./BottomNav";
import { CartDrawer } from "./CartDrawer";
import { Header } from "./Header";
import { LatestOrderStatusDock } from "./LatestOrderStatusDock";
import type { SearchBoxHandle } from "./SearchBox";
import { BottomBar } from "./BottomBar";

/**
 * Client shell: providers plus every globally-mounted surface (cart drawer, pack modal,
 * added-to-cart banner, bottom nav). Pages stay server components.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const searchRef = useRef<SearchBoxHandle>(null);

  return (
    <CartProvider>
      <VariantModalProvider>
        <Header searchRef={searchRef} />

        {/* Bottom padding clears the mobile nav + sticky cart bar */}
        <main className="min-h-[60vh] pb-[calc(9rem+env(safe-area-inset-bottom))] sm:pb-24 lg:pb-10">
          {children}
        </main>

        <SiteFooter />

        <CartDrawer />
        <AddedToCartBanner />
        <LatestOrderStatusDock />
        <BottomBar />
        <BottomNav />
      </VariantModalProvider>
    </CartProvider>
  );
}

function SiteFooter() {
  return (
    <footer className="mt-8 border-t border-ink-100 bg-ink-50 pb-[calc(9rem+env(safe-area-inset-bottom))] sm:pb-24 lg:pb-0">
      <div className="mx-auto max-w-[1400px] px-4 py-8 lg:px-6">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <p className="text-lg font-extrabold text-brand-800">SZepto</p>
          </div>
          <FooterCol title="Company" links={["About us", "Careers", "Blog", "Press"]} />
          <FooterCol
            title="Help"
            links={["Delivery areas", "Return policy", "FAQs", "Contact us"]}
          />
          <FooterCol
            title="Legal"
            links={["Terms of use", "Privacy policy", "Refund policy", "Licences"]}
          />
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-ink-900">{title}</p>
      <ul className="mt-2.5 flex flex-col gap-1.5">
        {links.map((l) => (
          <li key={l}>
            <span className="cursor-default text-xs text-ink-500 transition-colors hover:text-ink-900">
              {l}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
