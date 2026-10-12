import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, View, type ListRenderItem } from 'react-native';

import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { CalendarButton, DateNavigator } from '../../components/DateNavigator';
import { GREETING, ROOM_TYPE_LABEL } from '../../components/labels';
import { EmptyState, Screen } from '../../components/Layout';
import { ROOM_CARD_ROW_HEIGHT, ROOM_CARD_TIMELINE_INSET, RoomCard } from '../../components/RoomCard';
import { getRoomDayStatus, type RoomDayStatus } from '../../components/roomDayStatus';
import { RoomFilterSheet } from '../../components/RoomFilterSheet';
import { TimelineAxis } from '../../components/RoomTimeline';
import { SearchBar } from '../../components/SearchBar';
import { countAdvancedFilters, EMPTY_FILTER, filterRooms, type RoomFilter } from '../../domain/filter';
import { generateSlots } from '../../domain/slots';
import { BOOKING_HORIZON_DAYS } from '../../domain/conflict';
import { dayPart, formatDateKey, formatMinutes, minutesOfDay, nextDateKeys } from '../../domain/time';
import { getDayRange, getDaySegments, type DaySegments } from '../../domain/timeline';
import { ROOM_TYPES, type Room } from '../../domain/types';
import { useNow } from '../../hooks/useNow';
import type { ExploreStackParams } from '../../navigation/types';
import { useBookingStore } from '../../store/useBookingStore';
import { usePolicyStore } from '../../store/usePolicyStore';
import { useRoomStore } from '../../store/useRoomStore';
import { themed } from '../../theme/themed';
import { colors, radius, spacing } from '../../theme/tokens';

const LIST_TOP_PADDING = spacing.xs;

interface RoomRow extends RoomDayStatus {
  segments: DaySegments;
}

export function RoomListScreen({ navigation }: NativeStackScreenProps<ExploreStackParams, 'RoomList'>) {
  const rooms = useRoomStore((state) => state.rooms);
  const bookings = useBookingStore((state) => state.bookings);
  const policy = usePolicyStore((state) => state.policy);
  const now = useNow();

  const dateKeys = useMemo(() => nextDateKeys(now, BOOKING_HORIZON_DAYS + 1), [now]);
  const [pickedDate, setPickedDate] = useState(dateKeys[0]);
  const dateKey = dateKeys.includes(pickedDate) ? pickedDate : dateKeys[0];
  const isToday = dateKey === dateKeys[0];

  const [filter, setFilter] = useState<RoomFilter>(EMPTY_FILTER);
  const [freeNowOnly, setFreeNowOnly] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  // Typing stays instant; the list re-filters at lower priority.
  const deferredFilter = useDeferredValue(filter);

  const range = useMemo(() => getDayRange(policy), [policy]);
  const slots = useMemo(() => generateSlots(policy), [policy]);

  const rowByRoom = useMemo(() => {
    const map: Record<string, RoomRow> = {};
    for (const room of rooms) {
      map[room.id] = {
        ...getRoomDayStatus({ room, bookings, dateKey, isToday, policy, slots, now }),
        segments: getDaySegments(room, bookings, dateKey, policy),
      };
    }
    return map;
  }, [rooms, bookings, dateKey, isToday, policy, slots, now]);

  const visibleRooms = useMemo(() => {
    const matching = filterRooms(rooms, deferredFilter);
    return freeNowOnly && isToday ? matching.filter((room) => rowByRoom[room.id]?.open) : matching;
  }, [rooms, deferredFilter, freeNowOnly, isToday, rowByRoom]);

  const openCount = rooms.filter((room) => rowByRoom[room.id]?.open).length;
  const summary = isToday
    ? `${openCount} trên ${rooms.length} phòng đang trống lúc ${formatMinutes(minutesOfDay(now))}.`
    : `${openCount} trên ${rooms.length} phòng còn khung giờ trống.`;
  const nowMinutes = isToday ? minutesOfDay(now) : null;
  const advancedCount = countAdvancedFilters(filter);

  const openRoom = useCallback((roomId: string) => navigation.navigate('RoomDetail', { roomId, dateKey }), [navigation, dateKey]);
  const renderItem = useCallback<ListRenderItem<Room>>(
    ({ item }) => {
      const row = rowByRoom[item.id];
      return (
        <RoomCard
          room={item}
          tone={row.tone}
          statusLabel={row.label}
          range={range}
          segments={row.segments}
          nowMinutes={nowMinutes}
          onPress={openRoom}
        />
      );
    },
    [rowByRoom, range, nowMinutes, openRoom],
  );
  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({ length: ROOM_CARD_ROW_HEIGHT, offset: LIST_TOP_PADDING + ROOM_CARD_ROW_HEIGHT * index, index }),
    [],
  );

  const closeSearch = () => {
    setSearchOpen(false);
    setFilter((current) => ({ ...current, query: '' }));
  };
  const resetAll = () => {
    setFilter(EMPTY_FILTER);
    setFreeNowOnly(false);
    setSearchOpen(false);
  };

  return (
    <Screen
      title={GREETING[dayPart(now)]}
      headerAction={<CalendarButton dateKeys={dateKeys} selected={dateKey} onSelect={setPickedDate} />}
    >
      <DateNavigator dateKeys={dateKeys} selected={dateKey} onSelect={setPickedDate} />

      <View style={styles.summaryRow}>
        <View style={styles.summaryText}>
          <AppText variant="titleMd">{isToday ? 'Hôm nay' : formatDateKey(dateKey)}</AppText>
          <AppText variant="bodySm" color="muted">
            {summary}
          </AppText>
        </View>
        <IconButton icon={searchOpen ? 'close' : 'search'} label={searchOpen ? 'Đóng tìm kiếm' : 'Tìm phòng'} onPress={searchOpen ? closeSearch : () => setSearchOpen(true)} />
        <IconButton icon="options-outline" label={`Bộ lọc, đang bật ${advancedCount}`} badge={advancedCount} onPress={() => setSheetOpen(true)} />
      </View>

      {searchOpen ? (
        <View style={styles.search}>
          <SearchBar
            autoFocus
            value={filter.query}
            onChangeText={(query) => setFilter((current) => ({ ...current, query }))}
            placeholder="Tìm theo mã, tên phòng, toà nhà…"
          />
        </View>
      ) : null}

      {/* One scrolling line: wrapping costs three rows on a small phone. The toggle leads so it never scrolls out of reach. */}
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip
            toggle
            label="Trống bây giờ"
            selected={freeNowOnly && isToday}
            disabled={!isToday}
            onPress={() => setFreeNowOnly((current) => !current)}
          />
          <View style={styles.chipDivider} />
          <Chip label="Tất cả" selected={filter.type === null} onPress={() => setFilter((current) => ({ ...current, type: null }))} />
          {ROOM_TYPES.map((type) => (
            <Chip
              key={type}
              label={ROOM_TYPE_LABEL[type]}
              selected={filter.type === type}
              onPress={() => setFilter((current) => ({ ...current, type }))}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.axis}>
        <TimelineAxis range={range} />
      </View>

      <FlatList
        data={visibleRooms}
        keyExtractor={(room) => room.id}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={7}
        removeClippedSubviews
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            title="Không có phòng phù hợp"
            message="Thử bỏ bớt bộ lọc, tắt “Trống bây giờ” hoặc chọn ngày khác."
            action={<Button label="Xoá bộ lọc" variant="secondary" onPress={resetAll} />}
          />
        }
      />

      <RoomFilterSheet
        visible={sheetOpen}
        filter={filter}
        resultCount={visibleRooms.length}
        onChange={setFilter}
        onClose={() => setSheetOpen(false)}
      />
    </Screen>
  );
}

interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  badge?: number;
  onPress: () => void;
}

/** `icon-button-outline` with an optional count badge. */
function IconButton({ icon, label, badge = 0, onPress }: IconButtonProps) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} hitSlop={spacing.xs} onPress={onPress} style={[styles.iconButton, badge > 0 && styles.iconButtonActive]}>
      <Ionicons name={icon} size={18} color={colors.ink} />
      {badge > 0 ? (
        <View style={styles.badge}>
          <AppText variant="badge" color="onDark">
            {badge}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = themed(() => ({
  summaryText: { flex: 1, gap: spacing.xxs },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.base,
    paddingBottom: spacing.md,
  },
  search: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  chips: { alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.base },
  chipDivider: { width: 1, height: 24, marginHorizontal: spacing.xs, backgroundColor: colors.hairline },
  axis: { paddingHorizontal: ROOM_CARD_TIMELINE_INSET },
  list: { paddingTop: LIST_TOP_PADDING, paddingBottom: spacing.lg },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.canvas,
  },
  iconButtonActive: { borderColor: colors.ink },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: colors.ink,
  },
}));
