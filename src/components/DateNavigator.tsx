import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { addDays, dateFromKey, formatDateKey, monthWeeks, toDateKey, weekOf } from '../domain/time';
import { themed } from '../theme/themed';
import { colors, CONTROL_HEIGHT, radius, spacing } from '../theme/tokens';
import { AppText } from './AppText';
import { DateStrip } from './DateStrip';

const WEEKDAY_HEADERS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const DAY_SIZE = 40;

const monthTitle = (dateKey: string) => `Tháng ${dateFromKey(dateKey).getMonth() + 1}`;

interface DateNavigatorProps {
  /** Every day that can be picked, starting today. */
  dateKeys: readonly string[];
  selected: string;
  onSelect: (dateKey: string) => void;
}

/** The month being viewed, arrows to step a week at a time, and that week's days. */
export function DateNavigator({ dateKeys, selected, onSelect }: DateNavigatorProps) {
  const first = dateKeys[0];
  const last = dateKeys[dateKeys.length - 1];
  const week = weekOf(selected);
  // Same weekday one week over, pulled back inside the pickable window at either end.
  const stepWeek = (weeks: number) => {
    const target = toDateKey(addDays(dateFromKey(selected), weeks * 7));
    onSelect(target < first ? first : target > last ? last : target);
  };
  return (
    <View style={styles.navigator}>
      <View style={styles.header}>
        <AppText variant="displayLg" style={styles.grow}>
          {monthTitle(selected)}
        </AppText>
        <WeekButton icon="chevron-back" label="Tuần trước" disabled={week[0] <= first} onPress={() => stepWeek(-1)} />
        <WeekButton icon="chevron-forward" label="Tuần sau" disabled={week[6] >= last} onPress={() => stepWeek(1)} />
      </View>
      <DateStrip dateKeys={dateKeys} selected={selected} onSelect={onSelect} />
    </View>
  );
}

/** Round calendar control for a screen header: opens month grids to jump to any pickable day. */
export function CalendarButton({ dateKeys, selected, onSelect }: DateNavigatorProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Chọn ngày trong ${dateKeys.length - 1} ngày tới`}
        hitSlop={spacing.xs}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.calendarButton, pressed && styles.pressed]}
      >
        <Ionicons name="calendar-outline" size={18} color={colors.ink} />
      </Pressable>
      <CalendarSheet
        visible={open}
        dateKeys={dateKeys}
        selected={selected}
        onSelect={(dateKey) => {
          onSelect(dateKey);
          setOpen(false);
        }}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

function WeekButton({ icon, label, disabled, onPress }: { icon: 'chevron-back' | 'chevron-forward'; label: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      aria-disabled={disabled}
      disabled={disabled}
      hitSlop={spacing.xs}
      onPress={onPress}
      style={({ pressed }) => [styles.weekButton, pressed && styles.pressed, disabled && styles.weekButtonDisabled]}
    >
      <Ionicons name={icon} size={20} color={colors.ink} />
    </Pressable>
  );
}

interface CalendarSheetProps extends DateNavigatorProps {
  visible: boolean;
  onClose: () => void;
}

/** Month grids covering the bookable window; days outside it are shown but cannot be picked. */
function CalendarSheet({ visible, dateKeys, selected, onSelect, onClose }: CalendarSheetProps) {
  const insets = useSafeAreaInsets();
  const today = dateKeys[0];
  const last = dateKeys[dateKeys.length - 1];
  // One grid per calendar month the window touches.
  const months = [...new Set(dateKeys.map((dateKey) => dateKey.slice(0, 7)))];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable accessibilityLabel="Đóng" style={styles.scrim} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.handle} />
        <AppText variant="displayMd" accessibilityRole="header">
          Chọn ngày
        </AppText>
        <AppText variant="bodySm" color="muted">
          Chọn được đến {formatDateKey(last)}, tức {dateKeys.length - 1} ngày kể từ hôm nay.
        </AppText>
        <ScrollView contentContainerStyle={styles.months}>
          {months.map((month) => {
            const [year, monthNumber] = month.split('-').map(Number);
            return (
              <View key={month} style={styles.month}>
                <AppText variant="titleMd">
                  Tháng {monthNumber}, {year}
                </AppText>
                <View style={styles.week}>
                  {WEEKDAY_HEADERS.map((label) => (
                    <AppText key={label} variant="captionSm" color="muted" style={styles.weekday}>
                      {label}
                    </AppText>
                  ))}
                </View>
                {monthWeeks(year, monthNumber - 1).map((week, index) => (
                  <View key={index} style={styles.week}>
                    {week.map((dateKey, column) => {
                      if (!dateKey) return <View key={column} style={styles.dayCell} />;
                      const bookable = dateKey >= today && dateKey <= last;
                      const isSelected = dateKey === selected;
                      return (
                        <View key={column} style={styles.dayCell}>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`${dateKey === today ? 'Hôm nay, ' : ''}${formatDateKey(dateKey)}`}
                            aria-selected={isSelected}
                            aria-disabled={!bookable}
                            disabled={!bookable}
                            onPress={() => onSelect(dateKey)}
                            style={[styles.day, isSelected && styles.daySelected]}
                          >
                            <AppText variant="titleSm" color={isSelected ? 'onPrimary' : bookable ? 'ink' : 'borderStrong'}>
                              {dateFromKey(dateKey).getDate()}
                            </AppText>
                            {dateKey === today ? <View style={[styles.todayDot, isSelected && styles.todayDotSelected]} /> : null}
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = themed(() => ({
  navigator: { gap: spacing.sm, paddingBottom: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.lg },
  grow: { flex: 1 },
  // Same height and outline as the presence pill it sits beside.
  calendarButton: {
    width: CONTROL_HEIGHT,
    height: CONTROL_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.canvas,
  },
  weekButton: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full },
  weekButtonDisabled: { opacity: 0.3 },
  pressed: { backgroundColor: colors.surfaceSoft },
  scrim: { flex: 1, backgroundColor: colors.scrim },
  sheet: {
    maxHeight: '80%',
    marginTop: -radius.xl,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: colors.canvas,
  },
  handle: { alignSelf: 'center', width: 32, height: 4, marginBottom: spacing.sm, borderRadius: radius.full, backgroundColor: colors.hairline },
  months: { gap: spacing.lg, paddingTop: spacing.md },
  month: { gap: spacing.sm },
  week: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center' },
  dayCell: { flex: 1, alignItems: 'center' },
  day: { width: DAY_SIZE, height: DAY_SIZE, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full },
  daySelected: { backgroundColor: colors.primary },
  todayDot: { position: 'absolute', bottom: spacing.xs, width: 4, height: 4, borderRadius: radius.full, backgroundColor: colors.primary },
  todayDotSelected: { backgroundColor: colors.onPrimary },
}));
