import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { jsonStorage } from './storage';

/** `system` follows the device's light/dark setting. */
export type ThemePreference = 'light' | 'dark' | 'system';
export type Language = 'vi' | 'en';
/** Web only: `mobile` shows the app inside a phone-sized frame instead of the full browser window. */
export type Frame = 'web' | 'mobile';

export const PREFERENCES_STORAGE_KEY = 'vku-preferences';

interface PreferencesState {
  theme: ThemePreference;
  language: Language;
  frame: Frame;
  setTheme: (theme: ThemePreference) => void;
  setLanguage: (language: Language) => void;
  setFrame: (frame: Frame) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: 'system',
      language: 'vi',
      frame: 'web',
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setFrame: (frame) => set({ frame }),
    }),
    { name: PREFERENCES_STORAGE_KEY, storage: jsonStorage },
  ),
);
