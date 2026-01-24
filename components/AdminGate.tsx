'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'ddjungsalon.2012@gmail.com';

export default function AdminGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      const isAdmin = !!user && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      setOk(isAdmin);
      setChecking(false);
      if (!isAdmin) {
        router.replace('/admin/login');
      }
    });
    return () => unsub();
  }, [router]);

  if (checking) {
    return (
      <main className="min-h-screen grid place-items-center text-gray-200">
        กำลังตรวจสอบสิทธิ์…
      </main>
    );
  }

  return ok ? <>{children}</> : null;
}