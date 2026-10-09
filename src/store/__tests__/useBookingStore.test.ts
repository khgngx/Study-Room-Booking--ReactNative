import { generateSlots } from '../../domain/slots';
import { addDays, toDateKey } from '../../domain/time';
import { cancelReminder, scheduleCheckInReminder } from '../../services/notifications';
import { useBookingStore } from '../useBookingStore';
import { usePolicyStore } from '../usePolicyStore';
import { useRoomStore } from '../useRoomStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('../../services/notifications', () => ({
  scheduleCheckInReminder: jest.fn(async () => 'notification-1'),
  cancelReminder: jest.fn(async () => undefined),
}));

const NOW = new Date(2026, 9, 12, 7, 20);
const today = toDateKey(NOW);
const tomorrow = toDateKey(addDays(NOW, 1));
const slots = generateSlots(usePolicyStore.getState().policy);
const [roomA, roomB, roomC] = useRoomStore.getState().rooms;

const book = (roomId: string, dateKey = tomorrow, slot = slots[0]) =>
  useBookingStore.getState().createBooking({ roomId, dateKey, slot });

beforeEach(() => {
  jest.useFakeTimers({ now: NOW });
  jest.clearAllMocks();
  useBookingStore.setState({ bookings: [], session: { userId: 'user-student' } });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('createBooking', () => {
  it('books a free slot and stores the reminder id', async () => {
    const result = await book(roomA.id);
    expect(result).toMatchObject({ ok: true, booking: { roomId: roomA.id, status: 'confirmed', notificationId: 'notification-1' } });
    expect(useBookingStore.getState().bookings).toHaveLength(1);
    expect(scheduleCheckInReminder).toHaveBeenCalledTimes(1);
  });

  it('refuses a second student for the same slot, then allows it after cancellation', async () => {
    const first = await book(roomA.id);
    useBookingStore.getState().signIn('user-student-2');
    expect(await book(roomA.id)).toEqual({ ok: false, reason: 'booked' });

    useBookingStore.getState().signIn('user-student');
    if (!first.ok) throw new Error('setup booking failed');
    await useBookingStore.getState().cancelBooking(first.booking.id);
    expect(cancelReminder).toHaveBeenCalledWith('notification-1');

    useBookingStore.getState().signIn('user-student-2');
    expect(await book(roomA.id)).toMatchObject({ ok: true });
  });

  it('lets only one of two simultaneous requests for a slot win', async () => {
    const results = await Promise.all([book(roomA.id), book(roomA.id)]);
    expect(results.filter((result) => result.ok)).toHaveLength(1);
    expect(useBookingStore.getState().bookings).toHaveLength(1);
  });

  it('enforces the daily limit from the policy store', async () => {
    expect((await book(roomA.id, tomorrow, slots[0])).ok).toBe(true);
    expect((await book(roomB.id, tomorrow, slots[1])).ok).toBe(true);
    expect(await book(roomC.id, tomorrow, slots[2])).toEqual({ ok: false, reason: 'daily_limit' });
  });

  it('rejects staff, managers and signed-out users', async () => {
    for (const userId of ['user-staff', 'user-manager']) {
      useBookingStore.getState().signIn(userId);
      expect(await book(roomA.id)).toEqual({ ok: false, reason: 'forbidden' });
    }
    useBookingStore.getState().signOut();
    expect(await book(roomA.id)).toEqual({ ok: false, reason: 'forbidden' });
  });

  it('does not let a student cancel someone else’s booking', async () => {
    const result = await book(roomA.id);
    if (!result.ok) throw new Error('setup booking failed');
    useBookingStore.getState().signIn('user-student-2');
    await useBookingStore.getState().cancelBooking(result.booking.id);
    expect(useBookingStore.getState().bookings[0].status).toBe('confirmed');
  });
});

describe('staff actions', () => {
  // 07:30 today: check-in is open at 07:20, and room A is in the staff member's area.
  const bookToday = async (roomId: string) => {
    const result = await book(roomId, today, slots[0]);
    if (!result.ok) throw new Error(`setup booking failed: ${result.reason}`);
    return result.booking.id;
  };

  it('lets lab staff check in a booking in their building, once', async () => {
    const id = await bookToday(roomA.id);
    useBookingStore.getState().signIn('user-staff');
    expect(useBookingStore.getState().checkIn(id)).toEqual({ ok: true });
    expect(useBookingStore.getState().bookings[0].status).toBe('checked_in');
    expect(useBookingStore.getState().checkIn(id)).toEqual({ ok: false, reason: 'already_checked_in' });
  });

  it('blocks students from checking themselves in', async () => {
    const id = await bookToday(roomA.id);
    expect(useBookingStore.getState().checkIn(id)).toEqual({ ok: false, reason: 'forbidden' });
  });

  it('blocks lab staff outside their area but not the facility manager', async () => {
    const outside = useRoomStore.getState().rooms.find((room) => room.building === 'V' && !room.underMaintenance);
    if (!outside) throw new Error('seed has no room in building V');
    const id = await bookToday(outside.id);
    useBookingStore.getState().signIn('user-staff');
    expect(useBookingStore.getState().checkIn(id)).toEqual({ ok: false, reason: 'out_of_area' });
    useBookingStore.getState().signIn('user-manager');
    expect(useBookingStore.getState().checkIn(id)).toEqual({ ok: true });
  });

  it('only marks a no-show after the slot has started', async () => {
    const id = await bookToday(roomA.id);
    useBookingStore.getState().signIn('user-staff');
    expect(useBookingStore.getState().markNoShow(id)).toEqual({ ok: false, reason: 'not_started' });
    jest.setSystemTime(new Date(2026, 9, 12, 7, 45));
    expect(useBookingStore.getState().markNoShow(id)).toEqual({ ok: true });
    expect(useBookingStore.getState().bookings[0].status).toBe('no_show');
  });
});
