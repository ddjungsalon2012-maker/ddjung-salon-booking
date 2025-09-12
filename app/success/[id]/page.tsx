'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

type Booking = {
  name: string;
  phone: string;
  service: string;
  date: string;     // yyyy-mm-dd
  time: string;     // HH:mm
  notes?: string;
  status: 'Pending' | 'Confirmed' | 'Cancelled';
  deposit?: number;
  slipUrl?: string;
  adminEmail?: string;
  createdAt?: any;
};

export default function SuccessDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || '';

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const ref = doc(db, 'bookings', id);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          setError('ไม่พบข้อมูลการจองนี้');
        } else {
          setBooking(snap.data() as Booking);
        }
      } catch (e: any) {
        console.error(e);
        setError(e?.message || 'โหลดข้อมูลไม่สำเร็จ');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (!id) {
    return (
      <main className="min-h-screen flex items-center justify-center text-white">
        <div className="bg-white/5 p-6 rounded-xl">
          <p className="mb-4">ไม่พบรหัสการจอง</p>
          <Link className="btn-primary inline-block" href="/">กลับหน้าแรก</Link>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center text-white">
        <div className="bg-white/5 p-6 rounded-xl">กำลังโหลดรายละเอียดการจอง…</div>
      </main>
    );
  }

  if (error || !booking) {
    return (
      <main className="min-h-screen flex items-center justify-center text-white">
        <div className="bg-white/5 p-6 rounded-xl">
          <p className="mb-4">{error || 'ไม่พบข้อมูลการจอง'}</p>
          <Link className="btn-primary inline-block" href="/">กลับหน้าแรก</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-10 text-gray-100">
      <div className="mx-auto w-full max-w-3xl bg-white/5 backdrop-blur rounded-2xl p-6 shadow space-y-6">
        <header className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">จองสำเร็จ 🎉</h1>
          <Link href="/" className="btn-secondary">จองใหม่อีกครั้ง</Link>
        </header>

        <div className="text-sm text-gray-300">
          รหัสการจอง:{' '}
          <span className="font-mono bg-white/10 px-2 py-1 rounded text-white">{id}</span>
        </div>

        {/* ข้อมูลลูกค้า + รายละเอียดการจอง */}
        <section className="grid sm:grid-cols-2 gap-6">
          <div className="rounded-xl border border-white/10 p-4">
            <h3 className="font-semibold mb-3">ข้อมูลลูกค้า</h3>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-400">ชื่อ: </span><span className="text-white">{booking.name}</span></div>
              <div><span className="text-gray-400">โทร: </span><span className="text-white">{booking.phone}</span></div>
              {booking.notes ? (
                <div>
                  <div className="text-gray-400">โน้ต:</div>
                  <div className="whitespace-pre-wrap text-white">{booking.notes}</div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 p-4">
            <h3 className="font-semibold mb-3">รายละเอียดการจอง</h3>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-400">บริการ: </span><span className="text-white">{booking.service}</span></div>
              <div><span className="text-gray-400">วันเวลา: </span><span className="text-white">{booking.date} • {booking.time}</span></div>
              <div><span className="text-gray-400">สถานะ: </span>
                <span className={
                  booking.status === 'Confirmed' ? 'text-green-300' :
                  booking.status === 'Cancelled' ? 'text-red-300' : 'text-yellow-300'
                }>
                  {booking.status}
                </span>
              </div>
              <div><span className="text-gray-400">มัดจำ: </span>
                <span className="text-white">{(booking.deposit ?? 0).toLocaleString()} บาท</span>
              </div>
            </div>
          </div>
        </section>

        {/* สลิปการโอน */}
        <section className="rounded-xl border border-white/10 p-4">
          <h3 className="font-semibold mb-3">สลิปการชำระเงิน</h3>
          {booking.slipUrl ? (
            <a href={booking.slipUrl} target="_blank" rel="noopener noreferrer" className="block">
              {/* แสดงรูปสลิป (คลิกเพื่อเปิดเต็ม) */}
              <img
                src={booking.slipUrl}
                alt="สลิปการโอน"
                className="max-h-[480px] w-auto rounded-lg border border-white/10"
              />
              <p className="text-xs text-gray-400 mt-2">แตะที่รูปเพื่อเปิดในแท็บใหม่</p>
            </a>
          ) : (
            <p className="text-sm text-gray-400">ยังไม่มีการแนบสลิป</p>
          )}
        </section>

        <div className="pt-2">
          <Link href="/" className="btn-primary">กลับหน้าแรก</Link>
        </div>
      </div>
    </main>
  );
}