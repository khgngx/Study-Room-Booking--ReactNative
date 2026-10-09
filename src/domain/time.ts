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
