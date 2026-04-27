import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  // Disable image optimization for now (can enable if needed)
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
