import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, shadow, spacing } from '../theme/tokens';
import { AppText } from './AppText';
import { USE_NATIVE_DRIVER } from '../theme/motion';

const TRACK_WIDTH = 46;
const TRACK_HEIGHT = 26;
const THUMB_SIZE = 20;
const THUMB_INSET = (TRACK_HEIGHT - THUMB_SIZE) / 2;
const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE - THUMB_INSET * 2;

interface MaintenanceToggleProps {
  roomCode: string;
  value: boolean;
  /** The viewer may not switch this room: the cell goes grey and a press only explains why. */
  locked: boolean;
  onPress: () => void;
}

/**
 * The maintenance cell of a room row. Soft green while the room is in service, soft red once
 * maintenance is on, grey when the room is outside the viewer's area.
 */
export function MaintenanceToggle({ roomCode, value, locked, onPress }: MaintenanceToggleProps) {
  // Not `useAnimatedValue`: react-native-web does not export it.
  const [position] = useState(() => new Animated.Value(value ? 1 : 0));
  useEffect(() => {
    Animated.timing(position, { toValue: value ? 1 : 0, duration: 160, useNativeDriver: USE_NATIVE_DRIVER }).start();
  }, [position, value]);

  const tone = locked ? 'locked' : value ? 'on' : 'off';
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={`Bảo trì phòng ${roomCode}`}
      accessibilityState={{ checked: value, disabled: locked }}
      // react-native-web ignores accessibilityState; the ARIA prop reaches both platforms.
      aria-checked={value}
      accessibilityHint={locked ? 'Bạn không được phân quyền phòng này' : undefined}
      onPress={onPress}
      style={({ pressed }) => [styles.cell, styles[tone], pressed && !locked && styles.pressed]}
    >
      <View style={styles.labelRow}>
        {locked ? <Ionicons name="lock-closed" size={12} color={colors.mutedSoft} /> : null}
        <AppText variant="captionSm" color={locked ? 'mutedSoft' : value ? 'primaryActive' : 'successInk'}>
          Bảo trì
        </AppText>
      </View>
      <View style={[styles.track, styles[`${tone}Track`]]}>
        <Animated.View
          style={[styles.thumb, shadow, { transform: [{ translateX: position.interpolate({ inputRange: [0, 1], outputRange: [0, THUMB_TRAVEL] }) }] }]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: {
    alignItems: 'center',
    gap: spacing.xs + spacing.xxs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  pressed: { opacity: 0.7 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  off: { borderColor: colors.success, backgroundColor: colors.successSoft },
  on: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  locked: { borderColor: colors.hairline, backgroundColor: colors.surfaceStrong },
  track: { width: TRACK_WIDTH, height: TRACK_HEIGHT, padding: THUMB_INSET, borderRadius: radius.full },
  offTrack: { backgroundColor: colors.success },
  onTrack: { backgroundColor: colors.primary },
  lockedTrack: { backgroundColor: colors.borderStrong },
  thumb: { width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: radius.full, backgroundColor: colors.canvas },
});
