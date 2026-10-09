import { generateSlots } from '../slots';
import { policy } from './fixtures';

describe('generateSlots', () => {
  it('produces the four 2-hour slots from the assignment brief', () => {
    expect(generateSlots(policy).map((slot) => slot.label)).toEqual([
      '07:30 – 09:30',
      '09:30 – 11:30',
      '13:00 – 15:00',
      '15:00 – 17:00',
    ]);
  });

  it('drops a remainder that does not fit a whole slot', () => {
    const slots = generateSlots({ ...policy, slotMinutes: 90 });
    expect(slots.map((slot) => slot.label)).toEqual([
      '07:30 – 09:00',
      '09:00 – 10:30',
      '13:00 – 14:30',
      '14:30 – 16:00',
    ]);
  });

  it('returns nothing when there are no opening windows', () => {
    expect(generateSlots({ openingWindows: [], slotMinutes: 120 })).toEqual([]);
  });

  it('rejects a non-positive slot length instead of looping forever', () => {
    expect(() => generateSlots({ ...policy, slotMinutes: 0 })).toThrow('slotMinutes');
  });
});
