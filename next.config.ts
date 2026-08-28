import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev server is reached through a tunnel/proxy during preview, so the
  // browser sends an Origin header that Next would otherwise reject.
  allowedDevOrigins: ["localhost", "127.0.0.1", "*.localhost", "*"],
  devIndicators: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
