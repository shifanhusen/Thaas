import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // IMPORTANT:
  // nginx is configured to proxy ONLY /cardgames/* and to STRIP the /cardgames prefix.
  // So the app must:
  // 1) publish assets under /cardgames/_next/... (so nginx proxies them)
  // 2) accept /cardgames/* URLs (for direct-IP access) and internally treat them as /*
  // We do that with assetPrefix + rewrites (NOT basePath).
  basePath: "",
  assetPrefix: "/cardgames",

  async rewrites() {
    return [
      // Map asset requests made under /cardgames to Next's internal /_next handler
      { source: "/cardgames/_next/:path*", destination: "/_next/:path*" },
      // Map all other /cardgames/* routes to app routes at /
      { source: "/cardgames/:path*", destination: "/:path*" },
    ];
  },

  async redirects() {
    return [
      // Direct IP root should land on the proxied prefix so assets load
      { source: "/", destination: "/cardgames", permanent: false },
    ];
  },
};

export default nextConfig;
