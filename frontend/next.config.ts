import type { NextConfig } from "next";

// Backend URL resolution:
//   - Vercel production : NEXT_PUBLIC_API_URL = https://<name>.railway.app
//   - Docker local      : http://backend:8000  (service name in docker network)
//   - Dev outside Docker: http://localhost:8000
const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "production" ? "" : "http://localhost:8000");

const nextConfig: NextConfig = {
  output: "standalone",

  env: {
    // Expose Supabase public vars to browser bundles
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  },

  async rewrites() {
    // Only proxy /api/* when apiUrl is set (not on Vercel — vercel.json handles it there)
    if (!apiUrl) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
