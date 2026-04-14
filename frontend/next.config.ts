import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@scalar/api-reference-react", "@scalar/api-reference"],
  images: {
    domains: ["gateway.pinata.cloud"],
  },
  async redirects() {
    return [{ source: "/docs", destination: "/docs-api", permanent: true }];
  },
};

export default nextConfig;
