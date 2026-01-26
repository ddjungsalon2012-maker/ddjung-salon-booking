// app/api/admin/bookings/[id]/route.ts
import { NextResponse } from 'next/server';
import { getAdminDb, verifyAdminFromRequest } from '@/lib/firebaseAdmin';

export async function DELETE(req: Request, ctx: { params: { id: string } }) {
  try {
    const auth = await verifyAdminFromRequest(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const id = ctx.params.id;
    const db = getAdminDb();
    await db.collection('bookings').doc(id).delete();

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
