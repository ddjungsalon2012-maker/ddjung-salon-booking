'use client';
import { useEffect, useState } from 'react';
import { auth, storage } from '@/lib/firebase';
import { signInAnonymously } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

type Props = { onUploaded: (url: string) => void };

export default function SlipUploadInline({ onUploaded }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [doneUrl, setDoneUrl] = useState<string>('');
  const [err, setErr] = useState<string>('');

  useEffect(() => {
    // ให้ผู้ใช้มี session แบบ anonymous เพื่ออัปโหลดได้ตาม Storage Rules
    signInAnonymously(auth).catch(() => {});
  }, []);

  async function doUpload() {
    if (!file) return;
    setErr('');
    setUploading(true);
    try {
      const key = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now());
      const r = ref(storage, `slips/pending/${key}-${file.name}`);
      await uploadBytes(r, file);
      const url = await getDownloadURL(r);
      setDoneUrl(url);
      onUploaded(url);
    } catch (e: unknown) {
      const msg = (e as { message?: string }).message ?? 'อัปโหลดไม่สำเร็จ';
      setErr(msg);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-700/50 p-4 bg-midnight/50">
      <label className="block text-sm font-medium mb-2 text-gray-200">แนบสลิปโอน (บังคับ)</label>

      <div className="flex items-center gap-3">
        <input
          type="file"
          accept="image/*,application/pdf"
          className="block w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-gold file:text-black file:px-3 file:py-2 hover:file:bg-yellow-400"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          onClick={doUpload}
          disabled={!file || uploading}
          className="px-4 py-2 rounded-lg bg-royal text-white disabled:opacity-50"
        >
          {uploading ? 'กำลังอัปโหลด...' : 'อัปโหลด'}
        </button>
      </div>

      {doneUrl && <p className="mt-2 text-xs text-green-400">อัปโหลดแล้ว ✓</p>}
      {err && <p className="mt-2 text-xs text-red-400">{err}</p>}
    </div>
  );
}
