import type { DayPart } from '../domain/time';
import type { Ionicons } from '@expo/vector-icons';

import type { BookingStatus, Equipment, Presence, RoomStatus, RoomType, UserRole } from '../domain/types';

type IconName = keyof typeof Ionicons.glyphMap;

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  projector: 'Máy chiếu',
  whiteboard: 'Bảng trắng',
  high_spec_pc: 'PC cấu hình cao',
  ac: 'Điều hoà',
};

export const EQUIPMENT_ICON: Record<Equipment, IconName> = {
  projector: 'videocam-outline',
  whiteboard: 'easel-outline',
  high_spec_pc: 'desktop-outline',
  ac: 'snow-outline',
};

export const ROOM_TYPE_LABEL: Record<RoomType, string> = {
  study: 'Phòng học nhóm',
  lab: 'Phòng lab',
  seminar: 'Hội thảo',
};

export const formatLocation = (room: { building: string; floor: number }) => `Toà ${room.building} · Tầng ${room.floor}`;

/** Given name only ("Trần Thị Bình" → "Bình"), enough to recognise a classmate on a shared schedule. */
export const givenName = (fullName: string) => fullName.trim().split(/\s+/).pop() ?? fullName;

/** Initials of the last two words ("Nguyễn Văn An" → "VA"), the stand-in for a missing avatar. */
export const initials = (fullName: string) =>
  fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

export const ROLE_ICON: Record<UserRole, IconName> = {
  student: 'school-outline',
  lab_staff: 'construct-outline',
  facility_manager: 'business-outline',
};

/** The title of every role's home tab. */
export const GREETING: Record<DayPart, string> = {
  morning: 'Good morning',
  afternoon: 'Good afternoon',
  evening: 'Good evening',
  night: 'Good night',
};

export const ROOM_STATUS_LABEL: Record<RoomStatus, string> = {
  available: 'Đang trống',
  occupied: 'Đang sử dụng',
  maintenance: 'Bảo trì',
};

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  confirmed: 'Đã xác nhận',
  checked_in: 'Đã check-in',
  cancelled: 'Đã huỷ',
  no_show: 'Vắng mặt',
};

export const ROLE_LABEL: Record<UserRole, string> = {
  student: 'Sinh viên',
  lab_staff: 'Nhân viên lab',
  facility_manager: 'Quản lý cơ sở vật chất',
};

export const PRESENCE_LABEL: Record<Presence, string> = {
  online: 'Trực tiếp',
  busy: 'Đang bận',
  inactive: 'Không hoạt động',
};

export const PRESENCE_DESCRIPTION: Record<Presence, string> = {
  online: 'Dùng được mọi chức năng và nhận thông báo.',
  busy: 'Dùng được mọi chức năng nhưng không nhận thông báo từ ứng dụng.',
  inactive: 'Chỉ xem. Không đặt, huỷ hay chỉnh sửa được gì.',
};

export const READ_ONLY_MESSAGE = 'Bạn đang ở trạng thái Không hoạt động nên chỉ xem được. Đổi trạng thái ở góc trên bên phải để tiếp tục.';

export const STAFF_ACTION_ERROR: Record<string, string> = {
  not_found: 'Không tìm thấy lượt đặt phòng này.',
  cancelled: 'Lượt đặt này đã bị huỷ.',
  already_checked_in: 'Lượt đặt này đã check-in rồi.',
  no_show: 'Lượt đặt này đã bị đánh dấu vắng mặt.',
  out_of_area: 'Phòng này nằm ngoài khu vực bạn phụ trách.',
  too_early: 'Chưa đến giờ check-in (mở trước giờ bắt đầu 15 phút).',
  expired: 'Ca đặt phòng đã kết thúc.',
  not_started: 'Chỉ đánh dấu vắng mặt sau khi ca đã bắt đầu.',
  forbidden: 'Tài khoản của bạn không có quyền thực hiện thao tác này.',
  inactive: READ_ONLY_MESSAGE,
};

export const MAINTENANCE_DENIED: Record<'forbidden' | 'out_of_area' | 'inactive' | 'room_not_found', { title: string; message: string }> = {
  out_of_area: { title: 'Không được phân quyền', message: 'Bạn không được phân quyền bảo trì phòng này. Vui lòng chọn phòng hoặc khu khác.' },
  forbidden: { title: 'Không được phân quyền', message: 'Tài khoản của bạn không có quyền bật tắt bảo trì.' },
  inactive: { title: 'Đang ở chế độ chỉ xem', message: READ_ONLY_MESSAGE },
  room_not_found: { title: 'Không tìm thấy phòng', message: 'Phòng này có thể đã bị xoá.' },
};
