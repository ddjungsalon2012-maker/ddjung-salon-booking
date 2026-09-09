import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');
  const time = searchParams.get('time');
  if (!date || !time) return NextResponse.json({ error: 'Missing date/time' }, { status: 400 });
  try {
    const snap = await getAdminDb().collection('bookings').where('date', '==', date).get();
    const available = !snap.docs.some(doc => doc.get('time') === time && ['Pending', 'Confirmed'].includes(doc.get('status')));
    return NextResponse.json({ available });
  } catch {
    console.error('GET /api/bookings/available failed');
    return NextResponse.json({ error: 'ตรวจสอบเวลาว่างไม่ได้ กรุณาลองใหม่หรือติดต่อร้านผ่าน LINE @ddjung' }, { status: 503 });
  }
}
