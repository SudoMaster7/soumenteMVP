import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleDailyNotification(hour: number, minute: number): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Soumente 🌱',
      body: 'Como foi seu dia hoje? Registre agora.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function scheduleRitualNotification(habitId: string, hour: number, minute: number, habitName: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(`ritual-${habitId}`).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: `ritual-${habitId}`,
    content: {
      title: 'Ritual',
      body: `Hora de: ${habitName}`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function cancelRitualNotification(habitId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(`ritual-${habitId}`).catch(() => {});
}
