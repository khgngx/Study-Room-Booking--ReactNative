import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { dateFromKey, formatRange } from '../domain/time';
import type { Booking, Room } from '../domain/types';

const CHANNEL_ID = 'check-in-reminders';
const supported = Platform.OS !== 'web';

export function configureNotifications(): void {
  if (!supported) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

async function ensurePermission(): Promise<boolean> {
  if (!supported) return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Nhắc giờ check-in',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

/**
 * Schedules the check-in reminder. Returns null when there is nothing to schedule:
 * permission denied, unsupported platform, or the reminder time has already passed.
 */
export async function scheduleCheckInReminder(
  booking: Pick<Booking, 'id' | 'dateKey' | 'startMinutes' | 'endMinutes'>,
  room: Pick<Room, 'name'>,
  minutesBefore: number,
): Promise<string | null> {
  const fireAt = dateFromKey(booking.dateKey, booking.startMinutes - minutesBefore);
  if (fireAt.getTime() <= Date.now()) return null;
  if (!(await ensurePermission())) return null;
  return Notifications.scheduleNotificationAsync({
    content: {
      title: `Sắp đến giờ check-in phòng ${room.name}`,
      body: `Ca ${formatRange(booking.startMinutes, booking.endMinutes)} bắt đầu sau ${minutesBefore} phút. Mở mã QR để check-in.`,
      data: { bookingId: booking.id },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fireAt, channelId: CHANNEL_ID },
  });
}

export async function cancelReminder(notificationId: string | undefined): Promise<void> {
  if (!supported || !notificationId) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/** Dev helper for demos: fires a sample reminder after a few seconds. */
export async function sendTestReminder(seconds = 10): Promise<boolean> {
  if (!(await ensurePermission())) return false;
  await Notifications.scheduleNotificationAsync({
    content: { title: 'Sắp đến giờ check-in phòng A101', body: 'Đây là thông báo thử.' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds, channelId: CHANNEL_ID },
  });
  return true;
}
