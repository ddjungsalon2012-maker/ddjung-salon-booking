'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';

type Props = {
  children: React.ReactNode;
  allowedEmails?: string[]; // ไม่ใส่จะใช้ NEXT_PUBLIC_ADMIN_EMAIL
};

export default function AdminGuard({ children, allowedEmails }: Props) {
  const fallbackEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';
  const whitelist = (allowedEmails && allowedEmails.length ? allowedEmails : [fallbackEmail]).filter(Boolean);

  const [ready, setReady] = useState(false);
  const [ok, setOk] = useState(false);

  // form state
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      const allow = !!u?.email && whitelist.includes(u.email);
      setOk(allow);
      setReady(true);
    });
    return () => unsub();
  }, []); // eslint-disable-line

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
    } catch (e: any) {
      setErr(e?.message || 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  if (!ready) return <div className="p-6">กำลังตรวจสิทธิ์…</div>;

  if (!ok) {
    return (
      <main className="min-h-screen grid place-items-center px-4">
        <form
          onSubmit={login}
          className="w-full max-w-sm bg-white/5 backdrop-blur rounded-2xl border border-white/10 p-6 text-gray-100"
        >
          <h1 className="text-xl font-bold mb-4">เข้าสู่ระบบผู้ดูแล</h1>
          <div className="space-y-3">
            <div>
              <label className="text-sm">อีเมล</label>
              <input
                className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label className="text-sm">รหัสผ่าน</label>
              <input
                className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 outline-none"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                type="password"
                placeholder="••••••••"
              />
            </div>
            {err && <p className="text-red-300 text-sm">{err}</p>}
            <button className="btn-primary w-full" disabled={loading}>
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
            {whitelist.length ? (
              <p className="text-xs text-gray-400">
                * จำกัดเฉพาะอีเมล: {whitelist.join(', ')}
              </p>
            ) : (
              <p className="text-xs text-yellow-300">
                * ยังไม่ได้ตั้งค่า NEXT_PUBLIC_ADMIN_EMAIL
              </p>
            )}
          </div>
        </form>
      </main>
    );
  }

  return <>{children}</>;
}
