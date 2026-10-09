import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { ROLE_LABEL } from '../../components/labels';
import { Divider, Screen, screenStyles } from '../../components/Layout';
import { TextField } from '../../components/TextField';
import { sendTestReminder } from '../../services/notifications';
import { useAccountStore } from '../../store/useAccountStore';
import { useBookingStore, useCurrentUser } from '../../store/useBookingStore';
import { colors, radius, spacing } from '../../theme/tokens';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

export function ProfileScreen() {
  const user = useCurrentUser();
  const updateProfile = useAccountStore((state) => state.updateProfile);
  const signOut = useBookingStore((state) => state.signOut);
  const [name, setName] = useState(user?.name ?? '');
  const [studentId, setStudentId] = useState(user?.studentId ?? '');

  if (!user) return null;

  const trimmedName = name.trim();
  const dirty = trimmedName !== user.name || studentId.trim() !== (user.studentId ?? '');
  const save = () => updateProfile(user.id, { name: trimmedName, studentId: studentId.trim() || undefined });

  const testReminder = async () => {
    const scheduled = await sendTestReminder();
    Alert.alert(
      scheduled ? 'Đã hẹn thông báo thử' : 'Chưa bật thông báo',
      scheduled ? 'Thông báo sẽ hiện sau khoảng 10 giây.' : 'Hãy cho phép ứng dụng gửi thông báo trong phần Cài đặt.',
    );
  };

  return (
    <Screen title="Hồ sơ">
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={screenStyles.content}>
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <AppText variant="displaySm" color="onDark">
              {initials(user.name)}
            </AppText>
          </View>
          <View style={styles.identityText}>
            <AppText variant="displayLg">{user.name}</AppText>
            <AppText variant="bodySm" color="muted">
              {ROLE_LABEL[user.role]} · {user.email}
            </AppText>
            {user.role === 'lab_staff' ? (
              <AppText variant="bodySm" color="muted">
                Khu vực phụ trách: {(user.assignedBuildings ?? []).map((building) => `Toà ${building}`).join(', ') || 'chưa được phân công'}
              </AppText>
            ) : null}
          </View>
        </View>
        <Divider />
        <View style={screenStyles.section}>
          <AppText variant="displayMd">Thông tin cá nhân</AppText>
          <TextField label="Họ và tên" value={name} onChangeText={setName} placeholder="Nhập họ và tên" />
          {user.role === 'student' ? (
            <TextField label="Mã sinh viên" value={studentId} onChangeText={setStudentId} placeholder="23IT001" autoCapitalize="characters" />
          ) : null}
          <Button label="Lưu thay đổi" variant="secondary" onPress={save} disabled={!dirty || trimmedName.length < 2} />
        </View>
        <Divider />
        <View style={screenStyles.section}>
          {__DEV__ && user.role === 'student' ? (
            <Button label="Gửi thông báo thử (dev)" variant="secondary" onPress={() => void testReminder()} />
          ) : null}
          <Button label="Đăng xuất" variant="tertiary" onPress={signOut} style={styles.signOut} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.base, paddingBottom: spacing.lg },
  identityText: { flex: 1, gap: spacing.xs },
  avatar: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: colors.ink,
  },
  signOut: { alignSelf: 'flex-start' },
});
