import { useColorScheme } from 'react-native';

import { usePreferencesStore } from '../store/usePreferencesStore';
import type { ThemeName } from '../theme/tokens';

/** The palette to draw with: the user's choice, or the device's setting when they chose "system". */
export function useResolvedTheme(): ThemeName {
  const preference = usePreferencesStore((state) => state.theme);
  const deviceScheme = useColorScheme();
  if (preference !== 'system') return preference;
  return deviceScheme === 'dark' ? 'dark' : 'light';
}
