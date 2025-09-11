// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // ⬇️ ข้าม ESLint ตอน build (ทั้ง local และบน Vercel)
  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    // ใส่โดเมนที่อนุญาตถ้ามีรูปจากภายนอก
    remotePatterns: [],
  },
};

export default nextConfig;
