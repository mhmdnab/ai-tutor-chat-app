import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Empty turbopack config to silence warning - matrix SDK works fine without custom config
  turbopack: {},

  // Optimize for production builds
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ["react", "react-dom", "socket.io-client"],
  },

  // Reduce memory usage during builds
  swcMinify: true,

  // Allow images from Matrix homeserver
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "matrix.org",
        pathname: "/_matrix/media/**",
      },
    ],
  },
};

export default nextConfig;
