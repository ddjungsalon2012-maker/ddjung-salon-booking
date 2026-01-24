import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // ⛳️ ลบส่วน eslint และ typescript ออกไปก่อนเพื่อให้ผ่านการเช็ค Type ของตัวแปร NextConfig
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
