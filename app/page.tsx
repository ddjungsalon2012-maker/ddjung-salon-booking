'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { addBooking } from '@/lib/booking';
import PromptPayQR from '@/components/PromptPayQR';

// ⭐ โหลดคอมโพเนนต์อัปโหลดสลิปแบบ client-only
const SlipUploadInline = dynamic(() => import('@/components/SlipUploadInline'), {
  ssr: false,
});

type Settings = {
  shopName: string;
  openHours: string;
  promptpay: string;
  deposit: number;
  services: string[];
  logoUrl?: string;
};

type Input = {
  name: string;
  phone: string;
  service: string;
  date: string;  // yyyy-mm-dd
  time: string;  // HH:mm
  notes?: string;
  slipUrl: string;
};

// เวลา 30 นาที 09:00-20:30
const TIMES_30M = (() => {
  const list: string[] = [];
  for (let h = 9; h <= 20; h++) {
    for (const m of ['00', '30']) list.push(`${String(h).padStart(2, '0')}:${m}`);
  }
  return list;
})();

/* ===========================
   HoverSelect: เมนูแบบกำหนดเอง
   - เปิดด้วย hover (เดสก์ท็อป) และ click (มือถือ)
   =========================== */
type HoverSelectProps = {
  label: string;
  value: string;
  placeholder?: string;
  options: string[];
  onChange: (v: string) => void;
};
function HoverSelect({
  label,
  value,
  placeholder = 'เลือก',
  options,
  onChange,
}: HoverSelectProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="sm:col-span-1">
      <label className="block text-sm mb-1">{label}</label>
      <div
        className="relative group"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 pr-10 text-left outline-none focus:ring-2 focus:ring-blue-500"
        >
          {value ? value : <span className="text-gray-400">{placeholder}</span>}
        </button>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-300">
          ▼
        </span>
        <div
          className={`absolute z-20 mt-1 w-full rounded-lg border border-white/10 bg-slate-900/95 backdrop-blur shadow-lg ${
            open ? 'block' : 'hidden group-hover:block'
          } max-h-64 overflow-auto`}
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-400">ไม่พบรายการ</div>
          ) : (
            options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`block w-full text-left px-3 py-2 text-sm hover:bg-white/10 ${
                  value === opt ? 'bg-white/10' : ''
                }`}
              >
                {opt}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // ===== โหลด settings จาก Firestore =====
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [settings, setSettings] = useState<Settings>({
    shopName: 'DDJUNG SALON – จองคิวออนไลน์',
    openHours: 'เวลาเปิดบริการ 09:00–20:00',
    promptpay: '0634594628',
    deposit: 500,
    services: ['ดัดวอลลุ่ม', 'ทำสี', 'ทรีทเมนต์', 'สระไดร์', 'ตัดซอย'],
    logoUrl: undefined,
  });

  useEffect(() => {
    (async () => {
      try {
        const ref = doc(db, 'settings', 'global');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data() as Partial<Settings>;
          setSettings((prev) => ({
            shopName: data.shopName ?? prev.shopName,
            openHours: data.openHours ?? prev.openHours,
            promptpay: data.promptpay ?? prev.promptpay,
            deposit: typeof data.deposit === 'number' ? data.deposit : prev.deposit,
            services: Array.isArray(data.services) ? data.services : prev.services,
            logoUrl: data.logoUrl ?? prev.logoUrl,
          }));
        }
      } finally {
        setLoadingSettings(false);
      }
    })();
  }, []);

  const [loading, setLoading] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [input, setInput] = useState<Input>({
    name: '',
    phone: '',
    service: '',
    date: '',
    time: '',
    notes: '',
    slipUrl: '',
  });

  // ตั้งค่า default date หลังจาก mount
  useEffect(() => {
    if (!mounted) return;
    if (!input.date) {
      const d = new Date();
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      setInput((prev) => ({ ...prev, date: `${yyyy}-${mm}-${dd}` }));
    }
  }, [mounted, input.date]);

  const adminEmail = useMemo(() => process.env.NEXT_PUBLIC_ADMIN_EMAIL || '', []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.slipUrl) {
      alert('กรุณาอัปโหลดสลิปก่อนยืนยันการจอง');
      return;
    }
    if (!input.name || !input.phone || !input.service || !input.date || !input.time) {
      alert('กรอกข้อมูลให้ครบถ้วน');
      return;
    }

    try {
      setLoading(true);
      const docId = await addBooking({
        name: input.name.trim(),
        phone: input.phone.trim(),
        service: input.service,
        date: input.date,
        time: input.time,
        notes: input.notes?.trim() || '',
        status: 'Pending',
        deposit: settings.deposit, // ใช้ค่ามัดจำจาก settings
        slipUrl: input.slipUrl,
        adminEmail,
      });
      setSuccessId(docId);
    } catch (err) {
      console.error(err);
      alert('บันทึกการจองไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  // หน้าหลังบันทึกสำเร็จ
  if (successId) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-10 text-gray-100">
        <div className="w-full max-w-2xl bg-white/5 backdrop-blur rounded-2xl p-6 shadow">
          <h1 className="text-2xl font-bold mb-4">จองสำเร็จ 🎉</h1>
          <p className="mb-6">
            รหัสการจอง:{' '}
            <span className="font-mono bg-white/10 px-2 py-1 rounded">{successId}</span>
          </p>
          <div className="flex gap-3">
            <Link href={`/success/${successId}`} className="btn-secondary inline-block">
              เปิดหน้าสำเร็จการจอง
            </Link>
            <Link href="/" className="btn-primary inline-block">
              จองใหม่อีกครั้ง
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-10 text-gray-100">
      <div className="mx-auto max-w-3xl">
        {/* ░░ กรอบโลโก้เหนือฟอร์ม ░░ */}
        <section className="mb-8">
          <div className="bg-white/5 backdrop-blur rounded-2xl border border-white/10 p-4 sm:p-5 shadow">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-white/10 ring-1 ring-white/10 flex items-center justify-center">
                {/* ถ้ามีโลโก้ใน settings ให้แสดง url นั้น ไม่งั้นใช้ /logo.png */}
                <img
                  src={settings.logoUrl || '/logo.png'}
                  alt="โลโก้ร้าน"
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {settings.shopName}
                </h1>
                <p className="text-gray-300">{settings.openHours}</p>
              </div>
            </div>
          </div>
        </section>

        {/* กรณีกำลังโหลด settings แสดงสเกเลตันเล็กน้อย */}
        {loadingSettings ? (
          <div className="bg-white/5 rounded-2xl p-6 animate-pulse">
            กำลังโหลดการตั้งค่าร้าน…
          </div>
        ) : (
          <form onSubmit={onSubmit} className="bg-white/5 backdrop-blur rounded-2xl p-6 shadow space-y-6">
            {/* ชื่อ-เบอร์ */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">ชื่อ–สกุล</label>
                <input
                  className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  value={input.name}
                  onChange={(e) => setInput({ ...input, name: e.target.value })}
                  placeholder="พิมพ์ชื่อของคุณ"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">เบอร์โทร</label>
                <input
                  className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  value={input.phone}
                  onChange={(e) => setInput({ ...input, phone: e.target.value })}
                  placeholder="เช่น 0812345678"
                />
              </div>
            </div>

            {/* บริการ / วันที่ / เวลา (ใช้ HoverSelect) */}
            <div className="grid sm:grid-cols-3 gap-4">
              <HoverSelect
                label="บริการ"
                value={input.service}
                placeholder="เลือกบริการ"
                options={settings.services}
                onChange={(v) => setInput({ ...input, service: v })}
              />

              <div className="sm:col-span-1">
                <label className="block text-sm mb-1">วันที่</label>
                <div className="relative">
                  <input
                    type="date"
                    className="peer w-full rounded-lg bg-white/10 text-white border border-white/10 px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400"
                    value={input.date}
                    onChange={(e) => setInput({ ...input, date: e.target.value })}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-300">
                    📅
                  </span>
                </div>
              </div>

              <HoverSelect
                label="เวลา"
                value={input.time}
                placeholder="เลือกเวลา"
                options={TIMES_30M}
                onChange={(v) => setInput({ ...input, time: v })}
              />
            </div>

            {/* โน้ต */}
            <div>
              <label className="block text-sm mb-1">โน้ต (ถ้ามี)</label>
              <textarea
                rows={4}
                className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                value={input.notes}
                onChange={(e) => setInput({ ...input, notes: e.target.value })}
                placeholder="รายละเอียดเพิ่มเติม"
              />
            </div>

            {/* อัปโหลดสลิป + QR */}
            <section className="rounded-xl border border-white/10 p-4">
              <h3 className="font-semibold mb-2">แนบสลิปโอน (บังคับ)</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <SlipUploadInline onUpload={(url: string) => setInput((prev) => ({ ...prev, slipUrl: url }))} />
                  <p className="text-sm text-yellow-300 mt-2">
                    * ต้องอัปโหลดสลิปก่อนจึงจะยืนยันการจองได้
                  </p>
                </div>
                <div className="flex items-center justify-center">
                  <PromptPayQR accountNo={settings.promptpay} amount={settings.deposit} />
                </div>
              </div>
            </section>

            {/* ยอดมัดจำ */}
            <div className="text-sm text-gray-300">
              มัดจำ:{' '}
              <span className="font-semibold text-white">
                {Number(settings.deposit).toLocaleString()} บาท
              </span>
            </div>

            {/* ปุ่ม */}
            <div className="pt-2">
              <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60">
                {loading ? 'กำลังบันทึก...' : 'ยืนยันการจอง'}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
