import type { InitialState, NavigationState } from '@react-navigation/native';
import { Platform } from 'react-native';

const STORAGE_KEY = 'vku-navigation';

/**
 * Web only. Remembers which screen is open so that switching between the full page and the phone
 * frame, which starts another copy of the app, lands on the same screen instead of the first tab.
 * Session storage is shared by the page and its same-origin frame and is dropped when the tab closes.
 * The signed-in user is stored alongside: each role has its own screens, so one user's place is never
 * replayed for another.
 */
export function rememberNavigation(userId: string | null, state: NavigationState | undefined): void {
  if (Platform.OS !== 'web' || !state) return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ userId, state }));
}

export function recallNavigation(userId: string | null): InitialState | undefined {
  if (Platform.OS !== 'web') return undefined;
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return undefined;
  try {
    const saved: unknown = JSON.parse(raw);
    if (typeof saved !== 'object' || saved === null) return undefined;
    const { userId: savedUser, state } = saved as { userId?: unknown; state?: unknown };
    if (savedUser !== userId || typeof state !== 'object' || state === null || !Array.isArray((state as { routes?: unknown }).routes)) return undefined;
    return state as InitialState;
  } catch (error) {
    // An unreadable entry only costs the remembered place; the app opens on its first screen.
    console.warn('Ignoring unreadable saved navigation state', error);
    return undefined;
  }
}
