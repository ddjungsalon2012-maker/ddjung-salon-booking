// lib/firebaseAdmin.ts
import admin from 'firebase-admin';

export function getAdminApp() {
  if (admin.apps.length) return admin.app();
  return admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

export function getAdminDb() {
  const app = getAdminApp();
  return app.firestore();
}

export async function verifyAdminFromRequest(req: Request) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) {
    return { ok: false as const, status: 401, error: 'Missing token' };
  }

  const app = getAdminApp();
  const decoded = await app.auth().verifyIdToken(token);

  const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';
  if (!decoded.email || decoded.email !== adminEmail) {
    return { ok: false as const, status: 403, error: 'Not admin' };
  }

  return { ok: true as const, decoded };
}
