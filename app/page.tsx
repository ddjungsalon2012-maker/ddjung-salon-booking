'use client';

import { useState } from 'react';
import { createBooking } from '@/lib/booking';
import { db, storage, auth } from '@/lib/firebase';
import { collection, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signInAnonymously } from 'firebase/auth';

// บริการในร้าน (แก้ไขได้ตามต้องการ)
const SERVICES = ['ดัดวอลุ่ม', 'ทำสีผม', 'ตัดซอย', 'สระไดร์'];

// ช่วงเวลา 30 นาที 09:00–19:00
const TIMES: string[] = [];
for (let h = 9; h <= 19; h++) {
  for (const m of ['00', '30']) {
    TIMES.push(`${String(h).padStart(2, '0')}:${m}`);
  }
}

export default function HomePage() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    service: '',
    date: '',
    time: '',
    notes: '',
  });
  const [slip, setSlip] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [successId, setSuccessId] = useState<string | undefined>();

  async function ensureAnonAuth() {
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name || !form.phone || !form.service || !form.date || !form.time) {
      alert('กรุณากรอกข้อมูลให้ครบ');
      return;
    }
    if (!slip) {
      alert('กรุณาแนบสลิปก่อนยืนยันการจอง');
      return;
    }

    setLoading(true);
    try {
      // 1) ให้มี session (Anonymous) ก่อนอัปโหลด
      await ensureAnonAuth();

      // 2) จอง bookingId ล่วงหน้า (ยังไม่เขียนเอกสาร)
      const preRef = doc(collection(db, 'bookings'));
      const bookingId = preRef.id;

      // 3) อัปโหลดสลิปไปตาม bookingId
      const r = ref(storage, `slips/${bookingId}/${slip.name}`);
      await uploadBytes(r, slip);
      const slipUrl = await getDownloadURL(r);

      // 4) สร้าง booking จริง (ส่ง slipUrl + presetId)
      const res = await createBooking({
        ...form,
        slipUrl,
        presetId: bookingId,
      });

      setSuccessId(res.id);
    } catch (err: any) {
      alert(err.message || 'จองคิวไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  // หน้าหลังจองสำเร็จ
  if (successId) {
    return (
      <main className="max-w-xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">จองสำเร็จ 🎉</h1>

        <div className="bg-white rounded-xl p-4 border shadow mb-4">
          <p className="mb-2">
            รหัสการจอง:{' '}
            <span className="font-mono bg-gray-100 px-2 py-1 rounded text-gray-900">
              {successId}
            </span>
          </p>
          <p className="text-sm text-gray-800">
            อัปโหลดสลิปเรียบร้อย ระบบบันทึกการจองให้แล้ว
          </p>
        </div>

        <div className="flex gap-2">
          <a
            href={`/success/${successId}`}
            className="inline-block px-4 py-2 rounded-lg border font-medium text-gray-900 hover:bg-gray-100"
          >
            เปิดหน้าสำเร็จการจอง
          </a>
          <a
            href="/"
            className="inline-block px-4 py-2 rounded-lg bg-black text-white font-medium"
          >
            จองใหม่อีกครั้ง
          </a>
        </div>
      </main>
    );
  }

  // ฟอร์มจอง
  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold">DDJUNG SALON – จองคิวออนไลน์</h1>
      <p className="text-gray-700 mb-4">เวลาเปิดบริการ 09:00–20:00</p>

      <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow p-5 space-y-4">
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
              <option key={s}>{s}</option>
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
                <option key={t}>{t}</option>
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

        {/* แนบสลิป (จำเป็นต้องเลือกก่อนส่ง) */}
        <div>
          <label className="block text-sm font-medium mb-1">แนบสลิปโอน</label>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setSlip(e.target.files?.[0] || null)}
            className="w-full"
          />
          <p className="text-xs text-gray-600 mt-1">รองรับ .jpg .png .pdf</p>
        </div>

        <button
          disabled={loading}
          className="w-full bg-black text-white rounded-xl py-3 font-semibold disabled:opacity-60"
        >
          {loading ? 'กำลังบันทึก...' : 'ยืนยันการจอง (แนบสลิปก่อน)'}
        </button>
      </form>
    </main>
  );
}
