'use client';

import { useEffect, useRef, useState } from 'react';
import { storage, auth } from '@/lib/firebase';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';

type Props = {
  /** จะถูกเรียกเมื่ออัปโหลดสำเร็จ พร้อม URL รูปสลิปที่พร้อมใช้งาน */
  onUpload: (url: string) => void;
  /** จำกัดขนาดไฟล์สูงสุด (MB) – ค่าเริ่มต้น 5MB */
  maxSizeMB?: number;
};

const ALLOWED_MIME = ['image/jpeg', 'image/png'];

export default function SlipUploadInline({ onUpload, maxSizeMB = 5 }: Props) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [doneUrl, setDoneUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ensure we have (anonymous) auth before upload
  useEffect(() => {
    let unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        try {
          await signInAnonymously(auth);
        } catch (e: any) {
          // ไม่ต้อง alert ที่นี่ ให้ไปแจ้งตอนจะอัปโหลดแทน
          console.error('Anon sign-in failed:', e?.message || e);
        }
      }
    });
    return () => unsub && unsub();
  }, []);

  function triggerPick() {
    if (uploading) return;
    setError(null);
    fileInputRef.current?.click();
  }

  async function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // reset ให้เลือกไฟล์ซ้ำได้

    if (!file) return;

    // validate
    if (!ALLOWED_MIME.includes(file.type)) {
      setError('อนุญาตเฉพาะไฟล์ .jpg / .jpeg / .png เท่านั้น');
      return;
    }
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`ไฟล์ใหญ่เกินไป (จำกัด ${maxSizeMB}MB)`);
      return;
    }

    // ensure auth exists
    const user = auth.currentUser;
    if (!user) {
      try {
        await signInAnonymously(auth);
      } catch (e: any) {
        setError('ไม่สามารถยืนยันตัวตนเพื่ออัปโหลดได้ (anonymous)');
        return;
      }
    }

    // upload
    try {
      setUploading(true);
      setProgress(0);
      setError(null);
      setDoneUrl(null);

      const safeName = file.name.replace(/\s+/g, '-').toLowerCase();
      const ts = Date.now();
      const path = `slips/${ts}-${safeName}`;

      const storageRef = ref(storage, path);
      const task = uploadBytesResumable(storageRef, file, {
        contentType: file.type,
      });

      task.on(
        'state_changed',
        (snap) => {
          const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
          setProgress(pct);
        },
        (err) => {
          console.error(err);
          setError(err?.message || 'อัปโหลดไม่สำเร็จ');
          setUploading(false);
        },
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          setDoneUrl(url);
          setUploading(false);
          setProgress(100);
          onUpload(url);
        }
      );
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'อัปโหลดไม่สำเร็จ');
      setUploading(false);
    }
  }

  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
        className="hidden"
        onChange={handlePick}
      />

      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={triggerPick}
          disabled={uploading}
          className="btn-secondary disabled:opacity-60"
        >
          {uploading ? 'กำลังอัปโหลด...' : (doneUrl ? 'อัปโหลดใหม่' : 'อัปโหลดสลิป')}
        </button>

        {uploading && (
          <div className="min-w-[160px] h-2 rounded bg-white/10 overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {doneUrl && !uploading && (
          <span className="text-emerald-300 text-sm">อัปโหลดแล้ว ✓</span>
        )}
      </div>

      {/* Preview เมื่ออัปโหลดสำเร็จ */}
      {doneUrl && (
        <div className="mt-3">
          <div className="text-sm text-gray-300 mb-2">พรีวิวสลิป</div>
          <img
            src={doneUrl}
            alt="slip preview"
            className="max-h-60 rounded-lg border border-white/10"
          />
        </div>
      )}

      {/* ข้อความกำกับ / เงื่อนไข */}
      <ul className="mt-3 text-sm text-yellow-300 space-y-1">
        <li>• อนุญาตเฉพาะไฟล์ .jpg / .jpeg / .png</li>
        <li>• ขนาดไฟล์ไม่เกิน {maxSizeMB}MB</li>
        <li>• ต้องอัปโหลดสลิปก่อนจึงจะยืนยันการจองได้</li>
      </ul>

      {error && (
        <div className="mt-3 text-sm text-red-300">
          {error}
        </div>
      )}
    </div>
  );
}
