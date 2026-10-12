import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';

import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { CalendarButton, DateNavigator } from '../../components/DateNavigator';
import { BOOKING_STATUS_LABEL, STAFF_ACTION_ERROR } from '../../components/labels';
import { EmptyState, Screen, screenStyles } from '../../components/Layout';
import { PillBadge } from '../../components/StatusBadge';
import { canVerifyInBuilding } from '../../domain/checkin';
import { can } from '../../domain/permissions';
import { formatRange, nextDateKeys, toDateKey } from '../../domain/time';
import { useNow } from '../../hooks/useNow';
import type { ShiftStackParams } from '../../navigation/types';
import { useCanAct } from '../../hooks/usePresence';
import { showMessage } from '../../services/dialog';
import { useAccountStore } from '../../store/useAccountStore';
import { useBookingStore, useCurrentUser, type StaffActionResult } from '../../store/useBookingStore';
import { useRoomStore } from '../../store/useRoomStore';
import { themed } from '../../theme/themed';
import { colors, spacing } from '../../theme/tokens';

function report(result: StaffActionResult) {
  if (!result.ok) showMessage('Không thực hiện được', STAFF_ACTION_ERROR[result.reason]);
}

export function ShiftBookingsScreen({ navigation }: NativeStackScreenProps<ShiftStackParams, 'ShiftBookings'>) {
  const staff = useCurrentUser();
  const bookings = useBookingStore((state) => state.bookings);
  const checkIn = useBookingStore((state) => state.checkIn);
  const markNoShow = useBookingStore((state) => state.markNoShow);
  const rooms = useRoomStore((state) => state.rooms);
  const users = useAccountStore((state) => state.users);
  const now = useNow();
  const canAct = useCanAct();

  const dateKeys = useMemo(() => nextDateKeys(now, 7), [now]);
  const today = toDateKey(now);
  const [pickedDate, setPickedDate] = useState(today);
  const dateKey = dateKeys.includes(pickedDate) ? pickedDate : today;

  const rows = useMemo(() => {
    if (!staff) return [];
    return bookings
      .filter((booking) => booking.dateKey === dateKey && booking.status !== 'cancelled')
      .map((booking) => ({
        booking,
        room: rooms.find((room) => room.id === booking.roomId),
        student: users.find((user) => user.id === booking.userId),
      }))
      .filter(({ room }) => room !== undefined && canVerifyInBuilding(staff, room))
      .sort((a, b) => a.booking.startMinutes - b.booking.startMinutes || (a.room?.code ?? '').localeCompare(b.room?.code ?? ''));
  }, [bookings, rooms, users, staff, dateKey]);

  if (!staff) return null;
  const area = can(staff.role, 'booking.viewAllAreas')
    ? 'Tất cả toà nhà'
    : (staff.assignedBuildings ?? []).map((building) => `Toà ${building}`).join(', ') || 'Chưa được phân công khu vực';

  return (
    <Screen
      title="Ca trực"
      subtitle={area}
      headerAction={<CalendarButton dateKeys={dateKeys} selected={dateKey} onSelect={setPickedDate} />}
      action={<Button label="Quét QR" variant="pill" onPress={() => navigation.navigate('Scan')} disabled={!canAct} />}
    >
      <View style={styles.dates}>
        <DateNavigator dateKeys={dateKeys} selected={dateKey} onSelect={setPickedDate} />
      </View>
      <FlatList
        data={rows}
        keyExtractor={({ booking }) => booking.id}
        contentContainerStyle={screenStyles.content}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <EmptyState icon="calendar-clear-outline" title="Không có lượt đặt nào" message="Ngày này chưa có ai đặt phòng trong khu vực của bạn." />
        }
        renderItem={({ item: { booking, room, student } }) => (
          <View style={styles.row}>
            <View style={styles.rowHeader}>
              <AppText variant="titleMd" style={styles.grow}>
                {formatRange(booking.startMinutes, booking.endMinutes)} · {room?.code}
              </AppText>
              <PillBadge label={BOOKING_STATUS_LABEL[booking.status]} />
            </View>
            <AppText variant="bodySm" color="muted">
              {room?.name} · {student?.name ?? 'Tài khoản đã xoá'}
              {student?.studentId ? ` · ${student.studentId}` : ''} · Mã {booking.code}
            </AppText>
            {booking.status === 'confirmed' && dateKey === today ? (
              <View style={styles.actions}>
                <Button label="Check-in" variant="secondary" onPress={() => report(checkIn(booking.id))} disabled={!canAct} style={styles.grow} />
                <Button label="Vắng mặt" variant="tertiary" onPress={() => report(markNoShow(booking.id))} disabled={!canAct} />
              </View>
            ) : null}
          </View>
        )}
      />
    </Screen>
  );
}

const styles = themed(() => ({
  dates: { paddingBottom: spacing.base, borderBottomWidth: 1, borderBottomColor: colors.hairline },
  separator: { height: 1, backgroundColor: colors.hairlineSoft },
  row: { gap: spacing.xs, paddingVertical: spacing.base },
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginTop: spacing.sm },
  grow: { flex: 1 },
}));
