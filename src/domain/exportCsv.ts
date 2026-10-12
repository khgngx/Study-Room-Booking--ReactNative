import { formatMinutes } from './time';
import type { Booking, BookingStatus, Room, User } from './types';

export type CsvValue = string | number;

// Spreadsheets run a cell that starts with one of these as a formula; names and notes are typed by users.
const FORMULA_LEAD = /^[=+\-@\t\r]/;

function csvCell(value: CsvValue): string {
  if (typeof value === 'number') return String(value);
  const safe = FORMULA_LEAD.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** RFC 4180 text with a UTF-8 byte-order mark, so Google Sheets and Excel read Vietnamese correctly. */
export function toCsv(rows: readonly (readonly CsvValue[])[]): string {
  return `﻿${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`;
}

interface ReportInput {
  bookings: readonly Booking[];
  rooms: readonly Room[];
  users: readonly User[];
  dateKeys: readonly string[];
  statusLabel: Record<BookingStatus, string>;
}

const HEADER = ['Ngày', 'Bắt đầu', 'Kết thúc', 'Thời lượng (phút)', 'Mã phòng', 'Tên phòng', 'Toà', 'Tầng', 'Người đặt', 'Email', 'Mã sinh viên', 'Trạng thái', 'Mã đặt phòng'];

/** One row per booking on the given days, oldest first, under a header row. */
export function buildBookingsReport({ bookings, rooms, users, dateKeys, statusLabel }: ReportInput): CsvValue[][] {
  const rows = bookings
    .filter((booking) => dateKeys.includes(booking.dateKey))
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey) || a.startMinutes - b.startMinutes || a.code.localeCompare(b.code))
    .map((booking): CsvValue[] => {
      const room = rooms.find((candidate) => candidate.id === booking.roomId);
      const user = users.find((candidate) => candidate.id === booking.userId);
      return [
        booking.dateKey,
        formatMinutes(booking.startMinutes),
        formatMinutes(booking.endMinutes),
        booking.endMinutes - booking.startMinutes,
        room?.code ?? '',
        room?.name ?? 'Phòng đã xoá',
        room?.building ?? '',
        room?.floor ?? '',
        user?.name ?? 'Tài khoản đã xoá',
        user?.email ?? '',
        user?.studentId ?? '',
        statusLabel[booking.status],
        booking.code,
      ];
    });
  return [HEADER, ...rows];
}
