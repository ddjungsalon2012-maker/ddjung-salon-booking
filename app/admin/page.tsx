'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import PromptPayQR from '@/components/PromptPayQR';
import { addBooking, BookingInput } from '@/lib/booking';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// client-only uploader
const SlipUploadInline = dynamic(() => import('@/components/SlipUploadInline'), { ssr: false });

type SettingsDoc = {
  shopName?: string;
  openHours?: string; // เช่น "09:30–15:30"
  promptpay?: string;
  deposit?: number;
  services?: string[];
  logoUrl?: string;
};

type Input = {
  name: string;
  phone: string;
  service: string;
  date: string; // yyyy-mm-dd
  time: string; // HH:mm
  notes?: string;
  slipUrl: string;
};

const DEFAULT_SERVICES = ['ดัดวอลลุ่ม', 'ทำสี', 'ทรีทเมนต์', 'สระไดร์', 'ตัดซอย'];
const DEFAULT_DEPOSIT = 500;

/* ========================= helpers ========================= */
function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}
function fromMinutes(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
/** รับ "09:30–15:30" -> { start: '09:30', end: '15:30' }; ถ้า parse ไม่ได้ใช้ดีฟอลต์ 09:00–20:00 */
function parseHours(range?: string) {
  const m = range?.match(/(\d{1,2}:\d{2})\s*[\-–—]\s*(\d{1,2}:\d{2})/);
  if (m) return { start: m[1], end: m[2] };
  return { start: '09:00', end: '20:00' };
}
/** สร้างช่วงเวลา step 30 นาที และ "ไม่รวม" end (ไม่ใส่เวลาปิด) */
function buildTimes(startHHMM: string, endHHMM: string, step = 30) {
  const out: string[] = [];
  let t = toMinutes(startHHMM);
  const end = toMinutes(endHHMM);
  while (t < end) {
    out.push(fromMinutes(t));
    t += step;
  }
  // ตัดเวลาที่ชนเวลาปิดออก
  return out.filter((v) => toMinutes(v) + step <= end);
}

async function fetchBookedTimes(date: string): Promise<string[]> {
  const res = await fetch(`/api/booked-times?date=${encodeURIComponent(date)}`, { cache: 'no-store' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? 'โหลดเวลาที่ถูกจองไม่สำเร็จ');
  return Array.isArray(data?.times) ? data.times : [];
}

/* ========================= Page ========================= */
export default function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // settings
  const [settings, setSettings] = useState<SettingsDoc | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const ref = doc(db, 'settings', 'global');
        const snap = await getDoc(ref);
        if (snap.exists()) setSettings(snap.data() as SettingsDoc);
      } catch (e) {
        console.error('โหลด settings ไม่สำเร็จ', e);
      }
    })();
  }, []);

  // form states
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

  // default date
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

  // ======= time options จาก settings.openHours (ไม่รวมเวลาปิด) =======
  const timeOptions = useMemo(() => {
    const { start, end } = parseHours(settings?.openHours);
    return buildTimes(start, end, 30);
  }, [settings?.openHours]);

  // ถ้ายังไม่มีค่า time หรือ time ไม่อยู่ในช่วง ให้รีเซ็ตเป็นค่าว่าง
  useEffect(() => {
    if (!timeOptions.length) return;
    if (!input.time || !timeOptions.includes(input.time)) {
      setInput((prev) => ({ ...prev, time: '' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeOptions]);

  // ======= โหลด "เวลาที่ถูกจองแล้ว" ของวันที่เลือก ผ่าน API -> เพื่อซ่อนจากลิสต์ =======
  const [bookedTimes, setBookedTimes] = useState<Set<string>>(new Set());
  const [loadingBookings, setLoadingBookings] = useState(false);

  useEffect(() => {
    if (!input.date) return;
    (async () => {
      setLoadingBookings(true);
      try {
        const times = await fetchBookedTimes(input.date);
        setBookedTimes(new Set(times));
      } catch (e) {
        console.error('โหลดเวลาที่ถูกจองไม่สำเร็จ', e);
        setBookedTimes(new Set());
      } finally {
        setLoadingBookings(false);
      }
    })();
  }, [input.date]);

  const adminEmail = useMemo(() => process.env.NEXT_PUBLIC_ADMIN_EMAIL || '', []);

  // ======= เปลี่ยนเวลา: เช็กกับรายการ bookedTimes ที่โหลดมา =======
  async function onChangeTime(nextTime: string) {
    if (!input.date) {
      alert('กรุณาเลือกวันที่ก่อน');
      return;
    }
    if (!timeOptions.includes(nextTime)) {
      alert('เวลานี้อยู่นอกช่วงเวลาทำการ');
      return;
    }

    // กันกรณีข้อมูลยังโหลดไม่ทัน
    if (loadingBookings) {
      alert('กำลังโหลดเวลาที่ว่าง กรุณารอสักครู่');
      return;
    }

    if (bookedTimes.has(nextTime)) {
      alert('ช่วงเวลานี้มีการจองแล้ว กรุณาเลือกเวลาอื่น');
      setInput((prev) => ({ ...prev, time: '' }));
      return;
    }

    setInput((prev) => ({ ...prev, time: nextTime }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.slipUrl) return alert('กรุณาอัปโหลดสลิปก่อนยืนยันการจอง');
    if (!input.name || !input.phone || !input.service || !input.date || !input.time)
      return alert('กรอกข้อมูลให้ครบถ้วน');

    // กันเลือกเวลานอกช่วงทำการ
    if (!timeOptions.includes(input.time)) {
      return alert('เวลาที่เลือกอยู่นอกช่วงเวลาทำการ กรุณาเลือกใหม่');
    }

    // กันกรณีคนอื่นจองไปก่อนหน้า (รีเฟรชสถานะล่าสุดก่อนส่ง)
    try {
      const latest = await fetchBookedTimes(input.date);
      const latestSet = new Set(latest);
      if (latestSet.has(input.time)) {
        setBookedTimes(latestSet);
        setInput((prev) => ({ ...prev, time: '' }));
        return alert('ช่วงเวลานี้ถูกจองไปแล้ว กรุณาเลือกเวลาอื่น');
      }
    } catch (e) {
      console.error('ตรวจสอบเวลาล่าสุดไม่สำเร็จ', e);
      // ให้ปล่อยไปพยายามบันทึก (API ฝั่ง server จะกันซ้ำให้อีกชั้น)
    }

    try {
      setLoading(true);

      const payload: BookingInput = {
        name: input.name.trim(),
        phone: input.phone.trim(),
        service: input.service,
        date: input.date,
        time: input.time,
        notes: input.notes?.trim() || '',
        status: 'Pending',
        deposit: settings?.deposit ?? DEFAULT_DEPOSIT,
        slipUrl: input.slipUrl,
        adminEmail,
      };

      const docId = await addBooking(payload);
      setSuccessId(docId);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'บันทึกการจองไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  /* ---------- success page ---------- */
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

  /* ---------- booking form ---------- */
  return (
    <main className="min-h-screen px-4 py-10 text-gray-100">
      <div className="mx-auto max-w-3xl">
        {/* header + logo */}
        <section className="mb-8">
          <div className="bg-white/5 backdrop-blur rounded-2xl border border-white/10 p-4 sm:p-5 shadow flex items-center gap-4">
            <div className="h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-white/10 ring-1 ring-white/10 grid place-items-center">
              {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt="โลโก้ร้าน" className="h-full w-full object-contain" />
              ) : (
                <span className="text-xs text-gray-400">No Logo</span>
              )}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {settings?.shopName ?? 'DDJUNG SALON – จองคิวออนไลน์'}
              </h1>
              <p className="text-gray-300">{settings?.openHours ?? 'เวลาเปิดบริการ 09:00–20:00'}</p>
            </div>
          </div>
        </section>

        {/* form */}
        <form onSubmit={onSubmit} className="bg-white/5 backdrop-blur rounded-2xl p-6 shadow space-y-6">
          {/* name/phone */}
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

          {/* service/date/time */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-sm mb-1">บริการ</label>
              <select
                className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                value={input.service}
                onChange={(e) => setInput({ ...input, service: e.target.value })}
              >
                <option value="" disabled>
                  เลือกบริการ
                </option>
                {(settings?.services?.length ? settings.services : DEFAULT_SERVICES).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1">วันที่</label>
              <input
                type="date"
                className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                value={input.date}
                onChange={(e) => setInput({ ...input, date: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm mb-1">เวลา</label>
              <select
                className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                value={input.time}
                onChange={(e) => onChangeTime(e.target.value)}
              >
                <option value="" disabled>
                  {loadingBookings ? 'กำลังโหลดเวลา...' : 'เลือกเวลา'}
                </option>
                {timeOptions
                  .filter((t) => !bookedTimes.has(t)) // ซ่อนเวลาที่เต็ม
                  .map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">แสดงเฉพาะเวลาที่ว่าง (ทุก 30 นาที) — ไม่รวม “เวลาปิดร้าน”</p>
            </div>
          </div>

          {/* note */}
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

          {/* slip + QR */}
          <section className="rounded-xl border border-white/10 p-4">
            <h3 className="font-semibold mb-2">แนบสลิปโอน (บังคับ)</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <SlipUploadInline onUpload={(url: string) => setInput((prev) => ({ ...prev, slipUrl: url }))} />
                <p className="text-sm text-yellow-300 mt-2">* ต้องอัปโหลดสลิปก่อนจึงจะยืนยันการจองได้</p>
              </div>
              <div className="flex items-center justify-center">
                <PromptPayQR
                  accountNo={settings?.promptpay ?? '0634594628'}
                  amount={settings?.deposit ?? DEFAULT_DEPOSIT}
                />
              </div>
            </div>
          </section>

          {/* deposit */}
          <div className="text-sm text-gray-300">
            มัดจำ:{' '}
            <span className="font-semibold text-white">
              {(settings?.deposit ?? DEFAULT_DEPOSIT).toLocaleString()} บาท
            </span>
          </div>

          {/* submit */}
          <div className="pt-2">
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60">
              {loading ? 'กำลังบันทึก...' : 'ยืนยันการจอง'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
