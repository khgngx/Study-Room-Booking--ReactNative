import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { dateFromKey, weekdayLabel } from '../domain/time';
import { colors, radius, spacing } from '../theme/tokens';
import { AppText } from './AppText';

interface DateStripProps {
  dateKeys: readonly string[];
  selected: string;
  onSelect: (dateKey: string) => void;
}

/** A week of day tiles spread across the screen: ink fill when selected, a dot under today. */
export function DateStrip({ dateKeys, selected, onSelect }: DateStripProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.strip} contentContainerStyle={styles.row}>
      {dateKeys.map((dateKey, index) => {
        const isSelected = dateKey === selected;
        const isToday = index === 0;
        return (
          <Pressable
            key={dateKey}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${isToday ? 'Hôm nay, ngày' : 'Ngày'} ${dateFromKey(dateKey).getDate()}`}
            onPress={() => onSelect(dateKey)}
            style={[styles.cell, isSelected && styles.cellSelected]}
          >
            <AppText variant="captionSm" color={isSelected ? 'onDark' : 'muted'}>
              {isToday ? 'Nay' : weekdayLabel(dateKey)}
            </AppText>
            <AppText variant="displaySm" color={isSelected ? 'onDark' : 'ink'}>
              {dateFromKey(dateKey).getDate()}
            </AppText>
            <View style={[styles.todayDot, isToday && styles.todayDotOn]} />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // A horizontal ScrollView otherwise stretches or collapses along the screen's column.
  strip: { flexGrow: 0, flexShrink: 0 },
  row: { flexGrow: 1, gap: spacing.xs, paddingHorizontal: spacing.lg },
  cell: {
    flex: 1,
    minWidth: 44,
    alignItems: 'center',
    gap: spacing.xxs,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    borderRadius: radius.md,
  },
  cellSelected: { backgroundColor: colors.ink },
  todayDot: { width: 4, height: 4, borderRadius: radius.full },
  todayDotOn: { backgroundColor: colors.primary },
});
