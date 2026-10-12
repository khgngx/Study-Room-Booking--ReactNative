import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { STAFF_ACTION_ERROR } from '../../components/labels';
import { TextField } from '../../components/TextField';
import { parseBookingQr, validateCheckIn } from '../../domain/checkin';
import { formatDateKey, formatRange } from '../../domain/time';
import type { Booking, Room, User } from '../../domain/types';
import { useAccountStore } from '../../store/useAccountStore';
import { useBookingStore, useCurrentUser, type StaffActionResult } from '../../store/useBookingStore';
import { useRoomStore } from '../../store/useRoomStore';
import { themed } from '../../theme/themed';
import { colors, radius, spacing } from '../../theme/tokens';

interface Lookup {
  booking?: Booking;
  room?: Room;
  student?: User;
  validation: StaffActionResult;
  checkedIn: boolean;
}

export function ScanScreen() {
  const staff = useCurrentUser();
  const [permission, requestPermission] = useCameraPermissions();
  const checkIn = useBookingStore((state) => state.checkIn);
  const [code, setCode] = useState('');
  const [lookup, setLookup] = useState<Lookup | null>(null);
  // The camera fires many frames per second; a ref blocks re-entry before state settles.
  const scanLocked = useRef(false);

  if (!staff) return null;

  const resolve = (match: (booking: Booking) => boolean) => {
    const booking = useBookingStore.getState().bookings.find(match);
    const room = useRoomStore.getState().rooms.find((candidate) => candidate.id === booking?.roomId);
    const student = useAccountStore.getState().users.find((user) => user.id === booking?.userId);
    setLookup({ booking, room, student, validation: validateCheckIn(booking, room, staff, new Date()), checkedIn: false });
  };

  const onScanned = ({ data }: { data: string }) => {
    if (scanLocked.current) return;
    scanLocked.current = true;
    const parsed = parseBookingQr(data);
    resolve((booking) => parsed !== null && booking.id === parsed.bookingId && booking.code === parsed.code);
  };

  const onManual = () => {
    const wanted = code.trim().toUpperCase();
    scanLocked.current = true;
    resolve((booking) => booking.code === wanted);
  };

  const reset = () => {
    setLookup(null);
    setCode('');
    scanLocked.current = false;
  };

  const confirm = () => {
    if (!lookup?.booking) return;
    const result = checkIn(lookup.booking.id);
    setLookup({ ...lookup, validation: result, checkedIn: result.ok });
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <View style={styles.camera}>
          {permission?.granted ? (
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={lookup ? undefined : onScanned}
            />
          ) : (
            <View style={styles.permission}>
              <AppText variant="bodySm" color="muted" style={styles.center}>
                {permission?.canAskAgain === false
                  ? 'Quyền camera đang bị tắt. Hãy bật lại trong phần Cài đặt, hoặc nhập mã bên dưới.'
                  : 'Cần quyền camera để quét mã QR của sinh viên.'}
              </AppText>
              {permission?.canAskAgain !== false ? (
                <Button label="Cho phép dùng camera" variant="secondary" onPress={() => void requestPermission()} />
              ) : null}
            </View>
          )}
        </View>

        {lookup ? (
          <View style={styles.result}>
            <AppText variant="displaySm" color={lookup.validation.ok ? 'ink' : 'error'}>
              {lookup.checkedIn
                ? 'Đã check-in thành công'
                : lookup.validation.ok
                  ? 'Mã hợp lệ'
                  : STAFF_ACTION_ERROR[lookup.validation.reason]}
            </AppText>
            {lookup.booking ? (
              <>
                <AppText color="body">
                  {lookup.room?.code ?? 'Phòng đã bị xoá'} · {formatDateKey(lookup.booking.dateKey)} ·{' '}
                  {formatRange(lookup.booking.startMinutes, lookup.booking.endMinutes)}
                </AppText>
                <AppText variant="bodySm" color="muted">
                  {lookup.student?.name ?? 'Tài khoản đã xoá'}
                  {lookup.student?.studentId ? ` · ${lookup.student.studentId}` : ''}
                </AppText>
              </>
            ) : null}
            {lookup.validation.ok && !lookup.checkedIn ? <Button label="Xác nhận check-in" onPress={confirm} /> : null}
            <Button label="Quét mã khác" variant="secondary" onPress={reset} />
          </View>
        ) : (
          <View style={styles.manual}>
            <AppText variant="displaySm">Không quét được?</AppText>
            <TextField
              label="Mã nhập tay trên vé của sinh viên"
              value={code}
              onChangeText={setCode}
              placeholder="VD: K3F9QA"
              autoCapitalize="characters"
              autoCorrect={false}
              onSubmitEditing={onManual}
            />
            <Button label="Tra mã" variant="secondary" onPress={onManual} disabled={code.trim().length === 0} />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = themed(() => ({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.lg, gap: spacing.lg },
  camera: { aspectRatio: 1, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.surfaceStrong },
  permission: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.base, padding: spacing.lg },
  center: { textAlign: 'center' },
  result: { gap: spacing.md, padding: spacing.lg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.hairline },
  manual: { gap: spacing.base },
}));
