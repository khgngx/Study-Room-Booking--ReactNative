import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../../components/AppText';
import { Chip } from '../../components/Chip';
import { Divider, ReadOnlyBanner } from '../../components/Layout';
import { generateSlots } from '../../domain/slots';
import { useCanAct } from '../../hooks/usePresence';
import { usePolicyStore } from '../../store/usePolicyStore';
import { colors, radius, spacing } from '../../theme/tokens';

const SLOT_OPTIONS = [60, 90, 120];
const REMINDER_OPTIONS = [10, 15, 30];
const CLOSING_OPTIONS = ['17:00', '19:00', '21:00'];
const DAILY_LIMIT = { min: 1, max: 4 };

export function PolicyScreen() {
  const policy = usePolicyStore((state) => state.policy);
  const updatePolicy = usePolicyStore((state) => state.updatePolicy);
  const canAct = useCanAct();
  const slots = generateSlots(policy);
  const lastWindow = policy.openingWindows[policy.openingWindows.length - 1];

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
      <AppText variant="bodySm" color="muted">
        Thay đổi có hiệu lực ngay. Các lượt đã đặt giữ nguyên giờ cũ và vẫn chặn khung giờ trùng.
      </AppText>

      <Section title="Độ dài khung giờ">
        <View style={styles.chips}>
          {SLOT_OPTIONS.map((minutes) => (
            <Chip key={minutes} label={`${minutes} phút`} selected={policy.slotMinutes === minutes} disabled={!canAct} onPress={() => updatePolicy({ slotMinutes: minutes })} />
          ))}
        </View>
      </Section>

      <Section title="Giờ đóng cửa buổi chiều">
        <View style={styles.chips}>
          {CLOSING_OPTIONS.map((end) => (
            <Chip key={end} label={end} selected={lastWindow?.end === end} disabled={!canAct} onPress={() => setClosing(end)} />
          ))}
        </View>
        <AppText variant="bodySm" color="muted">
          Mở cửa: {policy.openingWindows.map((window) => `${window.start} – ${window.end}`).join(' và ')}
        </AppText>
      </Section>

      <Section title="Giới hạn lượt đặt mỗi ngày">
        <View style={styles.stepper}>
          <StepButton icon="remove" label="Giảm" disabled={!canAct || policy.maxBookingsPerDay <= DAILY_LIMIT.min} onPress={() => stepLimit(-1)} />
          <AppText variant="displaySm" style={styles.stepValue}>
            {policy.maxBookingsPerDay}
          </AppText>
          <StepButton icon="add" label="Tăng" disabled={!canAct || policy.maxBookingsPerDay >= DAILY_LIMIT.max} onPress={() => stepLimit(1)} />
          <AppText variant="bodySm" color="muted">
            lượt / sinh viên / ngày
          </AppText>
        </View>
      </Section>

      <Section title="Nhắc trước giờ check-in">
        <View style={styles.chips}>
          {REMINDER_OPTIONS.map((minutes) => (
            <Chip key={minutes} label={`${minutes} phút`} selected={policy.reminderMinutes === minutes} disabled={!canAct} onPress={() => updatePolicy({ reminderMinutes: minutes })} />
          ))}
        </View>
      </Section>

      <Section title={`Khung giờ trong ngày (${slots.length})`}>
        <AppText color="body">{slots.map((slot) => slot.label).join('\n') || 'Không có khung giờ nào.'}</AppText>
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <Divider />
      <View style={styles.section}>
        <AppText variant="displaySm">{title}</AppText>
        {children}
      </View>
    </>
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
      <Ionicons name={icon} size={16} color={colors.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.lg, gap: spacing.lg },
  section: { gap: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepValue: { minWidth: 24, textAlign: 'center' },
  stepButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.canvas,
  },
  stepDisabled: { opacity: 0.4 },
});
