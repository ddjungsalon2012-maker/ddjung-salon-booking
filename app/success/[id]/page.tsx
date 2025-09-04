'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

type PageProps = { params: { id: string } };
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

export default function SuccessPage({ params }: PageProps) {
  const [data, setData] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function run() {
      const ref = doc(db,'bookings', params.id);
      const snap = await getDoc(ref);
      setData(snap.exists() ? (snap.data() as Booking) : null);
      setLoading(false);
    }
    run();
  }, [params.id]);

  if (loading) return <main className="p-6">Loading...</main>;
  if (!data) return <main className="p-6">ไม่พบข้อมูลการจอง</main>;

  return (
    <main className="max-w-2xl mx-auto p-6 text-gray-100">
      <h1 className="text-3xl font-extrabold tracking-tight text-gold mb-4">จองสำเร็จ 🎉</h1>

      <div className="rounded-2xl p-5 bg-midnight/60 border border-gray-700/50">
        <p className="mb-3">รหัสการจอง: <span className="font-mono bg-black/40 px-2 py-1 rounded">{params.id}</span></p>

        <div className="grid grid-cols-2 gap-6 text-sm">
          <div><div className="text-gray-400">ชื่อ</div><div className="font-medium">{data.name}</div></div>
          <div><div className="text-gray-400">เบอร์โทร</div><div className="font-medium">{data.phone}</div></div>
          <div><div className="text-gray-400">บริการ</div><div className="font-medium">{data.service}</div></div>
          <div><div className="text-gray-400">วันเวลา</div><div className="font-medium">{data.date} {data.time}</div></div>
          <div><div className="text-gray-400">สถานะ</div><div className="inline-block bg-black text-white rounded px-2 py-1">{data.status}</div></div>
          <div><div className="text-gray-400">มัดจำ</div><div className="font-medium">{data.deposit ?? 500} บาท</div></div>
          <div className="col-span-2">
            <div className="text-gray-400">สลิป</div>
            {data.slipUrl ? <a href={data.slipUrl} target="_blank" className="text-blue-400 underline">เปิดสลิป</a> : <span>-</span>}
          </div>
        </div>

        <div className="mt-6">
          <Link href="/" className="inline-block bg-gradient-to-r from-gold to-royal text-black px-4 py-2 rounded-lg font-semibold">จองใหม่อีกครั้ง</Link>
        </div>
      </div>
    </main>
  );
}
