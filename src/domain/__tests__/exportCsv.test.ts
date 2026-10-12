import { buildBookingsReport, toCsv } from '../exportCsv';
import type { BookingStatus, User } from '../types';
import { makeBooking, makeRoom } from './fixtures';

const statusLabel: Record<BookingStatus, string> = {
  confirmed: 'Đã xác nhận',
  checked_in: 'Đã check-in',
  cancelled: 'Đã huỷ',
  no_show: 'Vắng mặt',
};
const user: User = { id: 'user-1', name: 'Trần Thị Bình', email: 'sv2@vku.udn.vn', password: 'x', role: 'student', studentId: '23IT002' };

describe('toCsv', () => {
  it('starts with a byte-order mark and ends every row with CRLF', () => {
    expect(toCsv([['a', 1], ['b', 2]])).toBe('﻿a,1\r\nb,2\r\n');
  });

  it('quotes cells holding commas, quotes or line breaks', () => {
    expect(toCsv([['Lab IoT, tầng 3', 'gọi là "lab"', 'dòng 1\ndòng 2']])).toBe('﻿"Lab IoT, tầng 3","gọi là ""lab""","dòng 1\ndòng 2"\r\n');
  });

  it('defuses text a spreadsheet would run as a formula, but leaves numbers alone', () => {
    expect(toCsv([['=HYPERLINK("http://x")', '+84', '@home', -5]])).toBe('﻿"\'=HYPERLINK(""http://x"")",\'+84,\'@home,-5\r\n');
  });
});

describe('buildBookingsReport', () => {
  const rooms = [makeRoom()];

  it('lists bookings on the given days oldest first, under a header', () => {
    const rows = buildBookingsReport({
      bookings: [
        makeBooking({ id: 'b', code: 'BBB', dateKey: '2026-10-12', startMinutes: 780, endMinutes: 900, userId: 'user-1', status: 'no_show' }),
        makeBooking({ id: 'a', code: 'AAA', dateKey: '2026-10-11', userId: 'user-1', status: 'checked_in' }),
        makeBooking({ id: 'c', code: 'CCC', dateKey: '2026-09-01', userId: 'user-1' }),
      ],
      rooms,
      users: [user],
      dateKeys: ['2026-10-12', '2026-10-11'],
      statusLabel,
    });
    expect(rows).toHaveLength(3);
    expect(rows[0][0]).toBe('Ngày');
    expect(rows[1]).toEqual(['2026-10-11', '07:30', '09:30', 120, 'A-101', 'Phòng học nhóm 1', 'A', 1, 'Trần Thị Bình', 'sv2@vku.udn.vn', '23IT002', 'Đã check-in', 'AAA']);
    expect(rows[2].slice(0, 4)).toEqual(['2026-10-12', '13:00', '15:00', 120]);
  });

  it('keeps rows whose room or account has been deleted', () => {
    const rows = buildBookingsReport({ bookings: [makeBooking({ roomId: 'gone', userId: 'gone' })], rooms, users: [], dateKeys: ['2026-10-12'], statusLabel });
    expect(rows[1].slice(4, 11)).toEqual(['', 'Phòng đã xoá', '', '', 'Tài khoản đã xoá', '', '']);
  });
});
