import { useEffect } from 'react';
import { View } from 'react-native';

import { framedUrl, PHONE_FRAME } from '../services/frame';
import { useAccountStore } from '../store/useAccountStore';
import { useBookingStore } from '../store/useBookingStore';
import { usePolicyStore } from '../store/usePolicyStore';
import { usePreferencesStore } from '../store/usePreferencesStore';
import { useRoomStore } from '../store/useRoomStore';
import { themed } from '../theme/themed';
import { colors, spacing } from '../theme/tokens';
import { PreferencesBar } from './PreferencesBar';

const FRAME_RADIUS = 36;
const stores = [usePreferencesStore, useAccountStore, useBookingStore, usePolicyStore, useRoomStore];

/**
 * Web only. Shows the app at phone size by loading a second copy of it in a phone-shaped iframe,
 * so everything that measures the window (layouts, sheets, tab bar) behaves as it would on a phone.
 * The display controls sit above the phone. Both copies share browser storage: this outer one
 * reloads its stores whenever the inner one saves, and the inner one follows the controls here the same way.
 */
export function PhoneFrame() {
  useEffect(() => {
    const sync = () => stores.forEach((store) => void store.persist.rehydrate());
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  return (
    <View style={styles.backdrop}>
      <PreferencesBar frameSwitch />
      <iframe
        title="VKU Study Rooms"
        src={framedUrl()}
        style={{
          width: PHONE_FRAME.width,
          maxWidth: '100%',
          height: `min(${PHONE_FRAME.height}px, calc(100vh - 112px))`,
          border: `1px solid ${colors.hairline}`,
          borderRadius: FRAME_RADIUS,
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.28)',
          background: colors.canvas,
        }}
      />
    </View>
  );
}

const styles = themed(() => ({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.base, padding: spacing.base, backgroundColor: colors.backdrop },
}));
