import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PRESENCES, type Presence } from '../domain/types';
import { usePresence } from '../hooks/usePresence';
import { useBookingStore, useCurrentUser } from '../store/useBookingStore';
import { colors, radius, spacing } from '../theme/tokens';
import { AppText } from './AppText';
import { PRESENCE_DESCRIPTION, PRESENCE_LABEL } from './labels';

export const PRESENCE_DOT_COLOR: Record<Presence, string> = {
  online: colors.success,
  busy: colors.primary,
  inactive: colors.mutedSoft,
};

/** Top-right status control: shows the signed-in user's presence and lets them change it. */
export function PresencePill() {
  const insets = useSafeAreaInsets();
  const user = useCurrentUser();
  const presence = usePresence();
  const changePresence = useBookingStore((state) => state.changePresence);
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const choose = (next: Presence) => {
    setOpen(false);
    if (next !== presence) void changePresence(next);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Trạng thái: ${PRESENCE_LABEL[presence]}. Chạm để đổi.`}
        hitSlop={spacing.sm}
        onPress={() => setOpen(true)}
        style={styles.pill}
      >
        <View style={[styles.dot, { backgroundColor: PRESENCE_DOT_COLOR[presence] }]} />
        <AppText variant="buttonSm">{PRESENCE_LABEL[presence]}</AppText>
        <Ionicons name="chevron-down" size={14} color={colors.ink} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable accessibilityLabel="Đóng" style={styles.scrim} onPress={() => setOpen(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.handle} />
          <AppText variant="displayMd" accessibilityRole="header">
            Trạng thái của bạn
          </AppText>
          {PRESENCES.map((option) => {
            const selected = option === presence;
            return (
              <Pressable
                key={option}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => choose(option)}
                style={styles.option}
              >
                <View style={[styles.dot, styles.optionDot, { backgroundColor: PRESENCE_DOT_COLOR[option] }]} />
                <View style={styles.optionText}>
                  <AppText variant="titleMd">{PRESENCE_LABEL[option]}</AppText>
                  <AppText variant="bodySm" color="muted">
                    {PRESENCE_DESCRIPTION[option]}
                  </AppText>
                </View>
                {selected ? <Ionicons name="checkmark" size={20} color={colors.ink} /> : null}
              </Pressable>
            );
          })}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + spacing.xxs,
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.canvas,
  },
  dot: { width: 8, height: 8, borderRadius: radius.full },
  scrim: { flex: 1, backgroundColor: colors.scrim },
  sheet: {
    marginTop: -radius.xl,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: colors.canvas,
  },
  handle: {
    alignSelf: 'center',
    width: 32,
    height: 4,
    marginBottom: spacing.lg,
    borderRadius: radius.full,
    backgroundColor: colors.hairline,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    paddingVertical: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineSoft,
  },
  optionDot: { width: 12, height: 12 },
  optionText: { flex: 1, gap: spacing.xxs },
});
