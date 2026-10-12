import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCanAct } from '../hooks/usePresence';
import { themed } from '../theme/themed';
import { colors, spacing, WIDE_LAYOUT_WIDTH } from '../theme/tokens';
import { AppText } from './AppText';
import { PreferencesBar } from './PreferencesBar';
import { PresencePill } from './PresencePill';

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

const styles = themed(() => ({
  divider: { height: 1, backgroundColor: colors.hairline },
  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg },
  center: { textAlign: 'center' },
  screen: { flex: 1, backgroundColor: colors.canvas },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.base,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surfaceSoft,
  },
  headerText: { flex: 1 },
  // On a wide header this group takes the same share as the title, which is what centres the controls between them.
  headerActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: spacing.sm },
}));

interface ScreenProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  /** A compact control shown in the title row, just left of the presence pill. */
  headerAction?: ReactNode;
  /** Set when a stack header above already handles the safe area and the presence pill. */
  nested?: boolean;
  children: ReactNode;
}

/**
 * Screen scaffold. Title row: calligraphic page title, the display controls (theme, language,
 * web/phone frame) in the centre, then the screen's own action and the presence pill.
 */
export function Screen({ title, subtitle, action, headerAction, nested = false, children }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const canAct = useCanAct();
  const wide = width >= WIDE_LAYOUT_WIDTH;
  return (
    <View style={[styles.screen, !nested && { paddingTop: insets.top + spacing.base }]}>
      <View style={styles.header}>
        <AppText variant="heading" accessibilityRole="header" numberOfLines={2} style={styles.headerText}>
          {title}
        </AppText>
        {!nested && wide ? <PreferencesBar /> : null}
        <View style={[styles.headerActions, !nested && wide && styles.headerText]}>
          {headerAction}
          {nested ? null : <PresencePill />}
        </View>
      </View>
      {subtitle || action ? (
        <View style={styles.subHeader}>
          <AppText variant="bodySm" color="muted" style={styles.headerText}>
            {subtitle}
          </AppText>
          {action}
        </View>
      ) : null}
      {canAct ? null : <ReadOnlyBanner />}
      {children}
    </View>
  );
}

/** Shown wherever an inactive user would otherwise wonder why controls are disabled. */
export function ReadOnlyBanner() {
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Ionicons name="eye-outline" size={16} color={colors.ink} />
      <AppText variant="captionSm" style={styles.headerText}>
        Không hoạt động: bạn chỉ xem được. Đổi trạng thái để dùng tiếp.
      </AppText>
    </View>
  );
}

export const screenStyles = themed(() => ({
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  section: { paddingVertical: spacing.lg, gap: spacing.md },
}));
