import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      // Seeded placeholder images — remove once you have real product photos
      { protocol: "https", hostname: "cdn.dummyjson.com", pathname: "/**" },
      // Supabase Storage — product images, banners, QR codes, payment proofs
      { protocol: "https", hostname: "ktjusregeorxootlmgca.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
    formats: ["image/webp"],
  },
};

export default nextConfig;
