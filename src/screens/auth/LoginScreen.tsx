import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { ROLE_LABEL } from '../../components/labels';
import { Divider } from '../../components/Layout';
import { TextField } from '../../components/TextField';
import { DEMO_PASSWORD, SEED_USERS } from '../../data/seed';
import type { AuthStackParams } from '../../navigation/types';
import { useAccountStore } from '../../store/useAccountStore';
import { useBookingStore } from '../../store/useBookingStore';
import { colors, spacing } from '../../theme/tokens';

const DEMO_ACCOUNTS = SEED_USERS.filter((user) => user.id !== 'user-student-2');

export function LoginScreen({ navigation }: NativeStackScreenProps<AuthStackParams, 'Login'>) {
  const insets = useSafeAreaInsets();
  const authenticate = useAccountStore((state) => state.authenticate);
  const signIn = useBookingStore((state) => state.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();

  const submit = () => {
    const user = authenticate(email, password);
    if (!user) {
      setError('Email hoặc mật khẩu không đúng.');
      return;
    }
    signIn(user.id);
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.lg }]}
      >
        <AppText variant="displayXl" accessibilityRole="header">
          Đặt phòng học VKU
        </AppText>
        <AppText variant="bodyMd" color="muted">
          Đăng nhập để đặt phòng học nhóm và phòng lab.
        </AppText>

        <View style={styles.form}>
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
          <Button label="Đăng nhập" onPress={submit} disabled={!email || !password} />
          <Button label="Tạo tài khoản sinh viên" variant="tertiary" onPress={() => navigation.navigate('Register')} />
        </View>

        <Divider />
        <AppText variant="titleSm" style={styles.demoTitle}>
          Tài khoản dùng thử
        </AppText>
        {DEMO_ACCOUNTS.map((account) => (
          <Pressable
            key={account.id}
            accessibilityRole="button"
            accessibilityLabel={`Điền tài khoản ${ROLE_LABEL[account.role]}`}
            onPress={() => {
              setEmail(account.email);
              setPassword(DEMO_PASSWORD);
              setError(undefined);
            }}
            style={styles.demoRow}
          >
            <AppText variant="caption">{ROLE_LABEL[account.role]}</AppText>
            <AppText variant="bodySm" color="muted">
              {account.email}
            </AppText>
          </Pressable>
        ))}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  form: { gap: spacing.base, marginVertical: spacing.lg },
  demoTitle: { marginTop: spacing.lg },
  demoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.md },
});
