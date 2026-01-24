import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export type BookingStatus = 'Pending' | 'Confirmed' | 'Rejected';

export async function setBookingStatus(id: string, status: BookingStatus, note?: string) {
  const ref = doc(db, 'bookings', id);
  await updateDoc(ref, {
    status,
    adminNote: note ?? '',
    reviewedAt: serverTimestamp(),
  });
}
