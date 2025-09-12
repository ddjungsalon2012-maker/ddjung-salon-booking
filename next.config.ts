// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // ⛳ ปิด ESLint error ตอน build (Vercel/production)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ⛳ ปิด TypeScript type-check error ตอน build (Vercel/production)
  typescript: {
    ignoreBuildErrors: true,
  },

  // อนุญาตโหลดรูปจาก Firebase Storage (ถ้าคุณใช้ <Image /> ในอนาคต)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },
};

export default nextConfig;
