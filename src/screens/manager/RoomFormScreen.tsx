import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { EQUIPMENT_ICON, EQUIPMENT_LABEL, ROOM_TYPE_LABEL } from '../../components/labels';
import { TextField } from '../../components/TextField';
import { placeholderImage } from '../../data/seed';
import { BUILDINGS, EQUIPMENT, ROOM_TYPES, type Building, type Equipment, type RoomType } from '../../domain/types';
import type { RoomAdminStackParams } from '../../navigation/types';
import { confirmDestructive } from '../../services/dialog';
import { useBookingStore } from '../../store/useBookingStore';
import { useRoomStore } from '../../store/useRoomStore';
import { colors, spacing } from '../../theme/tokens';

const CAPACITY_RANGE = { min: 2, max: 20 };
const FLOOR_RANGE = { min: 1, max: 20 };

function parseIntInRange(text: string, range: { min: number; max: number }): number | null {
  if (!/^\d+$/.test(text.trim())) return null;
  const value = Number(text);
  return value >= range.min && value <= range.max ? value : null;
}

export function RoomFormScreen({ navigation, route }: NativeStackScreenProps<RoomAdminStackParams, 'RoomForm'>) {
  const rooms = useRoomStore((state) => state.rooms);
  const existing = rooms.find((room) => room.id === route.params.roomId);
  const { addRoom, updateRoom, deleteRoom } = useRoomStore.getState();
  const cancelUpcomingForRoom = useBookingStore((state) => state.cancelUpcomingForRoom);

  const [code, setCode] = useState(existing?.code ?? '');
  const [name, setName] = useState(existing?.name ?? '');
  const [type, setType] = useState<RoomType>(existing?.type ?? 'study');
  const [building, setBuilding] = useState<Building>(existing?.building ?? 'A');
  const [floor, setFloor] = useState(String(existing?.floor ?? 1));
  const [capacity, setCapacity] = useState(String(existing?.capacity ?? 4));
  const [description, setDescription] = useState(existing?.description ?? '');
  const [equipment, setEquipment] = useState<Equipment[]>(existing?.equipment ?? []);
  const [note, setNote] = useState(existing?.maintenanceNote ?? '');
  const [errors, setErrors] = useState<{ code?: string; name?: string; floor?: string; capacity?: string }>({});

  const save = () => {
    const parsedFloor = parseIntInRange(floor, FLOOR_RANGE);
    const parsedCapacity = parseIntInRange(capacity, CAPACITY_RANGE);
    const next: typeof errors = {};
    const trimmedCode = code.trim().toUpperCase();
    if (trimmedCode.length === 0) next.code = 'Vui lòng nhập mã phòng.';
    else if (rooms.some((room) => room.code === trimmedCode && room.id !== existing?.id)) next.code = 'Mã phòng này đã tồn tại.';
    if (name.trim().length === 0) next.name = 'Vui lòng nhập tên phòng.';
    if (parsedFloor === null) next.floor = `Tầng phải là số từ ${FLOOR_RANGE.min} đến ${FLOOR_RANGE.max}.`;
    if (parsedCapacity === null) next.capacity = `Sức chứa phải là số từ ${CAPACITY_RANGE.min} đến ${CAPACITY_RANGE.max}.`;
    setErrors(next);
    if (parsedFloor === null || parsedCapacity === null || next.name || next.code) return;

    const fields = { code: trimmedCode, name: name.trim(), type, building, floor: parsedFloor, capacity: parsedCapacity, equipment, description: description.trim() || undefined };
    if (existing) {
      updateRoom(existing.id, { ...fields, maintenanceNote: existing.underMaintenance ? note.trim() || undefined : undefined });
    } else {
      addRoom({ ...fields, imageUrl: placeholderImage(fields.code), underMaintenance: false });
    }
    navigation.goBack();
  };

  const confirmDelete = () => {
    if (!existing) return;
    confirmDestructive({
      title: `Xoá phòng ${existing.code}?`,
      message: 'Các lượt đặt sắp tới của phòng này sẽ bị huỷ. Không thể hoàn tác.',
      confirmLabel: 'Xoá phòng',
      cancelLabel: 'Giữ lại',
      onConfirm: () => {
        cancelUpcomingForRoom(existing.id);
        deleteRoom(existing.id);
        navigation.goBack();
      },
    });
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <TextField label="Mã phòng" value={code} onChangeText={setCode} placeholder="VD: A-302" autoCapitalize="characters" autoCorrect={false} error={errors.code} />
        <TextField label="Tên phòng" value={name} onChangeText={setName} placeholder="VD: Lab IoT và hệ thống nhúng" error={errors.name} />
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
        <TextField
          label="Mô tả"
          value={description}
          onChangeText={setDescription}
          placeholder="VD: Bàn tròn 6 chỗ, hợp họp nhóm đồ án"
          multiline
          style={styles.multiline}
        />
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
  multiline: { height: 96, paddingVertical: spacing.md, textAlignVertical: 'top' },
});
