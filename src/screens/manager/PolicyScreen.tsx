import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../../components/AppText';
import { Chip } from '../../components/Chip';
import { ReadOnlyBanner } from '../../components/Layout';
import { generateSlots } from '../../domain/slots';
import { formatDuration, parseTime } from '../../domain/time';
import { useCanAct } from '../../hooks/usePresence';
import { usePolicyStore } from '../../store/usePolicyStore';
import { colors, radius, spacing, type ColorToken } from '../../theme/tokens';

type IconName = keyof typeof Ionicons.glyphMap;

const SLOT_OPTIONS = [60, 90, 120];
const REMINDER_OPTIONS = [10, 15, 30];
const CLOSING_OPTIONS = ['17:00', '19:00', '21:00'];
const DAILY_LIMIT = { min: 1, max: 4 };
const NOON = 12 * 60;

export function PolicyScreen() {
  const policy = usePolicyStore((state) => state.policy);
  const updatePolicy = usePolicyStore((state) => state.updatePolicy);
  const canAct = useCanAct();
  const slots = generateSlots(policy);
  const lastWindow = policy.openingWindows[policy.openingWindows.length - 1];
  const openMinutes = policy.openingWindows.reduce((sum, window) => sum + parseTime(window.end) - parseTime(window.start), 0);

  const setClosing = (end: string) =>
    updatePolicy({
      openingWindows: policy.openingWindows.map((window, index) =>
        index === policy.openingWindows.length - 1 ? { ...window, end } : window,
      ),
    });
  const stepLimit = (delta: number) =>
    updatePolicy({
      maxBookingsPerDay: Math.min(DAILY_LIMIT.max, Math.max(DAILY_LIMIT.min, policy.maxBookingsPerDay + delta)),
    });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {canAct ? null : <ReadOnlyBanner />}

      <View style={styles.summary}>
        <SummaryStat value={formatDuration(openMinutes)} label="mở cửa mỗi ngày" />
        <SummaryStat value={String(slots.length)} label="khung giờ mỗi ngày" divided />
        <SummaryStat value={String(policy.maxBookingsPerDay)} label="lượt mỗi sinh viên" divided />
      </View>

      <View style={styles.notice}>
        <Ionicons name="information-circle-outline" size={18} color={colors.accentInk} />
        <AppText variant="captionSm" color="body" style={styles.grow}>
          Thay đổi có hiệu lực ngay. Các lượt đã đặt giữ nguyên giờ cũ và vẫn chặn khung giờ trùng.
        </AppText>
      </View>

      <Group title="Giờ hoạt động">
        <Setting icon="time-outline" tint="primarySoft" ink="primaryActive" title="Giờ đóng cửa buổi chiều" hint={`Đang mở: ${policy.openingWindows.map((window) => `${window.start} – ${window.end}`).join(' và ')}`}>
          <View style={styles.chips}>
            {CLOSING_OPTIONS.map((end) => (
              <Chip key={end} label={end} selected={lastWindow?.end === end} disabled={!canAct} onPress={() => setClosing(end)} />
            ))}
          </View>
        </Setting>
        <Setting icon="hourglass-outline" tint="successSoft" ink="successInk" title="Độ dài khung giờ" hint="Cũng là thời lượng dài nhất của một ca tự chỉnh giờ." divided>
          <View style={styles.chips}>
            {SLOT_OPTIONS.map((minutes) => (
              <Chip key={minutes} label={`${minutes} phút`} selected={policy.slotMinutes === minutes} disabled={!canAct} onPress={() => updatePolicy({ slotMinutes: minutes })} />
            ))}
          </View>
        </Setting>
      </Group>

      <Group title="Quy định đặt phòng">
        <Setting icon="layers-outline" tint="accentSoft" ink="accentInk" title="Giới hạn lượt đặt mỗi ngày" hint={`Mỗi sinh viên đặt từ ${DAILY_LIMIT.min} đến ${DAILY_LIMIT.max} lượt một ngày.`}>
          <View style={styles.stepper}>
            <StepButton icon="remove" label="Giảm" disabled={!canAct || policy.maxBookingsPerDay <= DAILY_LIMIT.min} onPress={() => stepLimit(-1)} />
            <AppText variant="displaySm" style={styles.stepValue}>
              {policy.maxBookingsPerDay}
            </AppText>
            <StepButton icon="add" label="Tăng" disabled={!canAct || policy.maxBookingsPerDay >= DAILY_LIMIT.max} onPress={() => stepLimit(1)} />
            <AppText variant="bodySm" color="muted" style={styles.grow}>
              lượt / sinh viên / ngày
            </AppText>
          </View>
        </Setting>
        <Setting icon="notifications-outline" tint="primarySoft" ink="primaryActive" title="Nhắc trước giờ check-in" hint="Thông báo gửi tới sinh viên đang ở trạng thái Trực tiếp." divided>
          <View style={styles.chips}>
            {REMINDER_OPTIONS.map((minutes) => (
              <Chip key={minutes} label={`${minutes} phút`} selected={policy.reminderMinutes === minutes} disabled={!canAct} onPress={() => updatePolicy({ reminderMinutes: minutes })} />
            ))}
          </View>
        </Setting>
      </Group>

      <Group title={`Khung giờ trong ngày (${slots.length})`}>
        <View style={styles.preview}>
          {slots.length === 0 ? (
            <AppText color="muted">Không có khung giờ nào. Hãy rút ngắn khung giờ hoặc lùi giờ đóng cửa.</AppText>
          ) : (
            <>
              <SlotRow label="Buổi sáng" slots={slots.filter((slot) => slot.startMinutes < NOON).map((slot) => slot.label)} />
              <SlotRow label="Buổi chiều và tối" slots={slots.filter((slot) => slot.startMinutes >= NOON).map((slot) => slot.label)} />
            </>
          )}
        </View>
      </Group>
    </ScrollView>
  );
}

function SummaryStat({ value, label, divided = false }: { value: string; label: string; divided?: boolean }) {
  return (
    <View style={[styles.summaryStat, divided && styles.summaryDivided]}>
      <AppText variant="displaySm" color="onPrimary" numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </AppText>
      <AppText variant="captionSm" color="onPrimary" style={styles.center}>
        {label}
      </AppText>
    </View>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.group}>
      <AppText variant="microLabel" color="muted" accessibilityRole="header" style={styles.groupTitle}>
        {title.toUpperCase()}
      </AppText>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

interface SettingProps {
  icon: IconName;
  tint: ColorToken;
  ink: ColorToken;
  title: string;
  hint: string;
  divided?: boolean;
  children: ReactNode;
}

function Setting({ icon, tint, ink, title, hint, divided = false, children }: SettingProps) {
  return (
    <View style={[styles.setting, divided && styles.settingDivided]}>
      <View style={styles.settingHeader}>
        <View style={[styles.settingIcon, { backgroundColor: colors[tint] }]}>
          <Ionicons name={icon} size={20} color={colors[ink]} />
        </View>
        <View style={styles.grow}>
          <AppText variant="titleMd">{title}</AppText>
          <AppText variant="bodySm" color="muted">
            {hint}
          </AppText>
        </View>
      </View>
      {children}
    </View>
  );
}

function SlotRow({ label, slots }: { label: string; slots: string[] }) {
  if (slots.length === 0) return null;
  return (
    <View style={styles.slotRow}>
      <AppText variant="caption" color="muted">
        {label}
      </AppText>
      <View style={styles.chips}>
        {slots.map((slot) => (
          <View key={slot} style={styles.slot}>
            <AppText variant="caption" color="successInk">
              {slot}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

function StepButton({ icon, label, disabled, onPress }: { icon: 'add' | 'remove'; label: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={spacing.sm}
      style={[styles.stepButton, disabled && styles.stepDisabled]}
    >
      <Ionicons name={icon} size={18} color={colors.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.lg, gap: spacing.lg },
  grow: { flex: 1 },
  center: { textAlign: 'center' },
  summary: { flexDirection: 'row', paddingVertical: spacing.base, borderRadius: radius.lg, backgroundColor: colors.primaryActive },
  summaryStat: { flex: 1, alignItems: 'center', gap: spacing.xxs, paddingHorizontal: spacing.sm },
  summaryDivided: { borderLeftWidth: 1, borderLeftColor: colors.primary },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.accentSoft },
  group: { gap: spacing.sm },
  groupTitle: { paddingHorizontal: spacing.xs, letterSpacing: 0.5 },
  card: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.hairline, backgroundColor: colors.canvas, overflow: 'hidden' },
  setting: { gap: spacing.md, padding: spacing.base },
  settingDivided: { borderTopWidth: 1, borderTopColor: colors.hairlineSoft },
  settingHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  settingIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepValue: { minWidth: 24, textAlign: 'center' },
  stepButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.canvas,
  },
  stepDisabled: { opacity: 0.4 },
  preview: { gap: spacing.base, padding: spacing.base },
  slotRow: { gap: spacing.sm },
  slot: { paddingVertical: spacing.xs + spacing.xxs, paddingHorizontal: spacing.md, borderRadius: radius.full, backgroundColor: colors.successSoft },
});
