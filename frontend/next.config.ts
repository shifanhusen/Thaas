import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No basePath - nginx will strip /cardgames/ prefix with trailing slash in proxy_pass
};

export default nextConfig;
