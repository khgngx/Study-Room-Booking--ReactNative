import { formatMinutes } from '../domain/time';
import { countFreeSlots, getAvailabilityNow } from '../domain/timeline';
import type { Booking, Policy, Room, RoomStatus, Slot } from '../domain/types';

export interface RoomDayStatus {
  tone: RoomStatus;
  label: string;
  /** Free right now (today) or still has a bookable slot (other days). */
  open: boolean;
}

interface RoomDayStatusInput {
  room: Room;
  bookings: readonly Booking[];
  dateKey: string;
  isToday: boolean;
  policy: Pick<Policy, 'openingWindows'>;
  slots: readonly Slot[];
  now: Date;
}

/** The one-line answer to "can I use this room?": live for today, a slot count for other days. */
export function getRoomDayStatus({ room, bookings, dateKey, isToday, policy, slots, now }: RoomDayStatusInput): RoomDayStatus {
  if (room.underMaintenance) {
    return { tone: 'maintenance', label: room.maintenanceNote ? `Bảo trì · ${room.maintenanceNote}` : 'Bảo trì', open: false };
  }
  if (isToday) {
    const availability = getAvailabilityNow(room, bookings, now, policy);
    if (availability.state === 'occupied') {
      return { tone: 'occupied', label: `Đang dùng đến ${formatMinutes(availability.untilMinutes)}`, open: false };
    }
    const until = availability.state === 'free' ? availability.untilMinutes : null;
    return { tone: 'available', label: until === null ? 'Đang trống' : `Trống đến ${formatMinutes(until)}`, open: true };
  }
  const free = countFreeSlots(room, bookings, dateKey, slots, now);
  return {
    tone: free > 0 ? 'available' : 'occupied',
    label: free === 0 ? 'Kín lịch' : free === slots.length ? 'Trống cả ngày' : `Còn ${free} khung giờ trống`,
    open: free > 0,
  };
}
