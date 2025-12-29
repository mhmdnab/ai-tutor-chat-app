import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Empty turbopack config to silence warning - matrix SDK works fine without custom config
  turbopack: {},

  // Allow images from Matrix homeserver
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'matrix.org',
        pathname: '/_matrix/media/**',
      },
    ],
  },
};

export default nextConfig;
