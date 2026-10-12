import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors, radius, spacing, type ColorToken } from '../theme/tokens';
import { AppText } from './AppText';

// Marks stay thin with a rounded data end; values and labels are always ink, never the series colour.
const BAR_RADIUS = 4;
const SEGMENT_GAP = 2;
const VALUE_LABEL_HEIGHT = 18;
/** Past this many columns the labels would collide, so only the peak is labelled and the axis thins out. */
const MAX_LABELLED_COLUMNS = 10;

export interface ChartDatum {
  key: string;
  label: string;
  value: number;
}

interface ColumnChartProps {
  data: readonly ChartDatum[];
  color: ColorToken;
  height?: number;
  /** Spoken summary, since the columns themselves are hidden from screen readers. */
  summary: string;
}

/** Vertical bars on a shared zero baseline: one value per day or hour. */
export function ColumnChart({ data, color, height = 132, summary }: ColumnChartProps) {
  const peak = Math.max(1, ...data.map((item) => item.value));
  const dense = data.length > MAX_LABELLED_COLUMNS;
  const peakIndex = data.findIndex((item) => item.value === peak);
  const labelEvery = dense ? Math.ceil(data.length / 6) : 1;
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={summary}>
      <View style={[styles.columns, { height: height + VALUE_LABEL_HEIGHT }]}>
        {data.map((item, index) => (
          <View key={item.key} style={styles.column}>
            {!dense || index === peakIndex ? (
              <AppText variant="captionSm" color={item.value === 0 ? 'mutedSoft' : 'ink'} numberOfLines={1} style={styles.valueLabel}>
                {item.value}
              </AppText>
            ) : null}
            <View
              style={[
                styles.bar,
                dense && styles.barDense,
                { height: Math.max(item.value === 0 ? 2 : BAR_RADIUS, (item.value / peak) * height), backgroundColor: colors[item.value === 0 ? 'hairline' : color] },
              ]}
            />
          </View>
        ))}
      </View>
      <View style={styles.axis}>
        {data.map((item, index) => (
          <View key={item.key} style={styles.column}>
            {index % labelEvery === 0 ? (
              <AppText variant="captionSm" color="muted" numberOfLines={1} style={styles.axisLabel}>
                {item.label}
              </AppText>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

interface BarListProps {
  /** `value` is 0–1 of the track; `detail` is the figure printed at the row's end. */
  data: readonly (ChartDatum & { detail: string })[];
  color: ColorToken;
}

/** Horizontal bars for a handful of named things, each labelled with its own figure. */
export function BarList({ data, color }: BarListProps) {
  return (
    <View style={styles.barList}>
      {data.map((item) => (
        <View key={item.key} style={styles.barRow} accessible accessibilityLabel={`${item.label}: ${item.detail}`}>
          <View style={styles.barRowHeader}>
            <AppText variant="titleSm" numberOfLines={1} style={styles.grow}>
              {item.label}
            </AppText>
            <AppText variant="bodySm" color="muted">
              {item.detail}
            </AppText>
          </View>
          <View style={styles.track}>
            <View style={[styles.trackFill, { width: `${Math.min(1, Math.max(0, item.value)) * 100}%`, backgroundColor: colors[color] }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

export interface DonutSegment {
  key: string;
  label: string;
  value: number;
  color: ColorToken;
}

interface DonutChartProps {
  segments: readonly DonutSegment[];
  /** Printed in the hole: the total, with a short caption under it. */
  total: string;
  caption: string;
  size?: number;
}

const DONUT_STROKE = 14;

/** Parts of a whole as a ring, with a legend that states every count so colour is never the only cue. */
export function DonutChart({ segments, total, caption, size = 132 }: DonutChartProps) {
  const sum = segments.reduce((running, segment) => running + segment.value, 0);
  const radiusPx = (size - DONUT_STROKE) / 2;
  const circumference = 2 * Math.PI * radiusPx;
  const visible = segments.filter((segment) => segment.value > 0);
  // The gap between neighbours is cut out of each arc; a lone segment closes the ring.
  const gap = visible.length > 1 ? SEGMENT_GAP : 0;
  const arcs = visible.map((segment, index) => {
    const before = visible.slice(0, index).reduce((running, earlier) => running + earlier.value, 0);
    return { ...segment, length: Math.max(0, (segment.value / sum) * circumference - gap), offset: (before / sum) * circumference };
  });

  return (
    <View style={styles.donutRow}>
      <View style={{ width: size, height: size }} accessible accessibilityRole="image" accessibilityLabel={`${caption}: ${total}`}>
        <Svg width={size} height={size}>
          <Circle cx={size / 2} cy={size / 2} r={radiusPx} stroke={colors.surfaceStrong} strokeWidth={DONUT_STROKE} fill="none" />
          {arcs.map((arc) => (
            <Circle
              key={arc.key}
              cx={size / 2}
              cy={size / 2}
              r={radiusPx}
              stroke={colors[arc.color]}
              strokeWidth={DONUT_STROKE}
              fill="none"
              strokeDasharray={`${arc.length} ${circumference - arc.length}`}
              strokeDashoffset={-arc.offset}
              // Start at 12 o'clock rather than SVG's 3 o'clock.
              rotation={-90}
              origin={`${size / 2}, ${size / 2}`}
            />
          ))}
        </Svg>
        <View style={styles.donutCenter} pointerEvents="none">
          <AppText variant="displayXl">{total}</AppText>
          <AppText variant="captionSm" color="muted">
            {caption}
          </AppText>
        </View>
      </View>
      <View style={styles.legend}>
        {segments.map((segment) => (
          <View key={segment.key} style={styles.legendRow}>
            <View style={[styles.legendSwatch, { backgroundColor: colors[segment.color] }]} />
            <AppText variant="bodySm" numberOfLines={1} style={styles.grow}>
              {segment.label}
            </AppText>
            <AppText variant="caption">{segment.value}</AppText>
            <AppText variant="captionSm" color="muted" style={styles.legendShare}>
              {sum > 0 ? `${Math.round((segment.value / sum) * 100)}%` : '0%'}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  columns: { flexDirection: 'row', alignItems: 'flex-end', gap: SEGMENT_GAP, borderBottomWidth: 1, borderBottomColor: colors.hairline },
  column: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  valueLabel: { height: VALUE_LABEL_HEIGHT },
  bar: { width: '100%', maxWidth: 28, borderTopLeftRadius: BAR_RADIUS, borderTopRightRadius: BAR_RADIUS },
  barDense: { maxWidth: 12 },
  axis: { flexDirection: 'row', gap: SEGMENT_GAP, paddingTop: spacing.xs },
  // Wider than its column so a sparse label is not clipped; neighbours are blank when that happens.
  axisLabel: { minWidth: 40, textAlign: 'center' },
  barList: { gap: spacing.md },
  barRow: { gap: spacing.xs + spacing.xxs },
  barRowHeader: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  grow: { flex: 1 },
  track: { height: 8, borderRadius: radius.full, backgroundColor: colors.surfaceStrong, overflow: 'hidden' },
  trackFill: { height: 8, borderRadius: radius.full },
  donutRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  donutCenter: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  legend: { flex: 1, gap: spacing.sm },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  legendSwatch: { width: 10, height: 10, borderRadius: radius.full },
  legendShare: { width: 34, textAlign: 'right' },
});
