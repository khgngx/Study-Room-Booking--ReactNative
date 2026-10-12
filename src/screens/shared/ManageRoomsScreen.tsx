import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { formatLocation, MAINTENANCE_DENIED, ROOM_STATUS_LABEL } from '../../components/labels';
import { EmptyState, Screen, screenStyles } from '../../components/Layout';
import { MaintenanceToggle } from '../../components/MaintenanceToggle';
import { can, getMaintenanceAccess } from '../../domain/permissions';
import { getRoomStatus } from '../../domain/roomStatus';
import type { Room } from '../../domain/types';
import { useNow } from '../../hooks/useNow';
import { useCanAct } from '../../hooks/usePresence';
import type { RoomAdminStackParams } from '../../navigation/types';
import { showMessage } from '../../services/dialog';
import { resolveImage } from '../../services/images';
import { useBookingStore, useCurrentUser } from '../../store/useBookingStore';
import { useRoomStore } from '../../store/useRoomStore';
import { colors, radius, spacing } from '../../theme/tokens';

/**
 * Lab staff switch maintenance here, only for rooms in the buildings assigned to them;
 * facility managers switch any room and can also add, edit and delete rooms.
 */
export function ManageRoomsScreen({ navigation }: NativeStackScreenProps<RoomAdminStackParams, 'ManageRooms'>) {
  const user = useCurrentUser();
  const rooms = useRoomStore((state) => state.rooms);
  const setMaintenance = useRoomStore((state) => state.setMaintenance);
  const bookings = useBookingStore((state) => state.bookings);
  const now = useNow();
  const active = useCanAct();

  const assigned = user?.assignedBuildings;
  const coversAll = user ? can(user.role, 'booking.viewAllAreas') : false;
  const sorted = useMemo(() => {
    const inArea = (room: Room) => coversAll || (assigned ?? []).includes(room.building);
    // The viewer's own rooms come first; the rest stay visible so they know who to ask.
    return [...rooms].sort(
      (a, b) => Number(inArea(b)) - Number(inArea(a)) || a.building.localeCompare(b.building) || a.floor - b.floor || a.code.localeCompare(b.code),
    );
  }, [rooms, assigned, coversAll]);

  if (!user) return null;
  // Role decides which controls exist; area and presence decide whether they respond.
  const canEdit = can(user.role, 'room.crud');
  const canToggle = can(user.role, 'room.setMaintenance');
  const area = coversAll ? 'tất cả toà nhà' : (assigned ?? []).map((building) => `Toà ${building}`).join(', ') || 'chưa được phân công';

  const toggle = (room: Room) => {
    const result = setMaintenance({ id: room.id, underMaintenance: !room.underMaintenance, actor: user, note: room.maintenanceNote });
    if (!result.ok) showMessage(MAINTENANCE_DENIED[result.reason].title, MAINTENANCE_DENIED[result.reason].message);
  };

  return (
    <Screen
      title="Phòng"
      subtitle={`${rooms.length} phòng · Khu phụ trách: ${area}`}
      action={canEdit ? <Button label="Thêm phòng" variant="pill" onPress={() => navigation.navigate('RoomForm', {})} disabled={!active} /> : undefined}
    >
      <FlatList
        data={sorted}
        keyExtractor={(room) => room.id}
        contentContainerStyle={[screenStyles.content, styles.list]}
        ListHeaderComponent={canToggle ? <ToggleLegend /> : null}
        ListEmptyComponent={<EmptyState icon="business-outline" title="Chưa có phòng nào" message="Thêm phòng đầu tiên để sinh viên bắt đầu đặt." />}
        renderItem={({ item: room }) => {
          const access = getMaintenanceAccess(user, room);
          const outOfArea = access === 'out_of_area';
          return (
            <View style={[styles.card, outOfArea && styles.cardLocked]}>
              <Pressable
                accessibilityRole={canEdit ? 'button' : undefined}
                accessibilityLabel={canEdit ? `Sửa phòng ${room.code}` : undefined}
                disabled={!canEdit || !active}
                onPress={() => navigation.navigate('RoomForm', { roomId: room.id })}
                style={styles.info}
              >
                <Image source={resolveImage(room.imageUrl)} style={[styles.thumb, outOfArea && styles.thumbLocked]} contentFit="cover" />
                <View style={styles.text}>
                  <AppText variant="titleMd" color={outOfArea ? 'muted' : 'ink'} numberOfLines={1}>
                    {room.code} · {room.name}
                  </AppText>
                  <AppText variant="bodySm" color="muted" numberOfLines={1}>
                    {formatLocation(room)} · {room.capacity} chỗ
                  </AppText>
                  <AppText variant="bodySm" color="muted" numberOfLines={1}>
                    {ROOM_STATUS_LABEL[getRoomStatus(room, bookings, now)]}
                    {room.maintenanceNote ? ` · ${room.maintenanceNote}` : ''}
                  </AppText>
                </View>
                {canEdit ? <Ionicons name="chevron-forward" size={18} color={colors.mutedSoft} /> : null}
              </Pressable>
              {canToggle ? (
                <MaintenanceToggle roomCode={room.code} value={room.underMaintenance} locked={access !== 'allowed'} onPress={() => toggle(room)} />
              ) : null}
            </View>
          );
        }}
      />
    </Screen>
  );
}

function ToggleLegend() {
  return (
    <View style={styles.legend}>
      <LegendItem label="Đang hoạt động" swatch={styles.swatchOff} />
      <LegendItem label="Đang bảo trì" swatch={styles.swatchOn} />
      <LegendItem label="Ngoài khu phụ trách" swatch={styles.swatchLocked} />
    </View>
  );
}

function LegendItem({ label, swatch }: { label: string; swatch: object }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.swatch, swatch]} />
      <AppText variant="captionSm" color="muted">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.canvas,
  },
  cardLocked: { borderColor: colors.hairlineSoft, backgroundColor: colors.surfaceSoft },
  info: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  thumb: { width: 56, height: 56, borderRadius: radius.sm, backgroundColor: colors.surfaceStrong },
  thumbLocked: { opacity: 0.5 },
  text: { flex: 1, gap: spacing.xxs },
  legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.base, rowGap: spacing.sm, paddingBottom: spacing.xs },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + spacing.xxs },
  swatch: { width: 14, height: 14, borderRadius: radius.xs, borderWidth: 1 },
  swatchOff: { borderColor: colors.success, backgroundColor: colors.successSoft },
  swatchOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  swatchLocked: { borderColor: colors.hairline, backgroundColor: colors.surfaceStrong },
});
