import { addDays, dateFromKey, parseTime, toDateKey } from './time';
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

/** Any stretch of one day, in minutes from midnight: a generated slot or a time the student typed in. */
export type MinuteRange = Pick<Slot, 'startMinutes' | 'endMinutes'>;

export function overlaps(a: MinuteRange, b: MinuteRange): boolean {
  return a.startMinutes < b.endMinutes && b.startMinutes < a.endMinutes;
}

export const sameRange = (a: MinuteRange, b: MinuteRange) => a.startMinutes === b.startMinutes && a.endMinutes === b.endMinutes;

interface AvailabilityInput {
  room: Room;
  dateKey: string;
  slot: MinuteRange;
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

/** How many more bookings `userId` may still make on `dateKey` before reaching the daily limit. */
export function countRemainingBookings(input: Pick<AvailabilityInput, 'dateKey' | 'bookings' | 'userId' | 'policy'>): number {
  const { dateKey, bookings, userId, policy } = input;
  const held = bookings.filter((booking) => booking.userId === userId && booking.dateKey === dateKey && isActive(booking)).length;
  return Math.max(0, policy.maxBookingsPerDay - held);
}

/** Rooms can be reserved from today up to this many days ahead. */
export const BOOKING_HORIZON_DAYS = 30;

/** Date keys sort like dates, so the horizon is a plain string comparison. */
export function isWithinBookingHorizon(dateKey: string, now: Date): boolean {
  return dateKey <= toDateKey(addDays(now, BOOKING_HORIZON_DAYS));
}

/** Shortest stretch worth holding a room for. */
export const MIN_BOOKING_MINUTES = 15;

export type RangeRejection = 'too_short' | 'too_long' | 'outside_hours';

/**
 * Shape rules every booking obeys, whichever way its time was picked: it sits inside one opening
 * window and runs no longer than a slot. Generated slots pass by construction; custom times must too.
 */
export function validateBookingRange(
  range: MinuteRange,
  policy: Pick<Policy, 'openingWindows' | 'slotMinutes'>,
): RangeRejection | null {
  const duration = range.endMinutes - range.startMinutes;
  if (!Number.isInteger(duration) || duration < MIN_BOOKING_MINUTES) return 'too_short';
  if (duration > policy.slotMinutes) return 'too_long';
  const inOneWindow = policy.openingWindows.some(
    (window) => range.startMinutes >= parseTime(window.start) && range.endMinutes <= parseTime(window.end),
  );
  return inOneWindow ? null : 'outside_hours';
}
