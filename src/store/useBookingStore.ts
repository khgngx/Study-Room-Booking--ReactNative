import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { buildSeedBookings } from '../data/seed';
import { validateCheckIn, type CheckInRejection } from '../domain/checkin';
import { getSlotAvailability, type SlotAvailability } from '../domain/conflict';
import { can } from '../domain/permissions';
import { dateFromKey } from '../domain/time';
import type { Booking, Slot, User } from '../domain/types';
import { cancelReminder, scheduleCheckInReminder } from '../services/notifications';
import { createId, jsonStorage } from './storage';
import { useAccountStore } from './useAccountStore';
import { usePolicyStore } from './usePolicyStore';
import { useRoomStore } from './useRoomStore';

type BookingFailure = Exclude<SlotAvailability, 'available'> | 'forbidden' | 'room_not_found';
export type CreateBookingResult = { ok: true; booking: Booking } | { ok: false; reason: BookingFailure };
export type StaffActionResult = { ok: true } | { ok: false; reason: CheckInRejection | 'forbidden' | 'not_started' };

interface BookingState {
  session: { userId: string } | null;
  bookings: Booking[];
  signIn: (userId: string) => void;
  signOut: () => void;
  createBooking: (input: { roomId: string; dateKey: string; slot: Slot }) => Promise<CreateBookingResult>;
  cancelBooking: (bookingId: string) => Promise<void>;
  checkIn: (bookingId: string) => StaffActionResult;
  markNoShow: (bookingId: string) => StaffActionResult;
  cancelUpcomingForRoom: (roomId: string) => void;
}

function currentUser(session: BookingState['session']): User | undefined {
  if (!session) return undefined;
  return useAccountStore.getState().users.find((user) => user.id === session.userId);
}

const createCode = () => Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, '0');

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      session: null,
      bookings: buildSeedBookings(new Date()),

      signIn: (userId) => set({ session: { userId } }),
      signOut: () => set({ session: null }),

      createBooking: async ({ roomId, dateKey, slot }) => {
        const user = currentUser(get().session);
        if (!user || !can(user.role, 'booking.create')) return { ok: false, reason: 'forbidden' };
        const room = useRoomStore.getState().rooms.find((candidate) => candidate.id === roomId);
        if (!room) return { ok: false, reason: 'room_not_found' };
        const { policy } = usePolicyStore.getState();

        // Re-checked here, not just in the UI, so a stale screen can never double-book.
        const availability = getSlotAvailability({
          room,
          dateKey,
          slot,
          bookings: get().bookings,
          userId: user.id,
          policy,
          now: new Date(),
        });
        if (availability !== 'available') return { ok: false, reason: availability };

        const booking: Booking = {
          id: createId('booking'),
          code: createCode(),
          roomId,
          userId: user.id,
          dateKey,
          startMinutes: slot.startMinutes,
          endMinutes: slot.endMinutes,
          status: 'confirmed',
          createdAt: Date.now(),
        };
        set((state) => ({ bookings: [...state.bookings, booking] }));

        const notificationId = await scheduleCheckInReminder(booking, room, policy.reminderMinutes);
        if (!notificationId) return { ok: true, booking };
        const withReminder = { ...booking, notificationId };
        set((state) => ({
          bookings: state.bookings.map((item) => (item.id === booking.id ? { ...item, notificationId } : item)),
        }));
        return { ok: true, booking: withReminder };
      },

      cancelBooking: async (bookingId) => {
        const user = currentUser(get().session);
        const booking = get().bookings.find((item) => item.id === bookingId);
        if (!user || !booking || booking.userId !== user.id || booking.status !== 'confirmed') return;
        set((state) => ({
          bookings: state.bookings.map((item) =>
            item.id === bookingId ? { ...item, status: 'cancelled', notificationId: undefined } : item,
          ),
        }));
        await cancelReminder(booking.notificationId);
      },

      checkIn: (bookingId) => {
        const staff = currentUser(get().session);
        if (!staff || !can(staff.role, 'checkin.verify')) return { ok: false, reason: 'forbidden' };
        const booking = get().bookings.find((item) => item.id === bookingId);
        const room = useRoomStore.getState().rooms.find((candidate) => candidate.id === booking?.roomId);
        const result = validateCheckIn(booking, room, staff, new Date());
        if (!result.ok) return result;
        set((state) => ({
          bookings: state.bookings.map((item) =>
            item.id === bookingId ? { ...item, status: 'checked_in', checkedInAt: Date.now() } : item,
          ),
        }));
        return { ok: true };
      },

      markNoShow: (bookingId) => {
        const staff = currentUser(get().session);
        if (!staff || !can(staff.role, 'checkin.verify')) return { ok: false, reason: 'forbidden' };
        const booking = get().bookings.find((item) => item.id === bookingId);
        if (!booking) return { ok: false, reason: 'not_found' };
        if (booking.status !== 'confirmed') {
          return { ok: false, reason: booking.status === 'checked_in' ? 'already_checked_in' : booking.status };
        }
        if (dateFromKey(booking.dateKey, booking.startMinutes).getTime() > Date.now()) {
          return { ok: false, reason: 'not_started' };
        }
        set((state) => ({
          bookings: state.bookings.map((item) => (item.id === bookingId ? { ...item, status: 'no_show' } : item)),
        }));
        return { ok: true };
      },

      cancelUpcomingForRoom: (roomId) => {
        const now = Date.now();
        set((state) => ({
          bookings: state.bookings.map((item) =>
            item.roomId === roomId &&
            item.status === 'confirmed' &&
            dateFromKey(item.dateKey, item.endMinutes).getTime() > now
              ? { ...item, status: 'cancelled' }
              : item,
          ),
        }));
      },
    }),
    { name: 'vku-bookings', storage: jsonStorage },
  ),
);

export function useCurrentUser(): User | undefined {
  const userId = useBookingStore((state) => state.session?.userId);
  return useAccountStore((state) => state.users.find((user) => user.id === userId));
}
