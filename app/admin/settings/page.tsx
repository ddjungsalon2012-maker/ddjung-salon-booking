'use client';

import { useEffect, useState } from 'react';
import AdminGate from '@/components/AdminGate';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import LogoUpload from '@/components/LogoUpload';
import PromptPayQR from '@/components/PromptPayQR';

type Settings = {
  shopName: string;
  openHours: string;   // เช่น "09:30–18:30"
  promptpay: string;
  deposit: number;
  services: string[];  // คั่นด้วยคอมม่าเวลาแสดง/แก้ไข
  logoUrl?: string;    // ไม่เซ็ตลง Firestore ถ้า undefined
};

const SETTINGS_REF = doc(db, 'settings', 'global');

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<Settings>({
    shopName: 'DDJUNG SALON – Booking',
    openHours: 'เวลาเปิดบริการ 09:00–18:30',
    promptpay: '0634594628',
    deposit: 500,
    services: ['ดัดวอลลุ่ม', 'ทำสี', 'ทรีทเมนต์', 'สระไดร์', 'ตัดซอย'],
    logoUrl: undefined,
  });

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(SETTINGS_REF);
        if (snap.exists()) {
          const d = snap.data() as Partial<Settings>;
          setForm((f) => ({
            shopName: d.shopName ?? f.shopName,
            openHours: d.openHours ?? f.openHours,
            promptpay: d.promptpay ?? f.promptpay,
            deposit: typeof d.deposit === 'number' ? d.deposit : f.deposit,
            services: Array.isArray(d.services) ? d.services : f.services,
            logoUrl: d.logoUrl ?? f.logoUrl,
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

      // เตรียม object โดยไม่ส่งฟิลด์ที่เป็น undefined (โดยเฉพาะ logoUrl)
      const payload: any = {
        shopName: form.shopName.trim(),
        openHours: form.openHours.trim(),
        promptpay: form.promptpay.trim(),
        deposit: Number(form.deposit) || 0,
        services: form.services.map((s) => s.trim()).filter(Boolean),
      };
      if (form.logoUrl) payload.logoUrl = form.logoUrl;

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

          {/* โลโก้ + ชื่อร้าน/เวลาเปิด */}
          <section className="bg-white/5 p-6 rounded-2xl shadow space-y-6">
            <div className="grid md:grid-cols-[auto,1fr] gap-6 items-start">
              {/* อัปโหลดโลโก้ (ปุ่ม/พรีวิวในคอมโพเนนต์นี้) */}
              <LogoUpload
                value={form.logoUrl}
                onChange={(url) => setForm((f) => ({ ...f, logoUrl: url }))}
              />

              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">ชื่อร้าน</label>
                  <input
                    className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 outline-none"
                    value={form.shopName}
                    onChange={(e) => setForm((f) => ({ ...f, shopName: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">เวลาเปิด–ปิด (เช่น 09:30–18:30)</label>
                  <input
                    className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 outline-none"
                    value={form.openHours}
                    onChange={(e) => setForm((f) => ({ ...f, openHours: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* PromptPay + Deposit + Save */}
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
            <label className="block text-sm">รายการบริการ (คั่นด้วยเครื่องหมายคอมม่า ,)</label>
            <input
              className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 outline-none"
              value={form.services.join(', ')}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  services: e.target.value.split(',').map((s) => s.trim()),
                }))
              }
            />
            <p className="text-xs text-gray-400">
              ตัวอย่าง: ดัดวอลลุ่ม, ทำสี, ทรีทเมนต์, สระไดร์, ตัดซอย
            </p>
          </section>

          {/* พรีวิว QR & โลโก้ */}
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
