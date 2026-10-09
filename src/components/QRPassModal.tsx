import { Modal, Pressable, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { encodeBookingQr } from '../domain/checkin';
import { formatDateKey, formatRange } from '../domain/time';
import type { Booking, Room } from '../domain/types';
import { colors, radius, spacing } from '../theme/tokens';
import { AppText } from './AppText';
import { Button } from './Button';

interface QRPassModalProps {
  booking: Booking | null;
  room: Room | undefined;
  onClose: () => void;
}

/** Booking pass shown to lab staff at check-in. */
export function QRPassModal({ booking, room, onClose }: QRPassModalProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={booking !== null} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable accessibilityLabel="Đóng" style={styles.scrim} onPress={onClose} />
      {booking ? (
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.handle} />
          <AppText variant="displayMd">Mã check-in</AppText>
          <AppText variant="bodySm" color="muted" style={styles.subtitle}>
            Đưa mã này cho nhân viên trực ca để xác nhận.
          </AppText>
          <View style={styles.qr}>
            <QRCode value={encodeBookingQr(booking)} size={200} color={colors.ink} backgroundColor={colors.canvas} />
          </View>
          <AppText variant="displaySm">{room?.name ?? 'Phòng đã bị xoá'}</AppText>
          <AppText variant="bodyMd" color="body">
            {formatDateKey(booking.dateKey)} · {formatRange(booking.startMinutes, booking.endMinutes)}
          </AppText>
          <View style={styles.codeRow}>
            <AppText variant="bodySm" color="muted">
              Mã nhập tay
            </AppText>
            <AppText variant="titleMd" selectable>
              {booking.code}
            </AppText>
          </View>
          <Button label="Xong" variant="secondary" onPress={onClose} style={styles.done} />
        </View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: colors.scrim },
  sheet: {
    alignItems: 'center',
    marginTop: -radius.xl,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: colors.canvas,
  },
  handle: { width: 32, height: 4, marginBottom: spacing.lg, borderRadius: radius.full, backgroundColor: colors.hairline },
  subtitle: { marginTop: spacing.xs, textAlign: 'center' },
  qr: {
    marginVertical: spacing.lg,
    padding: spacing.base,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  done: { alignSelf: 'stretch', marginTop: spacing.lg },
});
