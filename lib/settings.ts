import { db, storage, auth } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export type ShopSettings = {
  shopName: string;
  promptpayNumber: string; // หมายเลขพร้อมเพย์
  promptpayNote?: string;  // บรรทัดคำอธิบายใต้ QR
  logoUrl?: string;
  qrUrl?: string;
  updatedAt?: any;
};

const SETTINGS_DOC = doc(db, 'settings', 'global');

export async function getSettings(): Promise<ShopSettings | null> {
  const snap = await getDoc(SETTINGS_DOC);
  return (snap.exists() ? (snap.data() as ShopSettings) : null);
}

export async function updateSettings(partial: Partial<ShopSettings>) {
  await setDoc(
    SETTINGS_DOC,
    { ...partial, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function uploadAdminImage(
  file: File,
  kind: 'logo' | 'qr'
): Promise<string> {
  const ct = file.type;
  if (!['image/png', 'image/jpeg'].includes(ct)) {
    throw new Error('อนุญาตเฉพาะไฟล์ .jpg หรือ .png');
  }
  const ts = Date.now();
  const path = kind === 'logo' ? `logos/${ts}-${file.name}` : `qrs/${ts}-${file.name}`;
  const r = ref(storage, path);
  await uploadBytes(r, file, { contentType: file.type });
  return await getDownloadURL(r);
}
