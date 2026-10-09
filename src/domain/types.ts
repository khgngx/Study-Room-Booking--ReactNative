export type UserRole = 'student' | 'lab_staff' | 'facility_manager';
export type Building = 'A' | 'B' | 'C' | 'V';
export type Equipment = 'projector' | 'whiteboard' | 'high_spec_pc' | 'ac';
export type RoomType = 'study' | 'lab';
export type RoomStatus = 'available' | 'occupied' | 'maintenance';
export type BookingStatus = 'confirmed' | 'checked_in' | 'cancelled' | 'no_show';

export const BUILDINGS: readonly Building[] = ['A', 'B', 'C', 'V'];
export const EQUIPMENT: readonly Equipment[] = ['projector', 'whiteboard', 'high_spec_pc', 'ac'];

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  building: Building;
  floor: number;
  capacity: number;
  equipment: Equipment[];
  imageUrl: string;
  // Occupied/available is derived from bookings; only maintenance is stored.
  underMaintenance: boolean;
  maintenanceNote?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  studentId?: string;
  // Buildings a lab staff member is responsible for.
  assignedBuildings?: Building[];
}

export interface Slot {
  id: string;
  startMinutes: number;
  endMinutes: number;
  label: string;
}

export interface Booking {
  id: string;
  // Short code a staff member can type when the QR cannot be scanned.
  code: string;
  roomId: string;
  userId: string;
  dateKey: string;
  startMinutes: number;
  endMinutes: number;
  status: BookingStatus;
  createdAt: number;
  checkedInAt?: number;
  notificationId?: string;
}

export interface TimeWindow {
  start: string;
  end: string;
}

export interface Policy {
  openingWindows: TimeWindow[];
  slotMinutes: number;
  maxBookingsPerDay: number;
  reminderMinutes: number;
}
