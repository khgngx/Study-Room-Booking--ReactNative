import type { Presence, Room, User, UserRole } from './types';

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

export function getPresence(user: Pick<User, 'presence'>): Presence {
  return user.presence ?? 'online';
}

/** Role check plus presence: an inactive user can look but not change anything. */
export function canAct(user: Pick<User, 'role' | 'presence'>, permission: Permission): boolean {
  return getPresence(user) !== 'inactive' && can(user.role, permission);
}

/** Only online users get reminders; busy and inactive users are left alone. */
export function receivesNotifications(user: Pick<User, 'presence'>): boolean {
  return getPresence(user) === 'online';
}

export type MaintenanceAccess = 'allowed' | 'forbidden' | 'out_of_area' | 'inactive';

/**
 * Whether `user` may switch maintenance for `room`. Lab staff only cover the buildings a facility
 * manager assigned to them; whoever sees all areas covers every building.
 */
export function getMaintenanceAccess(
  user: Pick<User, 'role' | 'presence' | 'assignedBuildings'>,
  room: Pick<Room, 'building'>,
): MaintenanceAccess {
  if (!can(user.role, 'room.setMaintenance')) return 'forbidden';
  const covered = can(user.role, 'booking.viewAllAreas') || (user.assignedBuildings ?? []).includes(room.building);
  if (!covered) return 'out_of_area';
  return getPresence(user) === 'inactive' ? 'inactive' : 'allowed';
}
