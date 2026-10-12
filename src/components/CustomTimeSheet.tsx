import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { MinuteRange } from '../domain/conflict';
import { formatDuration, formatMinutes, formatRange, formatTimeEntry, resolveTimeInput } from '../domain/time';
import { colors, radius, spacing } from '../theme/tokens';
import { AppText } from './AppText';
import { Button } from './Button';
import { TextField } from './TextField';

interface CustomTimeSheetProps {
  /** The time to start editing from; null keeps the sheet closed. */
  initial: MinuteRange | null;
  /** The rules in one line, e.g. opening hours and the longest stay. */
  rules: string;
  /** Why this time cannot be booked, or null when it can. */
  validate: (range: MinuteRange) => string | null;
  onConfirm: (range: MinuteRange) => void;
  onClose: () => void;
}

/** Lets a student type their own start and end instead of taking a whole slot. */
export function CustomTimeSheet({ initial, rules, validate, onConfirm, onClose }: CustomTimeSheetProps) {
  return (
    <Modal visible={initial !== null} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable accessibilityLabel="Đóng" style={styles.scrim} onPress={onClose} />
        {/* Mounted per opening so the fields start from the block that was pressed. */}
        {initial ? <SheetBody initial={initial} rules={rules} validate={validate} onConfirm={onConfirm} onClose={onClose} /> : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}

function SheetBody({ initial, rules, validate, onConfirm, onClose }: CustomTimeSheetProps & { initial: MinuteRange }) {
  const insets = useSafeAreaInsets();
  const [startText, setStartText] = useState(formatMinutes(initial.startMinutes));
  const [endText, setEndText] = useState(formatMinutes(initial.endMinutes));

  const startMinutes = resolveTimeInput(startText);
  const endMinutes = resolveTimeInput(endText);
  const range = startMinutes !== null && endMinutes !== null ? { startMinutes, endMinutes } : null;
  const problem = range ? validate(range) : 'Nhập đủ giờ và phút, ví dụ 13:05.';

  return (
    <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.base }]}>
      <View style={styles.handle} />
      <AppText variant="displayMd" accessibilityRole="header">
        Tuỳ chỉnh giờ đặt
      </AppText>
      <AppText variant="bodySm" color="muted">
        {rules} Gõ 4 chữ số theo dạng giờ:phút, phút quá 59 sẽ tự cộng sang giờ (13:99 thành 14:39).
      </AppText>
      <View style={styles.fields}>
        <TimeField label="Bắt đầu" value={startText} onChange={setStartText} placeholder="13:05" />
        <TimeField label="Kết thúc" value={endText} onChange={setEndText} placeholder="14:40" />
      </View>
      <View accessibilityLiveRegion="polite" style={styles.status}>
        {problem || !range ? (
          <AppText variant="bodySm" color="error">
            {problem}
          </AppText>
        ) : (
          <AppText variant="titleMd" color="successInk">
            {formatRange(range.startMinutes, range.endMinutes)} · {formatDuration(range.endMinutes - range.startMinutes)}
          </AppText>
        )}
      </View>
      <Button label="Dùng giờ này" disabled={problem !== null || !range} onPress={() => range && onConfirm(range)} />
      <Button label="Huỷ" variant="tertiary" onPress={onClose} />
    </View>
  );
}

/** Types as HH:mm: the colon is added for the student and minutes past 59 roll into the hour. */
function TimeField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (text: string) => void; placeholder: string }) {
  const tidy = () => {
    const minutes = resolveTimeInput(value);
    if (minutes !== null) onChange(formatMinutes(minutes));
  };
  return (
    <View style={styles.field}>
      <TextField
        label={label}
        value={value}
        onChangeText={(text) => onChange(formatTimeEntry(text))}
        onBlur={tidy}
        placeholder={placeholder}
        keyboardType="number-pad"
        autoCorrect={false}
        maxLength={5}
        selectTextOnFocus
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scrim: { flex: 1, backgroundColor: colors.scrim },
  sheet: {
    marginTop: -radius.xl,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: colors.canvas,
  },
  handle: { alignSelf: 'center', width: 32, height: 4, marginBottom: spacing.sm, borderRadius: radius.full, backgroundColor: colors.hairline },
  fields: { flexDirection: 'row', gap: spacing.base },
  field: { flex: 1 },
  status: { minHeight: 40, justifyContent: 'center' },
});
