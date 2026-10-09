import { dateFromKey } from './time';
import type { Booking, Policy, Room, Slot } from './types';

export type SlotAvailability =
  | 'available'
  | 'maintenance'
  | 'past'
  | 'mine'
  | 'booked'
  | 'user_overlap'
  | 'daily_limit';

/** A booking still holds its slot unless it was cancelled. */
export function isActive(booking: Booking): boolean {
  return booking.status !== 'cancelled';
}

export function overlaps(
  a: Pick<Booking, 'startMinutes' | 'endMinutes'>,
  b: Pick<Slot, 'startMinutes' | 'endMinutes'>,
): boolean {
  return a.startMinutes < b.endMinutes && b.startMinutes < a.endMinutes;
}

interface AvailabilityInput {
  room: Room;
  dateKey: string;
  slot: Slot;
  bookings: readonly Booking[];
  userId: string;
  policy: Pick<Policy, 'maxBookingsPerDay'>;
  now: Date;
}

/**
 * The conflict engine: decides whether `userId` may book `slot` in `room`.
 * Comparison is interval-based, so bookings made under an older slot length still block correctly.
 */
export function getSlotAvailability(input: AvailabilityInput): SlotAvailability {
  const { room, dateKey, slot, bookings, userId, policy, now } = input;
  if (room.underMaintenance) return 'maintenance';
  if (dateFromKey(dateKey, slot.startMinutes).getTime() <= now.getTime()) return 'past';

  const sameDay = bookings.filter((booking) => booking.dateKey === dateKey && isActive(booking));
  const roomClash = sameDay.find((booking) => booking.roomId === room.id && overlaps(booking, slot));
  if (roomClash) return roomClash.userId === userId ? 'mine' : 'booked';

  const ownSameDay = sameDay.filter((booking) => booking.userId === userId);
  if (ownSameDay.some((booking) => overlaps(booking, slot))) return 'user_overlap';
  if (ownSameDay.length >= policy.maxBookingsPerDay) return 'daily_limit';
  return 'available';
}
