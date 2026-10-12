import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Animated, Easing, KeyboardAvoidingView, Platform, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../../components/AppText';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { FloatingBalls } from '../../components/FloatingBalls';
import { PreferencesBar } from '../../components/PreferencesBar';
import { ROLE_LABEL } from '../../components/labels';
import { TextField } from '../../components/TextField';
import { DEMO_PASSWORD, SEED_USERS } from '../../data/seed';
import { useEntrance } from '../../hooks/useEntrance';
import type { AuthStackParams } from '../../navigation/types';
import { useAccountStore } from '../../store/useAccountStore';
import { useBookingStore } from '../../store/useBookingStore';
import { themed } from '../../theme/themed';
import { colors, radius, shadow, spacing, WIDE_LAYOUT_WIDTH } from '../../theme/tokens';
import { USE_NATIVE_DRIVER } from '../../theme/motion';

const DEMO_IDS = SEED_USERS.filter((user) => user.id !== 'user-student-2').map((user) => user.id);
const LOGO = require('../../../assets/vku-logo.png');
const LOGO_WIDTH = 132;
const LOGO_ASPECT = 247 / 480;
const MAX_CONTENT_WIDTH = 440;

// Real frosting needs a backdrop blur, which only the web build has; native keeps the translucent fill.
// `backdropFilter` is a react-native-web style that React Native's types do not list, hence `object`.
const frosted: object = Platform.OS === 'web' ? { backdropFilter: 'blur(14px) saturate(140%)' } : {};

export function LoginScreen({ navigation }: NativeStackScreenProps<AuthStackParams, 'Login'>) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const authenticate = useAccountStore((state) => state.authenticate);
  const users = useAccountStore((state) => state.users);
  const signIn = useBookingStore((state) => state.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const entrance = useEntrance(2);
  // Not `useAnimatedValue`: react-native-web does not export it.
  const [shake] = useState(() => new Animated.Value(0));

  // Demo rows read the live accounts, so a changed avatar shows here too.
  const demoAccounts = users.filter((user) => DEMO_IDS.includes(user.id));

  const submit = () => {
    const user = authenticate(email, password);
    if (user) {
      signIn(user.id);
      return;
    }
    setError('Email hoặc mật khẩu không đúng.');
    shake.setValue(0);
    Animated.timing(shake, { toValue: 1, duration: 360, easing: Easing.linear, useNativeDriver: USE_NATIVE_DRIVER }).start();
  };

  const shakeX = shake.interpolate({ inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1], outputRange: [0, -8, 8, -6, 6, 0] });

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FloatingBalls />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }]}
      >
        {width >= WIDE_LAYOUT_WIDTH ? <PreferencesBar /> : null}
        <Animated.View style={[styles.glass, frosted, shadow, entrance(0)]}>
          <View style={styles.heading}>
            <Image source={LOGO} contentFit="contain" accessibilityLabel="VKU" style={styles.logo} />
            <AppText variant="displayXl" accessibilityRole="header" style={styles.center}>
              Đặt phòng học VKU
            </AppText>
            <AppText variant="bodySm" color="muted" style={styles.center}>
              Phòng học nhóm, phòng lab và hội thảo, đặt trong vài lần chạm.
            </AppText>
          </View>
          <Animated.View style={[styles.form, { transform: [{ translateX: shakeX }] }]}>
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="ten@vku.udn.vn"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
            />
            <TextField
              label="Mật khẩu"
              value={password}
              onChangeText={setPassword}
              placeholder="Nhập mật khẩu"
              secureTextEntry
              error={error}
              onSubmitEditing={submit}
            />
          </Animated.View>
          <Button label="Đăng nhập" onPress={submit} disabled={!email || !password} />
          <Button label="Tạo tài khoản sinh viên" variant="tertiary" onPress={() => navigation.navigate('Register')} />
        </Animated.View>

        <Animated.View style={[styles.glass, styles.demo, frosted, shadow, entrance(1)]}>
          <AppText variant="microLabel" color="muted" style={styles.demoTitle}>
            TÀI KHOẢN DÙNG THỬ
          </AppText>
          {demoAccounts.map((account) => {
            const filled = email === account.email;
            return (
              <Pressable
                key={account.id}
                accessibilityRole="button"
                accessibilityState={{ selected: filled }}
                accessibilityLabel={`Điền tài khoản ${ROLE_LABEL[account.role]}`}
                onPress={() => {
                  setEmail(account.email);
                  setPassword(DEMO_PASSWORD);
                  setError(undefined);
                }}
                style={({ pressed }) => [styles.demoRow, filled && styles.demoRowFilled, pressed && styles.demoRowPressed]}
              >
                <Avatar name={account.name} imageUrl={account.avatarUrl} size={40} />
                <View style={styles.demoText}>
                  <AppText variant="titleMd" numberOfLines={1}>
                    {ROLE_LABEL[account.role]}
                  </AppText>
                  <AppText variant="bodySm" color="muted" numberOfLines={1}>
                    {account.email}
                  </AppText>
                </View>
                <Ionicons name={filled ? 'checkmark-circle' : 'arrow-forward-circle-outline'} size={22} color={filled ? colors.primary : colors.mutedSoft} />
              </Pressable>
            );
          })}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = themed(() => ({
  flex: { flex: 1, backgroundColor: colors.primarySoft },
  content: { flexGrow: 1, justifyContent: 'center', gap: spacing.base, paddingHorizontal: spacing.lg },
  glass: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    gap: spacing.base,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glass,
  },
  heading: { alignItems: 'center', gap: spacing.sm },
  logo: { width: LOGO_WIDTH, height: LOGO_WIDTH * LOGO_ASPECT, marginBottom: spacing.xs },
  center: { textAlign: 'center' },
  form: { gap: spacing.base },
  demo: { gap: spacing.sm },
  demoTitle: { paddingHorizontal: spacing.xs, letterSpacing: 0.5 },
  demoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.canvas,
  },
  demoRowFilled: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  demoRowPressed: { backgroundColor: colors.surfaceSoft },
  demoText: { flex: 1, gap: spacing.xxs },
}));
