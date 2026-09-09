import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');
  if (!date) return NextResponse.json({ error: 'Missing date' }, { status: 400 });
  try {
    const snap = await getAdminDb().collection('bookings').where('date', '==', date).get();
    const times = new Set<string>();
    snap.docs.forEach(doc => {
      if (['Pending', 'Confirmed'].includes(doc.get('status')) && typeof doc.get('time') === 'string') times.add(doc.get('time'));
    });
    return NextResponse.json({ times: [...times].sort() });
  } catch {
    console.error('GET /api/booked-times failed');
    return NextResponse.json({ error: 'ตรวจสอบเวลาว่างไม่ได้ กรุณาลองใหม่หรือติดต่อร้านผ่าน LINE @ddjung' }, { status: 503 });
  }
}
