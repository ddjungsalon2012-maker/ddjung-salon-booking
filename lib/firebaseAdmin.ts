// lib/firebaseAdmin.ts
import admin from 'firebase-admin';

export function getAdminApp() {
  if (admin.apps.length) return admin.app();
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (clientEmail || privateKey) {
    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Incomplete Firebase Admin configuration');
    }
    return admin.initializeApp({
      projectId,
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
  }
  // Google-hosted environments can still use their attached service account.
  return admin.initializeApp({
    projectId,
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
