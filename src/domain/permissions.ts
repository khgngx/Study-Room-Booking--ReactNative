import type { UserRole } from './types';

export type Permission =
  | 'booking.create'
  | 'booking.cancelOwn'
  | 'checkin.verify'
  | 'booking.viewShift'
  | 'booking.viewAllAreas'
  | 'room.setMaintenance'
  | 'room.crud'
  | 'user.manage'
  | 'stats.view'
  | 'policy.edit';

const STAFF: Permission[] = ['checkin.verify', 'booking.viewShift', 'room.setMaintenance'];

const MATRIX: Record<UserRole, readonly Permission[]> = {
  student: ['booking.create', 'booking.cancelOwn'],
  lab_staff: STAFF,
  facility_manager: [...STAFF, 'booking.viewAllAreas', 'room.crud', 'user.manage', 'stats.view', 'policy.edit'],
};

export function can(role: UserRole, permission: Permission): boolean {
  return MATRIX[role].includes(permission);
}
