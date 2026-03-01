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

// Create a notification using PWA
export const createNotification = (title: string, options?: NotificationOptions) => {
  if ("Notification" in window) {
    if (Notification.permission === "granted") {
      new Notification(title, {
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        ...options,
      });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification(title, {
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            ...options,
          });
        }
      });
    }
  }
};

// Create a notification with a custom icon
export const createNotificationWithIcon = (title: string, options?: NotificationOptions) => {
  const iconUrl = "/icon-192.png"; // Use public icon
  const notificationOptions = { ...options, icon: iconUrl, badge: iconUrl };
  createNotification(title, notificationOptions);
};

// Type-specific notification helpers
export const notifyFriendRequest = (friendName: string, _friendId: string) => {
  createNotification('New Friend Request', {
    body: `${friendName} wants to be your friend`,
    tag: 'friend-request',
  });
};

export const notifyGameInvite = (opponentName: string, gameId: string) => {
  createNotification('Game Invite', {
    body: `${opponentName} invited you to play chess`,
    tag: 'game-invite-' + gameId,
  });
};

export const notifyNewMessage = (senderName: string, senderId: string, message: string) => {
  createNotification('New Message', {
    body: `${senderName}: ${message.substring(0, 50)}...`,
    tag: 'message-' + senderId,
  });
};

export const notifyGameUpdate = (type: string, gameId: string) => {
  const titleMap: { [key: string]: string } = {
    opponentMoved: 'Opponent Moved',
    gameEnded: 'Game Ended',
    gameAbandoned: 'Game Abandoned',
  };

  createNotification(titleMap[type] || 'Game Update', {
    body:
      type === 'opponentMoved'
        ? 'Your opponent made a move'
        : 'Check your game',
    tag: 'game-update-' + gameId,
  });
};

// Example usage:
// createNotification("Hello!", { body: "This is a notification from your PWA." });