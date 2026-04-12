import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@scalar/api-reference-react", "@scalar/api-reference"],
  images: {
    domains: ["gateway.pinata.cloud"],
  },
};

export default nextConfig;
