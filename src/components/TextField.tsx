import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, radius, spacing, typography } from '../theme/tokens';
import { AppText } from './AppText';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

export function TextField({ label, error, style, onFocus, onBlur, ...rest }: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrapper}>
      <AppText variant="caption" color="muted">
        {label}
      </AppText>
      <TextInput
        {...rest}
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[styles.input, focused && styles.focused, error ? styles.invalid : null, style]}
      />
      {error ? (
        <AppText variant="captionSm" color="error">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  input: {
    ...typography.bodyMd,
    // A fixed line height clips text inside a single-line TextInput on Android.
    lineHeight: undefined,
    height: 56,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.canvas,
    color: colors.ink,
  },
  // Padding shrinks by the extra border pixel so the text does not shift on focus.
  focused: { borderWidth: 2, borderColor: colors.ink, paddingHorizontal: spacing.md - 1 },
  invalid: { borderColor: colors.error },
});
