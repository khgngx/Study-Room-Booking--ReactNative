import type { Ionicons } from '@expo/vector-icons';

import type { BookingStatus, Equipment, RoomStatus, RoomType, UserRole } from '../domain/types';

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

export const ROOM_TYPE_LABEL: Record<RoomType, string> = { study: 'Phòng học nhóm', lab: 'Phòng lab máy tính' };

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
};
