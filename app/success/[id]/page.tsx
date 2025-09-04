'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import PromptPayQR from '@/components/PromptPayQR';

type Booking = {
  name: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  status: 'Pending' | 'Confirmed' | 'Cancelled';
  deposit?: number;
  slipUrl?: string;
};

export default function SuccessPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function run() {
      try {
        const snap = await getDoc(doc(db, 'bookings', params.id));
        if (!snap.exists()) {
          setNotFound(true);
        } else {
          setData(snap.data() as Booking);
        }
      } finally {
        setLoading(false);
      }
    }
    run();
  }, [params.id]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center text-gray-300">
        กำลังโหลด...
      </main>
    );
  }

  if (notFound || !data) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="rounded-2xl bg-midnight/60 border border-gray-700 p-6 text-center">
          <p className="text-white mb-4">ไม่พบข้อมูลการจอง</p>
          <Link href="/" className="btn-primary inline-block">กลับหน้าแรก</Link>
        </div>
      </main>
    );
  }

  const deposit = data.deposit ?? 500;

  return (
    <main className="max-w-3xl mx-auto p-6">
      <div className="rounded-2xl bg-midnight/60 border border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-white">จองสำเร็จ 🎉</h1>
        <p className="text-sm text-gray-300 mt-2">
          รหัสการจอง: <span className="font-mono bg-black/40 px-2 py-1 rounded">{params.id}</span>
        </p>

        <div className="grid md:grid-cols-2 gap-5 mt-6">
          <div className="space-y-2 text-gray-200">
            <Row label="ชื่อ" value={data.name} />
            <Row label="เบอร์โทร" value={data.phone} />
            <Row label="บริการ" value={data.service} />
            <Row label="วันเวลา" value={`${data.date} ${data.time}`} />
            <Row
              label="สถานะ"
              value={
                <span className="inline-block px-2 py-1 text-xs rounded bg-gray-800 border border-gray-600">
                  {data.status}
                </span>
              }
            />
            <Row label="มัดจำ" value={`${deposit.toLocaleString()} บาท`} />
          </div>

          {/* กล่อง QR PromptPay */}
          <PromptPayQR amount={deposit} />
        </div>

        <p className="text-sm text-gray-400 mt-4">
          โอนแล้วสามารถส่งสลิปให้แอดมินหรือแนบสลิปในระบบได้
        </p>

        <div className="mt-6 flex gap-3">
          <Link href="/" className="btn-primary">จองใหม่อีกครั้ง</Link>
        </div>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-24 text-gray-400">{label}</div>
      <div className="flex-1 text-white">{value}</div>
    </div>
  );
}
