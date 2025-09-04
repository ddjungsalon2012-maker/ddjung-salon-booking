// lib/booking.ts
import { db } from "./firebase";
import {
  doc, runTransaction, serverTimestamp, collection
} from "firebase/firestore";

export type BookingInput = {
  name: string;
  phone: string;
  service: string;
  date: string;   // YYYY-MM-DD
  time: string;   // HH:mm
  notes?: string;
  deposit?: number;
  slipUrl?: string;     // <— เพิ่ม
  presetId?: string;    // <— เพิ่ม (จอง id ล่วงหน้า)
};

// จองได้สูงสุด 2 ต่อช่วงเวลา (ตามที่เราทำไว้)
export async function createBooking(input: BookingInput) {
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";
  const deposit = input.deposit ?? 500;
  const slotId = `${input.date}_${input.time}`;
  const slotRef = doc(db, "slots", slotId);

  const bookingId = await runTransaction(db, async (tx) => {
    // slot counter
    const slotSnap = await tx.get(slotRef);
    if (!slotSnap.exists()) {
      tx.set(slotRef, { capacity: 2, booked: 0, createdAt: serverTimestamp(), adminEmail });
    }
    const data = slotSnap.exists() ? (slotSnap.data() as any) : { capacity: 2, booked: 0 };
    const capacity = typeof data.capacity === "number" ? data.capacity : 2;
    const booked = typeof data.booked === "number" ? data.booked : 0;
    if (booked >= capacity) throw new Error("ช่วงเวลานี้เต็มแล้ว (เต็ม 2 คิวต่อช่วง)");

    // เตรียมเอกสาร booking ด้วย presetId (ถ้ามี)
    const id = input.presetId || doc(collection(db, "bookings")).id;
    const bookingRef = doc(db, "bookings", id);

    // อัปเดตตัวนับใน slot
    tx.update(slotRef, { booked: booked + 1, updatedAt: serverTimestamp(), adminEmail });

    // เขียน booking
    tx.set(bookingRef, {
      name: input.name,
      phone: input.phone,
      service: input.service,
      date: input.date,
      time: input.time,
      notes: input.notes || "",
      status: "Pending",
      deposit,
      slipUrl: input.slipUrl || "", // บันทึก URL สลิปที่อัปโหลดแล้ว
      adminEmail,
      createdAt: serverTimestamp(),
      slotId,
    });

    return id;
  });

  return { id: bookingId };
}
