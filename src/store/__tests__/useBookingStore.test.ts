import { generateSlots } from '../../domain/slots';
import { addDays, toDateKey } from '../../domain/time';
import { cancelReminder, scheduleCheckInReminder } from '../../services/notifications';
import { useAccountStore } from '../useAccountStore';
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

const book = (roomId: string, dateKey = tomorrow, slot: { startMinutes: number; endMinutes: number } = slots[0]) =>
  useBookingStore.getState().createBooking({ roomId, dateKey, slot });

beforeEach(() => {
  jest.useFakeTimers({ now: NOW });
  jest.clearAllMocks();
  useBookingStore.setState({ bookings: [], session: { userId: 'user-student' } });
  for (const user of useAccountStore.getState().users) useAccountStore.getState().setPresence(user.id, 'online');
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

  it('books a custom time that crosses slot boundaries and keeps its exact minutes', async () => {
    const custom = { startMinutes: 13 * 60 + 5, endMinutes: 14 * 60 + 39 };
    expect(await book(roomA.id, tomorrow, custom)).toMatchObject({ ok: true, booking: custom });

    useBookingStore.getState().signIn('user-student-2');
    // The 13:00–15:00 slot is now partly taken, but what is left of it can still be booked.
    expect(await book(roomA.id, tomorrow, slots[2])).toEqual({ ok: false, reason: 'booked' });
    expect(await book(roomA.id, tomorrow, { startMinutes: 14 * 60 + 39, endMinutes: 15 * 60 + 30 })).toMatchObject({ ok: true });
  });

  it('refuses custom times that break the booking rules', async () => {
    expect(await book(roomA.id, tomorrow, { startMinutes: 11 * 60, endMinutes: 13 * 60 + 30 })).toEqual({ ok: false, reason: 'too_long' });
    expect(await book(roomA.id, tomorrow, { startMinutes: 11 * 60, endMinutes: 12 * 60 })).toEqual({ ok: false, reason: 'outside_hours' });
    expect(await book(roomA.id, tomorrow, { startMinutes: 14 * 60, endMinutes: 14 * 60 + 5 })).toEqual({ ok: false, reason: 'too_short' });
    expect(await book(roomA.id, today, { startMinutes: 7 * 60, endMinutes: 8 * 60 })).toEqual({ ok: false, reason: 'outside_hours' });
    expect(useBookingStore.getState().bookings).toHaveLength(0);
  });

  it('lets a student hold four slots in one day and refuses the fifth', async () => {
    expect(usePolicyStore.getState().policy.maxBookingsPerDay).toBe(4);
    for (const slot of slots.slice(0, 4)) expect((await book(roomA.id, tomorrow, slot)).ok).toBe(true);
    expect(await book(roomA.id, tomorrow, slots[4])).toEqual({ ok: false, reason: 'daily_limit' });
    expect(await book(roomB.id, tomorrow, slots[4])).toEqual({ ok: false, reason: 'daily_limit' });
    expect(useBookingStore.getState().bookings).toHaveLength(4);
  });

  it('enforces whatever daily limit the policy store holds', async () => {
    const { policy, updatePolicy } = usePolicyStore.getState();
    updatePolicy({ maxBookingsPerDay: 2 });
    expect((await book(roomA.id, tomorrow, slots[0])).ok).toBe(true);
    expect((await book(roomB.id, tomorrow, slots[1])).ok).toBe(true);
    expect(await book(roomC.id, tomorrow, slots[2])).toEqual({ ok: false, reason: 'daily_limit' });
    updatePolicy({ maxBookingsPerDay: policy.maxBookingsPerDay });
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

describe('presence', () => {
  const setPresence = (presence: 'online' | 'busy' | 'inactive') => useBookingStore.getState().changePresence(presence);

  it('books without a reminder while busy', async () => {
    await setPresence('busy');
    const result = await book(roomA.id);
    expect(result).toMatchObject({ ok: true });
    expect(result.ok && result.booking.notificationId).toBeUndefined();
    expect(scheduleCheckInReminder).not.toHaveBeenCalled();
  });

  it('pulls pending reminders when going busy and restores them when back online', async () => {
    await book(roomA.id);
    await setPresence('busy');
    expect(cancelReminder).toHaveBeenCalledWith('notification-1');
    expect(useBookingStore.getState().bookings[0].notificationId).toBeUndefined();

    await setPresence('online');
    expect(scheduleCheckInReminder).toHaveBeenCalledTimes(2);
    expect(useBookingStore.getState().bookings[0].notificationId).toBe('notification-1');
  });

  it('makes an inactive student read-only: no booking, no cancelling', async () => {
    const existing = await book(roomA.id);
    if (!existing.ok) throw new Error('setup booking failed');
    await setPresence('inactive');

    expect(await book(roomB.id)).toEqual({ ok: false, reason: 'inactive' });
    await useBookingStore.getState().cancelBooking(existing.booking.id);
    expect(useBookingStore.getState().bookings[0].status).toBe('confirmed');
    expect(cancelReminder).toHaveBeenCalledWith('notification-1');
  });

  it('blocks check-in and no-show for inactive staff, then allows them again once online', async () => {
    const result = await book(roomA.id, today, slots[0]);
    if (!result.ok) throw new Error('setup booking failed');
    useBookingStore.getState().signIn('user-staff');
    await setPresence('inactive');
    expect(useBookingStore.getState().checkIn(result.booking.id)).toEqual({ ok: false, reason: 'inactive' });
    expect(useBookingStore.getState().markNoShow(result.booking.id)).toEqual({ ok: false, reason: 'inactive' });

    await setPresence('online');
    expect(useBookingStore.getState().checkIn(result.booking.id)).toEqual({ ok: true });
  });

  it('only touches the signed-in user’s presence', async () => {
    await setPresence('busy');
    const users = useAccountStore.getState().users;
    expect(users.find((user) => user.id === 'user-student')?.presence).toBe('busy');
    expect(users.find((user) => user.id === 'user-staff')?.presence).toBe('online');
  });
});
