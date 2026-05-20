import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@scalar/api-reference-react", "@scalar/api-reference"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gateway.pinata.cloud",
        pathname: "/ipfs/**",
      },
    ],
  },
  async redirects() {
    return [{ source: "/docs", destination: "/docs-api", permanent: true }];
  },
};

export default nextConfig;
