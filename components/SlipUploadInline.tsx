'use client';

import { useRef, useState } from 'react';
import { storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

type Props = {
  onUpload: (url: string) => void;
};

export default function SlipUploadInline({ onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  const pickFile = () => inputRef.current?.click();

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // ตรวจชนิดไฟล์ + ขนาด
    if (!/^image\/(png|jpe?g)$/i.test(file.type)) {
      setError('อนุญาตเฉพาะไฟล์ .jpg .jpeg หรือ .png');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('ขนาดไฟล์ต้องไม่เกิน 5MB');
      return;
    }

    // อัปโหลดเข้าโฟลเดอร์ slips/
    const safeName = file.name.replace(/\s+/g, '_');
    const path = `slips/${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`;
    const storageRef = ref(storage, path);
    const task = uploadBytesResumable(storageRef, file, { contentType: file.type });

    setProgress(0);

    task.on(
      'state_changed',
      snap => {
        const p = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        setProgress(p);
      },
      err => {
        console.error(err);
        setError('อัปโหลดไม่สำเร็จ ลองใหม่อีกครั้ง');
        setProgress(null);
      },
      async () => {
        const downloadURL = await getDownloadURL(task.snapshot.ref);
        setUrl(downloadURL);
        setProgress(null);
        onUpload(downloadURL);
      }
    );
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={onFile}
      />

      <button type="button" onClick={pickFile} className="btn-secondary">
        อัปโหลดสลิป
      </button>

      <ul className="text-sm text-yellow-200 list-disc pl-5">
        <li>อนุญาตเฉพาะไฟล์ .jpg / .jpeg / .png</li>
        <li>ขนาดไฟล์ไม่เกิน 5MB</li>
        <li>ต้องอัปโหลดสลิปก่อนจึงจะยืนยันการจองได้</li>
      </ul>

      {progress !== null && (
        <div className="text-sm">กำลังอัปโหลด… {progress}%</div>
      )}

      {url && (
        <div className="text-sm break-all">
          อัปโหลดแล้ว ✓
        </div>
      )}

      {error && <div className="text-sm text-red-300">{error}</div>}
    </div>
  );
}
