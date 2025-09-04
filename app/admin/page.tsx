'use client';
import AdminGate from '@/components/AdminGate';
import { db } from '@/lib/firebase';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, updateDoc, doc, Timestamp } from 'firebase/firestore';

type BookingDoc = {
  id: string;
  name: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  status: 'Pending' | 'Confirmed' | 'Cancelled';
  createdAt?: Timestamp;
};

export default function AdminPage(){
  const [items, setItems] = useState<BookingDoc[]>([]);

  useEffect(()=>{
    const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      const rows: BookingDoc[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<BookingDoc,'id'>) }));
      setItems(rows);
    });
    return () => unsub();
  },[]);

  async function setStatus(id: string, status: BookingDoc['status']){
    await updateDoc(doc(db,'bookings', id), { status });
  }

  return (
    <AdminGate>
      <div className="bg-white rounded-2xl shadow p-4 overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">เมื่อ</th>
              <th>ชื่อ</th>
              <th>บริการ</th>
              <th>วัน</th>
              <th>เวลา</th>
              <th>สถานะ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map(it=> (
              <tr key={it.id} className="border-b">
                <td className="py-2">{it.createdAt?.toDate ? it.createdAt.toDate().toLocaleString() : '-'}</td>
                <td>{it.name} <div className="text-gray-500">{it.phone}</div></td>
                <td>{it.service}</td>
                <td>{it.date}</td>
                <td>{it.time}</td>
                <td>{it.status}</td>
                <td className="space-x-2">
                  <button onClick={()=>setStatus(it.id,'Confirmed')} className="px-2 py-1 rounded bg-green-600 text-white">Confirm</button>
                  <button onClick={()=>setStatus(it.id,'Cancelled')} className="px-2 py-1 rounded bg-red-600 text-white">Cancel</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminGate>
  );
}
