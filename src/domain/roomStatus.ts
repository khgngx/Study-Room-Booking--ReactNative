import { minutesOfDay, toDateKey } from './time';
import type { Booking, Room, RoomStatus } from './types';

export function getRoomStatus(room: Room, bookings: readonly Booking[], now: Date): RoomStatus {
  if (room.underMaintenance) return 'maintenance';
  const today = toDateKey(now);
  const minute = minutesOfDay(now);
  const inUse = bookings.some(
    (booking) =>
      booking.roomId === room.id &&
      booking.dateKey === today &&
      (booking.status === 'confirmed' || booking.status === 'checked_in') &&
      booking.startMinutes <= minute &&
      minute < booking.endMinutes,
  );
  return inUse ? 'occupied' : 'available';
}
