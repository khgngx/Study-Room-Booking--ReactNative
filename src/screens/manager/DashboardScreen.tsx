import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { BarList, ColumnChart, DonutChart, type DonutSegment } from '../../components/charts';
import { Chip } from '../../components/Chip';
import { BOOKING_STATUS_LABEL } from '../../components/labels';
import { Screen, screenStyles } from '../../components/Layout';
import { buildBookingsReport, toCsv } from '../../domain/exportCsv';
import { can } from '../../domain/permissions';
import { generateSlots } from '../../domain/slots';
import { computeStats } from '../../domain/stats';
import { addDays, dateFromKey, formatDateKey, toDateKey, weekdayLabel } from '../../domain/time';
import { getDayRange } from '../../domain/timeline';
import { useNow } from '../../hooks/useNow';
import { showMessage } from '../../services/dialog';
import { exportCsvFile } from '../../services/exportFile';
import { useAccountStore } from '../../store/useAccountStore';
import { useBookingStore, useCurrentUser } from '../../store/useBookingStore';
import { usePolicyStore } from '../../store/usePolicyStore';
import { useRoomStore } from '../../store/useRoomStore';
import { colors, radius, spacing, type ColorToken } from '../../theme/tokens';

const RANGE_OPTIONS = [7, 14, 30];
const percent = (ratio: number) => `${Math.round(ratio * 100)}%`;
const dayOfMonth = (dateKey: string) => String(dateFromKey(dateKey).getDate());

export function DashboardScreen() {
  const user = useCurrentUser();
  const bookings = useBookingStore((state) => state.bookings);
  const rooms = useRoomStore((state) => state.rooms);
  const users = useAccountStore((state) => state.users);
  const policy = usePolicyStore((state) => state.policy);
  const today = toDateKey(useNow());
  const [rangeDays, setRangeDays] = useState(RANGE_OPTIONS[0]);
  const [exporting, setExporting] = useState(false);

  const dateKeys = useMemo(() => {
    const end = dateFromKey(today);
    return Array.from({ length: rangeDays }, (_, index) => toDateKey(addDays(end, -index)));
  }, [today, rangeDays]);

  const stats = useMemo(() => {
    const bookableMinutesPerDay = generateSlots(policy).reduce((sum, slot) => sum + slot.endMinutes - slot.startMinutes, 0);
    return computeStats({ bookings, rooms, dateKeys, bookableMinutesPerDay, dayRange: getDayRange(policy) });
  }, [bookings, rooms, policy, dateKeys]);

  const exportReport = async () => {
    // The file lists who booked what, so it is gated like the screen itself.
    if (!user || !can(user.role, 'stats.view')) return;
    setExporting(true);
    try {
      const rows = buildBookingsReport({ bookings, rooms, users, dateKeys, statusLabel: BOOKING_STATUS_LABEL });
      const outcome = await exportCsvFile(`dat-phong-vku-${dateKeys[dateKeys.length - 1]}_${today}.csv`, toCsv(rows));
      if (outcome === 'unavailable') showMessage('Chưa xuất được', 'Thiết bị này không hỗ trợ chia sẻ file.');
      if (outcome === 'downloaded') showMessage('Đã tải file CSV', `${rows.length - 1} lượt đặt. Mở Google Sheets, chọn Tệp > Nhập để đưa file vào bảng tính.`);
    } catch (error) {
      console.warn('Exporting the bookings report failed', error);
      showMessage('Chưa xuất được', 'Không tạo được file. Vui lòng thử lại.');
    } finally {
      setExporting(false);
    }
  };

  const tiles: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap; tint: ColorToken; ink: ColorToken }[] = [
    { label: 'Lượt đặt', value: String(stats.totalBookings), icon: 'calendar-outline', tint: 'primarySoft', ink: 'primaryActive' },
    { label: 'Check-in', value: String(stats.checkedIn), icon: 'checkmark-done-outline', tint: 'successSoft', ink: 'successInk' },
    { label: 'Tỷ lệ vắng', value: percent(stats.noShowRate), icon: 'alert-circle-outline', tint: 'accentSoft', ink: 'accentInk' },
    { label: 'Đã huỷ', value: String(stats.cancelled), icon: 'close-circle-outline', tint: 'surfaceStrong', ink: 'ink' },
  ];
  const statusSegments: DonutSegment[] = [
    { key: 'checked_in', label: BOOKING_STATUS_LABEL.checked_in, value: stats.statusCounts.checked_in, color: 'success' },
    { key: 'confirmed', label: 'Chờ check-in', value: stats.statusCounts.confirmed, color: 'ink' },
    { key: 'no_show', label: BOOKING_STATUS_LABEL.no_show, value: stats.statusCounts.no_show, color: 'primary' },
    { key: 'cancelled', label: BOOKING_STATUS_LABEL.cancelled, value: stats.statusCounts.cancelled, color: 'borderStrong' },
  ];
  const daily = stats.daily.map((day) => ({ key: day.dateKey, label: rangeDays <= 7 ? weekdayLabel(day.dateKey) : dayOfMonth(day.dateKey), value: day.count }));
  const busiestDay = stats.daily.reduce((best, day) => (day.count > best.count ? day : best), stats.daily[0]);
  const busiestHour = stats.byHour.reduce((best, hour) => (hour.count > best.count ? hour : best), stats.byHour[0]);
  const topCount = stats.topRooms[0]?.count ?? 0;
  const empty = stats.totalBookings === 0;

  return (
    <Screen nested title="Tổng quan" subtitle={`${formatDateKey(dateKeys[dateKeys.length - 1])} đến ${formatDateKey(today)}`}>
      <ScrollView contentContainerStyle={[screenStyles.content, styles.content]}>
        <View style={styles.ranges}>
          {RANGE_OPTIONS.map((days) => (
            <Chip key={days} label={`${days} ngày`} selected={rangeDays === days} onPress={() => setRangeDays(days)} />
          ))}
        </View>

        <View style={styles.hero}>
          <AppText variant="microLabel" color="onPrimary" style={styles.heroLabel}>
            TỶ LỆ SỬ DỤNG PHÒNG
          </AppText>
          <AppText variant="ratingDisplay" color="onPrimary">
            {percent(stats.utilization)}
          </AppText>
          <AppText variant="bodySm" color="onPrimary">
            Thời lượng đã đặt trên tổng thời lượng mở cửa của {rooms.length} phòng.
          </AppText>
        </View>

        <View style={styles.tiles}>
          {tiles.map((tile) => (
            <View key={tile.label} style={styles.tile}>
              <View style={[styles.tileIcon, { backgroundColor: colors[tile.tint] }]}>
                <Ionicons name={tile.icon} size={18} color={colors[tile.ink]} />
              </View>
              <AppText variant="displaySm">{tile.value}</AppText>
              <AppText variant="captionSm" color="muted">
                {tile.label}
              </AppText>
            </View>
          ))}
        </View>

        <Panel title="Lượt đặt theo ngày" note={empty ? undefined : `Đông nhất: ${formatDateKey(busiestDay.dateKey)} với ${busiestDay.count} lượt.`}>
          <ColumnChart data={daily} color="primary" summary={`Lượt đặt theo ngày trong ${rangeDays} ngày, cao nhất ${busiestDay.count} lượt.`} />
        </Panel>

        <Panel title="Kết quả các lượt đặt">
          <DonutChart segments={statusSegments} total={String(stats.totalBookings)} caption="lượt đặt" />
        </Panel>

        <Panel title="Giờ cao điểm" note={empty ? undefined : `Đông nhất lúc ${busiestHour.hour}h với ${busiestHour.count} lượt đang dùng phòng.`}>
          <ColumnChart
            data={stats.byHour.map((hour) => ({ key: String(hour.hour), label: `${hour.hour}h`, value: hour.count }))}
            color="success"
            summary={`Số lượt đặt đang diễn ra theo từng giờ, cao nhất lúc ${busiestHour.hour} giờ.`}
          />
        </Panel>

        <Panel title="Mức sử dụng theo toà nhà">
          <BarList
            color="accent"
            data={stats.byBuilding.map((entry) => ({
              key: entry.building,
              label: `Toà ${entry.building} · ${entry.rooms} phòng`,
              value: entry.utilization,
              detail: `${percent(entry.utilization)} · ${entry.bookings} lượt`,
            }))}
          />
        </Panel>

        <Panel title="Phòng được đặt nhiều nhất">
          {stats.topRooms.length === 0 ? (
            <AppText color="muted">Chưa có lượt đặt nào trong khoảng thời gian này.</AppText>
          ) : (
            <BarList
              color="primary"
              data={stats.topRooms.map(({ room, count }) => ({ key: room.id, label: `${room.code} · ${room.name}`, value: count / topCount, detail: `${count} lượt` }))}
            />
          )}
        </Panel>

        <View style={styles.export}>
          <View style={styles.exportIcon}>
            <Ionicons name="document-text-outline" size={20} color={colors.successInk} />
          </View>
          <View style={styles.exportText}>
            <AppText variant="titleMd">Xuất dữ liệu sang Google Sheets</AppText>
            <AppText variant="bodySm" color="muted">
              File CSV gồm mọi lượt đặt trong {rangeDays} ngày đang xem: phòng, người đặt, giờ và trạng thái.
            </AppText>
            <Button label={exporting ? 'Đang xuất…' : 'Xuất file CSV'} variant="secondary" onPress={() => void exportReport()} disabled={exporting} style={styles.exportButton} />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

function Panel({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <View style={styles.panel}>
      <AppText variant="titleMd" accessibilityRole="header">
        {title}
      </AppText>
      {children}
      {note ? (
        <AppText variant="captionSm" color="muted">
          {note}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.base },
  ranges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  hero: { gap: spacing.xs, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.primaryActive },
  heroLabel: { letterSpacing: 0.5 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tile: {
    flexGrow: 1,
    flexBasis: '40%',
    gap: spacing.xs,
    padding: spacing.base,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.canvas,
  },
  tileIcon: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs, borderRadius: radius.full },
  panel: { gap: spacing.base, padding: spacing.base, borderRadius: radius.md, borderWidth: 1, borderColor: colors.hairline, backgroundColor: colors.canvas },
  export: { flexDirection: 'row', gap: spacing.md, padding: spacing.base, borderRadius: radius.md, backgroundColor: colors.successSoft },
  exportIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full, backgroundColor: colors.canvas },
  exportText: { flex: 1, gap: spacing.xs },
  exportButton: { alignSelf: 'flex-start', marginTop: spacing.sm },
});
