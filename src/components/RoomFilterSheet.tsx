import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RoomFilter } from '../domain/filter';
import { BUILDINGS, EQUIPMENT } from '../domain/types';
import { themed } from '../theme/themed';
import { colors, radius, spacing } from '../theme/tokens';
import { AppText } from './AppText';
import { Button } from './Button';
import { Chip } from './Chip';
import { EQUIPMENT_ICON, EQUIPMENT_LABEL } from './labels';

const CAPACITY_OPTIONS = [2, 4, 8, 12, 20];

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((value) => value !== item) : [...list, item];
}

interface RoomFilterSheetProps {
  visible: boolean;
  filter: RoomFilter;
  resultCount: number;
  onChange: (filter: RoomFilter) => void;
  onClose: () => void;
}

/** Building, capacity and equipment filters, applied live so the result count updates as chips are tapped. */
export function RoomFilterSheet({ visible, filter, resultCount, onChange, onClose }: RoomFilterSheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable accessibilityLabel="Đóng" style={styles.scrim} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.base }]}>
        <View style={styles.handle} />
        <AppText variant="displayMd" accessibilityRole="header">
          Bộ lọc
        </AppText>
        <ScrollView contentContainerStyle={styles.groups}>
          <Group label="Toà nhà">
            {BUILDINGS.map((building) => (
              <Chip
                key={building}
                label={`Toà ${building}`}
                selected={filter.buildings.includes(building)}
                onPress={() => onChange({ ...filter, buildings: toggle(filter.buildings, building) })}
              />
            ))}
          </Group>
          <Group label="Sức chứa tối thiểu">
            {CAPACITY_OPTIONS.map((capacity) => (
              <Chip
                key={capacity}
                label={capacity === 20 ? '20 chỗ' : `${capacity}+ chỗ`}
                selected={filter.minCapacity === capacity}
                onPress={() => onChange({ ...filter, minCapacity: filter.minCapacity === capacity ? null : capacity })}
              />
            ))}
          </Group>
          <Group label="Thiết bị">
            {EQUIPMENT.map((item) => (
              <Chip
                key={item}
                label={EQUIPMENT_LABEL[item]}
                icon={EQUIPMENT_ICON[item]}
                selected={filter.equipment.includes(item)}
                onPress={() => onChange({ ...filter, equipment: toggle(filter.equipment, item) })}
              />
            ))}
          </Group>
        </ScrollView>
        <View style={styles.footer}>
          <Button
            label="Xoá bộ lọc"
            variant="tertiary"
            onPress={() => onChange({ ...filter, buildings: [], minCapacity: null, equipment: [] })}
          />
          <Button label={`Xem ${resultCount} phòng`} onPress={onClose} style={styles.grow} />
        </View>
      </View>
    </Modal>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <AppText variant="titleSm">{label}</AppText>
      <View style={styles.chips}>{children}</View>
    </View>
  );
}

const styles = themed(() => ({
  scrim: { flex: 1, backgroundColor: colors.scrim },
  sheet: {
    maxHeight: '80%',
    marginTop: -radius.xl,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: colors.canvas,
  },
  handle: {
    alignSelf: 'center',
    width: 32,
    height: 4,
    marginBottom: spacing.lg,
    borderRadius: radius.full,
    backgroundColor: colors.hairline,
  },
  groups: { gap: spacing.lg, paddingVertical: spacing.lg },
  group: { gap: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingTop: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  grow: { flex: 1 },
}));
