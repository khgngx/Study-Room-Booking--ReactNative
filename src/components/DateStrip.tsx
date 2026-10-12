import { Pressable, View } from 'react-native';

import { dateFromKey, formatDateKey, weekdayLabel, weekOf } from '../domain/time';
import { themed } from '../theme/themed';
import { colors, radius, spacing, type ColorToken } from '../theme/tokens';
import { AppText } from './AppText';

type Tone = 'weekday' | 'weekend' | 'selected';

/** Calendar-leaf colours: a tinted tab for the weekday over a white leaf for the date. */
const TONE: Record<Tone, { tab: ColorToken; label: ColorToken; leaf: ColorToken; day: ColorToken; border: ColorToken }> = {
  weekday: { tab: 'surfaceStrong', label: 'muted', leaf: 'canvas', day: 'ink', border: 'hairline' },
  // Babu sets the weekend apart without competing with the Rausch of the selected day.
  weekend: { tab: 'successSoft', label: 'successInk', leaf: 'canvas', day: 'successInk', border: 'successSoft' },
  selected: { tab: 'primary', label: 'onPrimary', leaf: 'primarySoft', day: 'primaryActive', border: 'primary' },
};

interface DateStripProps {
  /** Every day that can be picked, starting today. Days of the shown week outside it are greyed out. */
  dateKeys: readonly string[];
  selected: string;
  onSelect: (dateKey: string) => void;
}

/** The Monday-to-Sunday week around the selected day, one calendar leaf per day. */
export function DateStrip({ dateKeys, selected, onSelect }: DateStripProps) {
  const today = dateKeys[0];
  return (
    <View style={styles.row}>
      {weekOf(selected).map((dateKey, index) => {
        const isSelected = dateKey === selected;
        const isToday = dateKey === today;
        const pickable = dateKeys.includes(dateKey);
        const tone = TONE[isSelected ? 'selected' : index >= 5 ? 'weekend' : 'weekday'];
        return (
          <Pressable
            key={dateKey}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected, disabled: !pickable }}
            aria-selected={isSelected}
            aria-disabled={!pickable}
            accessibilityLabel={`${isToday ? 'Hôm nay, ' : ''}${formatDateKey(dateKey)}`}
            disabled={!pickable}
            onPress={() => onSelect(dateKey)}
            style={[styles.cell, { borderColor: colors[tone.border] }, !pickable && styles.unavailable]}
          >
            <View style={[styles.tab, { backgroundColor: colors[tone.tab] }]}>
              <AppText variant="captionSm" color={tone.label} numberOfLines={1}>
                {weekdayLabel(dateKey)}
              </AppText>
            </View>
            <View style={[styles.leaf, { backgroundColor: colors[tone.leaf] }]}>
              <AppText variant="displaySm" color={tone.day}>
                {dateFromKey(dateKey).getDate()}
              </AppText>
              <View style={[styles.todayDot, isToday && { backgroundColor: colors[tone.day] }]} />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = themed(() => ({
  row: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg },
  cell: { flex: 1, borderRadius: radius.md, borderWidth: 1, overflow: 'hidden' },
  unavailable: { opacity: 0.4 },
  tab: { alignItems: 'center', paddingVertical: spacing.xs },
  leaf: { alignItems: 'center', gap: spacing.xxs, paddingTop: spacing.sm, paddingBottom: spacing.xs },
  // Present on every day so all leaves are the same height; only today's is coloured.
  todayDot: { width: 4, height: 4, borderRadius: radius.full },
}));
