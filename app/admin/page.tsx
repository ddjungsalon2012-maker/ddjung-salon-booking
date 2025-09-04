'use client';
import AdminGate from '@/components/AdminGate';
import { db } from '@/lib/firebase';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, updateDoc, doc } from 'firebase/firestore';

export default function AdminPage() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  async function setStatus(id: string, status: 'Pending' | 'Confirmed' | 'Cancelled') {
    await updateDoc(doc(db, 'bookings', id), { status });
  }

  return (
    <AdminGate>
      <div className="space-y-4">
        {items.map((it: any) => (
          <div
            key={it.id}
            className="bg-white rounded-2xl shadow p-4 border border-gray-200 hover:shadow-md transition"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1 text-gray-900">
                <p className="font-semibold text-lg">{it.name}</p>
                <p className="text-sm text-gray-600">{it.phone}</p>
                <p className="text-sm"><span className="font-medium">บริการ:</span> {it.service}</p>
                <p className="text-sm"><span className="font-medium">วันเวลา:</span> {it.date} {it.time}</p>
                <p className="text-xs text-gray-500">
                  {it.createdAt?.toDate ? it.createdAt.toDate().toLocaleString() : '-'}
                </p>
              </div>

              <div className="mt-3 sm:mt-0 flex flex-col sm:items-end gap-2">
                <span
                  className={
                    'inline-block px-3 py-1 rounded-full text-white text-sm ' +
                    (it.status === 'Confirmed'
                      ? 'bg-green-600'
                      : it.status === 'Cancelled'
                      ? 'bg-red-600'
                      : 'bg-gray-700')
                  }
                >
                  {it.status}
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={() => setStatus(it.id, 'Confirmed')}
                    className="px-3 py-1 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setStatus(it.id, 'Cancelled')}
                    className="px-3 py-1 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {items.length === 0 && <p className="text-center text-gray-500">ยังไม่มีการจอง</p>}
      </div>
    </AdminGate>
  );
}
