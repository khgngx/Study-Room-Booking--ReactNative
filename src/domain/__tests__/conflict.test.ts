import { getSlotAvailability } from '../conflict';
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
