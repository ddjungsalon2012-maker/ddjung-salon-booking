'use client';

import { useEffect, useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { getAuth } from 'firebase/auth';

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
    if (!file) {
      alert('กรุณาเลือกไฟล์ก่อน');
      return;
    }
    if (!/image\/(png|jpeg)/.test(file.type)) {
      alert('อัปโหลดได้เฉพาะ .png หรือ .jpg เท่านั้น');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('ไฟล์ต้องไม่เกิน 5MB');
      return;
    }

    try {
      setUploading(true);

      // ต้องล็อกอินเป็นแอดมิน (ตาม Storage rules)
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        alert('กรุณาเข้าสู่ระบบแอดมินก่อนอัปโหลดโลโก้');
        return;
      }
      await user.getIdToken(true); // refresh token

      const ext = file.type === 'image/png' ? 'png' : 'jpg';
      // ✅ ให้ตรงกับ rules: logos/**
      const path = `logos/logo.${ext}`;
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
            <span className="text-xs text-gray-400">โลโก้</span>
          )}
        </div>

        <label className="text-sm">
          <input
            type="file"
            accept="image/png,image/jpeg"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="hidden"
            id="logo-input"
          />
          <span className="btn-secondary cursor-pointer" onClick={() => document.getElementById('logo-input')?.click()}>
            เลือกไฟล์
          </span>
          <span className="ml-3 text-gray-300">
            {file ? file.name : 'ไม่มีไฟล์ที่เลือก'}
          </span>
        </label>

        {/* ✅ type="button" กันฟอร์ม submit */}
        <button
          type="button"
          onClick={doUpload}
          disabled={!file || uploading}
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'กำลังอัปโหลด…' : 'อัปโหลดโลโก้'}
        </button>
      </div>

      <p className="text-xs text-gray-400">รองรับ .png / .jpg ขนาดไม่เกิน 5MB</p>
    </div>
  );
}
