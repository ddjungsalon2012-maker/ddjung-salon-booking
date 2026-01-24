import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // ✅ ลบ output: 'export' ออกแล้ว เพื่อให้รองรับหน้า Dynamic (/success/[id])
  
  // ⛳ ปิด ESLint error ตอน build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ⛳ ปิด TypeScript type-check error ตอน build
  typescript: {
    ignoreBuildErrors: true,
  },

  // อนุญาตโหลดรูปจาก Firebase Storage
  images: {
    // ✅ เอา unoptimized: true ออกได้เลยครับ เพราะ App Hosting รองรับการจัดการรูปภาพแบบปกติแล้ว
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },
};

export default nextConfig;