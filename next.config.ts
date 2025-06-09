import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // ✅ Add this line
  },
  // other config options can stay here
};

export default nextConfig;
