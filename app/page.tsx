'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBooking } from '@/lib/booking';

type FormState = {
  name: string;
  phone: string;
  service: string;
  date: string;   // YYYY-MM-DD
  time: string;   // HH:mm
  notes?: string;
};

const SERVICES = ['ดัดวอลุ่ม', 'ทำสีผม', 'ตัดซอย', 'สระไดร์'];

// สร้างช่วงเวลา 30 นาที 09:00–19:00
const TIMES: string[] = [];
for (let h = 9; h <= 19; h++) {
  for (const m of ['00', '30']) {
    TIMES.push(`${String(h).padStart(2, '0')}:${m}`);
  }
}

export default function Home() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    name: '',
    phone: '',
    service: '',
    date: '',
    time: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.name || !form.phone || !form.service || !form.date || !form.time) {
      alert('กรุณากรอกข้อมูลให้ครบ');
      return;
    }
    setLoading(true);
    try {
      const res = await createBooking(form);
      router.push(`/success/${res.id}`);
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message ?? 'จองคิวไม่สำเร็จ';
      alert(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-3xl font-extrabold tracking-tight">DDJUNG SALON – จองคิวออนไลน์</h1>
      <p className="text-gray-600 mb-5">เวลาเปิดบริการ 09:00–20:00</p>

      <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">ชื่อ–สกุล</label>
          <input
            className="w-full border rounded-xl px-3 py-2"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">เบอร์โทร</label>
          <input
            className="w-full border rounded-xl px-3 py-2"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">บริการ</label>
          <select
            className="w-full border rounded-xl px-3 py-2"
            value={form.service}
            onChange={(e) => setForm({ ...form, service: e.target.value })}
          >
            <option value="">เลือกบริการ</option>
            {SERVICES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">วันที่</label>
            <input
              type="date"
              className="w-full border rounded-xl px-3 py-2"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">เวลา</label>
            <select
              className="w-full border rounded-xl px-3 py-2"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
            >
              <option value="">เลือกเวลา</option>
              {TIMES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">โน้ต (ถ้ามี)</label>
          <textarea
            className="w-full border rounded-xl px-3 py-2"
            rows={3}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>

        <button
          disabled={loading}
          className="w-full bg-black text-white rounded-xl py-3 font-semibold"
        >
          {loading ? 'กำลังบันทึก...' : 'ยืนยันการจอง'}
        </button>
      </form>
    </main>
  );
}
