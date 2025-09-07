'use client';

import { useEffect, useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

type Props = {
  value?: string;
  onChange: (url: string) => void;
};

export default function LogoUpload({ value, onChange }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState<string | undefined>(value);

  useEffect(() => setUrl(value), [value]);

  async function doUpload() {
    if (!file) return;
    if (!/image\/(png|jpeg)/.test(file.type)) {
      alert('อัปโหลดได้เฉพาะ .png หรือ .jpg เท่านั้น'); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('ไฟล์ต้องไม่เกิน 5MB'); return;
    }
    try {
      setUploading(true);
      const ext = file.type === 'image/png' ? 'png' : 'jpg';
      const path = `logo/logo.${ext}`; // path คงที่: เขียนทับโลโก้เดิม
      const rf = ref(storage, path);
      await uploadBytes(rf, file);
      const download = await getDownloadURL(rf);
      setUrl(download);
      onChange(download);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || 'อัปโหลดโลโก้ไม่สำเร็จ');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-xl overflow-hidden bg-white/10 ring-1 ring-white/10 grid place-items-center">
          {url ? (
            <img src={url} alt="โลโก้" className="h-full w-full object-contain" />
          ) : (
            <span className="text-xs text-gray-400">No Logo</span>
          )}
        </div>
        <input
          type="file"
          accept="image/png,image/jpeg"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="text-sm"
        />
        <button onClick={doUpload} disabled={!file || uploading} className="btn-secondary">
          {uploading ? 'กำลังอัปโหลด...' : 'อัปโหลดโลโก้'}
        </button>
      </div>
      <p className="text-xs text-gray-400">รองรับ .png / .jpg ขนาดไม่เกิน 5MB</p>
    </div>
  );
}
