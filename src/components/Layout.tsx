import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../theme/tokens';
import { AppText } from './AppText';

export function Divider() {
  return <View style={styles.divider} />;
}

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={32} color={colors.ink} />
      <AppText variant="displaySm" style={styles.center}>
        {title}
      </AppText>
      <AppText variant="bodySm" color="muted" style={styles.center}>
        {message}
      </AppText>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  divider: { height: 1, backgroundColor: colors.hairline },
  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg },
  center: { textAlign: 'center' },
  screen: { flex: 1, backgroundColor: colors.canvas },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.base,
  },
  headerText: { flex: 1 },
});

interface ScreenProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}

/** Tab-root scaffold: safe-area top padding and a `display-xl` page title. */
export function Screen({ title, subtitle, action, children }: ScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.base }]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <AppText variant="displayXl" accessibilityRole="header">
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="bodySm" color="muted">
              {subtitle}
            </AppText>
          ) : null}
        </View>
        {action}
      </View>
      {children}
    </View>
  );
}

export const screenStyles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  section: { paddingVertical: spacing.lg, gap: spacing.md },
});
