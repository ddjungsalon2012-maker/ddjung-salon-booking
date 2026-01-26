'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from '@/lib/firebase';

export default function AdminLoginPage() {
  const router = useRouter();
  const auth = getAuth(app);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.push('/admin');
    } catch (err: any) {
      alert(err?.message || 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 text-gray-100">
      <form onSubmit={onLogin} className="w-full max-w-md bg-white/5 rounded-2xl p-6 space-y-4">
        <h1 className="text-xl font-bold">Admin Login</h1>

        <input
          className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button disabled={loading} className="btn-primary w-full disabled:opacity-60">
          {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>
      </form>
    </main>
  );
}
