import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { useAccountStore } from '../../store/useAccountStore';
import { useBookingStore } from '../../store/useBookingStore';
import { colors, spacing } from '../../theme/tokens';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

export function RegisterScreen() {
  const register = useAccountStore((state) => state.register);
  const signIn = useBookingStore((state) => state.signIn);
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  const submit = () => {
    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = 'Vui lòng nhập họ tên.';
    if (!EMAIL_PATTERN.test(email.trim())) next.email = 'Email không hợp lệ.';
    if (password.length < MIN_PASSWORD_LENGTH) next.password = `Mật khẩu cần ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`;
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    const result = register({ name, email, password, studentId });
    if (!result.ok) {
      setErrors({ email: 'Email này đã được đăng ký.' });
      return;
    }
    signIn(result.user.id);
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <AppText variant="displayLg" accessibilityRole="header">
          Tạo tài khoản sinh viên
        </AppText>
        <AppText variant="bodySm" color="muted">
          Tài khoản nhân viên và quản lý do quản lý cơ sở vật chất cấp quyền.
        </AppText>
        <TextField label="Họ và tên" value={name} onChangeText={setName} placeholder="Nguyễn Văn A" error={errors.name} />
        <TextField label="Mã sinh viên (không bắt buộc)" value={studentId} onChangeText={setStudentId} placeholder="23IT001" autoCapitalize="characters" />
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="ten@vku.udn.vn"
          autoCapitalize="none"
          keyboardType="email-address"
          error={errors.email}
        />
        <TextField label="Mật khẩu" value={password} onChangeText={setPassword} placeholder="Ít nhất 6 ký tự" secureTextEntry error={errors.password} />
        <Button label="Đăng ký" onPress={submit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.lg, gap: spacing.base },
});
