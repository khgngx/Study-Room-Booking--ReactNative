import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../../components/AppText';
import { Divider, Screen, screenStyles } from '../../components/Layout';
import { generateSlots } from '../../domain/slots';
import { computeStats } from '../../domain/stats';
import { addDays, dateFromKey, toDateKey } from '../../domain/time';
import { useNow } from '../../hooks/useNow';
import type { DashboardStackParams } from '../../navigation/types';
import { useBookingStore } from '../../store/useBookingStore';
import { usePolicyStore } from '../../store/usePolicyStore';
import { useRoomStore } from '../../store/useRoomStore';
import { colors, radius, spacing } from '../../theme/tokens';

const RANGE_DAYS = 7;
const percent = (ratio: number) => `${Math.round(ratio * 100)}%`;

export function DashboardScreen({ navigation }: NativeStackScreenProps<DashboardStackParams, 'Dashboard'>) {
  const bookings = useBookingStore((state) => state.bookings);
  const rooms = useRoomStore((state) => state.rooms);
  const policy = usePolicyStore((state) => state.policy);
  const today = toDateKey(useNow());

  const stats = useMemo(() => {
    const end = dateFromKey(today);
    const dateKeys = Array.from({ length: RANGE_DAYS }, (_, index) => toDateKey(addDays(end, -index)));
    const bookableMinutesPerDay = generateSlots(policy).reduce((sum, slot) => sum + slot.endMinutes - slot.startMinutes, 0);
    return computeStats({ bookings, rooms, dateKeys, bookableMinutesPerDay });
  }, [bookings, rooms, policy, today]);

  const columns = [
    { label: 'Lượt đặt', value: String(stats.totalBookings) },
    { label: 'Check-in', value: String(stats.checkedIn) },
    { label: 'Tỷ lệ vắng', value: percent(stats.noShowRate) },
    { label: 'Đã huỷ', value: String(stats.cancelled) },
  ];
  const topCount = stats.topRooms[0]?.count ?? 0;

  return (
    <Screen title="Tổng quan" subtitle={`${RANGE_DAYS} ngày gần nhất`}>
      <ScrollView contentContainerStyle={screenStyles.content}>
        <View style={styles.hero}>
          <AppText variant="ratingDisplay">{percent(stats.utilization)}</AppText>
          <AppText variant="titleMd">Tỷ lệ sử dụng phòng</AppText>
          <AppText variant="bodySm" color="muted" style={styles.center}>
            Thời lượng đã đặt trên tổng thời lượng mở cửa của {rooms.length} phòng.
          </AppText>
        </View>
        <View style={styles.columns}>
          {columns.map((column, index) => (
            <View key={column.label} style={[styles.column, index > 0 && styles.columnDivider]}>
              <AppText variant="displaySm">{column.value}</AppText>
              <AppText variant="captionSm" color="muted">
                {column.label}
              </AppText>
            </View>
          ))}
        </View>
        <Divider />
        <View style={screenStyles.section}>
          <AppText variant="displayMd">Phòng được đặt nhiều nhất</AppText>
          {stats.topRooms.length === 0 ? (
            <AppText color="muted">Chưa có lượt đặt nào trong khoảng thời gian này.</AppText>
          ) : (
            stats.topRooms.map(({ room, count }) => (
              <View key={room.id} style={styles.rank}>
                <View style={styles.rankHeader}>
                  <AppText variant="titleSm">{room.name}</AppText>
                  <AppText variant="bodySm" color="muted">
                    {count} lượt
                  </AppText>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${(count / topCount) * 100}%` }]} />
                </View>
              </View>
            ))
          )}
        </View>
        <Divider />
        <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Policy')} style={styles.link}>
          <View style={styles.linkText}>
            <AppText variant="titleMd">Chính sách sử dụng</AppText>
            <AppText variant="bodySm" color="muted">
              Giờ mở cửa, độ dài khung giờ, giới hạn lượt đặt
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.ink} />
        </Pressable>
        <Divider />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.lg },
  center: { textAlign: 'center' },
  columns: { flexDirection: 'row', paddingBottom: spacing.lg },
  column: { flex: 1, alignItems: 'center', gap: spacing.xs },
  columnDivider: { borderLeftWidth: 1, borderLeftColor: colors.hairline },
  rank: { gap: spacing.sm },
  rankHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  track: { height: 8, borderRadius: radius.full, backgroundColor: colors.surfaceStrong },
  fill: { height: 8, borderRadius: radius.full, backgroundColor: colors.ink },
  link: { flexDirection: 'row', alignItems: 'center', gap: spacing.base, paddingVertical: spacing.lg },
  linkText: { flex: 1, gap: spacing.xxs },
});
