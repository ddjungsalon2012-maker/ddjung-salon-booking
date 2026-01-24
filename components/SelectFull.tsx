'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type SelectFullProps = {
  /** รายการตัวเลือก (string ทั้งหมด) */
  options: string[];
  /** ค่าที่เลือกอยู่ (string) */
  value: string | '';
  /** fired เมื่อเลือกค่า */
  onChange: (val: string) => void;
  /** ข้อความ placeholder เวลาไม่มีค่า */
  placeholder?: string;
  /** ปิดใช้งาน */
  disabled?: boolean;
  /** ความสูงต่อแถว (px) ใช้คุมความสูง dropdown ให้สวย */
  itemHeight?: number; // default 48
  /** ถ้าต้องการให้กล่อง dropdown กว้างเท่าปุ่ม ให้ใช้ค่า true (ค่าเริ่มต้น true) */
  matchButtonWidth?: boolean;
};

export default function SelectFull({
  options,
  value,
  onChange,
  placeholder = 'กรุณาเลือก',
  disabled,
  itemHeight = 48,
  matchButtonWidth = true,
}: SelectFullProps) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);

  // ปิดเมื่อคลิกนอก
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!popRef.current || !btnRef.current) return;
      const el = e.target as Node;
      if (!popRef.current.contains(el) && !btnRef.current.contains(el)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  // คำนวณสไตล์/ตำแหน่ง popup
  const popStyle = useMemo<React.CSSProperties>(() => {
    const base: React.CSSProperties = {
      position: 'absolute',
      zIndex: 50,
      top: '100%',
      marginTop: 8,
      maxHeight: 420,
      overflowY: 'auto',
    };
    if (matchButtonWidth && btnRef.current) {
      base.minWidth = btnRef.current.offsetWidth;
    }
    return base;
  }, [matchButtonWidth, btnRef.current?.offsetWidth]); // eslint-disable-line

  const selectedIdx = value ? options.findIndex(o => o === value) : -1;

  function choose(v: string) {
    onChange(v);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-left outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
      >
        <div className="flex items-center justify-between">
          <span className={value ? 'text-white' : 'text-gray-400'}>
            {value || placeholder}
          </span>
          <span className="opacity-80">▾</span>
        </div>
      </button>

      {open && (
        <div
          ref={popRef}
          style={popStyle}
          className="rounded-xl border border-white/10 bg-[#0b1220]/95 backdrop-blur shadow-xl p-1"
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-400">ไม่มีตัวเลือก</div>
          ) : (
            <ul className="max-h-[420px] overflow-y-auto">
              {options.map((opt, i) => {
                const active = i === selectedIdx;
                return (
                  <li key={opt}>
                    <button
                      type="button"
                      onClick={() => choose(opt)}
                      style={{ height: itemHeight }}
                      className={
                        'w-full text-left px-3 rounded-lg flex items-center ' +
                        (active
                          ? 'bg-blue-600/30 text-white'
                          : 'text-gray-100 hover:bg-white/10')
                      }
                    >
                      {opt}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
