import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { BOOKING_STATUS_LABEL } from '../../components/labels';
import { EmptyState, Screen, screenStyles } from '../../components/Layout';
import { QRPassModal } from '../../components/QRPassModal';
import { PillBadge } from '../../components/StatusBadge';
import { dateFromKey, formatDateKey, formatRange } from '../../domain/time';
import type { Booking } from '../../domain/types';
import { useNow } from '../../hooks/useNow';
import { useBookingStore } from '../../store/useBookingStore';
import { useRoomStore } from '../../store/useRoomStore';
import { colors, radius, spacing } from '../../theme/tokens';

type Tab = 'upcoming' | 'history';
const TABS: { key: Tab; label: string }[] = [
  { key: 'upcoming', label: 'Sắp tới' },
  { key: 'history', label: 'Lịch sử' },
];

export function MyBookingsScreen() {
  const userId = useBookingStore((state) => state.session?.userId);
  const bookings = useBookingStore((state) => state.bookings);
  const cancelBooking = useBookingStore((state) => state.cancelBooking);
  const rooms = useRoomStore((state) => state.rooms);
  const now = useNow();
  const [tab, setTab] = useState<Tab>('upcoming');
  const [pass, setPass] = useState<Booking | null>(null);

  const { upcoming, history } = useMemo(() => {
    const mine = bookings.filter((booking) => booking.userId === userId);
    const isUpcoming = (booking: Booking) =>
      (booking.status === 'confirmed' || booking.status === 'checked_in') &&
      dateFromKey(booking.dateKey, booking.endMinutes).getTime() > now.getTime();
    const byStart = (a: Booking, b: Booking) =>
      a.dateKey.localeCompare(b.dateKey) || a.startMinutes - b.startMinutes;
    return {
      upcoming: mine.filter(isUpcoming).sort(byStart),
      history: mine.filter((booking) => !isUpcoming(booking)).sort((a, b) => byStart(b, a)),
    };
  }, [bookings, userId, now]);

  const confirmCancel = (booking: Booking) => {
    Alert.alert('Huỷ đặt phòng?', 'Khung giờ sẽ được mở lại cho người khác.', [
      { text: 'Giữ lại', style: 'cancel' },
      { text: 'Huỷ đặt phòng', style: 'destructive', onPress: () => void cancelBooking(booking.id) },
    ]);
  };

  return (
    <Screen title="Đặt chỗ của tôi">
      <View style={styles.tabs}>
        {TABS.map(({ key, label }) => (
          <Pressable
            key={key}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === key }}
            onPress={() => setTab(key)}
            style={[styles.tab, tab === key && styles.tabActive]}
          >
            <AppText variant="titleMd" color={tab === key ? 'ink' : 'muted'}>
              {label}
            </AppText>
          </Pressable>
        ))}
      </View>
      <FlatList
        data={tab === 'upcoming' ? upcoming : history}
        keyExtractor={(booking) => booking.id}
        contentContainerStyle={[screenStyles.content, styles.list]}
        ListEmptyComponent={
          <EmptyState
            icon="calendar-outline"
            title={tab === 'upcoming' ? 'Chưa có lượt đặt nào' : 'Chưa có lịch sử'}
            message={tab === 'upcoming' ? 'Vào mục Khám phá để chọn phòng và khung giờ.' : 'Các lượt đặt đã qua sẽ hiện ở đây.'}
          />
        }
        renderItem={({ item }) => {
          const room = rooms.find((candidate) => candidate.id === item.roomId);
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <AppText variant="displaySm" style={styles.cardTitle}>
                  {room?.name ?? 'Phòng đã bị xoá'}
                </AppText>
                <PillBadge label={BOOKING_STATUS_LABEL[item.status]} />
              </View>
              <AppText color="body">
                {formatDateKey(item.dateKey)} · {formatRange(item.startMinutes, item.endMinutes)}
              </AppText>
              {room ? (
                <AppText variant="bodySm" color="muted">
                  Toà {room.building} · Tầng {room.floor}
                </AppText>
              ) : null}
              {tab === 'upcoming' ? (
                <View style={styles.actions}>
                  <Button label="Xem mã QR" variant="secondary" onPress={() => setPass(item)} style={styles.grow} />
                  {item.status === 'confirmed' ? (
                    <Button label="Huỷ" variant="tertiary" onPress={() => confirmCancel(item)} />
                  ) : null}
                </View>
              ) : null}
            </View>
          );
        }}
      />
      <QRPassModal
        booking={pass}
        room={rooms.find((candidate) => candidate.id === pass?.roomId)}
        onClose={() => setPass(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  tab: { paddingVertical: spacing.md, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.ink },
  list: { paddingTop: spacing.lg, gap: spacing.base },
  card: {
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.canvas,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardTitle: { flex: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginTop: spacing.md },
  grow: { flex: 1 },
});
