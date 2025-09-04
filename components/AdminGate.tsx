'use client';
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);

  // อ่าน env แล้ว normalize เพื่อตัดช่องว่าง/ตัวพิมพ์ใหญ่เล็ก
  const adminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').trim().toLowerCase();

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  const isAdmin =
    !!user &&
    !!user.email &&
    user.email.trim().toLowerCase() === adminEmail &&
    adminEmail.length > 0;

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow p-6 space-y-3">
          <h1 className="text-xl font-bold">Admin Login</h1>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setErr(null);
              try {
                await signInWithEmailAndPassword(auth, email, password);
              } catch (e: any) {
                setErr(e.code || e.message);
              }
            }}
            className="space-y-3"
          >
            <input
              className="w-full rounded-xl border px-3 py-2"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              className="w-full rounded-xl border px-3 py-2"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {err && <div className="text-red-600 text-sm">{err}</div>}
            <button className="w-full rounded-xl bg-black text-white py-2">เข้าสู่ระบบ</button>
          </form>

          {/* แผงดีบั๊กชั่วคราว — ลบได้ภายหลัง */}
          <div className="text-xs text-gray-500 mt-2 border-t pt-2">
            <div>ENV admin: <code>{adminEmail || '(empty)'}</code></div>
            <div>Signed-in: <code>{user?.email || '(no user)'}</code></div>
            {!adminEmail && <div className="text-red-600">ENV ว่าง: ตรวจ .env.local</div>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">แดชบอร์ดแอดมิน</h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-600">{user.email}</span>
          <button onClick={() => signOut(auth)} className="text-blue-600">ออกจากระบบ</button>
        </div>
      </div>
      {children}
    </div>
  );
}
