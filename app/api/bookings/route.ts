import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { notifyBooking } from '@/lib/lineNotification';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      name, phone, service, date, time,
      notes = '',
      deposit = 0, slipUrl, adminEmail = ''
    } = body || {};

    if (![name, phone, service, date, time, slipUrl].every(value => typeof value === 'string' && value.trim())) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบ (name/phone/service/date/time/slipUrl)' }, { status: 400 });
    }

    const db = getAdminDb();

    // เช็กซ้ำกันจองซ้อน: Pending/Confirmed
    const ref = db.collection('bookings');
    const docRef = ref.doc();
    const saved = await db.runTransaction(async transaction => {
      // A date-only query avoids requiring an undeployed composite index.
      const existing = await transaction.get(ref.where('date', '==', date));
      if (existing.docs.some(doc => doc.get('time') === time && ['Pending', 'Confirmed'].includes(doc.get('status')))) return false;
      transaction.create(docRef, {
      name: String(name).trim(),
      phone: String(phone).trim(),
      service,
      date,
      time,
      notes: String(notes || '').trim(),
      status: 'Pending',
      deposit: Number(deposit) || 0,
      slipUrl,
      adminEmail,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lineNotificationStatus: 'pending',
      });
      return true;
    });
    if (!saved) return NextResponse.json({ error: 'ช่วงเวลานี้ถูกจองไปแล้ว กรุณาเลือกเวลาใหม่' }, { status: 409 });

    // Notification failure must not report an already-saved booking as failed.
    const notificationStatus = await notifyBooking({ id: docRef.id, service, date, time });
    try {
      await docRef.update({ lineNotificationStatus: notificationStatus });
    } catch {
      console.error('Could not record LINE notification status', { bookingId: docRef.id });
    }

    return NextResponse.json({ id: docRef.id });
  } catch (e: any) {
    console.error('POST /api/bookings error:', e);
    return NextResponse.json({ error: 'ระบบจองขัดข้องชั่วคราว กรุณาติดต่อร้านผ่าน LINE @ddjung', code: 'BOOKING_UNAVAILABLE' }, { status: 503 });
  }
}
