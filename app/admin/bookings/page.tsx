'use client';

import { useEffect, useMemo, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import {
  collection,
  getDocs,
  orderBy,
  query,
  limit,
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import AdminGate from '@/components/AdminGate';
import { setBookingStatus, BookingStatus } from '@/lib/admin';

type Row = {
  id: string;
  name: string;
  phone: string;
  service: string;
  date: string;  // yyyy-mm-dd
  time: string;  // HH:mm
  notes?: string;
  status: BookingStatus;
  deposit?: number;
  slipUrl?: string;
  createdAt?: any;
};

const STATUS_COLORS: Record<BookingStatus, string> = {
  Pending: 'bg-yellow-500/20 text-yellow-300',
  Confirmed: 'bg-emerald-500/20 text-emerald-300',
  Rejected: 'bg-rose-500/20 text-rose-300',
};

export default function AdminBookingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [qStatus, setQStatus] = useState<'ALL' | BookingStatus>('ALL');
  const [detail, setDetail] = useState<Row | null>(null);
  const [actLoading, setActLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const ref = collection(db, 'bookings');

        // เรียงด้วย createdAt ถ้ามี ไม่งั้น fallback เรียง date/time
        let snap = await getDocs(query(ref, orderBy('createdAt', 'desc'), limit(300)));
        if (snap.empty) {
          snap = await getDocs(query(ref, orderBy('date', 'desc'), limit(300)));
        }

        const list: Row[] = [];
        snap.forEach(d => {
          const x = d.data() as any;
          list.push({
            id: d.id,
            name: x.name || '',
            phone: x.phone || '',
            service: x.service || '',
            date: x.date || '',
            time: x.time || '',
            notes: x.notes || '',
            status: (x.status as BookingStatus) || 'Pending',
            deposit: x.deposit,
            slipUrl: x.slipUrl,
            createdAt: x.createdAt,
          });
        });

        const sorted = list.sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
        setRows(sorted);
      } catch (e) {
        console.error(e);
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(
    () => (qStatus === 'ALL' ? rows : rows.filter(r => r.status === qStatus)),
    [rows, qStatus]
  );

  async function doSetStatus(id: string, status: BookingStatus, note?: string) {
    setActLoading(true);
    try {
      await setBookingStatus(id, status, note);
      setRows(prev => prev.map(r => (r.id === id ? { ...r, status } : r)));
      setDetail(d => (d ? { ...d, status } : d));
    } catch (e) {
      console.error(e);
      alert('อัปเดตสถานะไม่สำเร็จ');
    } finally {
      setActLoading(false);
    }
  }

  async function handleLogout() {
    await signOut(auth);
    router.replace('/admin/login');
  }

  return (
    <AdminGate>
      <main className="min-h-screen px-4 py-8 text-gray-100">
        <div className="mx-auto max-w-5xl">
          {/* ===== Header ===== */}
          <header className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Admin – รายการจอง</h1>
            <div className="flex items-center gap-3">
              <select
                className="rounded-md bg-white/10 border border-white/10 px-2 py-1"
                value={qStatus}
                onChange={(e) => setQStatus(e.target.value as any)}
              >
                <option value="ALL">ทั้งหมด</option>
                <option value="Pending">รอตรวจสอบ</option>
                <option value="Confirmed">อนุมัติแล้ว</option>
                <option value="Rejected">ปฏิเสธ</option>
              </select>
              <button
                onClick={handleLogout}
                className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-sm"
              >
                ออกจากระบบ
              </button>
            </div>
          </header>

          {/* ===== ตารางแสดงการจอง ===== */}
          <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left p-3">วันที่</th>
                  <th className="text-left p-3">เวลา</th>
                  <th className="text-left p-3">ชื่อ</th>
                  <th className="text-left p-3">บริการ</th>
                  <th className="text-left p-3">สถานะ</th>
                  <th className="text-left p-3">สลิป</th>
                  <th className="text-left p-3"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="p-6">กำลังโหลด...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="p-6">ไม่พบรายการ</td></tr>
                ) : (
                  filtered.map(r => (
                    <tr key={r.id} className="border-t border-white/10">
                      <td className="p-3 whitespace-nowrap">{r.date}</td>
                      <td className="p-3 whitespace-nowrap">{r.time}</td>
                      <td className="p-3">{r.name}</td>
                      <td className="p-3">{r.service}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded ${STATUS_COLORS[r.status]}`}>{r.status}</span>
                      </td>
                      <td className="p-3">
                        {r.slipUrl ? (
                          <button className="underline" onClick={() => setDetail(r)}>เปิดดู</button>
                        ) : <span className="text-gray-400">ไม่มี</span>}
                      </td>
                      <td className="p-3">
                        <button className="btn-secondary" onClick={() => setDetail(r)}>รายละเอียด</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ===== Modal แสดงรายละเอียด ===== */}
          {detail && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center p-4">
              <div className="w-full max-w-3xl bg-gray-900 rounded-2xl border border-white/10 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                  <h2 className="text-lg font-semibold">รายละเอียดการจอง</h2>
                  <button onClick={() => setDetail(null)} className="text-gray-300 hover:text-white">✕</button>
                </div>

                <div className="p-4 grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <RowItem label="ชื่อ–สกุล" value={detail.name} />
                    <RowItem
                      label="เบอร์โทร"
                      value={
                        <span className="inline-flex items-center gap-2">
                          {detail.phone || '-'}
                          {detail.phone && <a className="underline text-blue-300" href={`tel:${detail.phone}`}>โทร</a>}
                        </span>
                      }
                    />
                    <RowItem label="บริการ" value={detail.service} />
                    <RowItem label="วันที่" value={detail.date} />
                    <RowItem label="เวลา" value={detail.time} />
                    <RowItem label="มัดจำ" value={`${(detail.deposit ?? 0).toLocaleString()} บาท`} />
                    <RowItem label="โน้ต" value={detail.notes || '-'} />
                    <RowItem
                      label="สถานะ"
                      value={<span className={`px-2 py-1 rounded ${STATUS_COLORS[detail.status]}`}>{detail.status}</span>}
                    />
                  </div>

                  <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                    <p className="text-sm mb-2">สลิปโอน</p>
                    {detail.slipUrl ? (
                      <a href={detail.slipUrl} target="_blank" rel="noreferrer">
                        <img src={detail.slipUrl} alt="slip" className="w-full h-[360px] object-contain bg-black/30 rounded" />
                      </a>
                    ) : (
                      <div className="h-[360px] grid place-items-center text-gray-400">ไม่มีสลิปแนบ</div>
                    )}
                  </div>
                </div>

                <div className="p-4 border-t border-white/10 flex flex-wrap gap-3 justify-end">
                  <button
                    className="px-4 py-2 rounded bg-rose-600 hover:bg-rose-700 disabled:opacity-60"
                    onClick={() => doSetStatus(detail.id, 'Rejected')}
                    disabled={actLoading}
                  >
                    ปฏิเสธ
                  </button>
                  <button
                    className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
                    onClick={() => doSetStatus(detail.id, 'Confirmed')}
                    disabled={actLoading}
                  >
                    อนุมัติ
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </AdminGate>
  );
}

function RowItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-gray-400">{label}</div>
      <div className="text-base">{value}</div>
    </div>
  );
}
