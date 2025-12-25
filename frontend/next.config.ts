import type { NextConfig } from "next";

// Configure Next.js to serve assets and routes under /cardgames
// This ensures CSS/JS and links work when accessed via innovitecho.cloud/cardgames/
const nextConfig: NextConfig = {
  basePath: "/cardgames",
  assetPrefix: "/cardgames",
};

export default nextConfig;
