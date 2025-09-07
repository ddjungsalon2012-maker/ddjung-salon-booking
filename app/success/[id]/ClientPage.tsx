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
  status?: string;
  deposit?: number;
};

export default function ClientPage({ id }: { id: string }) {
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<BookingData | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'bookings', id));
        setBooking(snap.exists() ? (snap.data() as BookingData) : null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen grid place-items-center text-gray-100">
        กำลังโหลด…
      </main>
    );
  }

  if (!booking) {
    return (
      <main className="min-h-screen grid place-items-center text-gray-100">
        <div className="bg-white/5 p-6 rounded-xl">
          ไม่พบข้อมูลการจอง
          <div className="mt-3">
            <Link href="/" className="btn-primary">กลับหน้าแรก</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10 text-gray-100">
      <div className="w-full max-w-2xl bg-white/5 backdrop-blur rounded-2xl p-6 shadow space-y-4">
        <h1 className="text-2xl font-bold">จองสำเร็จ 🎉</h1>
        <p>รหัสการจอง: <span className="font-mono bg-white/10 px-2 py-1 rounded">{id}</span></p>
        <div className="space-y-1 text-sm">
          <div>ชื่อ: {booking.name}</div>
          <div>เบอร์โทร: {booking.phone}</div>
          <div>บริการ: {booking.service}</div>
          <div>วันเวลา: {booking.date} {booking.time}</div>
          {booking.notes ? <div>โน้ต: {booking.notes}</div> : null}
          <div>สถานะ: {booking.status ?? 'Pending'}</div>
          {typeof booking.deposit === 'number' && (
            <div>มัดจำ: {booking.deposit.toLocaleString()} บาท</div>
          )}
        </div>
        {booking.slipUrl && (
          <img
            src={booking.slipUrl}
            alt="Slip"
            className="rounded-lg border border-white/10 max-h-96 object-contain"
          />
        )}
        <div className="pt-2">
          <Link href="/" className="btn-primary">จองใหม่อีกครั้ง</Link>
        </div>
      </div>
    </main>
  );
}
