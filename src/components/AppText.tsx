import type { ReactNode } from 'react';
import { Text, type TextProps } from 'react-native';

import { translate } from '../i18n';
import { colors, typography, type ColorToken, type TypographyToken } from '../theme/tokens';

interface AppTextProps extends TextProps {
  variant?: TypographyToken;
  color?: ColorToken;
}

const isPlain = (child: unknown): child is string | number => typeof child === 'string' || typeof child === 'number';

/**
 * JSX such as `{count} chỗ` arrives as separate pieces; they are joined first so the sentence is
 * translated as a whole. Nested elements are left alone and translate themselves.
 */
function localize(children: ReactNode): ReactNode {
  if (typeof children === 'string') return translate(children);
  if (!Array.isArray(children)) return children;
  const pieces: unknown[] = children.flat(Infinity).filter((child) => child !== null && child !== undefined && typeof child !== 'boolean');
  if (pieces.every(isPlain)) return translate(pieces.join(''));
  return children;
}

export function AppText({ variant = 'bodyMd', color = 'ink', style, children, ...rest }: AppTextProps) {
  return (
    <Text {...rest} style={[typography[variant], { color: colors[color] }, style]}>
      {localize(children)}
    </Text>
  );
}
