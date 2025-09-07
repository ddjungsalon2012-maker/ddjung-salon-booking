import { db } from './firebase';
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';

export type BookingInput = {
  name: string;
  phone: string;
  service: string;
  date: string;  // yyyy-mm-dd
  time: string;  // HH:mm
  notes?: string;
  status: 'Pending' | 'Confirmed' | 'Cancelled';
  deposit: number;
  slipUrl: string;
  adminEmail?: string;
};

const BOOKINGS = 'bookings';

/** ตรวจว่า slot ว่างหรือไม่ (นับ Pending + Confirmed) */
export async function checkSlotAvailable(date: string, time: string) {
  const ref = collection(db, BOOKINGS);
  const [qp, qc] = [
    query(ref, where('date', '==', date), where('time', '==', time), where('status', '==', 'Pending')),
    query(ref, where('date', '==', date), where('time', '==', time), where('status', '==', 'Confirmed')),
  ];
  const [sp, sc] = await Promise.all([getDocs(qp), getDocs(qc)]);
  return sp.empty && sc.empty;
}

/** บันทึกการจอง (เช็กซ้ำก่อนเขียน) */
export async function addBooking(input: BookingInput) {
  const ok = await checkSlotAvailable(input.date, input.time);
  if (!ok) throw new Error('ช่วงเวลานี้ถูกจองไปแล้ว กรุณาเลือกเวลาอื่น');

  const ref = collection(db, BOOKINGS);
  const docRef = await addDoc(ref, {
    ...input,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}
