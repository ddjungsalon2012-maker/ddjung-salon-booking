export type BookingInput = {
  name: string;
  phone: string;
  service: string;
  date: string; // yyyy-mm-dd
  time: string; // HH:mm
  notes?: string;
  status: 'Pending' | 'Confirmed' | 'Cancelled';
  deposit: number;
  slipUrl: string;
  adminEmail?: string;
};

export async function addBooking(input: BookingInput) {
  const res = await fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error ?? 'บันทึกการจองไม่สำเร็จ');
  }

  return data.id as string;
}
