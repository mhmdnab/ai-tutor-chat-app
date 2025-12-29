import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Empty turbopack config to silence warning - matrix SDK works fine without custom config
  turbopack: {},
};

export default nextConfig;
