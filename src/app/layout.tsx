import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import { CatalogRefresh } from "@/components/CatalogRefresh";
import { InstallPrompt } from "@/components/InstallPrompt";
import { ServiceWorker } from "@/components/ServiceWorker";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Kiranaclick",
    template: "%s · Kiranaclick",
  },
  description:
    "Order groceries, fresh fruits and vegetables, snacks and household essentials online.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Kiranaclick" },
  icons: { apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#087828",
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
          {/* One tiny subscription covers the whole catalog — see CatalogRefresh */}
          <CatalogRefresh />
          <ServiceWorker />
          <InstallPrompt />
          {children}
        </AppShell>
      </body>
    </html>
  );
}
