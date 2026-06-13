import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export async function registerForPushNotifications(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    return false
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('morning-reorder', {
      name: 'Morning Reorder',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF9900',
      sound: 'default',
    })
  }

  return true
}

export async function scheduleMorningNotification(): Promise<void> {
  // Cancel any existing morning notifications
  await Notifications.cancelAllScheduledNotificationsAsync()

  // Schedule daily 7AM notification
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🛒 Your daily reorder is ready',
      body: 'Tata Salt, Surf Excel, Parle-G — Tap to approve & order via Amazon Now ⚡',
      data: { screen: 'home', action: 'morning_approval' },
      sound: 'default',
      badge: 1,
      color: '#FF9900',
    },
    trigger: {
      hour: 7,
      minute: 0,
      repeats: true,
      channelId: 'morning-reorder',
    },
  })
}

export async function scheduleTestNotification(): Promise<void> {
  // Fires in 5 seconds — for demo purposes
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🛒 Your daily reorder is ready',
      body: 'Tata Salt, Surf Excel, Parle-G — Tap to approve & order via Amazon Now ⚡',
      data: { screen: 'home', action: 'morning_approval' },
      sound: 'default',
      color: '#FF9900',
    },
    trigger: { seconds: 5 },
  })
}
