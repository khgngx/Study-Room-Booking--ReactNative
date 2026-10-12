import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Pressable, View } from 'react-native';

import { translate } from '../i18n';
import { canSwitchFrame } from '../services/frame';
import { usePreferencesStore, type Language, type ThemePreference } from '../store/usePreferencesStore';
import { USE_NATIVE_DRIVER } from '../theme/motion';
import { themed } from '../theme/themed';
import { colors, CONTROL_HEIGHT, radius, spacing } from '../theme/tokens';
import { AppText } from './AppText';

type IconName = keyof typeof Ionicons.glyphMap;

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: IconName }[] = [
  { value: 'light', label: 'Sáng', icon: 'sunny-outline' },
  { value: 'dark', label: 'Tối', icon: 'moon-outline' },
  { value: 'system', label: 'Theo máy', icon: 'phone-portrait-outline' },
];

// Language names are shown in their own language, whichever one is active.
const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'vi', label: 'VIE' },
  { value: 'en', label: 'ENG' },
];

const TRACK_WIDTH = 40;
const THUMB_SIZE = 18;
const THUMB_INSET = 3;

interface PreferencesBarProps {
  /** `bar` is one centred line for headers and toolbars; `list` is labelled rows for a settings card. */
  layout?: 'bar' | 'list';
  /** Overrides whether the Web app / Mobile app switch is offered. Defaults to wherever it makes sense. */
  frameSwitch?: boolean;
}

/** Display controls: phone-sized frame (web only), colour mode and language. */
export function PreferencesBar({ layout = 'bar', frameSwitch = canSwitchFrame() }: PreferencesBarProps) {
  const theme = usePreferencesStore((state) => state.theme);
  const language = usePreferencesStore((state) => state.language);
  const setTheme = usePreferencesStore((state) => state.setTheme);
  const setLanguage = usePreferencesStore((state) => state.setLanguage);
  const list = layout === 'list';

  const items: { key: string; icon: IconName; title: string; control: ReactNode }[] = [
    ...(frameSwitch ? [{ key: 'frame', icon: 'browsers-outline' as const, title: 'Khung hiển thị', control: <FrameSwitch compact={list} /> }] : []),
    { key: 'theme', icon: 'contrast-outline', title: 'Chế độ màu', control: <Segmented label="Chế độ màu" options={THEME_OPTIONS} value={theme} onChange={setTheme} /> },
    { key: 'language', icon: 'language-outline', title: 'Ngôn ngữ', control: <Segmented label="Ngôn ngữ" options={LANGUAGE_OPTIONS} value={language} onChange={setLanguage} /> },
  ];

  if (!list) {
    return (
      <View style={styles.bar}>
        {items.map((item) => (
          <View key={item.key}>{item.control}</View>
        ))}
      </View>
    );
  }
  return (
    <View>
      {items.map((item, index) => (
        <View key={item.key} style={[styles.listRow, index > 0 && styles.listRowDivided]}>
          <View style={styles.listIcon}>
            <Ionicons name={item.icon} size={20} color={colors.ink} />
          </View>
          <AppText variant="titleMd" numberOfLines={1} style={styles.listTitle}>
            {item.title}
          </AppText>
          {item.control}
        </View>
      ))}
    </View>
  );
}

/** Sliding switch between the full browser layout and the phone-sized frame. */
export function FrameSwitch({ compact = false }: { /** Icons instead of the two words, where the row is short on width. */ compact?: boolean }) {
  const frame = usePreferencesStore((state) => state.frame);
  const setFrame = usePreferencesStore((state) => state.setFrame);
  const mobile = frame === 'mobile';
  // Not `useAnimatedValue`: react-native-web does not export it.
  const [position] = useState(() => new Animated.Value(mobile ? 1 : 0));
  useEffect(() => {
    Animated.timing(position, { toValue: mobile ? 1 : 0, duration: 180, useNativeDriver: USE_NATIVE_DRIVER }).start();
  }, [mobile, position]);
  const travel = position.interpolate({ inputRange: [0, 1], outputRange: [0, TRACK_WIDTH - THUMB_SIZE - THUMB_INSET * 2] });

  // Both sides are set identically; the thumb alone says which one is on.
  const side = (label: string, icon: IconName) =>
    compact ? <Ionicons name={icon} size={16} color={colors.ink} /> : <AppText variant="buttonSm">{label}</AppText>;

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={translate('Khung hiển thị') + ': Web app / Mobile app'}
      aria-checked={mobile}
      onPress={() => setFrame(mobile ? 'web' : 'mobile')}
      style={styles.frameSwitch}
    >
      {side('Web app', 'desktop-outline')}
      <View style={[styles.track, mobile && styles.trackOn]}>
        <Animated.View style={[styles.thumb, { transform: [{ translateX: travel }] }]} />
      </View>
      {side('Mobile app', 'phone-portrait-outline')}
    </Pressable>
  );
}

interface SegmentedProps<Value extends string> {
  /** What the group chooses, for screen readers. Options with an icon show only the icon; their label is read out. */
  label: string;
  options: readonly { value: Value; label: string; icon?: IconName }[];
  value: Value;
  onChange: (value: Value) => void;
}

/** One-of-many pill: the chosen segment is filled, the rest stay quiet. */
function Segmented<Value extends string>({ label, options, value, onChange }: SegmentedProps<Value>) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={translate(label)} style={styles.segmented}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={translate(option.label)}
            aria-checked={selected}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && styles.segmentSelected]}
          >
            {option.icon ? (
              <Ionicons name={option.icon} size={16} color={selected ? colors.onDark : colors.ink} />
            ) : (
              <AppText variant="buttonSm" color={selected ? 'onDark' : 'ink'}>
                {option.label}
              </AppText>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = themed(() => ({
  bar: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 64, paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  listRowDivided: { borderTopWidth: 1, borderTopColor: colors.hairlineSoft },
  listIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full, backgroundColor: colors.surfaceStrong },
  listTitle: { flex: 1 },
  frameSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: CONTROL_HEIGHT,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.canvas,
  },
  track: {
    width: TRACK_WIDTH,
    height: THUMB_SIZE + THUMB_INSET * 2,
    padding: THUMB_INSET,
    borderRadius: radius.full,
    backgroundColor: colors.borderStrong,
  },
  trackOn: { backgroundColor: colors.primary },
  thumb: { width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: radius.full, backgroundColor: colors.onPrimary },
  segmented: {
    flexDirection: 'row',
    height: CONTROL_HEIGHT,
    padding: spacing.xs - 1,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.canvas,
  },
  segment: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 32,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
  },
  segmentSelected: { backgroundColor: colors.ink },
}));
