import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["gateway.pinata.cloud"],
  },
};

export default nextConfig;
