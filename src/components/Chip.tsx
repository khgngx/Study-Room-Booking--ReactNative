import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { colors, radius, spacing } from '../theme/tokens';
import { AppText } from './AppText';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  /** Fills green when selected; for on/off toggles rather than a choice among options. */
  toggle?: boolean;
}

export const Chip = memo(function Chip({ label, selected, onPress, icon, disabled = false, toggle = false }: ChipProps) {
  const on = toggle && selected;
  return (
    <Pressable
      accessibilityState={toggle ? { checked: selected, disabled } : { selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      accessibilityRole={toggle ? 'switch' : 'button'}
      style={[styles.chip, selected && (on ? styles.toggledOn : styles.selected), disabled && styles.disabled]}
    >
      {icon ? <Ionicons name={icon} size={16} color={on ? colors.onPrimary : selected ? colors.primaryActive : colors.ink} /> : null}
      <AppText variant="buttonSm" color={on ? 'onPrimary' : selected ? 'primaryActive' : 'ink'}>
        {label}
      </AppText>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + spacing.xxs,
    height: 40,
    paddingHorizontal: spacing.base,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.canvas,
  },
  selected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  toggledOn: { borderColor: colors.successInk, backgroundColor: colors.successInk },
  disabled: { opacity: 0.4 },
});
