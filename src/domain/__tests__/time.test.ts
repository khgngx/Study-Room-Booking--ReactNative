import { dayPart, formatDuration, formatTimeEntry, maskTimeInput, monthWeeks, resolveTimeInput, weekOf } from '../time';

describe('maskTimeInput', () => {
  it.each([
    ['', ''],
    ['1', '1'],
    ['13', '13'],
    ['130', '13:0'],
    ['1305', '13:05'],
    ['13:05', '13:05'],
    ['13h05', '13:05'],
    ['130599', '13:05'],
    ['abc', ''],
  ])('shapes %p as %p', (text, masked) => {
    expect(maskTimeInput(text)).toBe(masked);
  });

  it('lets the colon be deleted', () => {
    expect(maskTimeInput('13:')).toBe('13');
  });
});

describe('resolveTimeInput', () => {
  it.each([
    ['13:05', 785],
    ['07:30', 450],
    ['00:00', 0],
    ['23:59', 1439],
    ['13', 780],
    ['7', 420],
    ['13:5', 785],
  ])('reads %p', (text, minutes) => {
    expect(resolveTimeInput(text)).toBe(minutes);
  });

  it.each([
    ['13:99', 879],
    ['13:60', 840],
    ['22:75', 1395],
  ])('rolls the extra minutes of %p into the hour', (text, minutes) => {
    expect(resolveTimeInput(text)).toBe(minutes);
  });

  it.each(['', 'abc', '24:00', '23:60', '99:99'])('rejects %p', (text) => {
    expect(resolveTimeInput(text)).toBeNull();
  });
});

describe('formatTimeEntry', () => {
  it('only masks while the time is incomplete', () => {
    expect(formatTimeEntry('139')).toBe('13:9');
  });

  it('rolls over as soon as the fourth digit lands', () => {
    expect(formatTimeEntry('1399')).toBe('14:39');
    expect(formatTimeEntry('13:05')).toBe('13:05');
  });

  it('leaves an impossible time for the field to flag', () => {
    expect(formatTimeEntry('2399')).toBe('23:99');
  });
});

describe('formatDuration', () => {
  it('drops the part that is zero', () => {
    expect(formatDuration(45)).toBe('45 phút');
    expect(formatDuration(120)).toBe('2 giờ');
    expect(formatDuration(94)).toBe('1 giờ 34 phút');
  });
});

describe('dayPart', () => {
  const at = (hour: number, minute = 0) => new Date(2026, 9, 13, hour, minute);

  it('switches at 05:00, 12:00, 18:00 and 22:00', () => {
    expect([at(4, 59), at(5), at(11, 59), at(12), at(17, 59), at(18), at(21, 59), at(22), at(0)].map(dayPart)).toEqual([
      'night',
      'morning',
      'morning',
      'afternoon',
      'afternoon',
      'evening',
      'evening',
      'night',
      'night',
    ]);
  });
});

describe('monthWeeks', () => {
  it('lays October 2026 out Monday-first with padding on both ends', () => {
    const weeks = monthWeeks(2026, 9);
    expect(weeks).toHaveLength(5);
    // 1 October 2026 is a Thursday.
    expect(weeks[0]).toEqual([null, null, null, '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']);
    expect(weeks[4]).toEqual(['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', null]);
  });

  it('handles a month that starts on Monday and a leap February', () => {
    expect(monthWeeks(2026, 5)[0][0]).toBe('2026-06-01');
    expect(monthWeeks(2028, 1).flat().filter(Boolean)).toHaveLength(29);
  });
});

describe('weekOf', () => {
  it('returns Monday to Sunday around a midweek day', () => {
    expect(weekOf('2026-10-14')).toEqual(['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18']);
  });

  it('keeps Monday first and Sunday last, across a month boundary', () => {
    expect(weekOf('2026-10-12')[0]).toBe('2026-10-12');
    expect(weekOf('2026-10-18')[0]).toBe('2026-10-12');
    expect(weekOf('2026-11-01')).toEqual(['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01']);
  });
});
