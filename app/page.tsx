'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { addBooking } from '@/lib/booking';
import PromptPayQR from '@/components/PromptPayQR';

// client-only uploader
const SlipUploadInline = dynamic(() => import('@/components/SlipUploadInline'), { ssr: false });

type Settings = {
  shopName: string;
  openHours: string;   // "HH:mm–HH:mm"
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

/* ====================== utilities สำหรับเวลา ====================== */
function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}
function fromMinutes(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}
/** parse "09:30–15:30" => { start:'09:30', end:'15:30' } ถ้า parse ไม่ได้ให้ใช้ 09:00–20:00 */
function parseHours(range?: string) {
  const m = range?.match(/(\d{1,2}:\d{2})\s*[\-–—]\s*(\d{1,2}:\d{2})/);
  if (m) return { start: m[1], end: m[2] };
  return { start: '09:00', end: '20:00' };
}
/** สร้างช่วงเวลา step นาที และ “ไม่รวม” end */
function buildTimes(startHHMM: string, endHHMM: string, step = 30) {
  const out: string[] = [];
  let t = toMinutes(startHHMM);
  const end = toMinutes(endHHMM);
  if (end <= t) return out;
  while (t + step <= end) {
    out.push(fromMinutes(t));
    t += step;
  }
  return out;
}

/* ====================== HoverSelect (เมนูแบบ hover/click) ====================== */
type HoverSelectProps = {
  label: string;
  value: string;
  placeholder?: string;
  options: string[];
  onChange: (v: string) => void;
};
function HoverSelect({ label, value, placeholder = 'เลือก', options, onChange }: HoverSelectProps) {
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
          onClick={() => setOpen(o => !o)}
          className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 pr-10 text-left outline-none focus:ring-2 focus:ring-blue-500"
        >
          {value ? value : <span className="text-gray-400">{placeholder}</span>}
        </button>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-300">▼</span>
        <div
          className={`absolute z-20 mt-1 w-full rounded-lg border border-white/10 bg-slate-900/95 backdrop-blur shadow-lg ${
            open ? 'block' : 'hidden group-hover:block'
          } max-h-64 overflow-auto`}
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-400">ไม่พบรายการ</div>
          ) : (
            options.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
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

/* ====================== Page ====================== */
export default function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const router = useRouter();

  // โหลด settings
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [settings, setSettings] = useState<Settings>({
    shopName: 'DDJUNG SALON – จองคิวออนไลน์',
    openHours: '09:00–20:00',
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
          setSettings(prev => ({
            shopName:    data.shopName   ?? prev.shopName,
            openHours:   data.openHours  ?? prev.openHours,
            promptpay:   data.promptpay  ?? prev.promptpay,
            deposit:     typeof data.deposit === 'number' ? data.deposit : prev.deposit,
            services:    Array.isArray(data.services) ? data.services : prev.services,
            logoUrl:     data.logoUrl ?? prev.logoUrl,
          }));
        }
      } finally {
        setLoadingSettings(false);
      }
    })();
  }, []);

  // ฟอร์ม
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState<Input>({
    name: '',
    phone: '',
    service: '',
    date: '',
    time: '',
    notes: '',
    slipUrl: '',
  });

  // ตั้งค่า default date หลัง mount
  useEffect(() => {
    if (!mounted) return;
    if (!input.date) {
      const d = new Date();
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      setInput(prev => ({ ...prev, date: `${yyyy}-${mm}-${dd}` }));
    }
  }, [mounted, input.date]);

  const adminEmail = useMemo(() => process.env.NEXT_PUBLIC_ADMIN_EMAIL || '', []);

  // === ช่วงเวลา จาก settings.openHours (ไม่รวมเวลาปิด) ===
  const timeOptions = useMemo(() => {
    const { start, end } = parseHours(settings.openHours);
    return buildTimes(start, end, 30);
  }, [settings.openHours]);

  // ====== โหลด "เวลาที่ถูกจองแล้ว" ของวันที่เลือก (Pending + Confirmed) ======
  const [bookedTimes, setBookedTimes] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!input.date) return;
    (async () => {
      try {
        const bookingsRef = collection(db, 'bookings');
        const q1 = query(bookingsRef, where('date', '==', input.date), where('status', '==', 'Pending'));
        const q2 = query(bookingsRef, where('date', '==', input.date), where('status', '==', 'Confirmed'));
        const [s1, s2] = await Promise.all([getDocs(q1), getDocs(q2)]);
        const taken = new Set<string>();
        s1.forEach(d => { const t = d.get('time'); if (typeof t === 'string') taken.add(t); });
        s2.forEach(d => { const t = d.get('time'); if (typeof t === 'string') taken.add(t); });
        setBookedTimes(taken);
      } catch (e) {
        console.error('โหลดเวลาที่ถูกจองไม่สำเร็จ', e);
        setBookedTimes(new Set());
      }
    })();
  }, [input.date]);

  // ซ่อนเวลาที่จองแล้วออกจากตัวเลือก
  const availableTimes = useMemo(
    () => timeOptions.filter(t => !bookedTimes.has(t)),
    [timeOptions, bookedTimes]
  );

  // ถ้า time ที่เลือกไม่อยู่ในตัวเลือก (เช่นเพิ่งถูกจองไป) ให้ล้างค่า + แจ้งเตือน
  useEffect(() => {
    if (!input.time) return;
    if (!availableTimes.includes(input.time)) {
      alert('ช่วงเวลานี้ถูกจองแล้ว กรุณาเลือกเวลาอื่น');
      setInput(prev => ({ ...prev, time: '' }));
    }
  }, [availableTimes]); // eslint-disable-line

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.slipUrl) return alert('กรุณาอัปโหลดสลิปก่อนยืนยันการจอง');
    if (!input.name || !input.phone || !input.service || !input.date || !input.time)
      return alert('กรอกข้อมูลให้ครบถ้วน');

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
        deposit: settings.deposit,
        slipUrl: input.slipUrl,
        adminEmail,
      });
      router.push(`/success/${docId}`);
    } catch (err) {
      console.error(err);
      alert('บันทึกการจองไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  return (
    <main className="min-h-screen px-4 py-10 text-gray-100">
      <div className="mx-auto max-w-3xl">
        {/* header + logo */}
        <section className="mb-8">
          <div className="bg-white/5 backdrop-blur rounded-2xl border border-white/10 p-4 sm:p-5 shadow">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-white/10 ring-1 ring-white/10 flex items-center justify-center">
                <img src={settings.logoUrl || '/logo.png'} alt="โลโก้ร้าน" className="h-full w-full object-contain" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{settings.shopName}</h1>
                <p className="text-gray-300">เวลาเปิดทำการ: {settings.openHours} <span className="text-gray-400">(ไม่รวมเวลาปิด)</span></p>
              </div>
            </div>
          </div>
        </section>

        {/* form */}
        {loadingSettings ? (
          <div className="bg-white/5 rounded-2xl p-6 animate-pulse">กำลังโหลดการตั้งค่าร้าน…</div>
        ) : (
          <form onSubmit={onSubmit} className="bg-white/5 backdrop-blur rounded-2xl p-6 shadow space-y-6">
            {/* name/phone */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">ชื่อ–สกุล</label>
                <input
                  className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  value={input.name}
                  onChange={e => setInput({ ...input, name: e.target.value })}
                  placeholder="พิมพ์ชื่อของคุณ"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">เบอร์โทร</label>
                <input
                  className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  value={input.phone}
                  onChange={e => setInput({ ...input, phone: e.target.value })}
                  placeholder="เช่น 0812345678"
                />
              </div>
            </div>

            {/* service/date/time */}
            <div className="grid sm:grid-cols-3 gap-4">
              <HoverSelect
                label="บริการ"
                value={input.service}
                placeholder="เลือกบริการ"
                options={settings.services}
                onChange={v => setInput({ ...input, service: v })}
              />

              <div className="sm:col-span-1">
                <label className="block text-sm mb-1">วันที่</label>
                <div className="relative">
                  <input
                    type="date"
                    className="peer w-full rounded-lg bg-white/10 text-white border border-white/10 px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400"
                    value={input.date}
                    onChange={e => setInput({ ...input, date: e.target.value })}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-300">📅</span>
                </div>
              </div>

              <HoverSelect
                label="เวลา"
                value={input.time}
                placeholder="เลือกเวลา"
                options={availableTimes}  // 🔒 แสดงเฉพาะเวลาที่ยังว่าง
                onChange={(v) => {
                  if (bookedTimes.has(v)) {
                    alert('ช่วงเวลานี้มีการจองแล้ว กรุณาเลือกเวลาอื่น');
                    return;
                  }
                  setInput({ ...input, time: v });
                }}
              />
            </div>

            {/* note */}
            <div>
              <label className="block text-sm mb-1">โน้ต (ถ้ามี)</label>
              <textarea
                rows={4}
                className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                value={input.notes}
                onChange={e => setInput({ ...input, notes: e.target.value })}
                placeholder="รายละเอียดเพิ่มเติม"
              />
            </div>

            {/* slip + QR */}
            <section className="rounded-xl border border-white/10 p-4">
              <h3 className="font-semibold mb-2">แนบสลิปโอน (บังคับ)</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <SlipUploadInline onUpload={(url: string) => setInput(prev => ({ ...prev, slipUrl: url }))} />
                  <p className="text-sm text-yellow-300 mt-2">* ต้องอัปโหลดสลิปก่อนจึงจะยืนยันการจองได้</p>
                </div>
                <div className="flex items-center justify-center">
                  <PromptPayQR accountNo={settings.promptpay} amount={settings.deposit} />
                </div>
              </div>
            </section>

            {/* deposit */}
            <div className="text-sm text-gray-300">
              มัดจำ: <span className="font-semibold text-white">{Number(settings.deposit).toLocaleString()} บาท</span>
            </div>

            {/* submit */}
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
