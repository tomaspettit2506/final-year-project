let hasRequestedNotificationPermission = false;

const isNotificationSupported = (): boolean => {
  return typeof window !== "undefined" && "Notification" in window;
};

// Request notification permission on app startup
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported()) {
    console.warn('[Notifications] Notifications not supported in this browser');
    return false;
  }

  if (Notification.permission === 'granted') {
    console.log('[Notifications] Notification permission already granted');
    return true;
  }

  if (Notification.permission === 'denied') {
    console.warn('[Notifications] Notification permission denied');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('[Notifications] Permission granted:', permission === 'granted');
    return permission === 'granted';
  } catch (error) {
    console.error('[Notifications] Error requesting permission:', error);
    return false;
  }
};

// Initialize PWA notifications once per session
export const initializePwaNotifications = async (): Promise<boolean> => {
  if (hasRequestedNotificationPermission) {
    return isNotificationSupported() && Notification.permission === 'granted';
  }

  hasRequestedNotificationPermission = true;
  return requestNotificationPermission();
};

// PWA Notification helper (using icon)
export const showNotification = (options?: NotificationOptions, title = 'GOTCG') => {
  if (!isNotificationSupported()) {
    console.warn('[Notifications] Cannot show notification, notifications are not supported');
    return;
  }

  if (Notification.permission !== 'granted') {
    if (Notification.permission === 'default') {
      // Attempt one-time initialization if permission wasn't requested yet.
      void initializePwaNotifications();
    }
    console.warn('[Notifications] Cannot show notification, permission not granted');
    return;
  }

  const notificationOptions: NotificationOptions = {
    ...options,
    icon: '/icon-192.png', // Use your app's icon here
    badge: '/icon-192.png',
  };

  new Notification(title, notificationOptions);
}
