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
}

export const Chip = memo(function Chip({ label, selected, onPress, icon, disabled = false }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.chip, selected && styles.selected, disabled && styles.disabled]}
    >
      {icon ? <Ionicons name={icon} size={16} color={colors.ink} /> : null}
      <AppText variant="buttonSm">{label}</AppText>
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
  selected: { borderColor: colors.ink, backgroundColor: colors.surfaceSoft },
  disabled: { opacity: 0.4 },
});
