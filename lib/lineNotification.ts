import { randomUUID } from 'node:crypto';

type BookingNotice = { id: string; service: string; date: string; time: string };

/** Notify only the server-configured shop recipient, never a client-supplied ID. */
export async function notifyBooking(booking: BookingNotice): Promise<'sent' | 'failed' | 'not_configured'> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const recipient = process.env.LINE_NOTIFICATION_TARGET_ID;
  if (!token || !recipient) {
    console.error('LINE booking notification not configured', { bookingId: booking.id });
    return 'not_configured';
  }
  try {
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Line-Retry-Key': randomUUID(),
      },
      // Customer contact details and payment slips stay in the authenticated admin page.
      body: JSON.stringify({ to: recipient, messages: [{ type: 'text', text:
        `มีการจองใหม่ DD jung salon\nรหัส: ${booking.id}\nบริการ: ${booking.service}\nวันที่: ${booking.date}\nเวลา: ${booking.time}\nสถานะ: รอตรวจสอบ\nดูรายละเอียด: https://ddjung-salon-booking.vercel.app/admin/bookings`
      }] }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      console.error('LINE booking notification rejected', { bookingId: booking.id, status: response.status });
      return 'failed';
    }
    return 'sent';
  } catch {
    console.error('LINE booking notification unavailable', { bookingId: booking.id });
    return 'failed';
  }
}
