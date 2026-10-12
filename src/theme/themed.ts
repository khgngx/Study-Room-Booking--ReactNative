import { StyleSheet } from 'react-native';

import { getActiveTheme, type ThemeName } from './tokens';

/**
 * `StyleSheet.create` that follows the theme. `build` runs once per theme, the first time one of
 * its styles is read, so a sheet declared at module scope still picks up the palette in force
 * when its component renders.
 */
// `NamedStyles<any>` mirrors the signature of `StyleSheet.create` itself.
export function themed<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(build: () => T & StyleSheet.NamedStyles<any>): T {
  const sheets: Partial<Record<ThemeName, T>> = {};
  return new Proxy({} as T, {
    get: (_target, name: string) => {
      const theme = getActiveTheme();
      const sheet = (sheets[theme] ??= StyleSheet.create(build()));
      return sheet[name as keyof T];
    },
  });
}
