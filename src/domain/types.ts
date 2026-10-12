export type UserRole = 'student' | 'lab_staff' | 'facility_manager';
export type Building = 'A' | 'B' | 'C' | 'V';
export type Equipment = 'projector' | 'whiteboard' | 'high_spec_pc' | 'ac';
export type RoomType = 'study' | 'lab' | 'seminar';
export type RoomStatus = 'available' | 'occupied' | 'maintenance';
/** Self-set availability: online = full use, busy = no notifications, inactive = read-only. */
export type Presence = 'online' | 'busy' | 'inactive';
export type BookingStatus = 'confirmed' | 'checked_in' | 'cancelled' | 'no_show';

export const PRESENCES: readonly Presence[] = ['online', 'busy', 'inactive'];
export const ROOM_TYPES: readonly RoomType[] = ['study', 'lab', 'seminar'];
export const BUILDINGS: readonly Building[] = ['A', 'B', 'C', 'V'];
export const EQUIPMENT: readonly Equipment[] = ['projector', 'whiteboard', 'high_spec_pc', 'ac'];

export interface Room {
  id: string;
  /** Short door code shown on signage, e.g. "A-302". */
  code: string;
  /** Descriptive name, e.g. "Lab IoT và hệ thống nhúng". */
  name: string;
  type: RoomType;
  building: Building;
  floor: number;
  capacity: number;
  equipment: Equipment[];
  /** One or two sentences on layout and best use, shown on the room page. */
  description?: string;
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
  // Absent on accounts saved before presence existed; treated as online.
  presence?: Presence;
  studentId?: string;
  /** A picked photo (see `services/images`); the initials stand in when absent. */
  avatarUrl?: string;
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
