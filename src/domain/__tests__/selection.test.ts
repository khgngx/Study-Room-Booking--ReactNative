import { toggleSelection } from '../selection';

const slot = { startMinutes: 780, endMinutes: 900 };
const nextSlot = { startMinutes: 900, endMinutes: 1020 };
const custom = { startMinutes: 795, endMinutes: 860 };

describe('toggleSelection', () => {
  it('picks a free slot and drops it when tapped again', () => {
    const picked = toggleSelection([], slot, 4);
    expect(picked).toEqual({ ok: true, selections: [slot] });
    expect(toggleSelection([slot], slot, 4)).toEqual({ ok: true, selections: [] });
  });

  it('drops a custom time when the slot it sits in is tapped again', () => {
    expect(toggleSelection([custom], slot, 4)).toEqual({ ok: true, selections: [] });
    expect(toggleSelection([custom], custom, 4)).toEqual({ ok: true, selections: [] });
  });

  it('keeps the other picks when one is dropped', () => {
    expect(toggleSelection([custom, nextSlot], slot, 4)).toEqual({ ok: true, selections: [nextSlot] });
  });

  it('refuses a new pick once the limit is reached, but still lets one be dropped', () => {
    expect(toggleSelection([slot], nextSlot, 1)).toEqual({ ok: false, reason: 'limit' });
    expect(toggleSelection([slot], slot, 1)).toEqual({ ok: true, selections: [] });
    expect(toggleSelection([], slot, 0)).toEqual({ ok: false, reason: 'limit' });
  });

  it('treats back-to-back times as separate', () => {
    expect(toggleSelection([slot], nextSlot, 4)).toEqual({ ok: true, selections: [slot, nextSlot] });
  });
});
