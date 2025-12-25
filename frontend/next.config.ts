import type { NextConfig } from "next";

// Configure Next.js to serve assets and routes under /cardgames
// This ensures CSS/JS and links work when accessed via innovitecho.cloud/cardgames/
const nextConfig: NextConfig = {
  basePath: "/cardgames",
  assetPrefix: "/cardgames",
  async redirects() {
    return [
      // Ensure direct IP root works by redirecting to basePath
      { source: "/", destination: "/cardgames", permanent: false },
      // Allow deep links without prefix to still resolve
      { source: "/games/:path*", destination: "/cardgames/games/:path*", permanent: false },
    ];
  },
};

export default nextConfig;
