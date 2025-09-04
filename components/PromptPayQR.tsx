'use client';

import Image from 'next/image';

export default function PromptPayQR({ amount }: { amount?: number }) {
  const number = process.env.NEXT_PUBLIC_PROMPTPAY || '0634594628';
  // ใช้บริการรูป QR สำเร็จรูป: https://promptpay.io/{number}/{amount}.png
  const src = `https://promptpay.io/${encodeURIComponent(number)}${
    amount ? `/${amount}` : ''
  }.png`;

  return (
    <div className="rounded-2xl border border-gold/40 bg-midnight/50 p-4">
      <h3 className="text-lg font-semibold text-gold">ชำระเงินด้วย PromptPay</h3>
      <p className="text-sm text-gray-300 mt-1">
        หมายเลข: <span className="font-mono text-white">{number}</span>
        {amount ? (
          <>
            {' '}ยอดชำระ <span className="font-semibold text-gold">{amount.toLocaleString()} บาท</span>
          </>
        ) : null}
      </p>
      <div className="mt-3 flex items-center justify-center">
        <Image
          src={src}
          alt="PromptPay QR"
          width={240}
          height={240}
          className="rounded-xl bg-black/40 p-2 ring-1 ring-gold/30"
          priority
        />
      </div>
      <p className="text-xs text-gray-400 mt-2 text-center">
        สแกนด้วยแอปธนาคารเพื่อชำระเงิน
      </p>
    </div>
  );
}
