import { generateSlots } from '../slots';
import { countFreeSlots, getAvailabilityNow, getDayRange, getDaySegments, getScheduleStart, subtractRanges } from '../timeline';
import { makeBooking, makeRoom, policy } from './fixtures';

// Fixture policy: open 07:30–11:30 and 13:00–17:00. Fixture booking: 07:30–09:30 on 2026-10-12.
const day = '2026-10-12';
const at = (hours: number, minutes = 0) => new Date(2026, 9, 12, hours, minutes);
const room = makeRoom();

describe('getDayRange', () => {
  it('widens opening hours to whole hours', () => {
    expect(getDayRange(policy)).toEqual({ startMinutes: 420, endMinutes: 1020 });
  });

  it('falls back to 7h–21h when nothing is open', () => {
    expect(getDayRange({ openingWindows: [] })).toEqual({ startMinutes: 420, endMinutes: 1260 });
  });
});

describe('getDaySegments', () => {
  const closed = [
    { startMinutes: 420, endMinutes: 450 },
    { startMinutes: 690, endMinutes: 780 },
  ];

  it('marks only closed hours when nothing is booked', () => {
    expect(getDaySegments(room, [], day, policy)).toEqual({ closed, booked: [] });
  });

  it('keeps bookings apart from the closed stretch they touch', () => {
    expect(getDaySegments(room, [makeBooking()], day, policy)).toEqual({
      closed,
      booked: [{ startMinutes: 450, endMinutes: 570 }],
    });
  });

  it('merges back-to-back bookings into one stretch', () => {
    const bookings = [makeBooking(), makeBooking({ id: 'b2', userId: 'user-2', startMinutes: 570, endMinutes: 690 })];
    expect(getDaySegments(room, bookings, day, policy).booked).toEqual([{ startMinutes: 450, endMinutes: 690 }]);
  });

  it('ignores cancelled bookings, other rooms and other days', () => {
    const bookings = [
      makeBooking({ status: 'cancelled' }),
      makeBooking({ id: 'b2', roomId: 'room-2' }),
      makeBooking({ id: 'b3', dateKey: '2026-10-13' }),
    ];
    expect(getDaySegments(room, bookings, day, policy).booked).toEqual([]);
  });

  it('closes the whole day under maintenance', () => {
    expect(getDaySegments(makeRoom({ underMaintenance: true }), [makeBooking()], day, policy)).toEqual({
      closed: [{ startMinutes: 420, endMinutes: 1020 }],
      booked: [],
    });
  });
});

describe('getScheduleStart', () => {
  const range = { startMinutes: 420, endMinutes: 1020 };

  it('shows the whole day when it is not today', () => {
    expect(getScheduleStart(range, null)).toBe(420);
  });

  it('hides hours that are over but keeps the one before now', () => {
    expect(getScheduleStart(range, 14 * 60 + 15)).toBe(13 * 60);
    expect(getScheduleStart(range, 14 * 60)).toBe(13 * 60);
  });

  it('never starts before opening or hides a day that has closed', () => {
    expect(getScheduleStart(range, 6 * 60)).toBe(420);
    expect(getScheduleStart(range, 7 * 60 + 40)).toBe(420);
    expect(getScheduleStart(range, 17 * 60)).toBe(420);
  });
});

describe('subtractRanges', () => {
  const slot = { startMinutes: 780, endMinutes: 900 };

  it('returns the whole range when nothing is taken', () => {
    expect(subtractRanges(slot, [])).toEqual([slot]);
  });

  it('leaves the stretches on either side of a booking', () => {
    expect(subtractRanges(slot, [{ startMinutes: 785, endMinutes: 879 }])).toEqual([
      { startMinutes: 780, endMinutes: 785 },
      { startMinutes: 879, endMinutes: 900 },
    ]);
  });

  it('ignores what lies outside and returns nothing when fully covered', () => {
    expect(subtractRanges(slot, [{ startMinutes: 600, endMinutes: 700 }])).toEqual([slot]);
    expect(subtractRanges(slot, [{ startMinutes: 700, endMinutes: 840 }, { startMinutes: 830, endMinutes: 1000 }])).toEqual([]);
  });
});

describe('getAvailabilityNow', () => {
  it('is free until closing when nothing is booked', () => {
    expect(getAvailabilityNow(room, [], at(14), policy)).toEqual({ state: 'free', untilMinutes: 1020 });
  });

  it('is free until the next booking starts', () => {
    const later = makeBooking({ startMinutes: 900, endMinutes: 1020 });
    expect(getAvailabilityNow(room, [later], at(14), policy)).toEqual({ state: 'free', untilMinutes: 900 });
  });

  it('is occupied until the end of back-to-back bookings', () => {
    const bookings = [makeBooking(), makeBooking({ id: 'b2', userId: 'user-2', startMinutes: 570, endMinutes: 690 })];
    expect(getAvailabilityNow(room, bookings, at(8), policy)).toEqual({ state: 'occupied', untilMinutes: 690 });
  });

  it('frees the room at the exact end minute and for released bookings', () => {
    expect(getAvailabilityNow(room, [makeBooking()], at(9, 30), policy).state).toBe('free');
    expect(getAvailabilityNow(room, [makeBooking({ status: 'no_show' })], at(8), policy).state).toBe('free');
  });

  it('has no end time after closing, and reports maintenance first', () => {
    expect(getAvailabilityNow(room, [], at(18), policy)).toEqual({ state: 'free', untilMinutes: null });
    expect(getAvailabilityNow(makeRoom({ underMaintenance: true }), [makeBooking()], at(8), policy)).toEqual({ state: 'maintenance' });
  });
});

describe('countFreeSlots', () => {
  const slots = generateSlots(policy);

  it('counts every slot on a future day with no bookings', () => {
    expect(countFreeSlots(room, [], '2026-10-13', slots, at(14))).toBe(4);
  });

  it('excludes booked slots and slots that already started', () => {
    expect(countFreeSlots(room, [makeBooking()], day, slots, at(6))).toBe(3);
    expect(countFreeSlots(room, [], day, slots, at(14))).toBe(1);
  });

  it('is zero under maintenance', () => {
    expect(countFreeSlots(makeRoom({ underMaintenance: true }), [], '2026-10-13', slots, at(14))).toBe(0);
  });
});
