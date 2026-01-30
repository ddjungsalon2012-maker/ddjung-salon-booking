// app/api/admin/bookings/[id]/status/route.ts
import { NextResponse } from 'next/server';
import { getAdminDb, verifyAdminFromRequest } from '@/lib/firebaseAdmin';

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminFromRequest(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { id } = await ctx.params;

    const body = await req.json();
    const status = body?.status;

    const db = getAdminDb();
    await db.collection('bookings').doc(id).update({ status });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
