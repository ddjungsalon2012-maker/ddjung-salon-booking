'use client';

import { useEffect, useState } from 'react';
import AdminGate from '@/components/AdminGate';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import LogoUpload from '@/components/LogoUpload';
import PromptPayQR from '@/components/PromptPayQR';

type Socials = {
  facebook?: string;
  line?: string;
  tiktok?: string;
  youtube?: string;
  website?: string;
};

type Settings = {
  shopName: string;
  openHours: string;
  promptpay: string;
  deposit: number;
  services: string[];
  logoUrl?: string | null;
  phone?: string;
  socials?: Socials;
  bannerSubtitle?: string;
  bannerPhone?: string;
};

const SETTINGS_REF = doc(db, 'settings', 'global');

// helper: trim string (null/undefined -> '')
const norm = (v?: string | null) => (v ?? '').trim();

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<Settings>({
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
        const snap = await getDoc(SETTINGS_REF);
        if (snap.exists()) {
          const d = snap.data() as Partial<Settings>;
          setForm((prev) => ({
            shopName: d.shopName ?? prev.shopName,
            openHours: d.openHours ?? prev.openHours,
            promptpay: d.promptpay ?? prev.promptpay,
            deposit: typeof d.deposit === 'number' ? d.deposit : prev.deposit,
            services: Array.isArray(d.services) ? d.services : prev.services,
            logoUrl: (d.logoUrl ?? prev.logoUrl) ?? null,
            phone: d.phone ?? prev.phone,
            socials: d.socials ?? prev.socials,
            bannerSubtitle: d.bannerSubtitle ?? prev.bannerSubtitle,
            bannerPhone: d.bannerPhone ?? d.phone ?? prev.bannerPhone,
          }));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save() {
    try {
      setSaving(true);

      // 1) จัดการ socials: เก็บเฉพาะที่ไม่ว่าง
      const rawSocials: Socials = {
        facebook: norm(form.socials?.facebook),
        line: norm(form.socials?.line),
        tiktok: norm(form.socials?.tiktok),
        youtube: norm(form.socials?.youtube),
        website: norm(form.socials?.website),
      };
      const socialsClean = Object.fromEntries(
        Object.entries(rawSocials).filter(([, v]) => v !== '')
      ) as Socials;

      // 2) จัด payload โดยไม่ส่งคีย์ที่ว่าง/undefined
      const payload: any = {
        shopName: norm(form.shopName),
        openHours: norm(form.openHours),
        promptpay: norm(form.promptpay),
        phone: norm(form.phone),
        deposit: Number(form.deposit) || 0,
        services: (form.services || []).map((s) => s.trim()).filter(Boolean),
        bannerSubtitle: norm(form.bannerSubtitle),
        bannerPhone: norm(form.bannerPhone),
      };

      // ถ้าโลโก้มีค่า ค่อยส่ง
      if (form.logoUrl) payload.logoUrl = form.logoUrl;

      // ส่ง socials เฉพาะกรณีมีอย่างน้อย 1 คีย์
      if (Object.keys(socialsClean).length > 0) {
        payload.socials = socialsClean;
      } else {
        // ถ้าอยากล้างทั้งหมดให้เป็น {} ก็ได้ (หรือจะไม่ส่งขึ้นเลยก็ได้)
        payload.socials = {};
      }

      await setDoc(SETTINGS_REF, payload, { merge: true });
      alert('บันทึกการตั้งค่าสำเร็จ');
    } catch (e: any) {
      console.error(e);
      alert(e?.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminGate>
        <main className="min-h-screen px-6 py-10 text-gray-100">
          <div className="bg-white/5 p-6 rounded-xl">กำลังโหลด…</div>
        </main>
      </AdminGate>
    );
  }

  return (
    <AdminGate>
      <main className="min-h-screen px-6 py-10 text-gray-100">
        <div className="mx-auto max-w-4xl space-y-8">
          <header className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Admin – Settings</h1>
            <a href="/admin" className="btn-secondary">กลับแดชบอร์ด</a>
          </header>

          {/* โลโก้ + ชื่อร้าน/เวลา/เบอร์ */}
          <section className="bg-white/5 p-6 rounded-2xl shadow space-y-6">
            <div className="grid md:grid-cols-[auto,1fr] gap-6 items-start">
              {/* อัปโหลดโลโก้ */}
              <LogoUpload
                value={form.logoUrl ?? undefined}
                onChange={(url) => setForm((f) => ({ ...f, logoUrl: url }))}
              />

              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">ชื่อร้าน (แสดงเป็นหัวเรื่องใหญ่)</label>
                  <input
                    className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 outline-none"
                    value={form.shopName}
                    onChange={(e) => setForm((f) => ({ ...f, shopName: e.target.value }))}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm mb-1">เวลาเปิด–ปิด (เช่น 09:00–18:30)</label>
                    <input
                      className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 outline-none"
                      value={form.openHours}
                      onChange={(e) => setForm((f) => ({ ...f, openHours: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">เบอร์โทร</label>
                    <input
                      className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 outline-none"
                      value={form.phone || ''}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ข้อความใต้แบนเนอร์ */}
          <section className="bg-white/5 p-6 rounded-2xl shadow space-y-4">
            <h3 className="font-semibold text-lg">ข้อความใต้แบนเนอร์</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-sm mb-1">Banner Subtitle (ข้อความรองใต้ชื่อร้าน)</label>
                <input
                  className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 outline-none"
                  value={form.bannerSubtitle ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, bannerSubtitle: e.target.value }))}
                  placeholder="เช่น ดีดีจัง ซาลอน ยี่ดาอุลุ่ม ชลบุรี"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Banner Phone (เว้นว่างจะใช้เบอร์โทรหลัก)</label>
                <input
                  className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 outline-none"
                  value={form.bannerPhone ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, bannerPhone: e.target.value }))}
                  placeholder="เช่น 0634594628"
                />
              </div>
            </div>
          </section>

          {/* พร้อมเพย์ / มัดจำ / บันทึก */}
          <section className="bg-white/5 p-6 rounded-2xl shadow space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm mb-1">พร้อมเพย์</label>
                <input
                  className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 outline-none"
                  value={form.promptpay}
                  onChange={(e) => setForm((f) => ({ ...f, promptpay: e.target.value }))}
                />
                <p className="text-xs text-gray-400 mt-1">ตัวอย่าง: 0634594628</p>
              </div>

              <div>
                <label className="block text-sm mb-1">มัดจำ (บาท)</label>
                <input
                  type="number"
                  className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 outline-none"
                  value={form.deposit}
                  onChange={(e) => setForm((f) => ({ ...f, deposit: Number(e.target.value) }))}
                />
              </div>

              <div className="flex items-end">
                <button onClick={save} disabled={saving} className="btn-primary w-full">
                  {saving ? 'กำลังบันทึก…' : 'บันทึก'}
                </button>
              </div>
            </div>
          </section>

          {/* รายการบริการ */}
          <section className="bg-white/5 p-6 rounded-2xl shadow space-y-3">
            <label className="block text-sm">รายการบริการ (คั่นด้วย ,)</label>
            <input
              className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 outline-none"
              value={(form.services || []).join(', ')}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  services: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                }))
              }
              placeholder="เช่น ดัดวอลลุ่ม, ทำสี, ทรีทเมนต์, สระไดร์, ตัดซอย"
            />
          </section>

          {/* ลิงก์โซเชียล */}
          <section className="bg-white/5 p-6 rounded-2xl shadow space-y-4">
            <h3 className="font-semibold">ลิงก์โซเชียล</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                className="rounded-lg bg-white/10 border border-white/10 px-3 py-2"
                placeholder="Facebook URL"
                value={form.socials?.facebook ?? ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, socials: { ...(f.socials ?? {}), facebook: e.target.value } }))
                }
              />
              <input
                className="rounded-lg bg-white/10 border border-white/10 px-3 py-2"
                placeholder="LINE URL"
                value={form.socials?.line ?? ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, socials: { ...(f.socials ?? {}), line: e.target.value } }))
                }
              />
              <input
                className="rounded-lg bg-white/10 border border-white/10 px-3 py-2"
                placeholder="TikTok URL"
                value={form.socials?.tiktok ?? ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, socials: { ...(f.socials ?? {}), tiktok: e.target.value } }))
                }
              />
              <input
                className="rounded-lg bg-white/10 border border-white/10 px-3 py-2"
                placeholder="YouTube URL"
                value={form.socials?.youtube ?? ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, socials: { ...(f.socials ?? {}), youtube: e.target.value } }))
                }
              />
              <input
                className="rounded-lg bg-white/10 border border-white/10 px-3 py-2 sm:col-span-2"
                placeholder="Website URL"
                value={form.socials?.website ?? ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, socials: { ...(f.socials ?? {}), website: e.target.value } }))
                }
              />
            </div>
          </section>

          {/* พรีวิว */}
          <section className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/10 p-4">
              <h3 className="font-semibold mb-2">พรีวิว QR มัดจำ</h3>
              <PromptPayQR accountNo={form.promptpay || '0634594628'} amount={form.deposit || 0} />
            </div>
            <div className="rounded-xl border border-white/10 p-4">
              <h3 className="font-semibold mb-2">พรีวิวโลโก้</h3>
              <div className="h-24 w-24 rounded-xl overflow-hidden bg-white/10 ring-1 ring-white/10 grid place-items-center">
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt="logo" className="h-full w-full object-contain" />
                ) : (
                  <span className="text-xs text-gray-400">No Logo</span>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </AdminGate>
  );
}
