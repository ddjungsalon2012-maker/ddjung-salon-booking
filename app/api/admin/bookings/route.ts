// app/api/admin/bookings/route.ts
import { NextResponse } from 'next/server';
import { getAdminDb, verifyAdminFromRequest } from '@/lib/firebaseAdmin';

export async function GET(req: Request) {
  try {
    const auth = await verifyAdminFromRequest(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date'); // yyyy-mm-dd
    if (!date) return NextResponse.json({ error: 'Missing date' }, { status: 400 });

    const db = getAdminDb();
    const snap = await db
      .collection('bookings')
      .where('date', '==', date)
      .orderBy('time', 'asc')
      .get();

    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
