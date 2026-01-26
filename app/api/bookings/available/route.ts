import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

function getAdmin() {
  if (admin.apps.length) return admin.app();
  return admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');
  const time = searchParams.get('time');

  if (!date || !time) {
    return NextResponse.json({ error: 'Missing date/time' }, { status: 400 });
  }

  const app = getAdmin();
  const db = app.firestore();
  const ref = db.collection('bookings');

  const [sp, sc] = await Promise.all([
    ref.where('date', '==', date).where('time', '==', time).where('status', '==', 'Pending').get(),
    ref.where('date', '==', date).where('time', '==', time).where('status', '==', 'Confirmed').get(),
  ]);

  const available = sp.empty && sc.empty;
  return NextResponse.json({ available });
}
