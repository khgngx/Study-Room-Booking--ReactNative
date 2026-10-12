import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { PRESENCE_LABEL, ROLE_LABEL } from '../../components/labels';
import { Screen } from '../../components/Layout';
import { PRESENCE_DOT_COLOR } from '../../components/PresencePill';
import { TextField } from '../../components/TextField';
import { can, receivesNotifications } from '../../domain/permissions';
import { dateFromKey, toDateKey } from '../../domain/time';
import type { Booking, Room, User, UserRole } from '../../domain/types';
import { useNow } from '../../hooks/useNow';
import { useCanAct, usePresence } from '../../hooks/usePresence';
import type { ProfileStackParams } from '../../navigation/types';
import { showMessage } from '../../services/dialog';
import { sendTestReminder } from '../../services/notifications';
import { useAccountStore } from '../../store/useAccountStore';
import { useBookingStore, useCurrentUser } from '../../store/useBookingStore';
import { useRoomStore } from '../../store/useRoomStore';
import { colors, radius, spacing } from '../../theme/tokens';

type IconName = keyof typeof Ionicons.glyphMap;

const AVATAR_SIZE = 88;
const PRESENCE_DOT_SIZE = 20;
const ROW_ICON_SIZE = 40;

const ROLE_ICON: Record<UserRole, IconName> = {
  student: 'school-outline',
  lab_staff: 'construct-outline',
  facility_manager: 'business-outline',
};

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

interface Stat {
  value: number;
  label: string;
}

/** Three numbers that sum up what the account does, so each role sees its own work at a glance. */
function buildStats(user: User, bookings: readonly Booking[], rooms: readonly Room[], accountCount: number, now: Date): Stat[] {
  if (user.role === 'student') {
    const mine = bookings.filter((booking) => booking.userId === user.id);
    const upcoming = mine.filter((booking) => booking.status === 'confirmed' && dateFromKey(booking.dateKey, booking.endMinutes) > now);
    return [
      { value: upcoming.length, label: 'Sắp tới' },
      { value: mine.filter((booking) => booking.status === 'checked_in').length, label: 'Đã check-in' },
      { value: mine.filter((booking) => booking.status === 'no_show').length, label: 'Vắng mặt' },
    ];
  }

  const today = bookings.filter((booking) => booking.dateKey === toDateKey(now));
  if (user.role === 'lab_staff') {
    const buildings = user.assignedBuildings ?? [];
    const roomIds = new Set(rooms.filter((room) => buildings.includes(room.building)).map((room) => room.id));
    const shift = today.filter((booking) => roomIds.has(booking.roomId));
    return [
      { value: roomIds.size, label: 'Phòng phụ trách' },
      { value: shift.filter((booking) => booking.status === 'confirmed').length, label: 'Chờ check-in' },
      { value: shift.filter((booking) => booking.status === 'checked_in').length, label: 'Đã check-in' },
    ];
  }
  return [
    { value: rooms.length, label: 'Phòng' },
    { value: accountCount, label: 'Tài khoản' },
    { value: today.filter((booking) => booking.status !== 'cancelled').length, label: 'Lượt đặt hôm nay' },
  ];
}

type ManagementLink = { screen: 'Dashboard' | 'Users' | 'Policy'; icon: IconName; title: string; hint: string };

export function ProfileScreen({ navigation }: NativeStackScreenProps<ProfileStackParams, 'Profile'>) {
  const user = useCurrentUser();
  const updateProfile = useAccountStore((state) => state.updateProfile);
  const accountCount = useAccountStore((state) => state.users.length);
  const bookings = useBookingStore((state) => state.bookings);
  const signOut = useBookingStore((state) => state.signOut);
  const rooms = useRoomStore((state) => state.rooms);
  const presence = usePresence();
  const canAct = useCanAct();
  const now = useNow();
  const [name, setName] = useState(user?.name ?? '');
  const [studentId, setStudentId] = useState(user?.studentId ?? '');

  if (!user) return null;

  const trimmedName = name.trim();
  const dirty = trimmedName !== user.name || studentId.trim() !== (user.studentId ?? '');
  const save = () => updateProfile(user.id, { name: trimmedName, studentId: studentId.trim() || undefined });

  const testReminder = async () => {
    if (!receivesNotifications(user)) {
      showMessage('Đang tắt thông báo', 'Ở trạng thái Đang bận bạn không nhận thông báo. Chuyển sang Trực tiếp để thử.');
      return;
    }
    const scheduled = await sendTestReminder();
    showMessage(
      scheduled ? 'Đã hẹn thông báo thử' : 'Chưa bật thông báo',
      scheduled ? 'Thông báo sẽ hiện sau khoảng 10 giây.' : 'Hãy cho phép ứng dụng gửi thông báo trong phần Cài đặt.',
    );
  };

  const links: ManagementLink[] = [];
  if (can(user.role, 'stats.view')) links.push({ screen: 'Dashboard', icon: 'stats-chart-outline', title: 'Tổng quan', hint: 'Tỷ lệ sử dụng, vắng mặt, phòng hot' });
  if (can(user.role, 'user.manage')) links.push({ screen: 'Users', icon: 'people-outline', title: 'Tài khoản', hint: 'Phân quyền và khu vực phụ trách' });
  if (can(user.role, 'policy.edit')) links.push({ screen: 'Policy', icon: 'options-outline', title: 'Chính sách sử dụng', hint: 'Giờ mở cửa, khung giờ, giới hạn lượt đặt' });

  const stats = buildStats(user, bookings, rooms, accountCount, now);
  const assigned = (user.assignedBuildings ?? []).map((building) => `Toà ${building}`).join(', ') || 'chưa được phân công';
  const showTestReminder = __DEV__ && user.role === 'student';

  return (
    <Screen title="Cá nhân">
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <AppText variant="displayXl" color="onPrimary">
              {initials(user.name)}
            </AppText>
            <View
              accessibilityLabel={`Trạng thái: ${PRESENCE_LABEL[presence]}`}
              style={[styles.presenceDot, { backgroundColor: PRESENCE_DOT_COLOR[presence] }]}
            />
          </View>
          <AppText variant="displayLg" style={styles.center}>
            {user.name}
          </AppText>
          <View style={styles.rolePill}>
            <Ionicons name={ROLE_ICON[user.role]} size={14} color={colors.ink} />
            <AppText variant="caption">{ROLE_LABEL[user.role]}</AppText>
          </View>
          <AppText variant="bodySm" color="muted" style={styles.center}>
            {user.email}
            {user.studentId ? ` · ${user.studentId}` : ''}
          </AppText>
          {user.role === 'lab_staff' ? (
            <AppText variant="bodySm" color="muted" style={styles.center}>
              Khu vực phụ trách: {assigned}
            </AppText>
          ) : null}

          <View style={styles.stats}>
            {stats.map((stat, index) => (
              <View key={stat.label} style={[styles.stat, index > 0 && styles.statDivided]}>
                <AppText variant="displayXl">{stat.value}</AppText>
                <AppText variant="captionSm" color="muted" style={styles.center}>
                  {stat.label}
                </AppText>
              </View>
            ))}
          </View>
        </View>

        <Card title="Thông tin cá nhân">
          <View style={styles.form}>
            <TextField label="Họ và tên" value={name} onChangeText={setName} placeholder="Nhập họ và tên" editable={canAct} />
            {user.role === 'student' ? (
              <TextField label="Mã sinh viên" value={studentId} onChangeText={setStudentId} placeholder="23IT001" autoCapitalize="characters" editable={canAct} />
            ) : null}
            <Button label="Lưu thay đổi" variant="secondary" onPress={save} disabled={!canAct || !dirty || trimmedName.length < 2} />
          </View>
        </Card>

        {links.length > 0 ? (
          <Card title="Quản lý">
            {links.map((link, index) => (
              <Row key={link.screen} icon={link.icon} title={link.title} hint={link.hint} divided={index > 0} onPress={() => navigation.navigate(link.screen)} />
            ))}
          </Card>
        ) : null}

        <Card title="Tài khoản">
          {showTestReminder ? (
            <Row
              icon="notifications-outline"
              title="Gửi thông báo thử"
              hint="Chỉ có ở bản dev: nhắc sau khoảng 10 giây"
              disabled={!canAct}
              onPress={() => void testReminder()}
            />
          ) : null}
          <Row icon="log-out-outline" title="Đăng xuất" hint={user.email} tone="primaryActive" divided={showTestReminder} onPress={signOut} />
        </Card>
      </ScrollView>
    </Screen>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.cardGroup}>
      <AppText variant="microLabel" color="muted" accessibilityRole="header" style={styles.cardTitle}>
        {title.toUpperCase()}
      </AppText>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

interface RowProps {
  icon: IconName;
  title: string;
  hint: string;
  /** Colours the icon and title; the default ink suits navigation rows. */
  tone?: 'ink' | 'primaryActive';
  divided?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

function Row({ icon, title, hint, tone = 'ink', divided = false, disabled = false, onPress }: RowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.row, divided && styles.rowDivided, pressed && styles.rowPressed, disabled && styles.rowDisabled]}
    >
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={20} color={colors[tone]} />
      </View>
      <View style={styles.rowText}>
        <AppText variant="titleMd" color={tone}>
          {title}
        </AppText>
        <AppText variant="bodySm" color="muted" numberOfLines={1}>
          {hint}
        </AppText>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.mutedSoft} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxl, gap: spacing.lg },
  center: { textAlign: 'center' },
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.base,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSoft,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  presenceDot: {
    position: 'absolute',
    right: spacing.xxs,
    bottom: spacing.xxs,
    width: PRESENCE_DOT_SIZE,
    height: PRESENCE_DOT_SIZE,
    borderRadius: radius.full,
    borderWidth: 3,
    borderColor: colors.surfaceSoft,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + spacing.xxs,
    paddingVertical: spacing.xs + spacing.xxs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.canvas,
  },
  stats: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    marginTop: spacing.base,
    paddingVertical: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  stat: { flex: 1, alignItems: 'center', gap: spacing.xxs, paddingHorizontal: spacing.xs },
  statDivided: { borderLeftWidth: 1, borderLeftColor: colors.hairline },
  cardGroup: { gap: spacing.sm },
  cardTitle: { paddingHorizontal: spacing.xs, letterSpacing: 0.5 },
  card: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.hairline, backgroundColor: colors.canvas, overflow: 'hidden' },
  form: { padding: spacing.base, gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.base },
  rowDivided: { borderTopWidth: 1, borderTopColor: colors.hairlineSoft },
  rowPressed: { backgroundColor: colors.surfaceSoft },
  rowDisabled: { opacity: 0.4 },
  rowIcon: {
    width: ROW_ICON_SIZE,
    height: ROW_ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSoft,
  },
  rowText: { flex: 1, gap: spacing.xxs },
});
