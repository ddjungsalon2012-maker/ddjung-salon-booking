// app/admin/layout.tsx
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      {/* แถบเมนูด้านบน */}
      <div className="sticky top-0 z-50 backdrop-blur bg-black/20 border-b border-white/10">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-2">
          <Link
            href="/admin"
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white"
          >
            หลังบ้าน
          </Link>

          <Link
            href="/admin/bookings"
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white"
          >
            รายการจอง
          </Link>

          <Link
            href="/admin/monthly"
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white"
          >
            สรุปรายเดือน
          </Link>

          <div className="flex-1" />

          <Link
            href="/admin/settings"
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white"
          >
            ตั้งค่า
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6">{children}</div>
    </div>
  );
}
