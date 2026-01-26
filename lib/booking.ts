export type BookingInput = {
  name: string;
  phone: string;
  service: string;
  date: string;  // yyyy-mm-dd
  time: string;  // HH:mm
  notes?: string;
  status: 'Pending' | 'Confirmed' | 'Cancelled';
  deposit: number;
  slipUrl: string;
  adminEmail?: string;
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

/** ตรวจ slot ว่าง */
export async function checkSlotAvailable(date: string, time: string) {
  const r = await api<{ available: boolean }>(`/api/bookings/available?date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}`);
  return r.available;
}

/** บันทึกการจอง */
export async function addBooking(input: BookingInput) {
  const r = await api<{ id: string }>(`/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return r.id;
}
