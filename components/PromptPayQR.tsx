'use client';

import React from 'react';

type Props = {
  accountNo: string;     // หมายเลขพร้อมเพย์
  amount?: number;       // จำนวนเงิน (ไม่ใส่ก็ได้)
  size?: number;         // ขนาด px ของรูป (default 220)
};

export default function PromptPayQR({ accountNo, amount, size = 220 }: Props) {
  // ใช้ API ของ promptpay.io (ฝั่ง client) คืนรูป QR โดยไม่ต้องมี key
  const src = amount
    ? `https://promptpay.io/${encodeURIComponent(accountNo)}/${amount}.png`
    : `https://promptpay.io/${encodeURIComponent(accountNo)}.png`;

  return (
    <div className="rounded-xl border border-yellow-500/40 bg-black/10 p-3">
      <img
        src={src}
        width={size}
        height={size}
        alt="PromptPay QR"
        className="mx-auto rounded-lg ring-2 ring-yellow-500/40"
      />
      <p className="mt-2 text-center text-sm text-gray-300">
        พร้อมเพย์: <span className="font-semibold">{accountNo}</span>
        {amount ? <> | ยอดมัดจำ {amount.toLocaleString()} บาท</> : null}
      </p>
    </div>
  );
}
