import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use basePath only when deployed behind nginx (via env var)
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  async redirects() {
    return [];
  },
};

export default nextConfig;
