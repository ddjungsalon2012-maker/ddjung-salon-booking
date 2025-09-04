import { db } from './firebase';
import {
  doc, runTransaction, serverTimestamp, collection, Timestamp
} from 'firebase/firestore';

export type BookingInput = {
  name: string;
  phone: string;
  service: string;
  date: string;   // YYYY-MM-DD
  time: string;   // HH:mm
  notes?: string;
  deposit?: number;
  slipUrl?: string;
};

type SlotDoc = {
  capacity: number;
  booked: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  adminEmail?: string;
};

export async function createBooking(input: BookingInput) {
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';
  const deposit = input.deposit ?? 500;
  const slotId = `${input.date}_${input.time}`;
  const slotRef = doc(db, 'slots', slotId);

  const bookingId = await runTransaction(db, async (tx) => {
    // อ่าน/สร้าง slot
    const slotSnap = await tx.get(slotRef);
    let slot: SlotDoc = { capacity: 2, booked: 0 };
    if (!slotSnap.exists()) {
      tx.set(slotRef, { capacity: 2, booked: 0, createdAt: serverTimestamp(), adminEmail });
    } else {
      slot = (slotSnap.data() as SlotDoc);
    }

    const capacity = typeof slot.capacity === 'number' ? slot.capacity : 2;
    const booked = typeof slot.booked === 'number' ? slot.booked : 0;
    if (booked >= capacity) {
      throw new Error('ช่วงเวลานี้เต็มแล้ว (เต็ม 2 คิวต่อช่วง)');
    }

    // เตรียม id booking
    const newRef = doc(collection(db, 'bookings'));
    const id = newRef.id;

    // อัปเดต slot counter
    tx.update(slotRef, { booked: booked + 1, updatedAt: serverTimestamp(), adminEmail });

    // เขียน booking
    tx.set(newRef, {
      name: input.name,
      phone: input.phone,
      service: input.service,
      date: input.date,
      time: input.time,
      notes: input.notes || '',
      status: 'Pending',
      deposit,
      slipUrl: input.slipUrl || '',
      adminEmail,
      createdAt: serverTimestamp(),
      slotId,
    });

    return id;
  });

  return { id: bookingId };
}
