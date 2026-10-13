import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { DarkTheme, DefaultTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PhoneFrame } from './src/components/PhoneFrame';
import { useResolvedTheme } from './src/hooks/useResolvedTheme';
import { useStoresHydrated } from './src/hooks/useStoresHydrated';
import { setActiveLanguage } from './src/i18n';
import { RootNavigator } from './src/navigation/RootNavigator';
import { hideFrameScrollbars, isFramedDocument } from './src/services/frame';
import { recallNavigation, rememberNavigation } from './src/services/navigationMemory';
import { configureNotifications } from './src/services/notifications';
import { useBookingStore } from './src/store/useBookingStore';
import { PREFERENCES_STORAGE_KEY, usePreferencesStore } from './src/store/usePreferencesStore';
import { themed } from './src/theme/themed';
import { colors, setActiveTheme, type ThemeName } from './src/theme/tokens';

configureNotifications();

function navigationTheme(theme: ThemeName): Theme {
  const base = theme === 'dark' ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: { ...base.colors, primary: colors.primary, background: colors.canvas, card: colors.canvas, text: colors.ink, border: colors.hairline },
  };
}

export default function App() {
  // A failed font load falls back to the system font rather than blocking the app.
  const [fontsLoaded, fontError] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  const hydrated = useStoresHydrated();
  const theme = useResolvedTheme();
  const language = usePreferencesStore((state) => state.language);
  const frame = usePreferencesStore((state) => state.frame);

  // The phone frame runs a second copy of the app; a choice made in one copy reaches the other through storage.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const follow = (event: StorageEvent) => {
      if (event.key === PREFERENCES_STORAGE_KEY) void usePreferencesStore.persist.rehydrate();
    };
    window.addEventListener('storage', follow);
    return () => window.removeEventListener('storage', follow);
  }, []);

  useEffect(hideFrameScrollbars, []);

  // Browser-drawn parts (scrollbars, form controls) follow the theme too.
  useEffect(() => {
    if (Platform.OS === 'web') document.documentElement.style.colorScheme = theme;
  }, [theme]);

  // Colours and strings are read from these while the tree below renders, so they are set first.
  setActiveTheme(theme);
  setActiveLanguage(language);

  if (!hydrated || (!fontsLoaded && !fontError)) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.ink} />
      </View>
    );
  }

  if (Platform.OS === 'web' && frame === 'mobile' && !isFramedDocument()) return <PhoneFrame key={`${theme}-${language}`} />;

  return (
    <SafeAreaProvider>
      <Navigation theme={theme} language={language} />
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
    </SafeAreaProvider>
  );
}

/** Mounted only once the stores are loaded, so the place to reopen is read for the right user. */
function Navigation({ theme, language }: { theme: ThemeName; language: string }) {
  const userId = useBookingStore((state) => state.session?.userId ?? null);
  const [initialState] = useState(() => recallNavigation(userId));
  return (
    <NavigationContainer theme={navigationTheme(theme)} initialState={initialState} onStateChange={(state) => rememberNavigation(userId, state)}>
      {/* Styles and strings are resolved during render, so a new theme or language remounts the screens; the container keeps where the user was. */}
      <RootNavigator key={`${theme}-${language}`} />
    </NavigationContainer>
  );
}

const styles = themed(() => ({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas },
}));
