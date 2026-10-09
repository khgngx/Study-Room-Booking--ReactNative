import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

// Single seam for persistence: swap this to move the stores off AsyncStorage.
export const jsonStorage = createJSONStorage(() => AsyncStorage);

export function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
