'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function SuccessPage() {
  const params = useParams();
  const { id } = params as { id?: string };

  const [bookingId, setBookingId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      setBookingId(id);
    }
  }, [id]);

  if (!bookingId) {
    return (
      <main className="min-h-screen flex items-center justify-center text-white">
        <p>ไม่พบรหัสการจอง</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10 text-gray-100">
      <div className="w-full max-w-2xl bg-white/5 backdrop-blur rounded-2xl p-6 shadow">
        <h1 className="text-2xl font-bold mb-4">จองสำเร็จ 🎉</h1>
        <p className="mb-6">
          รหัสการจอง:{' '}
          <span className="font-mono bg-white/10 px-2 py-1 rounded">{bookingId}</span>
        </p>
      </div>
    </main>
  );
}
