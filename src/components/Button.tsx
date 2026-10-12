import { Pressable, type StyleProp, type ViewStyle } from 'react-native';

import { themed } from '../theme/themed';
import { colors, radius, spacing } from '../theme/tokens';
import { AppText } from './AppText';

type Variant = 'primary' | 'secondary' | 'tertiary' | 'pill';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({ label, onPress, variant = 'primary', disabled = false, style }: ButtonProps) {
  const filled = variant === 'primary' || variant === 'pill';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={variant === 'tertiary' ? spacing.sm : undefined}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        filled && pressed && styles.filledPressed,
        filled && disabled && styles.filledDisabled,
        !filled && pressed && styles.plainPressed,
        !filled && disabled && styles.plainDisabled,
        style,
      ]}
    >
      <AppText
        variant={variant === 'pill' ? 'buttonSm' : 'buttonMd'}
        color={filled ? 'onPrimary' : 'ink'}
        style={variant === 'tertiary' && styles.underline}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = themed(() => ({
  base: { alignItems: 'center', justifyContent: 'center' },
  primary: { height: 48, paddingHorizontal: spacing.lg, borderRadius: radius.sm, backgroundColor: colors.primary },
  secondary: {
    height: 48,
    paddingHorizontal: spacing.lg - 1,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.ink,
    backgroundColor: colors.canvas,
  },
  tertiary: { minHeight: 32 },
  pill: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: radius.full, backgroundColor: colors.primary },
  filledPressed: { backgroundColor: colors.primaryActive },
  filledDisabled: { backgroundColor: colors.primaryDisabled },
  plainPressed: { backgroundColor: colors.surfaceSoft },
  plainDisabled: { opacity: 0.4 },
  underline: { textDecorationLine: 'underline' },
}));
