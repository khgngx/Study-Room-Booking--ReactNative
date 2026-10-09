import type { Booking, Policy, Room } from '../types';

export const policy: Policy = {
  openingWindows: [
    { start: '07:30', end: '11:30' },
    { start: '13:00', end: '17:00' },
  ],
  slotMinutes: 120,
  maxBookingsPerDay: 2,
  reminderMinutes: 15,
};

export function makeRoom(overrides: Partial<Room> = {}): Room {
  return {
    id: 'room-1',
    name: 'A101',
    type: 'study',
    building: 'A',
    floor: 1,
    capacity: 8,
    equipment: ['projector', 'whiteboard'],
    imageUrl: '',
    underMaintenance: false,
    ...overrides,
  };
}

export function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: 'booking-1',
    code: 'ABC123',
    roomId: 'room-1',
    userId: 'user-1',
    dateKey: '2026-10-12',
    startMinutes: 450,
    endMinutes: 570,
    status: 'confirmed',
    createdAt: 0,
    ...overrides,
  };
}
