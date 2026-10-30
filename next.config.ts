import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // CV uploads go through a server action. Vercel allows about 4.5 MB per request, and
  // the CV limit is 3 MB, so 4 MB leaves room for the upload's own overhead.
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // Always use the secure site (for a year), and stop other sites framing ours, planting a base address or loading plug ins.
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
        ],
      },
    ];
  },
};

export default nextConfig;
