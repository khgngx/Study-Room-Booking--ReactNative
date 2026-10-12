import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, View } from 'react-native';

import { overlaps, sameRange, type MinuteRange, type SlotAvailability } from '../domain/conflict';
import { formatDuration, formatMinutes, formatRange } from '../domain/time';
import type { TimeRange } from '../domain/timeline';
import type { Slot } from '../domain/types';
import { themed } from '../theme/themed';
import { colors, radius, spacing, type ColorToken } from '../theme/tokens';
import { AppText } from './AppText';
import { Hatch } from './Hatch';

const STEP_MINUTES = 30;
const STEP_HEIGHT = 36;
const PIXELS_PER_MINUTE = STEP_HEIGHT / STEP_MINUTES;
const LABEL_WIDTH = 48;
const LABEL_LINE_HEIGHT = 18;
const BLOCK_INSET = 2;
// How much a block can say depends on how tall its stretch of time is.
const TWO_LINE_HEIGHT = 52;
const ONE_LINE_HEIGHT = 30;
const COMPACT_HEIGHT = 16;

const UNAVAILABLE_LABEL: Record<Exclude<SlotAvailability, 'available'>, string> = {
  maintenance: 'Bảo trì',
  past: 'Đã qua',
  mine: 'Của bạn',
  booked: 'Đã đặt',
  user_overlap: 'Trùng lịch của bạn',
  daily_limit: 'Đã đủ số ca hôm đó',
};

type Tone = 'free' | 'selected' | 'mine' | 'booked' | 'off';

const TEXT_COLOR: Record<Tone, { title: ColorToken; detail: ColorToken }> = {
  free: { title: 'ink', detail: 'successInk' },
  selected: { title: 'onPrimary', detail: 'onPrimary' },
  mine: { title: 'onDark', detail: 'onDark' },
  booked: { title: 'ink', detail: 'muted' },
  off: { title: 'mutedSoft', detail: 'mutedSoft' },
};

/** Vertical distance from the top of a schedule drawing `range` down to `minutes`. */
export const scheduleOffset = (range: TimeRange, minutes: number) =>
  LABEL_LINE_HEIGHT / 2 + (minutes - range.startMinutes) * PIXELS_PER_MINUTE;

// Pressable's types omit the web-only `onContextMenu` that react-native-web forwards, hence `object`.
const onRightClick = (handler: (() => void) | undefined): object =>
  Platform.OS === 'web' && handler
    ? {
        onContextMenu: (event: { preventDefault: () => void }) => {
          event.preventDefault();
          handler();
        },
      }
    : {};

export interface ScheduleBooking extends MinuteRange {
  id: string;
  mine: boolean;
  /** Given name of whoever holds it, when known. */
  holder?: string;
  /** The viewer's own booking that can still be given up. */
  cancellable?: boolean;
}

interface DayScheduleProps {
  /** The stretch of the day to draw; anything starting before it is clipped or left out. */
  range: TimeRange;
  slots: readonly Slot[];
  availability: Record<string, SlotAvailability>;
  /** Active bookings for this room and day, drawn at their exact minutes. */
  bookings: readonly ScheduleBooking[];
  /** Bookable leftovers inside slots that a booking only partly covers. */
  gaps: readonly TimeRange[];
  closed: readonly TimeRange[];
  /** Every time picked so far, whole slots and custom times alike. */
  selections: readonly MinuteRange[];
  /** Minutes of day for the "now" line, or null when another day is shown. */
  nowMinutes: number | null;
  /** Tap on a free slot or on a picked time: the screen picks it or drops it. */
  onSelect: (range: MinuteRange) => void;
  /** Long-press or right-click: the student wants to set their own time, starting from this stretch. */
  onCustomize: (range: MinuteRange) => void;
  /** Tap on one of the viewer's own cancellable bookings. */
  onCancelBooking: (bookingId: string) => void;
}

/**
 * A room's day as a vertical calendar: tap free slots to pick or drop them, hold one to set a custom time.
 * Every stretch of time belongs to exactly one block, so no label is ever drawn over another.
 */
export function DaySchedule({ range, slots, availability, bookings, gaps, closed, selections, nowMinutes, onSelect, onCustomize, onCancelBooking }: DayScheduleProps) {
  const offset = (minutes: number) => (minutes - range.startMinutes) * PIXELS_PER_MINUTE;
  const place = (segment: MinuteRange) => {
    const top = offset(Math.max(segment.startMinutes, range.startMinutes));
    return { top: top + BLOCK_INSET, height: offset(Math.min(segment.endMinutes, range.endMinutes)) - top - BLOCK_INSET * 2 };
  };
  const isVisible = (segment: MinuteRange) => segment.endMinutes > range.startMinutes && segment.startMinutes < range.endMinutes;

  const ticks: number[] = [];
  for (let minutes = range.startMinutes; minutes <= range.endMinutes; minutes += STEP_MINUTES) ticks.push(minutes);
  const showNow = nowMinutes !== null && nowMinutes >= range.startMinutes && nowMinutes <= range.endMinutes;

  const customSelections = selections.filter((picked) => !slots.some((slot) => sameRange(slot, picked)));
  // A slot that a booking or a custom time cuts into is not offered whole; that block and the leftover gaps are drawn instead.
  const carved = [...bookings, ...customSelections];
  const wholeSlots = slots.filter((slot) => isVisible(slot) && !carved.some((taken) => overlaps(taken, slot)));
  const selectedSlots = wholeSlots.filter((slot) => availability[slot.id] === 'available' && selections.some((picked) => sameRange(slot, picked)));

  return (
    <View style={[styles.schedule, { height: offset(range.endMinutes) + LABEL_LINE_HEIGHT }]}>
      <View style={styles.labels} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {ticks.map((minutes) => {
          const onTheHour = minutes % 60 === 0;
          return (
            <AppText
              key={minutes}
              variant={onTheHour ? 'caption' : 'captionSm'}
              color={onTheHour ? 'ink' : 'mutedSoft'}
              style={[styles.label, { top: offset(minutes) }]}
            >
              {formatMinutes(minutes)}
            </AppText>
          );
        })}
      </View>

      <View style={styles.grid}>
        {ticks.map((minutes) => (
          <View key={minutes} style={[styles.line, minutes % 60 !== 0 && styles.lineSoft, { top: offset(minutes) }]} />
        ))}

        {closed.filter(isVisible).map((segment) => {
          const frame = place(segment);
          return (
            <View key={segment.startMinutes} style={[styles.block, styles.closed, frame]}>
              <Hatch />
              {frame.height >= LABEL_LINE_HEIGHT + spacing.sm ? (
                <AppText variant="captionSm" color="muted" style={styles.closedLabel}>
                  Ngoài giờ mở cửa
                </AppText>
              ) : null}
            </View>
          );
        })}

        {wholeSlots.map((slot) => {
          const state = availability[slot.id];
          const free = state === 'available';
          const selected = selectedSlots.includes(slot);
          // A slot that has started can still be booked for what is left of it.
          const underway = state === 'past' && nowMinutes !== null && slot.endMinutes > nowMinutes;
          const customizable = free || underway || state === 'user_overlap';
          const customize = customizable ? () => onCustomize(slot) : undefined;
          const title = free ? slot.label : UNAVAILABLE_LABEL[state];
          const detail = selected ? 'Đã chọn · chạm để bỏ' : free ? 'Chạm để chọn · giữ để chỉnh giờ' : underway ? 'Giữ để đặt phần còn lại' : slot.label;
          return (
            <Pressable
              key={slot.id}
              accessibilityRole="button"
              accessibilityState={{ disabled: !customizable, selected }}
              accessibilityLabel={`${slot.label}, ${free ? (selected ? 'đã chọn' : 'còn trống') : title}`}
              accessibilityHint={customizable ? 'Nhấn giữ để tuỳ chỉnh giờ' : undefined}
              accessibilityActions={customizable ? [{ name: 'longpress', label: 'Tuỳ chỉnh giờ' }] : undefined}
              onAccessibilityAction={customize}
              disabled={!customizable}
              onPress={free ? () => onSelect(slot) : undefined}
              onLongPress={customize}
              {...onRightClick(customize)}
              style={[styles.block, styles[selected ? 'selected' : free ? 'free' : 'off'], place(slot)]}
            >
              <BlockText tone={selected ? 'selected' : free ? 'free' : 'off'} height={place(slot).height} title={title} detail={detail} />
              {selected ? <Ionicons name="checkmark-circle" size={20} color={colors.onPrimary} /> : null}
            </Pressable>
          );
        })}

        {gaps.filter(isVisible).map((gap) => {
          const label = formatRange(gap.startMinutes, gap.endMinutes);
          const customize = () => onCustomize(gap);
          return (
            <Pressable
              key={gap.startMinutes}
              accessibilityRole="button"
              accessibilityLabel={`${label}, còn trống, tuỳ chỉnh giờ`}
              onPress={customize}
              onLongPress={customize}
              {...onRightClick(customize)}
              style={[styles.block, styles.free, place(gap)]}
            >
              <BlockText tone="free" height={place(gap).height} title={label} detail="Còn trống · chạm để chỉnh giờ" />
            </Pressable>
          );
        })}

        {bookings.filter(isVisible).map((booking) => {
          const tone = booking.mine ? 'mine' : 'booked';
          const title = booking.mine ? 'Của bạn' : booking.holder ? `Đã đặt, ${booking.holder}` : 'Đã đặt';
          const label = formatRange(booking.startMinutes, booking.endMinutes);
          if (!booking.cancellable) {
            return (
              <View key={booking.id} accessible accessibilityLabel={`${label}, ${title}`} style={[styles.block, styles[tone], place(booking)]}>
                <BlockText tone={tone} height={place(booking).height} title={title} detail={label} />
              </View>
            );
          }
          return (
            <Pressable
              key={booking.id}
              accessibilityRole="button"
              accessibilityLabel={`${label}, ${title}`}
              accessibilityHint="Chạm để huỷ ca này"
              onPress={() => onCancelBooking(booking.id)}
              style={[styles.block, styles[tone], place(booking)]}
            >
              <BlockText tone={tone} height={place(booking).height} title={title} detail={`${label} · chạm để huỷ`} />
              {place(booking).height >= ONE_LINE_HEIGHT ? <Ionicons name="close-circle" size={20} color={colors.onDark} /> : null}
            </Pressable>
          );
        })}

        {customSelections.filter(isVisible).map((picked) => {
          const label = formatRange(picked.startMinutes, picked.endMinutes);
          const customize = () => onCustomize(picked);
          return (
            <Pressable
              key={picked.startMinutes}
              accessibilityRole="button"
              accessibilityState={{ selected: true }}
              accessibilityLabel={`${label}, đã chọn`}
              accessibilityHint="Chạm để bỏ chọn, nhấn giữ để chỉnh lại giờ"
              accessibilityActions={[{ name: 'longpress', label: 'Chỉnh lại giờ' }]}
              onAccessibilityAction={customize}
              onPress={() => onSelect(picked)}
              onLongPress={customize}
              {...onRightClick(customize)}
              style={[styles.block, styles.selected, place(picked)]}
            >
              <BlockText tone="selected" height={place(picked).height} title={label} detail={`Chạm để bỏ · ${formatDuration(picked.endMinutes - picked.startMinutes)}`} />
              {place(picked).height >= ONE_LINE_HEIGHT ? <Ionicons name="checkmark-circle" size={20} color={colors.onPrimary} /> : null}
            </Pressable>
          );
        })}

        {showNow ? (
          <View pointerEvents="none" style={[styles.now, { top: offset(nowMinutes) }]}>
            <View style={styles.nowDot} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

function BlockText({ tone, height, title, detail }: { tone: Tone; height: number; title: string; detail: string }) {
  if (height < COMPACT_HEIGHT) return null;
  const compact = height < ONE_LINE_HEIGHT;
  return (
    <View style={[styles.blockText, compact ? styles.blockTextCompact : styles.blockTextRoomy]}>
      <AppText variant={compact ? 'captionSm' : 'titleMd'} color={TEXT_COLOR[tone].title} numberOfLines={1}>
        {title}
      </AppText>
      {height >= TWO_LINE_HEIGHT ? (
        <AppText variant="captionSm" color={TEXT_COLOR[tone].detail} numberOfLines={1}>
          {detail}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = themed(() => ({
  schedule: { flexDirection: 'row', paddingTop: LABEL_LINE_HEIGHT / 2 },
  labels: { width: LABEL_WIDTH },
  label: { position: 'absolute', left: 0, marginTop: -LABEL_LINE_HEIGHT / 2, lineHeight: LABEL_LINE_HEIGHT },
  grid: { flex: 1, borderLeftWidth: 1, borderLeftColor: colors.hairline },
  line: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: colors.hairline },
  lineSoft: { backgroundColor: colors.hairlineSoft },
  block: {
    position: 'absolute',
    left: spacing.xs,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  blockText: { flex: 1, gap: spacing.xxs },
  blockTextRoomy: { paddingVertical: spacing.xs + spacing.xxs },
  blockTextCompact: { justifyContent: 'center', alignSelf: 'stretch' },
  free: { borderColor: colors.success, backgroundColor: colors.successSoft },
  // The deeper Rausch and Kazan keep white text readable.
  selected: { borderColor: colors.primaryActive, backgroundColor: colors.primaryActive },
  mine: { borderColor: colors.successInk, backgroundColor: colors.successInk },
  booked: { backgroundColor: colors.surfaceStrong },
  off: { backgroundColor: colors.surfaceSoft },
  closed: { backgroundColor: colors.surfaceSoft },
  closedLabel: { alignSelf: 'flex-start', paddingHorizontal: spacing.xs, borderRadius: radius.xs, backgroundColor: colors.surfaceSoft },
  now: { position: 'absolute', left: 0, right: 0, height: 2, marginTop: -1, zIndex: 2, backgroundColor: colors.primary },
  nowDot: { position: 'absolute', left: -5, top: -4, width: 10, height: 10, borderRadius: radius.full, backgroundColor: colors.primary },
}));
