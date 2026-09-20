import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev only: lets the HMR client connect when the app is opened via 127.0.0.1.
  allowedDevOrigins: ["127.0.0.1"],
  devIndicators: false,
  experimental: {
    serverActions: {
      // Profile pictures (≤ 2 MB) are uploaded through a server action.
      // Agreement PDFs are not: Vercel rejects any request body over 4.5 MB
      // before the function runs, so they go straight to storage from the
      // browser (see admin/actions.ts createContractUpload).
      bodySizeLimit: "4mb",
    },
    // With proxy.ts present, a self-hosted server buffers request bodies and
    // silently truncates them at 10 MB. Demo mode PUTs agreement PDFs (≤ 20 MB)
    // to /api/contracts/upload, so allow the full size there.
    proxyClientMaxBodySize: "25mb",
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
