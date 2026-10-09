import { dateFromKey } from './time';
import type { Booking, Room, User } from './types';

const QR_PREFIX = 'VKUROOM';
// Check-in opens this many minutes before the slot starts.
export const CHECK_IN_LEAD_MINUTES = 15;

export function encodeBookingQr(booking: Pick<Booking, 'id' | 'code'>): string {
  return `${QR_PREFIX}|${booking.id}|${booking.code}`;
}

export function parseBookingQr(data: string): { bookingId: string; code: string } | null {
  const [prefix, bookingId, code, ...rest] = data.split('|');
  if (prefix !== QR_PREFIX || !bookingId || !code || rest.length > 0) return null;
  return { bookingId, code };
}

export type CheckInRejection =
  | 'not_found'
  | 'cancelled'
  | 'already_checked_in'
  | 'no_show'
  | 'out_of_area'
  | 'too_early'
  | 'expired';

export type CheckInResult = { ok: true } | { ok: false; reason: CheckInRejection };

export function canVerifyInBuilding(staff: Pick<User, 'role' | 'assignedBuildings'>, room: Pick<Room, 'building'>): boolean {
  if (staff.role === 'facility_manager') return true;
  return staff.role === 'lab_staff' && (staff.assignedBuildings ?? []).includes(room.building);
}

export function validateCheckIn(
  booking: Booking | undefined,
  room: Room | undefined,
  staff: Pick<User, 'role' | 'assignedBuildings'>,
  now: Date,
): CheckInResult {
  if (!booking || !room) return { ok: false, reason: 'not_found' };
  if (booking.status === 'cancelled') return { ok: false, reason: 'cancelled' };
  if (booking.status === 'checked_in') return { ok: false, reason: 'already_checked_in' };
  if (booking.status === 'no_show') return { ok: false, reason: 'no_show' };
  if (!canVerifyInBuilding(staff, room)) return { ok: false, reason: 'out_of_area' };

  const opensAt = dateFromKey(booking.dateKey, booking.startMinutes - CHECK_IN_LEAD_MINUTES).getTime();
  const closesAt = dateFromKey(booking.dateKey, booking.endMinutes).getTime();
  if (now.getTime() < opensAt) return { ok: false, reason: 'too_early' };
  if (now.getTime() >= closesAt) return { ok: false, reason: 'expired' };
  return { ok: true };
}
