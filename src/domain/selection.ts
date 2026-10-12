import { overlaps, type MinuteRange } from './conflict';

export type ToggleOutcome = { ok: true; selections: MinuteRange[] } | { ok: false; reason: 'limit' };

/**
 * A tap on a stretch of the schedule. It picks the time, or, when something already picked sits there
 * (the same slot, or a custom time inside it), gives that up instead of refusing the tap.
 */
export function toggleSelection(current: readonly MinuteRange[], range: MinuteRange, limit: number): ToggleOutcome {
  const kept = current.filter((picked) => !overlaps(picked, range));
  if (kept.length < current.length) return { ok: true, selections: kept };
  if (current.length >= limit) return { ok: false, reason: 'limit' };
  return { ok: true, selections: [...current, range] };
}
