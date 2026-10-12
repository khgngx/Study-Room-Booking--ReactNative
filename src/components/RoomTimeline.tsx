import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import type { DaySegments, TimeRange } from '../domain/timeline';
import { colors, radius } from '../theme/tokens';
import { AppText } from './AppText';
import { Hatch } from './Hatch';

const AXIS_STEP_MINUTES = 120;
const AXIS_LABEL_WIDTH = 28;
const BAR_HEIGHT = 10;
const NOW_OVERHANG = 5;

const percent = (minutes: number, range: TimeRange) =>
  `${((minutes - range.startMinutes) / (range.endMinutes - range.startMinutes)) * 100}%` as const;

const span = (segment: TimeRange, range: TimeRange) => ({
  left: percent(segment.startMinutes, range),
  width: percent(range.startMinutes + segment.endMinutes - segment.startMinutes, range),
});

const isWithin = (minutes: number | null, range: TimeRange): minutes is number =>
  minutes !== null && minutes >= range.startMinutes && minutes <= range.endMinutes;

interface RoomTimelineProps {
  range: TimeRange;
  segments: DaySegments;
  /** Minutes of day for the "now" marker, or null when the bar shows another day. */
  nowMinutes: number | null;
}

/** One room's day at a glance: green where it can be booked, grey where taken, striped where closed. */
export const RoomTimeline = memo(function RoomTimeline({ range, segments, nowMinutes }: RoomTimelineProps) {
  const showNow = isWithin(nowMinutes, range);
  return (
    <View style={styles.wrapper} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.track}>
        {segments.booked.map((segment) => (
          <View key={segment.startMinutes} style={[styles.segment, styles.booked, span(segment, range)]} />
        ))}
        {segments.closed.map((segment) => (
          <View key={segment.startMinutes} style={[styles.segment, styles.closed, span(segment, range)]}>
            <Hatch />
          </View>
        ))}
        {showNow ? <View style={[styles.segment, styles.past, { left: 0, width: percent(nowMinutes, range) }]} /> : null}
      </View>
      {showNow ? <View style={[styles.now, { left: percent(nowMinutes, range) }]} /> : null}
    </View>
  );
});

/** Hour labels that line up with the `RoomTimeline` bars below them. */
export function TimelineAxis({ range }: Pick<RoomTimelineProps, 'range'>) {
  const ticks: number[] = [];
  for (let minutes = range.startMinutes; minutes <= range.endMinutes; minutes += AXIS_STEP_MINUTES) ticks.push(minutes);
  return (
    <View style={styles.axis} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {ticks.map((minutes) => (
        <AppText key={minutes} variant="captionSm" color="muted" style={[styles.axisLabel, { left: percent(minutes, range) }]}>
          {minutes / 60}h
        </AppText>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { height: BAR_HEIGHT + NOW_OVERHANG * 2, justifyContent: 'center' },
  track: { height: BAR_HEIGHT, borderRadius: radius.xs, overflow: 'hidden', backgroundColor: colors.success },
  segment: { position: 'absolute', top: 0, bottom: 0 },
  booked: { backgroundColor: colors.borderStrong },
  closed: { backgroundColor: colors.surfaceStrong },
  // Time already gone fades back so the eye lands on what can still be booked.
  past: { backgroundColor: colors.canvas, opacity: 0.7 },
  now: { position: 'absolute', top: 0, bottom: 0, width: 2, marginLeft: -1, borderRadius: radius.full, backgroundColor: colors.primary },
  axis: { height: 18 },
  axisLabel: { position: 'absolute', top: 0, width: AXIS_LABEL_WIDTH, marginLeft: -AXIS_LABEL_WIDTH / 2, textAlign: 'center' },
});
