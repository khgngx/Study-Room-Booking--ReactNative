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
  maxBookingsPerDay: 4,
  reminderMinutes: 15,
};

type RoomRow = [code: string, name: string, type: RoomType, building: Building, floor: number, capacity: number, equipment: Equipment[], description: string];

const ROOM_ROWS: RoomRow[] = [
  ['A-101', 'Phòng học nhóm 1', 'study', 'A', 1, 4, ['whiteboard', 'ac'], 'Bàn chung 4 chỗ, bảng trắng treo tường. Hợp nhóm nhỏ ôn bài hoặc chia việc đồ án.'],
  ['A-102', 'Phòng học nhóm 2', 'study', 'A', 1, 6, ['whiteboard'], 'Bàn dài 6 chỗ và bảng trắng lớn, hợp thảo luận và giải bài tập nhóm. Phòng không có điều hoà.'],
  ['A-203', 'Phòng học nhóm 3', 'study', 'A', 2, 8, ['projector', 'whiteboard', 'ac'], 'Bàn chữ U 8 chỗ, có máy chiếu và bảng trắng để tập thuyết trình trước buổi báo cáo.'],
  ['A-305', 'Phòng hội thảo A', 'seminar', 'A', 3, 12, ['projector', 'ac'], 'Phòng hội thảo 12 chỗ với máy chiếu và màn chiếu lớn. Dành cho seminar, bảo vệ thử và họp câu lạc bộ.'],
  ['A-401', 'Lab Lập trình ứng dụng', 'lab', 'A', 4, 20, ['projector', 'high_spec_pc', 'ac'], 'Lab 20 máy cấu hình cao cài sẵn Android Studio và VS Code, có máy chiếu cho buổi hướng dẫn.'],
  ['B-101', 'Phòng tự học đôi 1', 'study', 'B', 1, 2, ['whiteboard'], 'Phòng nhỏ 2 chỗ, bảng trắng mini. Hợp học đôi hoặc phỏng vấn thử.'],
  ['B-104', 'Phòng học nhóm 4', 'study', 'B', 1, 4, ['whiteboard', 'ac'], 'Bàn tròn 4 chỗ, bảng trắng, điều hoà. Yên tĩnh vì nằm cuối hành lang tầng 1.'],
  ['B-202', 'Phòng hội thảo B', 'seminar', 'B', 2, 10, ['projector', 'whiteboard'], 'Phòng hội thảo 10 chỗ có máy chiếu và bảng trắng. Hợp báo cáo tiến độ và sinh hoạt chuyên đề.'],
  ['B-301', 'Lab IoT và hệ thống nhúng', 'lab', 'B', 3, 20, ['high_spec_pc', 'ac'], 'Lab 20 chỗ với máy trạm và bàn thực hành cho mạch, cảm biến, vi điều khiển. Nhóm tự mang kit.'],
  ['B-302', 'Lab Mac và iOS', 'lab', 'B', 3, 16, ['projector', 'high_spec_pc', 'ac'], 'Lab 16 máy Mac cài Xcode để build và chạy thử ứng dụng iOS, có máy chiếu.'],
  ['C-101', 'Phòng học nhóm 5', 'study', 'C', 1, 6, ['whiteboard', 'ac'], 'Bàn chung 6 chỗ, bảng trắng, điều hoà. Gần sảnh toà C nên dễ hẹn nhóm.'],
  ['C-102', 'Phòng học nhóm 6', 'study', 'C', 1, 8, ['projector', 'whiteboard'], 'Phòng 8 chỗ có máy chiếu và bảng trắng, hợp tập thuyết trình. Phòng không có điều hoà.'],
  ['C-204', 'Phòng hội thảo C', 'seminar', 'C', 2, 12, ['projector', 'whiteboard', 'ac'], 'Phòng hội thảo 12 chỗ đủ máy chiếu, bảng trắng và điều hoà cho workshop hoặc bảo vệ thử.'],
  ['C-301', 'Lab Mạng máy tính', 'lab', 'C', 3, 18, ['high_spec_pc', 'ac'], 'Lab 18 máy kèm switch và router thực hành để cấu hình, đo kiểm mạng.'],
  ['C-402', 'Phòng tự học yên tĩnh', 'study', 'C', 4, 4, ['whiteboard'], 'Phòng 4 chỗ dành cho tự học yên tĩnh: không thảo luận lớn tiếng, không họp nhóm.'],
  ['V-101', 'Phòng học nhóm 7', 'study', 'V', 1, 6, ['whiteboard', 'ac'], 'Bàn chung 6 chỗ, bảng trắng, điều hoà. Ngay tầng 1 toà V, tiện ghé giữa hai tiết học.'],
  ['V-202', 'Phòng hội thảo V', 'seminar', 'V', 2, 10, ['projector', 'whiteboard', 'ac'], 'Phòng hội thảo 10 chỗ có máy chiếu, bảng trắng và điều hoà. Hợp họp đồ án với giảng viên hướng dẫn.'],
  ['V-301', 'Lab Trí tuệ nhân tạo', 'lab', 'V', 3, 20, ['projector', 'high_spec_pc', 'ac'], 'Lab 20 máy có GPU để huấn luyện và chạy thử mô hình, kèm máy chiếu cho buổi seminar.'],
  ['V-302', 'Lab Đồ hoạ và đa phương tiện', 'lab', 'V', 3, 14, ['high_spec_pc', 'ac'], 'Lab 14 máy màn hình lớn, cài sẵn phần mềm thiết kế và dựng phim.'],
  ['V-405', 'Phòng tự học đôi 2', 'study', 'V', 4, 2, ['whiteboard'], 'Phòng nhỏ 2 chỗ ở tầng 4, bảng trắng mini. Hợp học đôi hoặc gọi video.'],
];

// Placeholder photography until real campus photos are available.
export const placeholderImage = (seed: string) =>
  `https://picsum.photos/seed/vku-${encodeURIComponent(seed)}/800/800`;

export const SEED_ROOMS: Room[] = ROOM_ROWS.map(([code, name, type, building, floor, capacity, equipment, description], index) => ({
  id: `room-${index + 1}`,
  code,
  name,
  type,
  building,
  floor,
  capacity,
  equipment,
  description,
  imageUrl: placeholderImage(code),
  underMaintenance: code === 'C-402',
  maintenanceNote: code === 'C-402' ? 'Đang sửa điều hoà' : undefined,
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
