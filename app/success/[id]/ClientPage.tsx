'use client';

import { useEffect, useState } from 'react';

export default function ClientPage({ id }: { id: string }) {
  // logic ฝั่ง client ของคุณ เช่น fetch ข้อมูล ตาม id
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, [id]);

  return (
    <main className="min-h-screen px-4 py-10 text-gray-100">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold mb-4">รายละเอียดการจอง</h1>
        <p className="font-mono">Booking ID: {id}</p>
        {!ready && <p>กำลังโหลด…</p>}
        {/* ส่วนแสดงผลอื่น ๆ ของคุณ */}
      </div>
    </main>
  );
}
