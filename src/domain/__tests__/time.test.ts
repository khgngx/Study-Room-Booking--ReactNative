import { formatDuration, formatTimeEntry, maskTimeInput, resolveTimeInput } from '../time';

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
