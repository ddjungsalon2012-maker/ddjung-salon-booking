'use client';

import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      const adminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').toLowerCase().trim();

      // ยังไม่ล็อกอิน → ส่งไปหน้า login
      if (!u) {
        setOk(false);
        if (pathname !== '/admin/login') router.replace('/admin/login');
        return;
      }

      // มีล็อกอิน แต่ไม่ใช่แอดมิน → ออกจากระบบแล้วเด้งไปหน้า login
      const userEmail = (u.email || '').toLowerCase().trim();
      if (!adminEmail || userEmail !== adminEmail) {
        await signOut(auth);
        setOk(false);
        router.replace('/admin/login');
        return;
      }

      setOk(true);
    });

    return () => unsub();
  }, [router, pathname]);

  if (ok === null) {
    return (
      <div className="min-h-screen grid place-items-center text-gray-100">
        กำลังตรวจสอบสิทธิ์แอดมิน…
      </div>
    );
  }

  if (!ok) return null;
  return <>{children}</>;
}
