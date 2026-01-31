"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AdminGate from "@/components/AdminGate";

type Booking = {
  date?: string;      // yyyy-mm-dd
  status?: string;    // Pending/Confirmed/Rejected/Cancelled
  service?: string;
  deposit?: number;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function monthStart(yyyy: number, mm: number) {
  return `${yyyy}-${pad2(mm)}-01`;
}

function nextMonthStart(yyyy: number, mm: number) {
  // mm: 1..12
  const d = new Date(yyyy, mm - 1, 1);
  d.setMonth(d.getMonth() + 1);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-01`;
}

function thMonthName(mm: number) {
  const names = [
    "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
    "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"
  ];
  return names[mm - 1] ?? `เดือน ${mm}`;
}

export default function MonthlyReportPage() {
  const now = new Date();
  const [yyyy, setYyyy] = useState(now.getFullYear());
  const [mm, setMm] = useState(now.getMonth() + 1);

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Booking[]>([]);

  const start = useMemo(() => monthStart(yyyy, mm), [yyyy, mm]);
  const endExclusive = useMemo(() => nextMonthStart(yyyy, mm), [yyyy, mm]);

  const STATUS_TH: Record<string, string> = {
    Pending: "รอตรวจสอบ",
    Confirmed: "ยืนยันแล้ว",
    Rejected: "ปฏิเสธ",
    Cancelled: "ยกเลิก",
    Unknown: "ไม่ระบุสถานะ",
  };

  async function load() {
    setLoading(true);
    try {
      const ref = collection(db, "bookings");

      // ดึงรายการภายในเดือน: date >= start && date < nextMonthStart
      const qy = query(ref, where("date", ">=", start), where("date", "<", endExclusive));
      const snap = await getDocs(qy);

      const list: Booking[] = snap.docs.map((d) => d.data() as any);
      setRows(list);
    } catch (e) {
      console.error(e);
      setRows([]);
      alert("โหลดรายงานไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  const summary = useMemo(() => {
    const s = {
      total: 0,
      depositTotal: 0,

      pending: 0,
      confirmed: 0,
      rejected: 0,
      cancelled: 0,
      unknown: 0,

      // service => { count, deposit }
      byService: new Map<string, { count: number; deposit: number }>(),
    };

    s.total = rows.length;

    for (const r of rows) {
      const status = r.status || "Unknown";
      if (status === "Pending") s.pending++;
      else if (status === "Confirmed") s.confirmed++;
      else if (status === "Rejected") s.rejected++;
      else if (status === "Cancelled") s.cancelled++;
      else s.unknown++;

      const service = (r.service || "").trim() || "ไม่ระบุบริการ";
      const dep = typeof r.deposit === "number" ? r.deposit : 0;

      s.depositTotal += dep;

      const cur = s.byService.get(service) ?? { count: 0, deposit: 0 };
      cur.count += 1;
      cur.deposit += dep;
      s.byService.set(service, cur);
    }

    return s;
  }, [rows]);

  const byServiceSorted = useMemo(() => {
    return Array.from(summary.byService.entries())
      .sort((a, b) => {
        // เรียงตามจำนวนก่อน ถ้าเท่ากันค่อยเรียงตามมัดจำรวม
        if (b[1].count !== a[1].count) return b[1].count - a[1].count;
        return b[1].deposit - a[1].deposit;
      });
  }, [summary.byService]);

  return (
    <AdminGate>
      <main className="min-h-screen px-6 py-10 text-gray-100">
        <div className="mx-auto max-w-5xl space-y-6">
          {/* Header */}
          <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">หลังบ้าน – สรุปรายเดือน</h1>
              <div className="text-sm text-gray-300 mt-1">
                ช่วงวันที่: <span className="font-semibold">{start}</span> ถึง{" "}
                <span className="font-semibold">{endExclusive}</span> (ไม่รวมวันสุดท้าย)
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href="/admin" className="btn-secondary">รายการจอง</Link>
              <Link href="/admin/settings" className="btn-secondary">ตั้งค่า</Link>
            </div>
          </header>

          {/* Controls */}
          <section className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="bg-white/10 border border-white/10 rounded-xl px-3 py-2"
                value={yyyy}
                onChange={(e) => setYyyy(Number(e.target.value))}
              >
                {Array.from({ length: 8 }).map((_, i) => {
                  const y = now.getFullYear() - 4 + i;
                  return (
                    <option key={y} value={y}>
                      ปี {y}
                    </option>
                  );
                })}
              </select>

              <select
                className="bg-white/10 border border-white/10 rounded-xl px-3 py-2"
                value={mm}
                onChange={(e) => setMm(Number(e.target.value))}
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {thMonthName(i + 1)}
                  </option>
                ))}
              </select>

              <button
                onClick={load}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 disabled:opacity-50"
              >
                {loading ? "กำลังโหลด..." : "โหลดสรุป"}
              </button>

              <div className="ml-auto text-sm text-gray-300">
                จำนวนรายการที่โหลด: <span className="font-semibold text-white">{rows.length}</span>
              </div>
            </div>
          </section>

          {/* KPI Cards */}
          <section className="grid gap-3 md:grid-cols-5">
            <Card label="ยอดจองรวม" value={summary.total.toLocaleString()} />
            <Card label={STATUS_TH.Pending} value={summary.pending.toLocaleString()} />
            <Card label={STATUS_TH.Confirmed} value={summary.confirmed.toLocaleString()} />
            <Card label={STATUS_TH.Rejected} value={summary.rejected.toLocaleString()} />
            <Card label={STATUS_TH.Cancelled} value={summary.cancelled.toLocaleString()} />
          </section>

          {/* Deposit total */}
          <section className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-lg font-semibold">ยอดมัดจำรวม (ทั้งเดือน)</div>
              <div className="text-2xl font-bold">
                {summary.depositTotal.toLocaleString()} บาท
              </div>
            </div>
            {summary.unknown > 0 && (
              <div className="text-sm text-gray-300 mt-2">
                * พบรายการที่ไม่ระบุสถานะ: <span className="font-semibold text-white">{summary.unknown}</span>
              </div>
            )}
          </section>

          {/* By service */}
          <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-3">แยกตามบริการ</h2>

            {byServiceSorted.length === 0 ? (
              <div className="text-gray-300">ยังไม่มีข้อมูลในเดือนนี้</div>
            ) : (
              <div className="space-y-2">
                {byServiceSorted.map(([name, v]) => (
                  <div
                    key={name}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-3"
                  >
                    <div className="font-medium">{name}</div>

                    <div className="flex flex-wrap gap-3 text-sm">
                      <span className="px-2 py-1 rounded bg-white/10 border border-white/10">
                        จำนวน: <b>{v.count.toLocaleString()}</b>
                      </span>
                      <span className="px-2 py-1 rounded bg-white/10 border border-white/10">
                        มัดจำรวม: <b>{v.deposit.toLocaleString()}</b> บาท
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </AdminGate>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
      <div className="text-sm text-gray-300">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
