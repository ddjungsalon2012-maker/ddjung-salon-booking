'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import PromptPayQR from '@/components/PromptPayQR';
import SlipUploadInline from '@/components/SlipUploadInline';
import { createBooking } from '@/lib/booking';

type FormState = {
  name: string;
  phone: string;
  service: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  notes: string;
  slipUrl?: string; // จะได้มาจากคอมโพเนนต์อัปโหลดสลิป
};

const SERVICES: string[] = ['ดัดวอลุ่ม', 'ทำสีผม', 'ตัดซอย', 'สระไดร์'];

export default function HomePage() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    name: '',
    phone: '',
    service: '',
    date: '',
    time: '',
    notes: '',
    slipUrl: undefined,
  });
  const [loading, setLoading] = useState<boolean>(false);

  // สร้างช่วงเวลา 30 นาที 09:00–19:30
  const TIMES = useMemo<string[]>(() => {
    const out: string[] = [];
    for (let h = 9; h <= 19; h++) {
      for (const m of ['00', '30']) {
        out.push(`${String(h).padStart(2, '0')}:${m}`);
      }
    }
    return out;
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // ตรวจความครบ
    if (!form.name || !form.phone || !form.service || !form.date || !form.time) {
      alert('กรุณากรอกข้อมูลให้ครบ');
      return;
    }
    // บังคับแนบสลิปก่อน
    if (!form.slipUrl) {
      alert('กรุณาอัปโหลดสลิปก่อนกดยืนยันการจอง');
      return;
    }

    try {
      setLoading(true);
      const res = await createBooking({
        name: form.name,
        phone: form.phone,
        service: form.service,
        date: form.date,
        time: form.time,
        notes: form.notes,
        deposit: 500,
        slipUrl: form.slipUrl, // << สำคัญ: ส่งสลิปที่อัปโหลดแล้วเข้าไป
      });
      // ไปหน้าสำเร็จ
      router.push(`/success/${res.id}`);
    } catch (err) {
      const message =
        (err as { message?: string }).message ?? 'จองคิวไม่สำเร็จ ลองใหม่อีกครั้ง';
      alert(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
        DDJUNG SALON – จองคิวออนไลน์
      </h1>
      <p className="text-gray-300 mt-1 mb-6">เวลาเปิดบริการ 09:00–20:00</p>

      <form
        onSubmit={onSubmit}
        className="rounded-2xl bg-midnight/60 border border-gray-700 p-5 md:p-6 space-y-5"
      >
        {/* แถวที่ 1 ชื่อ/โทร */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">ชื่อ–สกุล</label>
            <input
              className="w-full rounded-lg bg-black/50 border border-gray-700 px-3 py-2 text-white"
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              placeholder="สมชาย ใจดี"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">เบอร์โทร</label>
            <input
              className="w-full rounded-lg bg-black/50 border border-gray-700 px-3 py-2 text-white"
              value={form.phone}
              onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
              placeholder="08x-xxx-xxxx"
            />
          </div>
        </div>

        {/* บริการ/วัน/เวลา */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">บริการ</label>
            <select
              className="w-full rounded-lg bg-black/50 border border-gray-700 px-3 py-2 text-white"
              value={form.service}
              onChange={(e) => setForm((s) => ({ ...s, service: e.target.value }))}
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
              <label className="block text-sm text-gray-300 mb-1">วันที่</label>
              <input
                type="date"
                className="w-full rounded-lg bg-black/50 border border-gray-700 px-3 py-2 text-white"
                value={form.date}
                onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">เวลา</label>
              <select
                className="w-full rounded-lg bg-black/50 border border-gray-700 px-3 py-2 text-white"
                value={form.time}
                onChange={(e) => setForm((s) => ({ ...s, time: e.target.value }))}
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
        </div>

        {/* โน้ต */}
        <div>
          <label className="block text-sm text-gray-300 mb-1">โน้ต (ถ้ามี)</label>
          <textarea
            rows={4}
            className="w-full rounded-lg bg-black/50 border border-gray-700 px-3 py-2 text-white"
            value={form.notes}
            onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
            placeholder="เช่น ผมหยักศก ทำสีมาแล้ว ฯลฯ"
          />
        </div>

        {/* อัปโหลดสลิป (บังคับก่อนส่ง) */}
        <div>
          <label className="block text-sm text-gray-300 mb-2">
            แนบสลิปโอน (บังคับ)
          </label>
          <SlipUploadInline
            onUploaded={(url) => setForm((s) => ({ ...s, slipUrl: url }))}
          />
          {!form.slipUrl && (
            <p className="text-xs text-yellow-400 mt-2">
              * กรุณาอัปโหลดสลิปก่อนกดยืนยันการจอง
            </p>
          )}
        </div>

        {/* QR PromptPay แสดงให้สแกน */}
        <div className="pt-2">
          <PromptPayQR amount={500} />
        </div>

        {/* ปุ่มส่ง */}
        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary bg-gold text-black hover:bg-yellow-400 font-semibold py-3 rounded-xl disabled:opacity-60"
        >
          {loading ? 'กำลังบันทึก...' : 'ยืนยันการจอง'}
        </button>
      </form>
    </main>
  );
}
