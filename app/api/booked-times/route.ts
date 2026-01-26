import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

function getAdmin() {
  if (admin.apps.length) return admin.app();
  return admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

type BookingInput = {
  name: string;
  phone: string;
  service: string;
  date: string; // yyyy-mm-dd
  time: string; // HH:mm
  notes?: string;
  deposit: number;
  slipUrl: string;
  adminEmail?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<BookingInput>;

    const required = ['name', 'phone', 'service', 'date', 'time', 'deposit', 'slipUrl'] as const;
    for (const k of required) {
      if (!body[k]) {
        return NextResponse.json({ error: `Missing ${k}` }, { status: 400 });
      }
    }

    const input: BookingInput = {
      name: String(body.name).trim(),
      phone: String(body.phone).trim(),
      service: String(body.service),
      date: String(body.date),
      time: String(body.time),
      notes: String(body.notes ?? '').trim(),
      deposit: Number(body.deposit),
      slipUrl: String(body.slipUrl),
      adminEmail: body.adminEmail ? String(body.adminEmail) : undefined,
    };

    const app = getAdmin();
    const db = app.firestore();

    const slotId = `${input.date}_${input.time}`;
    const slotRef = db.collection('slots').doc(slotId);
    const bookingRef = db.collection('bookings').doc(); // สร้าง id ล่วงหน้า

    // ทำให้ “ล็อกเวลา + สร้าง booking” แบบ atomic กันจองซ้ำ
    await db.runTransaction(async (tx) => {
      const slotSnap = await tx.get(slotRef);
      if (slotSnap.exists) {
        throw new Error('ช่วงเวลานี้ถูกจองไปแล้ว กรุณาเลือกเวลาอื่น');
      }

      tx.set(slotRef, {
        locked: true,
        date: input.date,
        time: input.time,
        bookingId: bookingRef.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      tx.set(bookingRef, {
        ...input,
        status: 'Pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({ id: bookingRef.id });
  } catch (e: any) {
    const msg = e?.message ?? String(e);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
