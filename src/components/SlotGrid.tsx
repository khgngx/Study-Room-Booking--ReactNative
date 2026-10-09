import { Pressable, StyleSheet, View } from 'react-native';

import type { SlotAvailability } from '../domain/conflict';
import type { Slot } from '../domain/types';
import { colors, radius, spacing } from '../theme/tokens';
import { AppText } from './AppText';

const UNAVAILABLE_LABEL: Record<Exclude<SlotAvailability, 'available'>, string> = {
  maintenance: 'Bảo trì',
  past: 'Đã qua',
  mine: 'Bạn đã đặt',
  booked: 'Đã có người đặt',
  user_overlap: 'Trùng lịch của bạn',
  daily_limit: 'Hết lượt hôm nay',
};

interface SlotGridProps {
  slots: readonly Slot[];
  availability: Record<string, SlotAvailability>;
  selectedId: string | null;
  onSelect: (slot: Slot) => void;
}

export function SlotGrid({ slots, availability, selectedId, onSelect }: SlotGridProps) {
  return (
    <View style={styles.grid}>
      {slots.map((slot) => {
        const state = availability[slot.id];
        const disabled = state !== 'available';
        const selected = slot.id === selectedId && !disabled;
        return (
          <Pressable
            key={slot.id}
            accessibilityRole="button"
            accessibilityState={{ disabled, selected }}
            accessibilityLabel={`${slot.label}, ${disabled ? UNAVAILABLE_LABEL[state] : 'còn trống'}`}
            disabled={disabled}
            onPress={() => onSelect(slot)}
            style={[styles.slot, disabled && styles.slotDisabled, selected && styles.slotSelected]}
          >
            <AppText
              variant="caption"
              color={selected ? 'onDark' : disabled ? 'mutedSoft' : 'ink'}
              style={disabled && styles.strike}
            >
              {slot.label}
            </AppText>
            <AppText variant="captionSm" color={selected ? 'onDark' : disabled ? 'mutedSoft' : 'muted'}>
              {disabled ? UNAVAILABLE_LABEL[state] : selected ? 'Đã chọn' : 'Còn trống'}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  slot: {
    flexGrow: 1,
    flexBasis: '45%',
    gap: spacing.xxs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.canvas,
  },
  slotDisabled: { backgroundColor: colors.surfaceSoft, borderColor: colors.hairlineSoft },
  slotSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  strike: { textDecorationLine: 'line-through' },
});
