'use client';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { addBooking } from '@/lib/booking';
import PromptPayQR from '@/components/PromptPayQR';
import Banner from '@/components/Banner';
import SelectFull from '@/components/SelectFull';

// โหลดคอมโพเนนต์อัปโหลดสลิปแบบ client-only
const SlipUploadInline = dynamic(() => import('@/components/SlipUploadInline'), {
  ssr: false,
});

/* ---------- ค่าดีฟอลต์ ---------- */
const DEFAULT_SERVICES: string[] = ['ดัดวอลลุ่ม', 'ทำสี', 'ทรีทเมนต์', 'สระไดร์', 'ตัดซอย'];

/* ---------- Types ให้สอดคล้องกับ Settings Page ---------- */
type Socials = {
  facebook?: string;
  line?: string;
  tiktok?: string;
  youtube?: string;
  website?: string;
  phone?: string;
};

type Settings = {
  shopName: string;
  openHours: string; // เช่น "09:00–18:30" หรือ "เวลาเปิดบริการ 09:00–18:30"
  promptpay: string;
  deposit: number;
  services: string[];
  logoUrl?: string | null;
  phone?: string;
  socials?: Socials;
  bannerSubtitle?: string;
  bannerPhone?: string;
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

/* ---------- ยูทิล: สร้างช่วงเวลา 30 นาทีจาก openHours ---------- */
function buildTimesFromOpenHours(openHours: string): string[] {
  // รองรับคั่นกลาง – หรือ -
  const sep = openHours.includes('–') ? '–' : openHours.includes('-') ? '-' : '–';
  const [startStr, endStr] = openHours.split(sep).map((s) => s.trim());

  // ดึง HH:mm ด้านท้าย (กันกรณีมีคำว่า "เวลาเปิดบริการ")
  const hhmm = (s?: string) => (s || '').match(/(\d{2}:\d{2})$/)?.[1] ?? '09:00';

  const start = hhmm(startStr);
  const end = hhmm(endStr || '');

  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);

  const out: string[] = [];
  let h = sh;
  let m = sm;

  while (h < eh || (h === eh && m < em)) {
    out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    m += 30;
    if (m >= 60) {
      m = 0;
      h += 1;
    }
  }
  return out;
}

/* ---------- หน้า Home ---------- */
export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  /* โหลด settings จาก Firestore */
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [settings, setSettings] = useState<Settings>({
    shopName: 'DDJUNG SALON – Booking',
    openHours: '09:00–18:30',
    promptpay: '0634594628',
    deposit: 500,
    services: ['ดัดวอลลุ่ม', 'ทำสี', 'ทรีทเมนต์', 'สระไดร์', 'ตัดซอย'],
    logoUrl: null,
    phone: '0634594628',
    socials: {},
    bannerSubtitle: 'ดีดีจัง ซาลอน',
    bannerPhone: '0634594628',
  });

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'global'));
        if (snap.exists()) {
          const d = snap.data() as Partial<Settings>;
          setSettings((prev) => ({
            shopName: d.shopName ?? prev.shopName,
            openHours: d.openHours ?? prev.openHours,
            promptpay: d.promptpay ?? prev.promptpay,
            deposit: typeof d.deposit === 'number' ? d.deposit : prev.deposit,
            services: Array.isArray(d.services) ? d.services : prev.services,
            logoUrl: (d.logoUrl ?? prev.logoUrl) ?? null,
            phone: d.phone ?? prev.phone,
            socials: d.socials ?? prev.socials,
            bannerSubtitle: d.bannerSubtitle ?? prev.bannerSubtitle,
            bannerPhone:
              d.bannerPhone ??
              d.phone ??
              d.socials?.phone ??
              prev.bannerPhone ??
              prev.phone,
          }));
        }
      } finally {
        setLoadingSettings(false);
      }
    })();
  }, []);

  /* ฟอร์มรับข้อมูล */
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

  /* default date หลัง mount */
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

  /* โหลดการจองของวันที่เลือก เพื่อซ่อนเวลาที่ถูกจองแล้ว */
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);

  useEffect(() => {
    if (!input.date) {
      setBookedTimes([]);
      return;
    }

    const fetchBookedTimes = async () => {
      setLoadingBookings(true);
      try {
        const res = await fetch(
          `/api/booked-times?date=${encodeURIComponent(input.date)}`,
          { cache: 'no-store' }
        );
        if (!res.ok) {
          // อย่าให้หน้าแตก แค่โชว์ว่าว่างทั้งหมด
          console.error('Error fetching booked times:', await res.text());
          setBookedTimes([]);
          return;
        }
        const data = (await res.json()) as { times?: string[] };
        setBookedTimes(Array.isArray(data.times) ? data.times : []);
      } catch (err) {
        console.error('Error fetching booked times:', err);
        setBookedTimes([]);
      } finally {
        setLoadingBookings(false);
      }
    };

    fetchBookedTimes();
  }, [input.date]);

  /* ตัวเลือกเวลา (ตาม settings) */
  const timeOptions: string[] = useMemo(
    () => buildTimesFromOpenHours(settings.openHours || '09:00–18:30'),
    [settings.openHours]
  );

  /* เปลี่ยนเวลาแบบมีตรวจความถูกต้องขั้นต้น */
  function onChangeTime(nextTime: string) {
    if (!timeOptions.includes(nextTime)) {
      alert('เวลานี้อยู่นอกช่วงเวลาทำการ');
      return;
    }
    setInput((prev) => ({ ...prev, time: nextTime }));
  }

  /* อีเมลแอดมิน */
  const adminEmail = useMemo(() => process.env.NEXT_PUBLIC_ADMIN_EMAIL || '', []);

  /* ส่งฟอร์ม */
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
        {/* ░░ แถบบน (Banner) ░░ */}
        <section className="mb-8">
          <Banner settings={settings} />
        </section>

        {/* ฟอร์มจอง */}
        {loadingSettings ? (
          <div className="bg-white/5 rounded-2xl p-6 animate-pulse">
            กำลังโหลดการตั้งค่าร้าน…
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="bg-white/5 backdrop-blur rounded-2xl p-6 shadow space-y-6"
          >
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

            {/* service/date/time */}
            <div className="grid sm:grid-cols-3 gap-4">
              {/* บริการ */}
              <div className="sm:col-span-1">
                <label className="block text-sm mb-1">บริการ</label>
                <SelectFull
                  options={settings?.services?.length ? settings.services! : DEFAULT_SERVICES}
                  value={input.service}
                  onChange={(v) => setInput({ ...input, service: v })}
                  placeholder="เลือกบริการ"
                  itemHeight={52}
                />
              </div>

              {/* วันที่ */}
              <div>
                <label className="block text-sm mb-1">วันที่</label>
                <input
                  type="date"
                  className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  value={input.date}
                  onChange={(e) => setInput({ ...input, date: e.target.value })}
                />
              </div>

              {/* เวลา */}
              <div>
                <label className="block text-sm mb-1">เวลา</label>
                <SelectFull
                  options={timeOptions.filter((t: string) => !bookedTimes.includes(t))}
                  value={input.time}
                  onChange={(v) => onChangeTime(v)}
                  placeholder={
                    loadingBookings ? 'กำลังโหลดเวลาว่าง…' : 'เลือกเวลา'
                  }
                  itemHeight={48}
                />
                <p className="text-xs text-gray-400 mt-1">
                  แสดงเฉพาะเวลาที่ว่าง (ทุก 30 นาที) — ไม่รวม “เวลาปิดร้าน”
                </p>
              </div>
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
                  <SlipUploadInline
                    onUpload={(url: string) =>
                      setInput((prev) => ({ ...prev, slipUrl: url }))
                    }
                  />
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

            {/* ปุ่มส่ง */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary disabled:opacity-60"
              >
                {loading ? 'กำลังบันทึก...' : 'ยืนยันการจอง'}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
