import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },
  // ⭐️ ก๊อปปี้ส่วนนี้ไปวางเพิ่มครับ (สำคัญมาก!)
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: "AIzaSyB7UrNib4nu101b6HtOjOUpKgcM8g1TU84",
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "ddjung-salon-v2.firebaseapp.com",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: "ddjung-salon-v2",
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "ddjung-salon-v2.firebasestorage.app",
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "692498039840",
    NEXT_PUBLIC_FIREBASE_APP_ID: "1:692498039840:web:23bd3a15aed9f7bf052b45",
    NEXT_PUBLIC_ADMIN_EMAIL: "ddjungsalon.2012@gmail.com",
  },
};

export default nextConfig;