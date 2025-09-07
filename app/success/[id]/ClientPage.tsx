'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

type BookingData = {
  name: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  notes?: string;
  slipUrl?: string;
  status: string;
};

export default function ClientPage({ id }: { id: string }) {
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<BookingData | null>(null);

  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        const ref = doc(db, 'bookings', id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setBooking(snap.data() as BookingData);
        }
      } catch (e) {
        console.error('โหลด booking ไม่สำเร็จ', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center text-gray-100">
        <p>กำลังโหลดข้อมูลการจอง...</p>
      </main>
    );
  }

  if (!booking) {
    return (
      <main className="min-h-screen flex items-center justify-center text-gray-100">
        <div className="bg-white/5 p-6 rounded-xl shadow">
          <h1 className="text-xl font-bold">ไม่พบข้อมูลการจอง</h1>
          <Link href="/" className="btn-primary mt-4 inline-block">กลับไปหน้าหลัก</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10 text-gray-100">
      <div className="w-full max-w-2xl bg-white/5 backdrop-blur rounded-2xl p-6 shadow space-y-6">
        <h1 className="text-2xl font-bold">จองสำเร็จ 🎉</h1>
        <p>รหัสการจอง: <span className="font-mono bg-white/10 px-2 py-1 rounded">{id}</span></p>

        <div className="space-y-2 text-sm">
          <p><span className="font-semibold">ชื่อ:</span> {booking.name}</p>
          <p><span className="font-semibold">เบอร์โทร:</span> {booking.phone}</p>
          <p><span className="font-semibold">บริการ:</span> {booking.service}</p>
          <p><span className="font-semibold">วันที่:</span> {booking.date}</p>
          <p><span className="font-semibold">เวลา:</span> {booking.time}</p>
          {booking.notes && <p><span className="font-semibold">โน้ต:</span> {booking.notes}</p>}
          <p><span className="font-semibold">สถานะ:</span> {booking.status}</p>
        </div>

        {booking.slipUrl && (
          <div>
            <h2 className="font-semibold mb-2">สลิปการโอน</h2>
            <img
              src={booking.slipUrl}
              alt="Slip"
              className="rounded-lg border border-white/10 max-h-96 object-contain"
            />
          </div>
        )}

        <div className="flex gap-3">
          <Link href="/" className="btn-primary">กลับไปหน้าหลัก</Link>
        </div>
      </div>
    </main>
  );
}
