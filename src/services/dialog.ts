import { Alert, Platform } from 'react-native';

import { translate } from '../i18n';

// Alert.alert is a no-op on react-native-web, so the web build falls back to browser dialogs.

export function showMessage(rawTitle: string, rawMessage: string): void {
  const title = translate(rawTitle);
  const message = translate(rawMessage);
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
}

export function confirmDestructive(options: ConfirmOptions): void {
  const { onConfirm } = options;
  const [title, message, confirmLabel, cancelLabel] = [options.title, options.message, options.confirmLabel, options.cancelLabel].map(translate);
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: cancelLabel, style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}
