'use client';
import Link from 'next/link';
import { useState } from 'react';
import { createBooking } from '@/lib/booking';

type FormState = {
  name: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  notes?: string;
};

export default function Home() {
  const [form, setForm] = useState<FormState>({ name:'', phone:'', service:'', date:'', time:'', notes:'' });
  const [loading, setLoading] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if(!form.name || !form.phone || !form.service || !form.date || !form.time){
      alert('กรุณากรอกข้อมูลให้ครบ'); return;
    }
    setLoading(true);
    try {
      const res = await createBooking(form);
      setSuccessId(res.id);
    } catch (e: unknown) {
      const msg = (e as { message?: string }).message ?? 'จองคิวไม่สำเร็จ';
      alert(msg);
    } finally { setLoading(false); }
  }

  if (successId) {
    return (
      <main className="max-w-xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-2">จองสำเร็จ 🎉</h1>
        <p className="mb-3">
          รหัสการจอง: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{successId}</span>
        </p>

        <div className="bg-white rounded-xl shadow p-4 mb-4">
          <p className="font-semibold">มัดจำ 500 บาท</p>
          <p>PromptPay: <span className="font-mono">0634594628</span></p>
          <p className="text-sm text-gray-600">โอนแล้วแจ้งสลิปกับแอดมินเพื่อยืนยันคิว</p>
        </div>

        <div className="space-x-3">
          <Link href={`/success/${successId}`} className="inline-block border px-4 py-2 rounded-lg">
            เปิดหน้าสำเร็จการจอง
          </Link>
          <Link href="/" className="inline-block bg-black text-white px-4 py-2 rounded-lg">
            จองใหม่อีกครั้ง
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold">DDJUNG SALON – จองคิวออนไลน์</h1>
      <p className="text-gray-600 mb-4">เวลาเปิดบริการ 09:00–20:00</p>

      <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow p-5 space-y-4">
        {/* ... ฟิลด์ฟอร์มของคุณเดิม ... */}
        <button disabled={loading} className="w-full bg-black text-white rounded-xl py-3 font-semibold">
          {loading ? 'กำลังบันทึก...' : 'ยืนยันการจอง'}
        </button>
      </form>
    </main>
  );
}
