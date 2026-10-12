import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import type { DaySegments, TimeRange } from '../domain/timeline';
import type { Room, RoomStatus } from '../domain/types';
import { themed } from '../theme/themed';
import { colors, radius, spacing, type ColorToken } from '../theme/tokens';
import { AppText } from './AppText';
import { formatLocation } from './labels';
import { RoomCodePlate } from './RoomCodePlate';
import { RoomTimeline } from './RoomTimeline';

const CARD_HEIGHT = 144;
/** Fixed row height (card plus the gap under it) so the FlatList can skip measuring (getItemLayout). */
export const ROOM_CARD_ROW_HEIGHT = CARD_HEIGHT + spacing.md;
/** Distance from the screen edge to the timeline bar, so the axis above can line up with it. */
export const ROOM_CARD_TIMELINE_INSET = spacing.lg + spacing.base + 1;

/** Text colour per tone; darker than the dot so small labels stay readable on white. */
export const ROOM_TONE_COLOR: Record<RoomStatus, ColorToken> = {
  available: 'successInk',
  occupied: 'primaryActive',
  maintenance: 'muted',
};

export const ROOM_TONE_DOT: Record<RoomStatus, ColorToken> = {
  available: 'success',
  occupied: 'primary',
  maintenance: 'mutedSoft',
};

interface RoomCardProps {
  room: Room;
  /** Drives the status colour: free, taken, or out of service for the day being viewed. */
  tone: RoomStatus;
  statusLabel: string;
  range: TimeRange;
  segments: DaySegments;
  nowMinutes: number | null;
  onPress: (roomId: string) => void;
}

/** One card of the room list: door code and identity on top, availability and the day's timeline below. */
export const RoomCard = memo(function RoomCard({ room, tone, statusLabel, range, segments, nowMinutes, onPress }: RoomCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${room.code}, ${room.name}, ${formatLocation(room)}, ${room.capacity} chỗ, ${statusLabel}`}
      onPress={() => onPress(room.id)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.top}>
        <RoomCodePlate code={room.code} />
        <View style={styles.text}>
          <AppText variant="titleMd" numberOfLines={1}>
            {room.name}
          </AppText>
          <View style={styles.meta}>
            <AppText variant="bodySm" color="muted" numberOfLines={1} style={styles.shrink}>
              {formatLocation(room)}
            </AppText>
            <Ionicons name="people-outline" size={14} color={colors.muted} />
            <AppText variant="bodySm" color="muted">
              {room.capacity}
            </AppText>
          </View>
        </View>
      </View>
      <View style={styles.statusRow}>
        <View style={[styles.dot, { backgroundColor: colors[ROOM_TONE_DOT[tone]] }]} />
        <AppText variant="caption" color={ROOM_TONE_COLOR[tone]} numberOfLines={1} style={styles.shrink}>
          {statusLabel}
        </AppText>
      </View>
      <RoomTimeline range={range} segments={segments} nowMinutes={nowMinutes} />
    </Pressable>
  );
});

const styles = themed(() => ({
  card: {
    height: CARD_HEIGHT,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.base,
    justifyContent: 'space-between',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.canvas,
  },
  pressed: { backgroundColor: colors.surfaceSoft },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  text: { flex: 1, gap: spacing.xxs },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  shrink: { flexShrink: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: radius.full },
}));
