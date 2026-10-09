import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { dateFromKey, weekdayLabel } from '../domain/time';
import { colors, radius, spacing } from '../theme/tokens';
import { AppText } from './AppText';

interface DateStripProps {
  dateKeys: readonly string[];
  selected: string;
  onSelect: (dateKey: string) => void;
}

/** Row of `date-picker-day` cells: 40px circles, ink fill when selected. */
export function DateStrip({ dateKeys, selected, onSelect }: DateStripProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {dateKeys.map((dateKey, index) => {
        const isSelected = dateKey === selected;
        return (
          <Pressable
            key={dateKey}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`Ngày ${dateFromKey(dateKey).getDate()}`}
            onPress={() => onSelect(dateKey)}
            style={styles.cell}
          >
            <AppText variant="captionSm" color="muted">
              {index === 0 ? 'Nay' : weekdayLabel(dateKey)}
            </AppText>
            <View style={[styles.day, isSelected && styles.daySelected]}>
              <AppText variant="bodySm" color={isSelected ? 'onDark' : 'ink'}>
                {dateFromKey(dateKey).getDate()}
              </AppText>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingHorizontal: spacing.lg },
  cell: { alignItems: 'center', gap: spacing.xs + spacing.xxs, minWidth: 44 },
  day: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full },
  daySelected: { backgroundColor: colors.ink },
});
