import { Ionicons } from '@expo/vector-icons';
import { Pressable, TextInput, View } from 'react-native';

import { translate } from '../i18n';
import { themed } from '../theme/themed';
import { colors, radius, shadow, spacing, typography } from '../theme/tokens';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  autoFocus?: boolean;
}

/** `search-bar-pill` with the Rausch `search-orb` at its right edge. */
export function SearchBar({ value, onChangeText, placeholder, autoFocus = false }: SearchBarProps) {
  return (
    <View style={[styles.bar, shadow]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={translate(placeholder)}
        placeholderTextColor={colors.muted}
        accessibilityLabel={translate(placeholder)}
        autoCorrect={false}
        autoFocus={autoFocus}
        returnKeyType="search"
        style={styles.input}
      />
      {value.length > 0 ? (
        <Pressable accessibilityLabel="Xoá tìm kiếm" hitSlop={spacing.sm} onPress={() => onChangeText('')} style={styles.clear}>
          <Ionicons name="close" size={16} color={colors.ink} />
        </Pressable>
      ) : null}
      <View style={styles.orb}>
        <Ionicons name="search" size={20} color={colors.onPrimary} />
      </View>
    </View>
  );
}

const styles = themed(() => ({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 64,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.canvas,
  },
  input: { ...typography.caption, lineHeight: undefined, flex: 1, height: '100%', color: colors.ink },
  clear: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: colors.surfaceStrong,
  },
  orb: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
}));
