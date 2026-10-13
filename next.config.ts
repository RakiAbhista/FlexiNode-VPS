import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pastikan Prisma & bcrypt tidak pernah di-bundle ke client-side
  serverExternalPackages: ["@prisma/client", "prisma", "bcrypt"],

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Cegah clickjacking
          { key: "X-Frame-Options", value: "DENY" },
          // Cegah MIME type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Batasi referrer info
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Matikan fitur browser yang tidak dipakai
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
