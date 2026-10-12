import { Platform } from 'react-native';

/** The phone the web build imitates when "Mobile app" is on. */
export const PHONE_FRAME = { width: 390, height: 844 } as const;
/** Browser windows narrower than this already are phone-sized, so the switch is not offered. */
const MIN_WINDOW_FOR_SWITCH = 700;
const FRAME_PARAM = 'frame';

/** True for the copy of the app running inside the phone frame. */
export function isFramedDocument(): boolean {
  return Platform.OS === 'web' && new URLSearchParams(window.location.search).has(FRAME_PARAM);
}

/** Address of the copy to load inside the frame. */
export const framedUrl = (): string => `${window.location.pathname}?${FRAME_PARAM}=1`;

/** The Web app / Mobile app switch only makes sense in a desktop-sized browser, or inside the frame to leave it. */
export function canSwitchFrame(): boolean {
  if (Platform.OS !== 'web') return false;
  return isFramedDocument() || window.innerWidth >= MIN_WINDOW_FOR_SWITCH;
}
