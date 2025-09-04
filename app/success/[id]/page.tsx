'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

type Booking = {
  name: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  status: 'Pending' | 'Confirmed' | 'Cancelled';
  deposit?: number;
  slipUrl?: string;
  createdAt?: any;
};

export default function SuccessPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [data, setData] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'bookings', id));
        if (!snap.exists()) {
          setNotFound(true);
        } else {
          setData(snap.data() as Booking);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-600">กำลังโหลดข้อมูล...</div>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">ไม่พบข้อมูลการจอง</p>
      </main>
    );
  }

  if (!data) return null;

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">จองสำเร็จ 🎉</h1>

      <div className="bg-white rounded-xl shadow p-5 space-y-3">
        <p><span className="font-semibold">รหัสการจอง:</span> {id}</p>
        <p><span className="font-semibold">ชื่อ:</span> {data.name}</p>
        <p><span className="font-semibold">เบอร์โทร:</span> {data.phone}</p>
        <p><span className="font-semibold">บริการ:</span> {data.service}</p>
        <p><span className="font-semibold">วันเวลา:</span> {data.date} {data.time}</p>
        <p><span className="font-semibold">สถานะ:</span> {data.status}</p>
        <p><span className="font-semibold">มัดจำ:</span> {data.deposit} บาท</p>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 mt-4 text-sm text-gray-700">
        <p className="font-semibold">การชำระเงินมัดจำ</p>
        <p>PromptPay: <span className="font-mono">0634594628</span></p>
        <p>โอนแล้วสามารถส่งสลิปให้แอดมินหรือแนบสลิปในรอบถัดไป</p>
      </div>

      <div className="flex gap-3 mt-6">
        <a href="/" className="px-4 py-2 rounded-lg bg-black text-white">จองใหม่อีกครั้ง</a>
      </div>
    </main>
  );
}
