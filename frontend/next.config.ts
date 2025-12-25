import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Always use /cardgames as basePath for production
  // For local dev (IP access), use npm run dev without NEXT_PUBLIC_BASE_PATH
  basePath: '/cardgames',
  assetPrefix: '/cardgames',
};

export default nextConfig;
