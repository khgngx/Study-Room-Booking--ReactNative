import { Text, type TextProps } from 'react-native';

import { colors, typography, type ColorToken, type TypographyToken } from '../theme/tokens';

interface AppTextProps extends TextProps {
  variant?: TypographyToken;
  color?: ColorToken;
}

export function AppText({ variant = 'bodyMd', color = 'ink', style, ...rest }: AppTextProps) {
  return <Text {...rest} style={[typography[variant], { color: colors[color] }, style]} />;
}
