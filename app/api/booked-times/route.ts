import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

function getAdmin() {
  if (admin.apps.length) return admin.app();
  return admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    if (!date) {
      return NextResponse.json({ error: 'Missing date' }, { status: 400 });
    }

    const app = getAdmin();
    const db = app.firestore();

    const ref = db.collection('bookings');
    const [sp, sc] = await Promise.all([
      ref.where('date', '==', date).where('status', '==', 'Pending').get(),
      ref.where('date', '==', date).where('status', '==', 'Confirmed').get(),
    ]);

    const times = new Set<string>();
    sp.forEach((d) => {
      const t = d.get('time');
      if (typeof t === 'string') times.add(t);
    });
    sc.forEach((d) => {
      const t = d.get('time');
      if (typeof t === 'string') times.add(t);
    });

    return NextResponse.json({ times: Array.from(times) });
  } catch (e: any) {
    console.error('GET /api/booked-times error:', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
