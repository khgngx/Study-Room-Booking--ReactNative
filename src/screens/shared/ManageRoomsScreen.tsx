import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Switch, View } from 'react-native';

import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { formatLocation, ROOM_STATUS_LABEL } from '../../components/labels';
import { EmptyState, Screen, screenStyles } from '../../components/Layout';
import { can } from '../../domain/permissions';
import { getRoomStatus } from '../../domain/roomStatus';
import { useNow } from '../../hooks/useNow';
import type { RoomAdminStackParams } from '../../navigation/types';
import { useCanAct } from '../../hooks/usePresence';
import { useBookingStore, useCurrentUser } from '../../store/useBookingStore';
import { useRoomStore } from '../../store/useRoomStore';
import { colors, radius, spacing } from '../../theme/tokens';

/** Lab staff toggle maintenance here; facility managers can also add, edit and delete rooms. */
export function ManageRoomsScreen({ navigation }: NativeStackScreenProps<RoomAdminStackParams, 'ManageRooms'>) {
  const user = useCurrentUser();
  const rooms = useRoomStore((state) => state.rooms);
  const setMaintenance = useRoomStore((state) => state.setMaintenance);
  const bookings = useBookingStore((state) => state.bookings);
  const now = useNow();
  const active = useCanAct();
  const sorted = useMemo(() => [...rooms].sort((a, b) => a.building.localeCompare(b.building) || a.floor - b.floor || a.code.localeCompare(b.code)), [rooms]);

  if (!user) return null;
  // Role decides which controls exist; presence decides whether they respond.
  const canEdit = can(user.role, 'room.crud');
  const canToggle = can(user.role, 'room.setMaintenance');

  return (
    <Screen
      title="Phòng"
      subtitle={`${rooms.length} phòng`}
      action={canEdit ? <Button label="Thêm phòng" variant="pill" onPress={() => navigation.navigate('RoomForm', {})} disabled={!active} /> : undefined}
    >
      <FlatList
        data={sorted}
        keyExtractor={(room) => room.id}
        contentContainerStyle={screenStyles.content}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<EmptyState icon="business-outline" title="Chưa có phòng nào" message="Thêm phòng đầu tiên để sinh viên bắt đầu đặt." />}
        renderItem={({ item: room }) => (
          <View style={styles.row}>
            <Pressable
              accessibilityRole={canEdit ? 'button' : undefined}
              accessibilityLabel={canEdit ? `Sửa phòng ${room.code}` : undefined}
              disabled={!canEdit || !active}
              onPress={() => navigation.navigate('RoomForm', { roomId: room.id })}
              style={styles.info}
            >
              <Image source={room.imageUrl} style={styles.thumb} contentFit="cover" />
              <View style={styles.text}>
                <AppText variant="titleMd" numberOfLines={1}>
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
            </Pressable>
            {canToggle ? (
              <View style={styles.toggle}>
                <AppText variant="captionSm" color="muted">
                  Bảo trì
                </AppText>
                <Switch
                  accessibilityLabel={`Bảo trì phòng ${room.code}`}
                  value={room.underMaintenance}
                  disabled={!active}
                  onValueChange={(value) => setMaintenance(room.id, value, room.maintenanceNote)}
                  trackColor={{ true: colors.ink, false: colors.hairline }}
                  thumbColor={colors.canvas}
                  ios_backgroundColor={colors.hairline}
                />
              </View>
            ) : null}
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  separator: { height: 1, backgroundColor: colors.hairlineSoft },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  info: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  thumb: { width: 64, height: 64, borderRadius: radius.sm, backgroundColor: colors.surfaceStrong },
  text: { flex: 1, gap: spacing.xxs },
  toggle: { alignItems: 'center', gap: spacing.xs },
});
