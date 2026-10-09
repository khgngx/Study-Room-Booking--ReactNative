import { EMPTY_FILTER, filterRooms } from '../filter';
import { getRoomStatus } from '../roomStatus';
import { makeBooking, makeRoom } from './fixtures';

describe('getRoomStatus', () => {
  const room = makeRoom();
  const during = new Date(2026, 9, 12, 8, 0);

  it('is occupied while a booking is running', () => {
    expect(getRoomStatus(room, [makeBooking()], during)).toBe('occupied');
    expect(getRoomStatus(room, [makeBooking({ status: 'checked_in' })], during)).toBe('occupied');
  });

  it('is available outside the booking, on the end minute, and for released bookings', () => {
    expect(getRoomStatus(room, [makeBooking()], new Date(2026, 9, 12, 7, 0))).toBe('available');
    expect(getRoomStatus(room, [makeBooking()], new Date(2026, 9, 12, 9, 30))).toBe('available');
    expect(getRoomStatus(room, [makeBooking({ status: 'cancelled' })], during)).toBe('available');
    expect(getRoomStatus(room, [makeBooking({ status: 'no_show' })], during)).toBe('available');
    expect(getRoomStatus(room, [makeBooking({ dateKey: '2026-10-13' })], during)).toBe('available');
  });

  it('lets maintenance win over a running booking', () => {
    expect(getRoomStatus(makeRoom({ underMaintenance: true }), [makeBooking()], during)).toBe('maintenance');
  });
});

describe('filterRooms', () => {
  const rooms = [
    makeRoom({ id: 'a', name: 'A101', building: 'A', capacity: 4, equipment: ['whiteboard'] }),
    makeRoom({ id: 'b', name: 'Lab B205', building: 'B', floor: 2, capacity: 20, equipment: ['high_spec_pc', 'ac'] }),
    makeRoom({ id: 'v', name: 'V301', building: 'V', floor: 3, capacity: 12, equipment: ['projector', 'ac'] }),
  ];
  const ids = (filter: Partial<typeof EMPTY_FILTER>) =>
    filterRooms(rooms, { ...EMPTY_FILTER, ...filter }).map((room) => room.id);

  it('returns everything for an empty filter', () => {
    expect(ids({})).toEqual(['a', 'b', 'v']);
  });

  it('matches the query case- and accent-insensitively', () => {
    expect(ids({ query: 'lab' })).toEqual(['b']);
    expect(ids({ query: 'Toà V' })).toEqual(['v']);
  });

  it('ORs buildings and ANDs equipment', () => {
    expect(ids({ buildings: ['A', 'V'] })).toEqual(['a', 'v']);
    expect(ids({ equipment: ['ac'] })).toEqual(['b', 'v']);
    expect(ids({ equipment: ['ac', 'projector'] })).toEqual(['v']);
  });

  it('applies minimum capacity inclusively and combines with other filters', () => {
    expect(ids({ minCapacity: 12 })).toEqual(['b', 'v']);
    expect(ids({ minCapacity: 12, buildings: ['B'], query: 'zzz' })).toEqual([]);
  });
});
