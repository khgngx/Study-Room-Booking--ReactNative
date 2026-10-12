import { isActive, overlaps } from './conflict';
import { BUILDINGS, type Booking, type BookingStatus, type Building, type Room } from './types';

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
  /** Active bookings per day, oldest day first. */
  daily: { dateKey: string; count: number }[];
  statusCounts: Record<BookingStatus, number>;
  /** Buildings that have rooms, with how much of their bookable time was booked (0–1). */
  byBuilding: { building: Building; rooms: number; bookings: number; utilization: number }[];
  /** Active bookings running during each hour of the day, summed over the given days. */
  byHour: { hour: number; count: number }[];
}

interface StatsInput {
  bookings: readonly Booking[];
  rooms: readonly Room[];
  dateKeys: readonly string[];
  bookableMinutesPerDay: number;
  /** The hours `byHour` covers, in minutes from midnight. */
  dayRange: { startMinutes: number; endMinutes: number };
}

const bookedMinutes = (bookings: readonly Booking[]) =>
  bookings.reduce((sum, booking) => sum + (booking.endMinutes - booking.startMinutes), 0);

export function computeStats({ bookings, rooms, dateKeys, bookableMinutesPerDay, dayRange }: StatsInput): DashboardStats {
  const inRange = bookings.filter((booking) => dateKeys.includes(booking.dateKey));
  const active = inRange.filter(isActive);
  const statusCounts: Record<BookingStatus, number> = { confirmed: 0, checked_in: 0, cancelled: 0, no_show: 0 };
  for (const booking of inRange) statusCounts[booking.status] += 1;

  const capacityMinutes = rooms.length * dateKeys.length * bookableMinutesPerDay;
  const resolved = statusCounts.checked_in + statusCounts.no_show;

  const counts = new Map<string, number>();
  for (const booking of active) counts.set(booking.roomId, (counts.get(booking.roomId) ?? 0) + 1);
  const topRooms = rooms
    .map((room) => ({ room, count: counts.get(room.id) ?? 0 }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count || a.room.code.localeCompare(b.room.code))
    .slice(0, 5);

  const daily = [...dateKeys]
    .sort()
    .map((dateKey) => ({ dateKey, count: active.filter((booking) => booking.dateKey === dateKey).length }));

  const byBuilding = BUILDINGS.map((building) => {
    const roomIds = new Set(rooms.filter((room) => room.building === building).map((room) => room.id));
    const held = active.filter((booking) => roomIds.has(booking.roomId));
    const capacity = roomIds.size * dateKeys.length * bookableMinutesPerDay;
    return {
      building,
      rooms: roomIds.size,
      bookings: held.length,
      utilization: capacity > 0 ? Math.min(1, bookedMinutes(held) / capacity) : 0,
    };
  }).filter((entry) => entry.rooms > 0);

  const byHour: DashboardStats['byHour'] = [];
  for (let start = Math.floor(dayRange.startMinutes / 60) * 60; start < dayRange.endMinutes; start += 60) {
    const hour = { startMinutes: start, endMinutes: start + 60 };
    byHour.push({ hour: start / 60, count: active.filter((booking) => overlaps(booking, hour)).length });
  }

  return {
    totalBookings: inRange.length,
    checkedIn: statusCounts.checked_in,
    noShows: statusCounts.no_show,
    cancelled: statusCounts.cancelled,
    utilization: capacityMinutes > 0 ? Math.min(1, bookedMinutes(active) / capacityMinutes) : 0,
    noShowRate: resolved > 0 ? statusCounts.no_show / resolved : 0,
    topRooms,
    daily,
    statusCounts,
    byBuilding,
    byHour,
  };
}
