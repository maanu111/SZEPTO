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
export function AppShell({
  children,
  footer,
}: {
  children: React.ReactNode;
  /** Rendered by the server layout so footer links can come from the database. */
  footer?: React.ReactNode;
}) {
  const searchRef = useRef<SearchBoxHandle>(null);

  return (
    <CartProvider>
      <VariantModalProvider>
        <Header searchRef={searchRef} />

        {/* Bottom padding clears the mobile nav + sticky cart bar */}
        <main className="min-h-[60vh] pb-[calc(9rem+env(safe-area-inset-bottom))] sm:pb-24 lg:pb-10">
          {children}
        </main>

        {footer}

        <CartDrawer />
        <AddedToCartBanner />
        <LatestOrderStatusDock />
        <BottomBar />
        <BottomNav />
      </VariantModalProvider>
    </CartProvider>
  );
}
