// MOCK DATA: demo rooms, accounts and bookings. There is no backend; everything lives on-device.
import { generateSlots } from '../domain/slots';
import { addDays, dateFromKey, toDateKey } from '../domain/time';
import type { Booking, Building, Equipment, Policy, Room, RoomType, User } from '../domain/types';

export const DEFAULT_POLICY: Policy = {
  openingWindows: [
    { start: '07:30', end: '11:30' },
    { start: '13:00', end: '21:00' },
  ],
  slotMinutes: 120,
  maxBookingsPerDay: 2,
  reminderMinutes: 15,
};

type RoomRow = [name: string, type: RoomType, building: Building, floor: number, capacity: number, equipment: Equipment[]];

const ROOM_ROWS: RoomRow[] = [
  ['A101', 'study', 'A', 1, 4, ['whiteboard', 'ac']],
  ['A102', 'study', 'A', 1, 6, ['whiteboard']],
  ['A203', 'study', 'A', 2, 8, ['projector', 'whiteboard', 'ac']],
  ['A305', 'study', 'A', 3, 12, ['projector', 'ac']],
  ['Lab A401', 'lab', 'A', 4, 20, ['projector', 'high_spec_pc', 'ac']],
  ['B101', 'study', 'B', 1, 2, ['whiteboard']],
  ['B104', 'study', 'B', 1, 4, ['whiteboard', 'ac']],
  ['B202', 'study', 'B', 2, 10, ['projector', 'whiteboard']],
  ['Lab B301', 'lab', 'B', 3, 20, ['high_spec_pc', 'ac']],
  ['Lab B302', 'lab', 'B', 3, 16, ['projector', 'high_spec_pc', 'ac']],
  ['C101', 'study', 'C', 1, 6, ['whiteboard', 'ac']],
  ['C102', 'study', 'C', 1, 8, ['projector', 'whiteboard']],
  ['C204', 'study', 'C', 2, 12, ['projector', 'whiteboard', 'ac']],
  ['Lab C301', 'lab', 'C', 3, 18, ['high_spec_pc', 'ac']],
  ['C402', 'study', 'C', 4, 4, ['whiteboard']],
  ['V101', 'study', 'V', 1, 6, ['whiteboard', 'ac']],
  ['V202', 'study', 'V', 2, 10, ['projector', 'whiteboard', 'ac']],
  ['Lab V301', 'lab', 'V', 3, 20, ['projector', 'high_spec_pc', 'ac']],
  ['Lab V302', 'lab', 'V', 3, 14, ['high_spec_pc', 'ac']],
  ['V405', 'study', 'V', 4, 2, ['whiteboard']],
];

// Placeholder photography until real campus photos are available.
export const placeholderImage = (seed: string) =>
  `https://picsum.photos/seed/vku-${encodeURIComponent(seed)}/800/800`;

export const SEED_ROOMS: Room[] = ROOM_ROWS.map(([name, type, building, floor, capacity, equipment], index) => ({
  id: `room-${index + 1}`,
  name,
  type,
  building,
  floor,
  capacity,
  equipment,
  imageUrl: placeholderImage(name),
  underMaintenance: name === 'C402',
  maintenanceNote: name === 'C402' ? 'Đang sửa điều hoà' : undefined,
}));

// MOCK AUTH: demo credentials stored in plain text on-device. Not suitable for a real deployment.
export const DEMO_PASSWORD = '123456';

export const SEED_USERS: User[] = [
  { id: 'user-student', name: 'Nguyễn Văn An', email: 'sv@vku.udn.vn', password: DEMO_PASSWORD, role: 'student', studentId: '23IT001' },
  { id: 'user-student-2', name: 'Trần Thị Bình', email: 'sv2@vku.udn.vn', password: DEMO_PASSWORD, role: 'student', studentId: '23IT002' },
  { id: 'user-staff', name: 'Lê Minh Cường', email: 'staff@vku.udn.vn', password: DEMO_PASSWORD, role: 'lab_staff', assignedBuildings: ['A', 'B'] },
  { id: 'user-manager', name: 'Phạm Thu Dung', email: 'manager@vku.udn.vn', password: DEMO_PASSWORD, role: 'facility_manager' },
];

/** Demo bookings held by the second student so the first one sees real conflicts and stats. */
export function buildSeedBookings(now: Date): Booking[] {
  const slots = generateSlots(DEFAULT_POLICY);
  const plan: [dayOffset: number, roomIndex: number, slotIndex: number, pastStatus: Booking['status']][] = [
    [-3, 0, 0, 'checked_in'],
    [-3, 4, 2, 'checked_in'],
    [-2, 4, 1, 'no_show'],
    [-2, 8, 3, 'checked_in'],
    [-1, 0, 2, 'checked_in'],
    [-1, 4, 3, 'checked_in'],
    [-1, 12, 0, 'no_show'],
    ...slots.map((_, slotIndex): [number, number, number, Booking['status']] => [0, 0, slotIndex, 'checked_in']),
    [0, 4, 2, 'checked_in'],
    [1, 0, 1, 'checked_in'],
    [1, 2, 0, 'checked_in'],
    [2, 4, 2, 'checked_in'],
  ];
  return plan.map(([dayOffset, roomIndex, slotIndex, pastStatus], index) => {
    const slot = slots[slotIndex];
    const dateKey = toDateKey(addDays(now, dayOffset));
    const ended = dateFromKey(dateKey, slot.endMinutes).getTime() <= now.getTime();
    return {
      id: `seed-booking-${index + 1}`,
      code: `SEED${String(index + 1).padStart(2, '0')}`,
      roomId: SEED_ROOMS[roomIndex].id,
      userId: 'user-student-2',
      dateKey,
      startMinutes: slot.startMinutes,
      endMinutes: slot.endMinutes,
      status: ended ? pastStatus : 'confirmed',
      createdAt: now.getTime(),
    };
  });
}
