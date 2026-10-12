const pad = (value: number) => String(value).padStart(2, '0');

/** Local-time calendar key, e.g. "2026-10-10". */
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseTime(time: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) throw new Error(`Invalid time "${time}", expected HH:mm`);
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 24 || minutes > 59) throw new Error(`Invalid time "${time}", out of range`);
  return hours * 60 + minutes;
}

const MINUTES_PER_DAY = 24 * 60;

/** Keeps a time being typed in the shape HH:mm: digits only, with the colon added after the hour. */
export function maskTimeInput(text: string): string {
  const digits = text.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
}

/**
 * Reads masked entry as minutes from midnight. Minutes past 59 roll into the hour, so "13:99" is 14:39.
 * A lone hour ("13") means on the hour. Null when the result is not a time of day.
 */
export function resolveTimeInput(text: string): number | null {
  const digits = maskTimeInput(text).replace(':', '');
  if (digits.length === 0) return null;
  const total = Number(digits.slice(0, 2)) * 60 + Number(digits.slice(2) || 0);
  return total < MINUTES_PER_DAY ? total : null;
}

/** What a time field shows after a keystroke: masked while typing, rolled over once all four digits are in. */
export function formatTimeEntry(text: string): string {
  const masked = maskTimeInput(text);
  if (masked.length < 5) return masked;
  const minutes = resolveTimeInput(masked);
  return minutes === null ? masked : formatMinutes(minutes);
}

/** "1 giờ 34 phút", "2 giờ", "45 phút". */
export function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} phút`;
  return minutes === 0 ? `${hours} giờ` : `${hours} giờ ${minutes} phút`;
}

export function formatMinutes(totalMinutes: number): string {
  return `${pad(Math.floor(totalMinutes / 60))}:${pad(totalMinutes % 60)}`;
}

export function formatRange(startMinutes: number, endMinutes: number): string {
  return `${formatMinutes(startMinutes)} – ${formatMinutes(endMinutes)}`;
}

export function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function dateFromKey(dateKey: string, minutes = 0): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day, Math.floor(minutes / 60), minutes % 60, 0, 0);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function nextDateKeys(now: Date, count: number): string[] {
  return Array.from({ length: count }, (_, index) => toDateKey(addDays(now, index)));
}

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export function weekdayLabel(dateKey: string): string {
  return WEEKDAYS[dateFromKey(dateKey).getDay()];
}

export function formatDateKey(dateKey: string): string {
  const date = dateFromKey(dateKey);
  return `${weekdayLabel(dateKey)}, ${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
}
