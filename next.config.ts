import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow server components to import Node.js-only packages (pdf-parse, mammoth)
  serverExternalPackages: ["pdf-parse", "mammoth"],

  // Strict mode for catching bugs early
  reactStrictMode: true,

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
