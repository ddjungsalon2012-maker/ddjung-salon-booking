'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBooking } from '@/lib/booking';
import SlipUploadInline from '@/components/SlipUploadInline';

type FormState = {
  name: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  notes?: string;
  slipUrl?: string;
};

const SERVICES = ['ดัดวอลุ่ม', 'ทำสีผม', 'ตัดซอย', 'สระไดร์'];
const TIMES: string[] = [];
for (let h = 9; h <= 19; h++) for (const m of ['00','30']) TIMES.push(`${String(h).padStart(2,'0')}:${m}`);

export default function Home() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({ name:'', phone:'', service:'', date:'', time:'', notes:'', slipUrl:'' });
  const [loading, setLoading] = useState(false);

  const canSubmit =
    !!form.name && !!form.phone && !!form.service && !!form.date && !!form.time && !!form.slipUrl;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) { alert('กรุณากรอกข้อมูลให้ครบและอัปโหลดสลิป'); return; }
    setLoading(true);
    try {
      const res = await createBooking(form);
      router.push(`/success/${res.id}`);
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message ?? 'จองคิวไม่สำเร็จ';
      alert(msg);
    } finally { setLoading(false); }
  }

  return (
    <main className="max-w-2xl mx-auto p-6 text-gray-100">
      <h1 className="text-3xl font-extrabold tracking-tight text-gold drop-shadow">DDJUNG SALON – จองคิวออนไลน์</h1>
      <p className="text-gray-300 mb-5">เวลาเปิดบริการ 09:00–20:00</p>

      <form onSubmit={onSubmit} className="rounded-2xl p-6 bg-midnight/60 border border-gray-700/50 shadow-soft space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1 text-gray-300">ชื่อ–สกุล</label>
            <input className="w-full rounded-xl bg-black/40 border border-gray-700 px-3 py-2 text-gray-100"
                   value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-300">เบอร์โทร</label>
            <input className="w-full rounded-xl bg-black/40 border border-gray-700 px-3 py-2 text-gray-100"
                   value={form.phone} onChange={(e)=>setForm({...form, phone:e.target.value})} required />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1 text-gray-300">บริการ</label>
            <select className="w-full rounded-xl bg-black/40 border border-gray-700 px-3 py-2 text-gray-100"
                    value={form.service} onChange={(e)=>setForm({...form, service:e.target.value})} required>
              <option value="">เลือกบริการ</option>
              {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1 text-gray-300">วันที่</label>
              <input type="date" className="w-full rounded-xl bg-black/40 border border-gray-700 px-3 py-2 text-gray-100"
                     value={form.date} onChange={(e)=>setForm({...form, date:e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm mb-1 text-gray-300">เวลา</label>
              <select className="w-full rounded-xl bg-black/40 border border-gray-700 px-3 py-2 text-gray-100"
                      value={form.time} onChange={(e)=>setForm({...form, time:e.target.value})} required>
                <option value="">เลือกเวลา</option>
                {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-300">โน้ต (ถ้ามี)</label>
          <textarea className="w-full rounded-xl bg-black/40 border border-gray-700 px-3 py-2 text-gray-100"
                    rows={3} value={form.notes} onChange={(e)=>setForm({...form, notes:e.target.value})} />
        </div>

        {/* อัปโหลดสลิป (บังคับ) */}
        <SlipUploadInline onUploaded={(url)=>setForm({...form, slipUrl: url})} />

        <button type="submit"
                disabled={loading || !canSubmit}
                className="w-full rounded-xl py-3 font-semibold bg-gradient-to-r from-gold to-royal text-black enabled:hover:opacity-90 disabled:opacity-50">
          {loading ? 'กำลังบันทึก...' : 'ยืนยันการจอง'}
        </button>
      </form>
    </main>
  );
}
