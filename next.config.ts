import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * Self-contained server build.
   *
   * Produces `.next/standalone` with a `server.js` and only the node_modules
   * actually reached at runtime, so the upload is tens of megabytes instead of
   * hundreds. Required when the host has no build step of its own.
   */
  output: "standalone",
  // This app sits beside another one; without a root, tracing walks up and
  // drags the sibling's files into the bundle.
  outputFileTracingRoot: __dirname,
  devIndicators: false,
  images: {
    remotePatterns: [
      // Seeded placeholder images — remove once you have real product photos
      { protocol: "https", hostname: "cdn.dummyjson.com", pathname: "/**" },
      // Supabase Storage — product images, banners, QR codes, payment proofs
      { protocol: "https", hostname: "ktjusregeorxootlmgca.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
    formats: ["image/webp"],
    /*
     * How long an optimised image is served before Next re-fetches the original.
     *
     * The default is 60 seconds, which means every product photo is pulled from
     * Supabase Storage roughly once a minute per size per edge region — the
     * single largest source of egress on a catalog site. Uploads already carry a
     * one-year cache header, so a matching TTL here means each image leaves
     * Supabase once and is then served from the CDN.
     */
    minimumCacheTTL: 60 * 60 * 24 * 31,
    // Narrower set than the default: fewer variants means fewer origin pulls.
    deviceSizes: [360, 480, 640, 828, 1080, 1440, 1920],
    imageSizes: [48, 64, 96, 128, 256],
  },
};

export default nextConfig;
