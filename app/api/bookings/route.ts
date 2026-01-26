import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

function getAdmin() {
  if (admin.apps.length) return admin.app();
  return admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      name, phone, service, date, time,
      notes = '', status = 'Pending',
      deposit = 0, slipUrl, adminEmail = ''
    } = body || {};

    if (!name || !phone || !service || !date || !time || !slipUrl) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบ (name/phone/service/date/time/slipUrl)' }, { status: 400 });
    }

    const app = getAdmin();
    const db = app.firestore();

    // เช็กซ้ำกันจองซ้อน: Pending/Confirmed
    const ref = db.collection('bookings');
    const [sp, sc] = await Promise.all([
      ref.where('date', '==', date).where('time', '==', time).where('status', '==', 'Pending').get(),
      ref.where('date', '==', date).where('time', '==', time).where('status', '==', 'Confirmed').get(),
    ]);

    if (!sp.empty || !sc.empty) {
      return NextResponse.json({ error: 'ช่วงเวลานี้ถูกจองไปแล้ว' }, { status: 409 });
    }

    const docRef = await ref.add({
      name: String(name).trim(),
      phone: String(phone).trim(),
      service,
      date,
      time,
      notes: String(notes || '').trim(),
      status,
      deposit: Number(deposit) || 0,
      slipUrl,
      adminEmail,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ id: docRef.id });
  } catch (e: any) {
    console.error('POST /api/bookings error:', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
