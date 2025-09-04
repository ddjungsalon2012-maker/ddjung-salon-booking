'use client';
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [err, setErr] = useState<string>('');
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e: unknown) {
      const msg = (e as { message?: string }).message ?? 'เข้าสู่ระบบไม่สำเร็จ';
      setErr(msg);
    }
  }

  if (!user || user.email !== adminEmail) {
    return (
      <div className="max-w-sm mx-auto p-6">
        <h1 className="text-xl font-bold mb-3">Admin Login</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <input className="w-full border rounded-xl px-3 py-2" placeholder="Email"
                 value={email} onChange={e=>setEmail(e.target.value)} />
          <input type="password" className="w-full border rounded-xl px-3 py-2" placeholder="Password"
                 value={password} onChange={e=>setPassword(e.target.value)} />
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button className="w-full bg-black text-white rounded-xl py-2">เข้าสู่ระบบ</button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">แดชบอร์ดแอดมิน</h1>
        <div className="text-sm text-gray-600">{user.email}</div>
        <button onClick={()=>signOut(auth)} className="text-sm text-blue-600">ออกจากระบบ</button>
      </div>
      {children}
    </div>
  );
}
