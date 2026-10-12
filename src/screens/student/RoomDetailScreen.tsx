import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { CalendarButton, DateNavigator } from '../../components/DateNavigator';
import { PresencePill } from '../../components/PresencePill';
import { CustomTimeSheet } from '../../components/CustomTimeSheet';
import { DaySchedule, scheduleOffset, type ScheduleBooking } from '../../components/DaySchedule';
import { Hatch } from '../../components/Hatch';
import { EQUIPMENT_ICON, EQUIPMENT_LABEL, formatLocation, givenName, READ_ONLY_MESSAGE, ROOM_TYPE_LABEL } from '../../components/labels';
import { Divider, EmptyState, ReadOnlyBanner } from '../../components/Layout';
import { QRPassModal } from '../../components/QRPassModal';
import { ROOM_TONE_DOT } from '../../components/RoomCard';
import { RoomCodePlate } from '../../components/RoomCodePlate';
import { getRoomDayStatus } from '../../components/roomDayStatus';
import { PillBadge } from '../../components/StatusBadge';
import {
  countRemainingBookings,
  BOOKING_HORIZON_DAYS,
  getSlotAvailability,
  isActive,
  MIN_BOOKING_MINUTES,
  overlaps,
  sameRange,
  validateBookingRange,
  type MinuteRange,
  type SlotAvailability,
} from '../../domain/conflict';
import { toggleSelection } from '../../domain/selection';
import { generateSlots } from '../../domain/slots';
import { dateFromKey, formatDateKey, formatDuration, formatMinutes, formatRange, minutesOfDay, nextDateKeys } from '../../domain/time';
import { getDayRange, getDaySegments, getScheduleStart, subtractRanges } from '../../domain/timeline';
import type { Booking, Policy } from '../../domain/types';
import { useNow } from '../../hooks/useNow';
import { useCanAct } from '../../hooks/usePresence';
import type { ExploreStackParams } from '../../navigation/types';
import { confirmDestructive, showMessage } from '../../services/dialog';
import { resolveImage } from '../../services/images';
import { useAccountStore } from '../../store/useAccountStore';
import { useBookingStore, type CreateBookingResult } from '../../store/useBookingStore';
import { usePolicyStore } from '../../store/usePolicyStore';
import { useRoomStore } from '../../store/useRoomStore';
import { themed } from '../../theme/themed';
import { colors, radius, spacing } from '../../theme/tokens';

type IconName = keyof typeof Ionicons.glyphMap;


type BookingFailure = Extract<CreateBookingResult, { ok: false }>['reason'];

const formatOpeningHours = (policy: Policy) => policy.openingWindows.map((window) => `${window.start} – ${window.end}`).join(', ');

function failureMessage(reason: BookingFailure, policy: Policy): string {
  switch (reason) {
    case 'maintenance':
      return 'Phòng đang bảo trì nên chưa thể đặt.';
    case 'past':
      return 'Giờ bắt đầu đã qua. Vui lòng chọn giờ muộn hơn.';
    case 'mine':
      return 'Bạn đã đặt phòng này trong khoảng giờ đó rồi.';
    case 'booked':
      return 'Khoảng giờ này trùng với lượt đặt của người khác.';
    case 'user_overlap':
      return 'Bạn đã có phòng khác trong khoảng giờ này.';
    case 'daily_limit':
      return `Bạn đã đặt đủ ${policy.maxBookingsPerDay} ca cho ngày này.`;
    case 'too_short':
      return `Mỗi ca cần ít nhất ${MIN_BOOKING_MINUTES} phút và giờ kết thúc phải sau giờ bắt đầu.`;
    case 'too_long':
      return `Mỗi ca tối đa ${formatDuration(policy.slotMinutes)}.`;
    case 'too_far':
      return `Chỉ đặt trước được tối đa ${BOOKING_HORIZON_DAYS} ngày.`;
    case 'outside_hours':
      return `Chỉ đặt được trọn trong một khoảng mở cửa: ${formatOpeningHours(policy)}.`;
    case 'forbidden':
      return 'Chỉ tài khoản sinh viên mới đặt được phòng.';
    case 'inactive':
      return READ_ONLY_MESSAGE;
    case 'room_not_found':
      return 'Phòng này không còn tồn tại.';
  }
}

/** Custom times default to the next five-minute mark, so "now" is never offered as a start. */
const NEXT_START_STEP = 5;

export function RoomDetailScreen({ navigation, route }: NativeStackScreenProps<ExploreStackParams, 'RoomDetail'>) {
  const insets = useSafeAreaInsets();
  const room = useRoomStore((state) => state.rooms.find((candidate) => candidate.id === route.params.roomId));
  const bookings = useBookingStore((state) => state.bookings);
  const userId = useBookingStore((state) => state.session?.userId);
  const createBooking = useBookingStore((state) => state.createBooking);
  const cancelBooking = useBookingStore((state) => state.cancelBooking);
  const users = useAccountStore((state) => state.users);
  const policy = usePolicyStore((state) => state.policy);
  const now = useNow();
  const canAct = useCanAct();

  const dateKeys = useMemo(() => nextDateKeys(now, BOOKING_HORIZON_DAYS + 1), [now]);
  const [pickedDate, setPickedDate] = useState(route.params.dateKey ?? dateKeys[0]);
  // If the app stays open past midnight the picked day can fall off the strip.
  const dateKey = dateKeys.includes(pickedDate) ? pickedDate : dateKeys[0];
  const isToday = dateKey === dateKeys[0];
  const [selections, setSelections] = useState<MinuteRange[]>([]);
  // `replaces` is the custom time being re-edited, so saving swaps it instead of adding another.
  const [customizing, setCustomizing] = useState<{ range: MinuteRange; replaces: MinuteRange | null } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pass, setPass] = useState<Booking | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  // Where the schedule sits inside the scroll content: its section, then its place in that section.
  const scheduleTop = useRef({ section: 0, schedule: 0 });

  const roomName = room?.name ?? '';
  const changeDate = useCallback((next: string) => {
    setPickedDate(next);
    setSelections([]);
  }, []);
  // The calendar joins the presence pill in the stack header, as it does on the tab roots.
  useLayoutEffect(
    () =>
      navigation.setOptions({
        title: roomName,
        headerRight: () => (
          <View style={styles.headerActions}>
            <CalendarButton dateKeys={dateKeys} selected={dateKey} onSelect={changeDate} />
            <PresencePill />
          </View>
        ),
      }),
    [navigation, roomName, dateKeys, dateKey, changeDate],
  );

  const nowMinutes = isToday ? minutesOfDay(now) : null;
  const slots = useMemo(() => generateSlots(policy), [policy]);
  const dayRange = useMemo(() => getDayRange(policy), [policy]);
  const availability = useMemo(() => {
    const map: Record<string, SlotAvailability> = {};
    if (!room || !userId) return map;
    for (const slot of slots) {
      map[slot.id] = getSlotAvailability({ room, dateKey, slot, bookings, userId, policy, now });
    }
    return map;
  }, [room, userId, slots, dateKey, bookings, policy, now]);
  const held = useMemo(
    () =>
      bookings
        .filter((booking) => booking.roomId === room?.id && booking.dateKey === dateKey && isActive(booking))
        .map((booking): ScheduleBooking => {
          const holder = users.find((user) => user.id === booking.userId);
          const mine = booking.userId === userId;
          return {
            id: booking.id,
            startMinutes: booking.startMinutes,
            endMinutes: booking.endMinutes,
            mine,
            holder: holder ? givenName(holder.name) : undefined,
            // Same rule as Lịch của tôi: only a booking not yet checked in or over can be given up.
            cancellable: mine && canAct && booking.status === 'confirmed' && dateFromKey(booking.dateKey, booking.endMinutes) > now,
          };
        }),
    [bookings, room?.id, dateKey, users, userId, canAct, now],
  );

  if (!room) {
    return <EmptyState icon="alert-circle-outline" title="Không tìm thấy phòng" message="Phòng này có thể đã bị xoá." />;
  }

  const status = getRoomDayStatus({ room, bookings, dateKey, isToday, policy, slots, now });
  const scheduleStart = getScheduleStart(dayRange, nowMinutes);
  const hidesPast = slots.some((slot) => slot.startMinutes < scheduleStart);

  /** The same checks the store runs, so the screen never offers a time that would be refused. */
  const rejectionOf = (range: MinuteRange): BookingFailure | null => {
    if (!userId) return 'forbidden';
    const shape = validateBookingRange(range, policy);
    if (shape) return shape;
    const state = getSlotAvailability({ room, dateKey, slot: range, bookings, userId, policy, now });
    return state === 'available' ? null : state;
  };

  const remaining = userId ? countRemainingBookings({ dateKey, bookings, userId, policy }) : 0;
  // A time picked earlier may have been taken or expired since.
  const activeSelections = selections
    .filter((picked) => rejectionOf(picked) === null)
    .sort((a, b) => a.startMinutes - b.startMinutes)
    .slice(0, remaining);
  const selectedMinutes = activeSelections.reduce((total, picked) => total + picked.endMinutes - picked.startMinutes, 0);
  const limitMessage = `Mỗi ngày bạn được đặt tối đa ${policy.maxBookingsPerDay} ca. Bỏ bớt một ca đang chọn để chọn ca khác.`;
  const isWholeSlot = (range: MinuteRange) => slots.some((slot) => sameRange(slot, range));
  const withoutRange = (range: MinuteRange | null) => activeSelections.filter((picked) => !range || !sameRange(picked, range));

  // What is still bookable inside slots that a booking or a custom time only partly covers.
  const carved = [...held, ...activeSelections.filter((picked) => !isWholeSlot(picked))];
  const gaps = slots
    .filter((slot) => carved.some((taken) => overlaps(taken, slot)))
    .flatMap((slot) => subtractRanges(slot, carved))
    .map((gap) => ({ ...gap, startMinutes: Math.max(gap.startMinutes, nowMinutes ?? 0) }))
    .filter((gap) => gap.endMinutes - gap.startMinutes >= MIN_BOOKING_MINUTES);

  const toggleRange = (range: MinuteRange) => {
    const outcome = toggleSelection(activeSelections, range, remaining);
    if (outcome.ok) setSelections(outcome.selections);
    else showMessage('Đã chọn đủ số ca', limitMessage);
  };

  /** Why a typed time cannot join the selection, or null when it can. */
  const customTimeProblem = (range: MinuteRange): string | null => {
    const reason = rejectionOf(range);
    if (reason) return failureMessage(reason, policy);
    const others = withoutRange(customizing?.replaces ?? null);
    if (others.some((picked) => overlaps(picked, range))) return 'Khoảng giờ này trùng với một ca bạn đang chọn.';
    return others.length >= remaining ? limitMessage : null;
  };

  const openCustomizer = (pressed: MinuteRange) => {
    // Holding a block a custom time sits in re-opens that time rather than starting a new one.
    const editing = activeSelections.find((picked) => !isWholeSlot(picked) && overlaps(picked, pressed));
    if (editing) {
      setCustomizing({ range: editing, replaces: editing });
      return;
    }
    const earliest = nowMinutes === null ? pressed.startMinutes : Math.ceil((nowMinutes + 1) / NEXT_START_STEP) * NEXT_START_STEP;
    const startMinutes = Math.min(Math.max(pressed.startMinutes, earliest), pressed.endMinutes);
    setCustomizing({ range: { startMinutes, endMinutes: pressed.endMinutes }, replaces: null });
  };

  const applyCustomTime = (range: MinuteRange) => {
    setSelections([...withoutRange(customizing?.replaces ?? null), range]);
    setCustomizing(null);
    // The chosen time is often far from the block that was held, so bring it into view.
    const visible = { startMinutes: scheduleStart, endMinutes: dayRange.endMinutes };
    const y = scheduleTop.current.section + scheduleTop.current.schedule + scheduleOffset(visible, range.startMinutes) - spacing.xl;
    scrollRef.current?.scrollTo({ y: Math.max(0, y), animated: true });
  };

  const confirmCancel = (bookingId: string) => {
    const booking = bookings.find((candidate) => candidate.id === bookingId);
    if (!booking) return;
    confirmDestructive({
      title: 'Huỷ ca đã đặt?',
      message: `${formatRange(booking.startMinutes, booking.endMinutes)}, ${formatDateKey(booking.dateKey)}. Khung giờ sẽ được mở lại cho người khác.`,
      confirmLabel: 'Huỷ ca',
      cancelLabel: 'Giữ lại',
      onConfirm: () => void cancelBooking(booking.id),
    });
  };

  const book = async () => {
    if (activeSelections.length === 0) return;
    setSubmitting(true);
    const booked: Booking[] = [];
    const failures: string[] = [];
    // One at a time: each booking is checked against the ones just made.
    for (const slot of activeSelections) {
      const result = await createBooking({ roomId: room.id, dateKey, slot });
      if (result.ok) booked.push(result.booking);
      else failures.push(`${formatRange(slot.startMinutes, slot.endMinutes)}: ${failureMessage(result.reason, policy)}`);
    }
    setSubmitting(false);
    setSelections([]);
    if (failures.length > 0) {
      const title = booked.length > 0 ? `Đã đặt ${booked.length}/${activeSelections.length} ca` : 'Chưa đặt được phòng';
      showMessage(title, failures.join('\n'));
    } else if (booked.length === 1) {
      setPass(booked[0]);
    } else {
      showMessage(`Đã đặt ${booked.length} ca`, 'Mỗi ca có một mã QR riêng. Mở tab Lịch của tôi để lấy mã khi check-in.');
    }
  };

  return (
    <View style={styles.screen}>
      <DateNavigator
        dateKeys={dateKeys}
        selected={dateKey}
        onSelect={changeDate}
      />
      <Divider />
      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll}>
        <View style={styles.section}>
          <View style={styles.hero}>
            <Image source={resolveImage(room.imageUrl)} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} accessibilityLabel={`Ảnh phòng ${room.code}`} />
            <PillBadge floating label={status.label} dotColor={colors[ROOM_TONE_DOT[status.tone]]} style={styles.heroBadge} />
            <View style={styles.heroPlate}>
              <RoomCodePlate code={room.code} size="lg" />
            </View>
          </View>
          <View style={styles.heading}>
            <AppText variant="microLabel" color="accentInk">
              {ROOM_TYPE_LABEL[room.type].toUpperCase()}
            </AppText>
            <AppText variant="displayLg" accessibilityRole="header">
              {room.name}
            </AppText>
          </View>
          <View style={styles.facts}>
            <Fact icon="location-outline" label={formatLocation(room)} />
            <Fact icon="people-outline" label={`${room.capacity} chỗ`} />
            {room.equipment.map((item) => (
              <Fact key={item} icon={EQUIPMENT_ICON[item]} label={EQUIPMENT_LABEL[item]} />
            ))}
          </View>
          {room.description ? <AppText color="body">{room.description}</AppText> : null}
        </View>

        {room.underMaintenance ? (
          <EmptyState icon="construct-outline" title="Phòng đang bảo trì" message="Chưa nhận đặt phòng cho đến khi bảo trì xong. Bạn thử chọn phòng khác nhé." />
        ) : slots.length === 0 ? (
          <EmptyState icon="time-outline" title="Chưa mở khung giờ" message="Phòng chưa có khung giờ nào để đặt." />
        ) : (
          <View style={styles.section} onLayout={(event) => (scheduleTop.current.section = event.nativeEvent.layout.y)}>
            <View style={styles.sectionHeader}>
              <AppText variant="displaySm" accessibilityRole="header" style={styles.grow}>
                Chọn khung giờ
              </AppText>
              <View style={styles.quota}>
                <AppText variant="caption" color="successInk">
                  Còn {remaining - activeSelections.length}/{policy.maxBookingsPerDay} ca
                </AppText>
              </View>
            </View>
            <View style={styles.tip}>
              <Ionicons name="bulb-outline" size={18} color={colors.accentInk} />
              <AppText variant="captionSm" color="body" style={styles.grow}>
                Chạm một khung để chọn, chạm lần nữa để bỏ. {Platform.OS === 'web' ? 'Nhấn giữ hoặc chuột phải' : 'Nhấn giữ'} để tự chỉnh giờ bắt đầu và kết thúc. Chạm vào ca của bạn để huỷ.
              </AppText>
            </View>
            <View style={styles.legend}>
              <Legend label="Trống" swatch={styles.swatchFree} />
              <Legend label="Đang chọn" swatch={styles.swatchSelected} />
              <Legend label="Của bạn" swatch={styles.swatchMine} />
              <Legend label="Đã đặt" swatch={styles.swatchBooked} />
              <Legend label="Ngoài giờ" swatch={styles.swatchClosed} hatched />
            </View>
            {hidesPast ? (
              <AppText variant="captionSm" color="muted">
                Đã ẩn các khung trước {formatMinutes(scheduleStart)} vì đã qua.
              </AppText>
            ) : null}
            <View onLayout={(event) => (scheduleTop.current.schedule = event.nativeEvent.layout.y)}>
              <DaySchedule
                range={{ startMinutes: scheduleStart, endMinutes: dayRange.endMinutes }}
                slots={slots}
                availability={availability}
                bookings={held}
                gaps={gaps}
                closed={getDaySegments(room, bookings, dateKey, policy).closed}
                selections={activeSelections}
                nowMinutes={nowMinutes}
                onSelect={toggleRange}
                onCustomize={openCustomizer}
                onCancelBooking={confirmCancel}
              />
            </View>
            <AppText variant="captionSm" color="muted">
              Mỗi ngày bạn được đặt tối đa {policy.maxBookingsPerDay} ca, mỗi ca không quá {formatDuration(policy.slotMinutes)}.
            </AppText>
          </View>
        )}
      </ScrollView>

      {canAct ? null : <ReadOnlyBanner />}
      <View style={[styles.bar, { paddingBottom: insets.bottom + spacing.base }]}>
        {activeSelections.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.picks}>
            {activeSelections.map((picked) => (
              <Pressable
                key={picked.startMinutes}
                accessibilityRole="button"
                accessibilityLabel={`Bỏ chọn ${formatRange(picked.startMinutes, picked.endMinutes)}`}
                onPress={() => setSelections(withoutRange(picked))}
                style={styles.pick}
              >
                <AppText variant="caption" color="primaryActive">
                  {formatRange(picked.startMinutes, picked.endMinutes)}
                </AppText>
                <Ionicons name="close" size={14} color={colors.primaryActive} />
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
        <View style={styles.barRow}>
          <View style={styles.barText}>
            <AppText variant="titleMd" numberOfLines={1}>
              {activeSelections.length > 0 ? `${activeSelections.length} ca · ${formatDuration(selectedMinutes)}` : 'Chưa chọn khung giờ'}
            </AppText>
            <AppText variant="bodySm" color="muted" numberOfLines={1}>
              {formatDateKey(dateKey)}
            </AppText>
          </View>
          <Button
            label={submitting ? 'Đang đặt…' : activeSelections.length > 1 ? `Đặt ${activeSelections.length} ca` : 'Đặt phòng'}
            onPress={() => void book()}
            disabled={activeSelections.length === 0 || submitting || !canAct}
          />
        </View>
      </View>

      <CustomTimeSheet
        initial={customizing?.range ?? null}
        rules={`Giờ mở cửa ${formatOpeningHours(policy)}. Mỗi ca tối đa ${formatDuration(policy.slotMinutes)}.`}
        validate={customTimeProblem}
        onConfirm={applyCustomTime}
        onClose={() => setCustomizing(null)}
      />
      <QRPassModal booking={pass} room={room} onClose={() => setPass(null)} />
    </View>
  );
}

function Fact({ icon, label }: { icon: IconName; label: string }) {
  return (
    <View style={styles.fact}>
      <Ionicons name={icon} size={16} color={colors.ink} />
      <AppText variant="caption">{label}</AppText>
    </View>
  );
}

function Legend({ label, swatch, hatched = false }: { label: string; swatch: object; hatched?: boolean }) {
  return (
    <View style={styles.item}>
      <View style={[styles.swatch, swatch]}>{hatched ? <Hatch /> : null}</View>
      <AppText variant="captionSm" color="muted">
        {label}
      </AppText>
    </View>
  );
}

const styles = themed(() => ({
  screen: { flex: 1, backgroundColor: colors.canvas },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  section: { paddingTop: spacing.lg, gap: spacing.md },
  grow: { flex: 1 },
  hero: { height: 184, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.surfaceStrong },
  heroBadge: { position: 'absolute', top: spacing.md, left: spacing.md, maxWidth: '80%' },
  heroPlate: { position: 'absolute', left: spacing.md, bottom: spacing.md },
  heading: { gap: spacing.xs },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  fact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + spacing.xxs,
    paddingVertical: spacing.xs + spacing.xxs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSoft,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  quota: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.full, backgroundColor: colors.successSoft },
  tip: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.accentSoft },
  legend: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: spacing.base, rowGap: spacing.sm },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + spacing.xxs },
  swatch: { width: 16, height: 16, borderRadius: radius.xs, borderWidth: 1, borderColor: 'transparent', overflow: 'hidden' },
  swatchFree: { borderColor: colors.success, backgroundColor: colors.successSoft },
  swatchSelected: { backgroundColor: colors.primaryActive },
  swatchMine: { backgroundColor: colors.successInk },
  swatchBooked: { backgroundColor: colors.surfaceStrong, borderColor: colors.hairline },
  swatchClosed: { backgroundColor: colors.surfaceSoft },
  bar: {
    gap: spacing.md,
    paddingTop: spacing.base,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    backgroundColor: colors.canvas,
  },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.base },
  barText: { flex: 1 },
  picks: { gap: spacing.sm },
  pick: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: 32,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
}));
