import { formatRange, parseTime } from './time';
import type { Policy, Slot } from './types';

/** Splits each opening window into back-to-back slots; a trailing remainder is dropped. */
export function generateSlots(policy: Pick<Policy, 'openingWindows' | 'slotMinutes'>): Slot[] {
  if (policy.slotMinutes <= 0) throw new Error(`slotMinutes must be positive, got ${policy.slotMinutes}`);
  const slots: Slot[] = [];
  for (const window of policy.openingWindows) {
    const windowEnd = parseTime(window.end);
    for (
      let start = parseTime(window.start);
      start + policy.slotMinutes <= windowEnd;
      start += policy.slotMinutes
    ) {
      const end = start + policy.slotMinutes;
      slots.push({ id: `${start}-${end}`, startMinutes: start, endMinutes: end, label: formatRange(start, end) });
    }
  }
  return slots;
}
