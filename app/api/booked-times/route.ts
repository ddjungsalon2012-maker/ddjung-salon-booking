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

  if (!date) {
    return NextResponse.json({ error: 'Missing date' }, { status: 400 });
  }

  const app = getAdmin();
  const db = app.firestore();

  const snap = await db
    .collection('bookings')
    .where('date', '==', date)
    .get();

  const times = snap.docs
    .map((d) => (d.data().time as string) || '')
    .filter(Boolean);

  return NextResponse.json({ times });
}
