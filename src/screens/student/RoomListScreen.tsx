import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, useWindowDimensions, View, type ListRenderItem } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { EQUIPMENT_ICON, EQUIPMENT_LABEL } from '../../components/labels';
import { EmptyState } from '../../components/Layout';
import { getRoomCardHeight, getRoomCardWidth, RoomCard } from '../../components/RoomCard';
import { SearchBar } from '../../components/SearchBar';
import { EMPTY_FILTER, filterRooms, type RoomFilter } from '../../domain/filter';
import { getRoomStatus } from '../../domain/roomStatus';
import { BUILDINGS, EQUIPMENT, type Room, type RoomStatus } from '../../domain/types';
import { useNow } from '../../hooks/useNow';
import type { ExploreStackParams } from '../../navigation/types';
import { useBookingStore } from '../../store/useBookingStore';
import { useRoomStore } from '../../store/useRoomStore';
import { colors, spacing } from '../../theme/tokens';

const CAPACITY_OPTIONS = [2, 4, 8, 12, 20];
// Fixed so getItemLayout can account for the list header.
const LIST_HEADER_HEIGHT = 48;

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((value) => value !== item) : [...list, item];
}

export function RoomListScreen({ navigation }: NativeStackScreenProps<ExploreStackParams, 'RoomList'>) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const rooms = useRoomStore((state) => state.rooms);
  const bookings = useBookingStore((state) => state.bookings);
  const now = useNow();
  const [filter, setFilter] = useState<RoomFilter>(EMPTY_FILTER);
  // Typing stays instant; the list re-filters at lower priority.
  const deferredFilter = useDeferredValue(filter);

  const visibleRooms = useMemo(() => filterRooms(rooms, deferredFilter), [rooms, deferredFilter]);
  const statusByRoom = useMemo(() => {
    const map: Record<string, RoomStatus> = {};
    for (const room of rooms) map[room.id] = getRoomStatus(room, bookings, now);
    return map;
  }, [rooms, bookings, now]);

  const cardWidth = getRoomCardWidth(width);
  const rowHeight = getRoomCardHeight(width);
  const openRoom = useCallback((roomId: string) => navigation.navigate('RoomDetail', { roomId }), [navigation]);
  const renderItem = useCallback<ListRenderItem<Room>>(
    ({ item }) => <RoomCard room={item} status={statusByRoom[item.id]} width={cardWidth} onPress={openRoom} />,
    [statusByRoom, cardWidth, openRoom],
  );
  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({ length: rowHeight, offset: LIST_HEADER_HEIGHT + rowHeight * index, index }),
    [rowHeight],
  );

  const hasFilter = filter !== EMPTY_FILTER;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.search}>
        <SearchBar
          value={filter.query}
          onChangeText={(query) => setFilter((current) => ({ ...current, query }))}
          placeholder="Tìm phòng, toà nhà…"
        />
      </View>
      <View style={styles.filterBand}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {BUILDINGS.map((building) => (
            <Chip
              key={building}
              label={`Toà ${building}`}
              selected={filter.buildings.includes(building)}
              onPress={() => setFilter((current) => ({ ...current, buildings: toggle(current.buildings, building) }))}
            />
          ))}
          <View style={styles.chipDivider} />
          {CAPACITY_OPTIONS.map((capacity) => (
            <Chip
              key={capacity}
              label={capacity === 20 ? '20 chỗ' : `${capacity}+ chỗ`}
              selected={filter.minCapacity === capacity}
              onPress={() =>
                setFilter((current) => ({ ...current, minCapacity: current.minCapacity === capacity ? null : capacity }))
              }
            />
          ))}
          <View style={styles.chipDivider} />
          {EQUIPMENT.map((item) => (
            <Chip
              key={item}
              label={EQUIPMENT_LABEL[item]}
              icon={EQUIPMENT_ICON[item]}
              selected={filter.equipment.includes(item)}
              onPress={() => setFilter((current) => ({ ...current, equipment: toggle(current.equipment, item) }))}
            />
          ))}
        </ScrollView>
      </View>
      <FlatList
        data={visibleRooms}
        keyExtractor={(room) => room.id}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        initialNumToRender={3}
        maxToRenderPerBatch={4}
        windowSize={7}
        removeClippedSubviews
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <AppText variant="caption" color="muted" style={[styles.count, { width: cardWidth }]}>
            {visibleRooms.length} phòng
          </AppText>
        }
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            title="Không có phòng phù hợp"
            message="Thử bỏ bớt bộ lọc hoặc tìm với từ khoá khác."
            action={hasFilter ? <Button label="Xoá bộ lọc" variant="secondary" onPress={() => setFilter(EMPTY_FILTER)} /> : undefined}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  search: { paddingHorizontal: spacing.lg, paddingBottom: spacing.base },
  filterBand: { borderBottomWidth: 1, borderBottomColor: colors.hairline },
  chips: { alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  chipDivider: { width: 1, height: 24, marginHorizontal: spacing.xs, backgroundColor: colors.hairline },
  list: { paddingBottom: spacing.lg },
  count: { alignSelf: 'center', height: LIST_HEADER_HEIGHT, textAlignVertical: 'center', paddingTop: spacing.base },
});
