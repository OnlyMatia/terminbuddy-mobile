import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications() {
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#08ff25',
    });
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const tokenResponse = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  return tokenResponse.data;
}

export async function savePushTokenForUser(userId, token) {
  if (!userId || !token) return;
  await supabase.from('profiles').update({ push_token: token }).eq('id', userId);
}

export function usePushNotificationSetup(userId) {
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    registerForPushNotifications().then((token) => {
      if (!cancelled && token) savePushTokenForUser(userId, token);
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);
}

export function usePushNotificationTapHandler() {
  const router = useRouter();
  const responseListener = useRef(null);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.terminId) {
        router.push(`/termin/${data.terminId}`);
      } else if (data?.chatTerminId) {
        router.push(`/chat/${data.chatTerminId}`);
      }
    });
    responseListener.current = subscription;

    return () => {
      const sub = responseListener.current;
      if (!sub) return;
      try {
        if (typeof sub.remove === 'function') {
          sub.remove();
        } else if (typeof Notifications.removeNotificationSubscription === 'function') {
          Notifications.removeNotificationSubscription(sub);
        }
      } catch (err) {
        console.warn('Failed to remove notification subscription:', err);
      }
    };
  }, [router]);
}
