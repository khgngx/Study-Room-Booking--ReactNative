import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import type { RoomStatus } from '../domain/types';
import { colors, radius, shadow, spacing } from '../theme/tokens';
import { AppText } from './AppText';
import { ROOM_STATUS_LABEL } from './labels';

const DOT_COLOR: Record<RoomStatus, string> = {
  available: colors.ink,
  occupied: colors.primary,
  maintenance: colors.mutedSoft,
};

interface PillBadgeProps {
  label: string;
  dotColor?: string;
  floating?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** The white rounded pill DESIGN.md calls `guest-favorite-badge`. */
export function PillBadge({ label, dotColor, floating = false, style }: PillBadgeProps) {
  return (
    <View style={[styles.badge, floating ? shadow : styles.outlined, style]}>
      {dotColor ? <View style={[styles.dot, { backgroundColor: dotColor }]} /> : null}
      <AppText variant="badge">{label}</AppText>
    </View>
  );
}

export function RoomStatusBadge({ status, floating, style }: { status: RoomStatus } & Omit<PillBadgeProps, 'label' | 'dotColor'>) {
  return <PillBadge label={ROOM_STATUS_LABEL[status]} dotColor={DOT_COLOR[status]} floating={floating} style={style} />;
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs + spacing.xxs,
    paddingVertical: spacing.xs + spacing.xxs,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    backgroundColor: colors.canvas,
  },
  outlined: { borderWidth: 1, borderColor: colors.hairline },
  dot: { width: 6, height: 6, borderRadius: radius.full },
});
