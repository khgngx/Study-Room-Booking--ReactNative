import { Platform } from 'react-native';

/** react-native-web has no native animation driver and warns when asked for one. */
export const USE_NATIVE_DRIVER = Platform.OS !== 'web';
