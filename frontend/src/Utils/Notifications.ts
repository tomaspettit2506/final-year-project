// Request notification permission on app startup
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
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
