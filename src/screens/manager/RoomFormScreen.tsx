import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { EQUIPMENT_ICON, EQUIPMENT_LABEL, ROOM_TYPE_LABEL } from '../../components/labels';
import { TextField } from '../../components/TextField';
import { placeholderImage } from '../../data/seed';
import { BUILDINGS, EQUIPMENT, type Building, type Equipment, type RoomType } from '../../domain/types';
import type { RoomAdminStackParams } from '../../navigation/types';
import { useBookingStore } from '../../store/useBookingStore';
import { useRoomStore } from '../../store/useRoomStore';
import { colors, spacing } from '../../theme/tokens';

const ROOM_TYPES: RoomType[] = ['study', 'lab'];
const CAPACITY_RANGE = { min: 2, max: 20 };
const FLOOR_RANGE = { min: 1, max: 20 };

function parseIntInRange(text: string, range: { min: number; max: number }): number | null {
  if (!/^\d+$/.test(text.trim())) return null;
  const value = Number(text);
  return value >= range.min && value <= range.max ? value : null;
}

export function RoomFormScreen({ navigation, route }: NativeStackScreenProps<RoomAdminStackParams, 'RoomForm'>) {
  const existing = useRoomStore((state) => state.rooms.find((room) => room.id === route.params.roomId));
  const { addRoom, updateRoom, deleteRoom } = useRoomStore.getState();
  const cancelUpcomingForRoom = useBookingStore((state) => state.cancelUpcomingForRoom);

  const [name, setName] = useState(existing?.name ?? '');
  const [type, setType] = useState<RoomType>(existing?.type ?? 'study');
  const [building, setBuilding] = useState<Building>(existing?.building ?? 'A');
  const [floor, setFloor] = useState(String(existing?.floor ?? 1));
  const [capacity, setCapacity] = useState(String(existing?.capacity ?? 4));
  const [equipment, setEquipment] = useState<Equipment[]>(existing?.equipment ?? []);
  const [note, setNote] = useState(existing?.maintenanceNote ?? '');
  const [errors, setErrors] = useState<{ name?: string; floor?: string; capacity?: string }>({});

  const save = () => {
    const parsedFloor = parseIntInRange(floor, FLOOR_RANGE);
    const parsedCapacity = parseIntInRange(capacity, CAPACITY_RANGE);
    const next: typeof errors = {};
    if (name.trim().length === 0) next.name = 'Vui lòng nhập tên phòng.';
    if (parsedFloor === null) next.floor = `Tầng phải là số từ ${FLOOR_RANGE.min} đến ${FLOOR_RANGE.max}.`;
    if (parsedCapacity === null) next.capacity = `Sức chứa phải là số từ ${CAPACITY_RANGE.min} đến ${CAPACITY_RANGE.max}.`;
    setErrors(next);
    if (parsedFloor === null || parsedCapacity === null || next.name) return;

    const fields = { name: name.trim(), type, building, floor: parsedFloor, capacity: parsedCapacity, equipment };
    if (existing) {
      updateRoom(existing.id, { ...fields, maintenanceNote: existing.underMaintenance ? note.trim() || undefined : undefined });
    } else {
      addRoom({ ...fields, imageUrl: placeholderImage(fields.name), underMaintenance: false });
    }
    navigation.goBack();
  };

  const confirmDelete = () => {
    if (!existing) return;
    Alert.alert(`Xoá phòng ${existing.name}?`, 'Các lượt đặt sắp tới của phòng này sẽ bị huỷ. Không thể hoàn tác.', [
      { text: 'Giữ lại', style: 'cancel' },
      {
        text: 'Xoá phòng',
        style: 'destructive',
        onPress: () => {
          cancelUpcomingForRoom(existing.id);
          deleteRoom(existing.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <TextField label="Tên phòng" value={name} onChangeText={setName} placeholder="VD: A101" error={errors.name} />
        <Group label="Loại phòng">
          {ROOM_TYPES.map((item) => (
            <Chip key={item} label={ROOM_TYPE_LABEL[item]} selected={type === item} onPress={() => setType(item)} />
          ))}
        </Group>
        <Group label="Toà nhà">
          {BUILDINGS.map((item) => (
            <Chip key={item} label={`Toà ${item}`} selected={building === item} onPress={() => setBuilding(item)} />
          ))}
        </Group>
        <View style={styles.pair}>
          <View style={styles.grow}>
            <TextField label="Tầng" value={floor} onChangeText={setFloor} placeholder="1" keyboardType="number-pad" error={errors.floor} />
          </View>
          <View style={styles.grow}>
            <TextField label="Sức chứa" value={capacity} onChangeText={setCapacity} placeholder="4" keyboardType="number-pad" error={errors.capacity} />
          </View>
        </View>
        <Group label="Thiết bị">
          {EQUIPMENT.map((item) => (
            <Chip
              key={item}
              label={EQUIPMENT_LABEL[item]}
              icon={EQUIPMENT_ICON[item]}
              selected={equipment.includes(item)}
              onPress={() =>
                setEquipment((current) => (current.includes(item) ? current.filter((value) => value !== item) : [...current, item]))
              }
            />
          ))}
        </Group>
        {existing?.underMaintenance ? (
          <TextField label="Ghi chú bảo trì" value={note} onChangeText={setNote} placeholder="VD: Đang sửa điều hoà" />
        ) : null}
        <Button label={existing ? 'Lưu thay đổi' : 'Thêm phòng'} onPress={save} />
        {existing ? <Button label="Xoá phòng" variant="tertiary" onPress={confirmDelete} /> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <AppText variant="caption" color="muted">
        {label}
      </AppText>
      <View style={styles.chips}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.lg, gap: spacing.lg },
  group: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pair: { flexDirection: 'row', gap: spacing.base },
  grow: { flex: 1 },
});
