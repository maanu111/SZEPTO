import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import { RealtimeRefresh } from "@/components/RealtimeRefresh";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SZepto",
    template: "%s · SZepto",
  },
  description:
    "Order groceries, fresh fruits and vegetables, snacks and household essentials online.",
};

export const viewport: Viewport = {
  themeColor: "#6d1b8c",
  width: "device-width",
  initialScale: 1,
  // Let people zoom — capping it is an accessibility failure.
  maximumScale: 5,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-white">
        <AppShell footer={<SiteFooter />}>
          {/* Catalog and settings edits in the admin reach shoppers without a reload */}
          <RealtimeRefresh
            tables={[
              "products",
              "product_variants",
              "categories",
              "banners",
              "store_settings",
              "pages",
              "orders",
            ]}
          />
          {children}
        </AppShell>
      </body>
    </html>
  );
}
