import { NextResponse } from "next/server";
import { getAdminDb, verifyAdminFromRequest } from "@/lib/firebaseAdmin";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const auth = await verifyAdminFromRequest(req);
    if (!auth.ok)
      return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { id } = await ctx.params;

    const body = (await req.json()) as { status?: string };

    const db = getAdminDb();
    await db.collection("bookings").doc(id).update({
      status: body.status ?? "pending",
      updatedAt: new Date(),
    });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
