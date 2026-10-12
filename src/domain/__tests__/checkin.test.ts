import { encodeBookingQr, parseBookingQr, validateCheckIn } from '../checkin';
import { can, canAct, getPresence, receivesNotifications } from '../permissions';
import { computeStats } from '../stats';
import { makeBooking, makeRoom } from './fixtures';

const staff = { role: 'lab_staff' as const, assignedBuildings: ['A' as const] };
const onTime = new Date(2026, 9, 12, 7, 20);

describe('booking QR payload', () => {
  it('round-trips', () => {
    expect(parseBookingQr(encodeBookingQr(makeBooking()))).toEqual({ bookingId: 'booking-1', code: 'ABC123' });
  });

  it('rejects foreign or malformed codes', () => {
    expect(parseBookingQr('https://example.com')).toBeNull();
    expect(parseBookingQr('VKUROOM|only-id')).toBeNull();
    expect(parseBookingQr('VKUROOM|a|b|c')).toBeNull();
    expect(parseBookingQr('')).toBeNull();
  });
});

describe('validateCheckIn', () => {
  const room = makeRoom();

  it('accepts from 15 minutes before start until the slot ends', () => {
    expect(validateCheckIn(makeBooking(), room, staff, new Date(2026, 9, 12, 7, 15))).toEqual({ ok: true });
    expect(validateCheckIn(makeBooking(), room, staff, new Date(2026, 9, 12, 9, 29))).toEqual({ ok: true });
  });

  it.each([
    ['too_early', new Date(2026, 9, 12, 7, 14)],
    ['expired', new Date(2026, 9, 12, 9, 30)],
    ['too_early', new Date(2026, 9, 11, 8, 0)],
  ])('rejects %s', (reason, now) => {
    expect(validateCheckIn(makeBooking(), room, staff, now)).toEqual({ ok: false, reason });
  });

  it.each([
    ['cancelled', 'cancelled'],
    ['checked_in', 'already_checked_in'],
    ['no_show', 'no_show'],
  ] as const)('rejects a %s booking', (status, reason) => {
    expect(validateCheckIn(makeBooking({ status }), room, staff, onTime)).toEqual({ ok: false, reason });
  });

  it('rejects unknown bookings', () => {
    expect(validateCheckIn(undefined, room, staff, onTime)).toEqual({ ok: false, reason: 'not_found' });
  });

  it('limits lab staff to their buildings but not the facility manager', () => {
    const roomB = makeRoom({ building: 'B' });
    expect(validateCheckIn(makeBooking(), roomB, staff, onTime)).toEqual({ ok: false, reason: 'out_of_area' });
    expect(validateCheckIn(makeBooking(), roomB, { role: 'facility_manager' }, onTime)).toEqual({ ok: true });
    expect(validateCheckIn(makeBooking(), room, { role: 'student' }, onTime)).toEqual({ ok: false, reason: 'out_of_area' });
  });
});

describe('permission matrix', () => {
  it('matches the role table in the brief', () => {
    expect(can('student', 'booking.create')).toBe(true);
    expect(can('lab_staff', 'booking.create')).toBe(false);
    expect(can('facility_manager', 'booking.create')).toBe(false);
    expect(can('student', 'checkin.verify')).toBe(false);
    expect(can('lab_staff', 'checkin.verify')).toBe(true);
    expect(can('facility_manager', 'checkin.verify')).toBe(true);
    expect(can('lab_staff', 'room.setMaintenance')).toBe(true);
    expect(can('lab_staff', 'room.crud')).toBe(false);
    expect(can('lab_staff', 'booking.viewAllAreas')).toBe(false);
    expect(can('facility_manager', 'policy.edit')).toBe(true);
  });
});

describe('presence', () => {
  it('defaults accounts without a saved presence to online', () => {
    expect(getPresence({})).toBe('online');
  });

  it('keeps every role permission while online or busy, and removes all of them while inactive', () => {
    expect(canAct({ role: 'student', presence: 'online' }, 'booking.create')).toBe(true);
    expect(canAct({ role: 'student', presence: 'busy' }, 'booking.create')).toBe(true);
    expect(canAct({ role: 'student', presence: 'inactive' }, 'booking.create')).toBe(false);
    expect(canAct({ role: 'facility_manager', presence: 'inactive' }, 'room.crud')).toBe(false);
  });

  it('never grants a permission the role does not have', () => {
    expect(canAct({ role: 'lab_staff', presence: 'online' }, 'room.crud')).toBe(false);
  });

  it('delivers notifications only while online', () => {
    expect(receivesNotifications({ presence: 'online' })).toBe(true);
    expect(receivesNotifications({ presence: 'busy' })).toBe(false);
    expect(receivesNotifications({ presence: 'inactive' })).toBe(false);
  });
});

describe('computeStats', () => {
  const rooms = [makeRoom(), makeRoom({ id: 'room-2', name: 'B201' })];
  const input = { rooms, dateKeys: ['2026-10-12'], bookableMinutesPerDay: 480 };

  it('returns zeros without dividing by zero', () => {
    expect(computeStats({ ...input, bookings: [] })).toMatchObject({ utilization: 0, noShowRate: 0, topRooms: [] });
    expect(computeStats({ ...input, rooms: [], bookings: [] }).utilization).toBe(0);
  });

  it('computes utilization, no-show rate and ranking', () => {
    const bookings = [
      makeBooking({ status: 'checked_in' }),
      makeBooking({ id: 'b2', status: 'no_show', startMinutes: 570, endMinutes: 690 }),
      makeBooking({ id: 'b3', roomId: 'room-2', status: 'checked_in' }),
      makeBooking({ id: 'b4', roomId: 'room-2', status: 'cancelled', startMinutes: 780, endMinutes: 900 }),
      makeBooking({ id: 'b5', dateKey: '2026-10-01' }),
    ];
    const stats = computeStats({ ...input, bookings });
    expect(stats.totalBookings).toBe(4);
    expect(stats.cancelled).toBe(1);
    expect(stats.utilization).toBeCloseTo(360 / 960);
    expect(stats.noShowRate).toBeCloseTo(1 / 3);
    expect(stats.topRooms.map((entry) => [entry.room.id, entry.count])).toEqual([
      ['room-1', 2],
      ['room-2', 1],
    ]);
  });
});
