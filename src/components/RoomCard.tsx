import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Room, RoomStatus } from '../domain/types';
import { colors, radius, spacing } from '../theme/tokens';
import { AppText } from './AppText';
import { EQUIPMENT_LABEL, ROOM_TYPE_LABEL } from './labels';
import { PillBadge, RoomStatusBadge } from './StatusBadge';

const META_HEIGHT = 76;
const MAX_CARD_WIDTH = 520;

export function getRoomCardWidth(windowWidth: number): number {
  return Math.min(windowWidth, MAX_CARD_WIDTH) - spacing.lg * 2;
}

/** Fixed row height so the FlatList can skip measuring (getItemLayout). */
export function getRoomCardHeight(windowWidth: number): number {
  return getRoomCardWidth(windowWidth) + META_HEIGHT + spacing.lg;
}

interface RoomCardProps {
  room: Room;
  status: RoomStatus;
  width: number;
  onPress: (roomId: string) => void;
}

/** `property-card`: 1:1 photo with floating badges, then a compact meta block. */
export const RoomCard = memo(function RoomCard({ room, status, width, onPress }: RoomCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Phòng ${room.name}, toà ${room.building}, ${room.capacity} chỗ`}
      onPress={() => onPress(room.id)}
      style={[styles.card, { width }]}
    >
      <View style={[styles.photo, { width, height: width }]}>
        <Image source={room.imageUrl} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} recyclingKey={room.id} />
        <RoomStatusBadge status={status} floating style={styles.statusBadge} />
        <PillBadge label={`${room.capacity} chỗ`} floating style={styles.capacityBadge} />
      </View>
      <View style={styles.meta}>
        <View style={styles.titleRow}>
          <AppText variant="titleMd" numberOfLines={1} style={styles.title}>
            {room.name}
          </AppText>
          <Ionicons name="people-outline" size={14} color={colors.ink} />
          <AppText variant="bodySm">{room.capacity}</AppText>
        </View>
        <AppText variant="bodySm" color="muted" numberOfLines={1}>
          Toà {room.building} · Tầng {room.floor} · {ROOM_TYPE_LABEL[room.type]}
        </AppText>
        <AppText variant="bodySm" color="muted" numberOfLines={1}>
          {room.equipment.map((item) => EQUIPMENT_LABEL[item]).join(' · ') || 'Không có thiết bị'}
        </AppText>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: { alignSelf: 'center', marginBottom: spacing.lg },
  photo: { borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.surfaceStrong },
  statusBadge: { position: 'absolute', top: spacing.md, left: spacing.md },
  capacityBadge: { position: 'absolute', top: spacing.md, right: spacing.md },
  meta: { height: META_HEIGHT, paddingTop: spacing.md, gap: spacing.xxs },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  title: { flex: 1 },
});
