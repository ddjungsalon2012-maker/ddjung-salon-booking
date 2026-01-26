'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { app } from '@/lib/firebase';

type Booking = {
  id: string;
  name: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  notes?: string;
  status: 'Pending' | 'Confirmed' | 'Cancelled';
  deposit?: number;
  slipUrl?: string;
};

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function AdminPage() {
  const router = useRouter();
  const auth = getAuth(app);

  const [userReady, setUserReady] = useState(false);
  const [date, setDate] = useState(todayISO());
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  // guard: ต้อง login ก่อน
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.replace('/admin/login');
        return;
      }
      setUserReady(true);
    });
    return () => unsub();
  }, [auth, router]);

  async function getToken() {
    const u = auth.currentUser;
    if (!u) throw new Error('Not logged in');
    return await u.getIdToken(true);
  }

  async function loadBookings() {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await fetch(`/api/admin/bookings?date=${encodeURIComponent(date)}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Load failed');
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (e: any) {
      alert(e?.message || 'โหลดรายการไม่สำเร็จ');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!userReady) return;
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userReady, date]);

  async function updateStatus(id: string, status: Booking['status']) {
    const token = await getToken();
    const res = await fetch(`/api/admin/bookings/${id}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data?.error || 'อัปเดตไม่สำเร็จ');
      return;
    }
    setItems(prev => prev.map(x => (x.id === id ? { ...x, status } : x)));
  }

  async function removeBooking(id: string) {
    if (!confirm('ลบรายการนี้ใช่ไหม?')) return;
    const token = await getToken();
    const res = await fetch(`/api/admin/bookings/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data?.error || 'ลบไม่สำเร็จ');
      return;
    }
    setItems(prev => prev.filter(x => x.id !== id));
  }

  async function logout() {
    await signOut(auth);
    router.replace('/admin/login');
  }

  const counts = useMemo(() => {
    const c = { Pending: 0, Confirmed: 0, Cancelled: 0 };
    for (const it of items) c[it.status] += 1;
    return c;
  }, [items]);

  if (!userReady) return null;

  return (
    <main className="min-h-screen px-4 py-10 text-gray-100">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">หลังบ้าน – รายการจอง</h1>
          <button onClick={logout} className="btn-secondary">ออกจากระบบ</button>
        </div>

        <div className="bg-white/5 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-300">เลือกวันที่</label>
            <input
              type="date"
              className="rounded-lg bg-white/10 border border-white/10 px-3 py-2"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <button onClick={loadBookings} disabled={loading} className="btn-primary disabled:opacity-60">
              {loading ? 'โหลด...' : 'รีเฟรช'}
            </button>
          </div>

          <div className="text-sm text-gray-300 flex gap-4">
            <span>Pending: <b className="text-white">{counts.Pending}</b></span>
            <span>Confirmed: <b className="text-white">{counts.Confirmed}</b></span>
            <span>Cancelled: <b className="text-white">{counts.Cancelled}</b></span>
          </div>
        </div>

        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="bg-white/5 rounded-2xl p-6 text-gray-300">
              ไม่มีรายการในวันนี้
            </div>
          ) : (
            items.map((b) => (
              <div key={b.id} className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-lg font-semibold">
                      {b.time} • {b.name} ({b.phone})
                    </div>
                    <div className="text-sm text-gray-300">บริการ: {b.service}</div>
                    {b.notes ? <div className="text-sm text-gray-300">โน้ต: {b.notes}</div> : null}
                    {b.slipUrl ? (
                      <a className="text-sm underline" href={b.slipUrl} target="_blank" rel="noreferrer">
                        เปิดสลิป
                      </a>
                    ) : null}
                    <div className="text-xs text-gray-400">ID: {b.id}</div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => updateStatus(b.id, 'Pending')} className="btn-secondary">
                      Pending
                    </button>
                    <button onClick={() => updateStatus(b.id, 'Confirmed')} className="btn-primary">
                      Confirm
                    </button>
                    <button onClick={() => updateStatus(b.id, 'Cancelled')} className="btn-secondary">
                      Cancel
                    </button>
                    <button onClick={() => removeBooking(b.id)} className="btn-secondary">
                      ลบ
                    </button>
                  </div>
                </div>

                <div className="mt-3 text-sm">
                  สถานะปัจจุบัน: <b className="text-white">{b.status}</b>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
