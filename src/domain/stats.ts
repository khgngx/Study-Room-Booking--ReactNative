import { isActive } from './conflict';
import type { Booking, Room } from './types';

export interface DashboardStats {
  totalBookings: number;
  checkedIn: number;
  noShows: number;
  cancelled: number;
  /** Booked minutes ÷ bookable minutes across the given days, 0–1. */
  utilization: number;
  /** No-shows ÷ bookings that reached an outcome (checked in or no-show), 0–1. */
  noShowRate: number;
  topRooms: { room: Room; count: number }[];
}

interface StatsInput {
  bookings: readonly Booking[];
  rooms: readonly Room[];
  dateKeys: readonly string[];
  bookableMinutesPerDay: number;
}

export function computeStats({ bookings, rooms, dateKeys, bookableMinutesPerDay }: StatsInput): DashboardStats {
  const inRange = bookings.filter((booking) => dateKeys.includes(booking.dateKey));
  const active = inRange.filter(isActive);
  const checkedIn = inRange.filter((booking) => booking.status === 'checked_in').length;
  const noShows = inRange.filter((booking) => booking.status === 'no_show').length;

  const bookedMinutes = active.reduce((sum, booking) => sum + (booking.endMinutes - booking.startMinutes), 0);
  const capacityMinutes = rooms.length * dateKeys.length * bookableMinutesPerDay;
  const resolved = checkedIn + noShows;

  const counts = new Map<string, number>();
  for (const booking of active) counts.set(booking.roomId, (counts.get(booking.roomId) ?? 0) + 1);
  const topRooms = rooms
    .map((room) => ({ room, count: counts.get(room.id) ?? 0 }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count || a.room.name.localeCompare(b.room.name))
    .slice(0, 5);

  return {
    totalBookings: inRange.length,
    checkedIn,
    noShows,
    cancelled: inRange.length - active.length,
    utilization: capacityMinutes > 0 ? Math.min(1, bookedMinutes / capacityMinutes) : 0,
    noShowRate: resolved > 0 ? noShows / resolved : 0,
    topRooms,
  };
}
