import { countRemainingBookings, getSlotAvailability, validateBookingRange } from '../conflict';
import { generateSlots } from '../slots';
import { makeBooking, makeRoom, policy } from './fixtures';

const [morning, lateMorning, afternoon] = generateSlots(policy);
const now = new Date(2026, 9, 12, 6, 0);
const base = { room: makeRoom(), dateKey: '2026-10-12', slot: morning, bookings: [], userId: 'user-1', policy, now };

describe('getSlotAvailability', () => {
  it('allows a free slot', () => {
    expect(getSlotAvailability(base)).toBe('available');
  });

  it('blocks a slot another student holds', () => {
    const bookings = [makeBooking({ userId: 'user-2' })];
    expect(getSlotAvailability({ ...base, bookings })).toBe('booked');
  });

  it('reports the slot as mine when I hold it', () => {
    expect(getSlotAvailability({ ...base, bookings: [makeBooking()] })).toBe('mine');
  });

  it('frees the slot again after cancellation', () => {
    const bookings = [makeBooking({ userId: 'user-2', status: 'cancelled' })];
    expect(getSlotAvailability({ ...base, bookings })).toBe('available');
  });

  it('does not let a booking on another day or room block the slot', () => {
    const bookings = [
      makeBooking({ userId: 'user-2', dateKey: '2026-10-13' }),
      makeBooking({ id: 'b2', userId: 'user-2', roomId: 'room-2' }),
    ];
    expect(getSlotAvailability({ ...base, bookings })).toBe('available');
  });

  it('treats back-to-back slots as non-overlapping', () => {
    const bookings = [makeBooking({ userId: 'user-2' })];
    expect(getSlotAvailability({ ...base, slot: lateMorning, bookings })).toBe('available');
  });

  it('blocks on partial overlap with a booking made under a different slot length', () => {
    const bookings = [makeBooking({ userId: 'user-2', startMinutes: 540, endMinutes: 630 })];
    expect(getSlotAvailability({ ...base, bookings })).toBe('booked');
  });

  it('blocks a slot that has already started', () => {
    const started = new Date(2026, 9, 12, 7, 30);
    expect(getSlotAvailability({ ...base, now: started })).toBe('past');
  });

  it('blocks every slot while the room is under maintenance', () => {
    expect(getSlotAvailability({ ...base, room: makeRoom({ underMaintenance: true }) })).toBe('maintenance');
  });

  it('stops me from being in two rooms at once', () => {
    const bookings = [makeBooking({ roomId: 'room-2' })];
    expect(getSlotAvailability({ ...base, bookings })).toBe('user_overlap');
  });

  it('enforces the daily booking limit', () => {
    const bookings = [
      makeBooking({ roomId: 'room-2' }),
      makeBooking({ id: 'b2', roomId: 'room-2', startMinutes: 570, endMinutes: 690 }),
    ];
    expect(getSlotAvailability({ ...base, slot: afternoon, bookings })).toBe('daily_limit');
  });

  it('does not count cancelled bookings toward the daily limit', () => {
    const bookings = [
      makeBooking({ roomId: 'room-2', status: 'cancelled' }),
      makeBooking({ id: 'b2', roomId: 'room-2', startMinutes: 570, endMinutes: 690 }),
    ];
    expect(getSlotAvailability({ ...base, slot: afternoon, bookings })).toBe('available');
  });
});

// Fixture policy: open 07:30–11:30 and 13:00–17:00, 120-minute slots.
describe('validateBookingRange', () => {
  const range = (startMinutes: number, endMinutes: number) => ({ startMinutes, endMinutes });

  it('accepts every generated slot', () => {
    for (const slot of generateSlots(policy)) expect(validateBookingRange(slot, policy)).toBeNull();
  });

  it('accepts a custom time that crosses a slot boundary inside one opening window', () => {
    expect(validateBookingRange(range(13 * 60 + 5, 14 * 60 + 39), policy)).toBeNull();
    expect(validateBookingRange(range(14 * 60 + 30, 16 * 60), policy)).toBeNull();
  });

  it('rejects a time that leaves opening hours or spans the midday closure', () => {
    expect(validateBookingRange(range(7 * 60, 8 * 60), policy)).toBe('outside_hours');
    expect(validateBookingRange(range(11 * 60, 13 * 60), policy)).toBe('outside_hours');
    expect(validateBookingRange(range(16 * 60 + 30, 17 * 60 + 30), policy)).toBe('outside_hours');
  });

  it('rejects a stay longer than one slot', () => {
    expect(validateBookingRange(range(13 * 60, 15 * 60 + 1), policy)).toBe('too_long');
  });

  it('rejects empty, reversed and very short ranges', () => {
    expect(validateBookingRange(range(13 * 60, 13 * 60), policy)).toBe('too_short');
    expect(validateBookingRange(range(14 * 60, 13 * 60), policy)).toBe('too_short');
    expect(validateBookingRange(range(13 * 60, 13 * 60 + 14), policy)).toBe('too_short');
    expect(validateBookingRange(range(13 * 60, 13 * 60 + 15), policy)).toBeNull();
  });
});

describe('getSlotAvailability with a custom time', () => {
  const custom = { startMinutes: 13 * 60 + 5, endMinutes: 14 * 60 + 39 };

  it('allows a custom time nobody holds', () => {
    expect(getSlotAvailability({ ...base, slot: custom })).toBe('available');
  });

  it('blocks a custom time that touches another booking by a single minute', () => {
    const bookings = [makeBooking({ userId: 'user-2', startMinutes: 14 * 60 + 38, endMinutes: 15 * 60 })];
    expect(getSlotAvailability({ ...base, slot: custom, bookings })).toBe('booked');
  });

  it('lets two custom times share one slot when they do not overlap', () => {
    const bookings = [makeBooking({ userId: 'user-2', startMinutes: 14 * 60 + 39, endMinutes: 15 * 60 })];
    expect(getSlotAvailability({ ...base, slot: custom, bookings })).toBe('available');
  });

  it('still applies the past, overlap and daily-limit rules', () => {
    expect(getSlotAvailability({ ...base, slot: custom, now: new Date(2026, 9, 12, 13, 5) })).toBe('past');
    const elsewhere = [makeBooking({ roomId: 'room-2', startMinutes: 14 * 60, endMinutes: 16 * 60 })];
    expect(getSlotAvailability({ ...base, slot: custom, bookings: elsewhere })).toBe('user_overlap');
    const twoToday = [makeBooking({ roomId: 'room-2' }), makeBooking({ id: 'b2', roomId: 'room-3', startMinutes: 570, endMinutes: 690 })];
    expect(getSlotAvailability({ ...base, slot: custom, bookings: twoToday })).toBe('daily_limit');
  });
});

describe('countRemainingBookings', () => {
  const input = { dateKey: '2026-10-12', userId: 'user-1', policy: { maxBookingsPerDay: 4 } };

  it('gives the whole allowance on an empty day', () => {
    expect(countRemainingBookings({ ...input, bookings: [] })).toBe(4);
  });

  it('counts only my active bookings on that day', () => {
    const bookings = [
      makeBooking(),
      makeBooking({ id: 'b2', startMinutes: 570, endMinutes: 690 }),
      makeBooking({ id: 'b3', status: 'cancelled' }),
      makeBooking({ id: 'b4', userId: 'user-2' }),
      makeBooking({ id: 'b5', dateKey: '2026-10-13' }),
    ];
    expect(countRemainingBookings({ ...input, bookings })).toBe(2);
  });

  it('never goes below zero when the limit was lowered after booking', () => {
    const bookings = [makeBooking(), makeBooking({ id: 'b2', startMinutes: 570, endMinutes: 690 })];
    expect(countRemainingBookings({ ...input, policy: { maxBookingsPerDay: 1 }, bookings })).toBe(0);
  });
});
