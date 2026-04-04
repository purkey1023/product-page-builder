import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",  // Supabase Storage 이미지 허용
      },
    ],
  },
};

export default nextConfig;
