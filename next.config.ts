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
        ],
      },
    ];
  },
};

export default nextConfig;
