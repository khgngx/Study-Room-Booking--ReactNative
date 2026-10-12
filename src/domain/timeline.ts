import { isActive, overlaps } from './conflict';
import { dateFromKey, minutesOfDay, parseTime, toDateKey } from './time';
import type { Booking, Policy, Room, Slot } from './types';

export interface TimeRange {
  startMinutes: number;
  endMinutes: number;
}

const FALLBACK_RANGE: TimeRange = { startMinutes: 7 * 60, endMinutes: 21 * 60 };

/** The span the timeline draws: opening hours widened to whole hours (07:30–21:00 → 7h–21h). */
export function getDayRange(policy: Pick<Policy, 'openingWindows'>): TimeRange {
  if (policy.openingWindows.length === 0) return FALLBACK_RANGE;
  const starts = policy.openingWindows.map((window) => parseTime(window.start));
  const ends = policy.openingWindows.map((window) => parseTime(window.end));
  return {
    startMinutes: Math.floor(Math.min(...starts) / 60) * 60,
    endMinutes: Math.ceil(Math.max(...ends) / 60) * 60,
  };
}

function mergeAndClamp(segments: TimeRange[], range: TimeRange): TimeRange[] {
  const clamped = segments
    .map((segment) => ({
      startMinutes: Math.max(segment.startMinutes, range.startMinutes),
      endMinutes: Math.min(segment.endMinutes, range.endMinutes),
    }))
    .filter((segment) => segment.endMinutes > segment.startMinutes)
    .sort((a, b) => a.startMinutes - b.startMinutes);
  const merged: TimeRange[] = [];
  for (const segment of clamped) {
    const last = merged[merged.length - 1];
    if (last && segment.startMinutes <= last.endMinutes) last.endMinutes = Math.max(last.endMinutes, segment.endMinutes);
    else merged.push({ ...segment });
  }
  return merged;
}

/** What is left of `range` once every `taken` stretch is cut out, in order. */
export function subtractRanges(range: TimeRange, taken: readonly TimeRange[]): TimeRange[] {
  const free: TimeRange[] = [];
  let cursor = range.startMinutes;
  for (const segment of mergeAndClamp([...taken], range)) {
    if (segment.startMinutes > cursor) free.push({ startMinutes: cursor, endMinutes: segment.startMinutes });
    cursor = segment.endMinutes;
  }
  if (cursor < range.endMinutes) free.push({ startMinutes: cursor, endMinutes: range.endMinutes });
  return free;
}

export interface DaySegments {
  /** Outside opening hours, or the whole day under maintenance. */
  closed: TimeRange[];
  /** Held by an active booking. */
  booked: TimeRange[];
}

/** Stretches of the day a room cannot be booked, split by why, so the timeline can draw them differently. */
export function getDaySegments(
  room: Room,
  bookings: readonly Booking[],
  dateKey: string,
  policy: Pick<Policy, 'openingWindows'>,
): DaySegments {
  const range = getDayRange(policy);
  if (room.underMaintenance) return { closed: [range], booked: [] };

  const windows = policy.openingWindows
    .map((window) => ({ startMinutes: parseTime(window.start), endMinutes: parseTime(window.end) }))
    .sort((a, b) => a.startMinutes - b.startMinutes);
  const closed: TimeRange[] = [];
  let cursor = range.startMinutes;
  for (const window of windows) {
    if (window.startMinutes > cursor) closed.push({ startMinutes: cursor, endMinutes: window.startMinutes });
    cursor = Math.max(cursor, window.endMinutes);
  }
  if (cursor < range.endMinutes) closed.push({ startMinutes: cursor, endMinutes: range.endMinutes });

  const booked = bookings.filter(
    (booking) => booking.roomId === room.id && booking.dateKey === dateKey && isActive(booking),
  );
  return { closed, booked: mergeAndClamp(booked, range) };
}

/**
 * First minute the day schedule shows. Today it skips hours that are over, keeping the hour
 * before now for context; once the day has closed nothing is hidden.
 */
export function getScheduleStart(range: TimeRange, nowMinutes: number | null): number {
  if (nowMinutes === null || nowMinutes >= range.endMinutes) return range.startMinutes;
  return Math.max(range.startMinutes, (Math.floor(nowMinutes / 60) - 1) * 60);
}

export type AvailabilityNow =
  | { state: 'maintenance' }
  | { state: 'occupied'; untilMinutes: number }
  /** `untilMinutes` is null once the building has closed for the day. */
  | { state: 'free'; untilMinutes: number | null };

/** What a room is doing right now and when that changes. Mirrors `getRoomStatus`. */
export function getAvailabilityNow(
  room: Room,
  bookings: readonly Booking[],
  now: Date,
  policy: Pick<Policy, 'openingWindows'>,
): AvailabilityNow {
  if (room.underMaintenance) return { state: 'maintenance' };
  const today = toDateKey(now);
  const minute = minutesOfDay(now);
  const holding = bookings
    .filter(
      (booking) =>
        booking.roomId === room.id &&
        booking.dateKey === today &&
        (booking.status === 'confirmed' || booking.status === 'checked_in') &&
        booking.endMinutes > minute,
    )
    .sort((a, b) => a.startMinutes - b.startMinutes);

  const [next] = holding;
  if (next && next.startMinutes <= minute) {
    // Back-to-back bookings read as one busy stretch.
    let untilMinutes = next.endMinutes;
    for (const booking of holding) {
      if (booking.startMinutes <= untilMinutes) untilMinutes = Math.max(untilMinutes, booking.endMinutes);
    }
    return { state: 'occupied', untilMinutes };
  }
  const closing = Math.max(0, ...policy.openingWindows.map((window) => parseTime(window.end)));
  if (minute >= closing) return { state: 'free', untilMinutes: null };
  return { state: 'free', untilMinutes: next ? next.startMinutes : closing };
}

/** Slots on `dateKey` that nobody holds and that have not started yet. */
export function countFreeSlots(
  room: Room,
  bookings: readonly Booking[],
  dateKey: string,
  slots: readonly Slot[],
  now: Date,
): number {
  if (room.underMaintenance) return 0;
  const taken = bookings.filter(
    (booking) => booking.roomId === room.id && booking.dateKey === dateKey && isActive(booking),
  );
  return slots.filter(
    (slot) =>
      dateFromKey(dateKey, slot.startMinutes).getTime() > now.getTime() &&
      !taken.some((booking) => overlaps(booking, slot)),
  ).length;
}
