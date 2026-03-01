import { io, Socket } from 'socket.io-client';

function resolveApiBaseUrl(): string {
  // 1. Check for backend port override in query parameter (for testing multiple instances)
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const backendPort = params.get('backendPort');
    if (backendPort) {
      console.log('[Socket.io] Using backend port from query param:', backendPort);
      return `http://localhost:${backendPort}`;
    }
  }

  // 2. Try to derive from current window location (most robust for Codespaces)
  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    
    if (hostname.endsWith(".app.github.dev")) {
      // Handle format: 5173-codespace-name.app.github.dev
      const portFirstMatch = hostname.match(/^(\d+)-(.+)\.app\.github\.dev$/);
      if (portFirstMatch) {
        return `${protocol}//${portFirstMatch[2]}-8000.app.github.dev`;
      }

      // Handle format: codespace-name-5173.app.github.dev
      const nameFirstMatch = hostname.match(/^(.+)-(\d+)\.app.github.dev$/);
      if (nameFirstMatch) {
        return `${protocol}//${nameFirstMatch[1]}-8000.app.github.dev`;
      }
    }
  }

  // 3. Fallback to environment variable if it's set and NOT localhost
  const configured = import.meta.env.VITE_BACKEND_URL;
  if (configured && !configured.includes("localhost")) {
    return configured;
  }

  // 4. Default to localhost
  return "http://localhost:8000";
}

const URL = resolveApiBaseUrl();

console.log('[Socket.io] Connecting to:', URL);
console.log('[Socket.io] Auto-connect disabled, manual connection required');

export const socket: Socket = io(URL, {
  autoConnect: false,
  transports: ['websocket'],
  reconnectionDelay: 1000,
  reconnection: true,
  reconnectionAttempts: 5
});

socket.on('connect', () => {
  console.log('[Socket.io] ✓ Connected with ID:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('[Socket.io] ✗ Disconnected. Reason:', reason);
});

socket.on('connect_error', (error: any) => {
  console.error('[Socket.io] ✗ Connection error:', error);
});

socket.on('error', (error: any) => {
  console.error('[Socket.io] ✗ Socket error:', error);
});

socket.on('gameReady', (data: any) => {
  console.log('[Socket.io] ← Received gameReady event:', data);
});

socket.on('roomUpdated', (data: any) => {
  console.log('[Socket.io] ← Received roomUpdated event:', data);
});

socket.on('roomTimeout', (data: any) => {
  console.log('[Socket.io] ← Received roomTimeout event:', data);
});

socket.io.on('reconnect_attempt', () => {
  console.log('[Socket.io] → Attempting to reconnect...');
});

socket.io.on('reconnect', () => {
  console.log('[Socket.io] ✓ Reconnected');
});

// Helper function to show notifications directly
function showNotification(
  title: string,
  options?: NotificationOptions
): void {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      ...options,
    });
  }
}

// Socket event listeners for notifications
socket.on('friendRequest', (data: any) => {
  console.log('[Socket.io] ← Received friendRequest event:', data);
  showNotification('New Friend Request', {
    body: `${data.senderName || data.senderId} wants to be your friend`,
    tag: 'friend-request',
    data: { senderId: data.senderId },
  });
});

socket.on('gameInvite', (data: any) => {
  console.log('[Socket.io] ← Received gameInvite event:', data);
  showNotification('Game Invite', {
    body: `${data.senderName || data.senderId} invited you to play chess`,
    tag: 'game-invite',
    data: { gameId: data.gameId, senderId: data.senderId },
  });
});

socket.on('newMessage', (data: any) => {
  console.log('[Socket.io] ← Received newMessage event:', data);
  showNotification('New Message', {
    body: `${data.senderName || data.senderId}: ${data.message}`,
    tag: 'message-' + data.senderId,
    data: { senderId: data.senderId },
  });
});

socket.on('gameUpdate', (data: any) => {
  console.log('[Socket.io] ← Received gameUpdate event:', data);
  const { gameId, type } = data;
  let title = 'Game Update';
  let body = 'Your game has been updated';

  if (type === 'opponentMoved') {
    title = 'Opponent Moved';
    body = 'Your opponent made a move';
  } else if (type === 'gameEnded') {
    title = 'Game Ended';
    body = data.result || 'The game has ended';
  } else if (type === 'gameAbandoned') {
    title = 'Game Abandoned';
    body = 'Your opponent abandoned the game';
  }

  showNotification(title, {
    body,
    tag: 'game-update-' + gameId,
    data: { gameId },
  });
});

// Socket event listeners for real-time updates (existing)
socket.on('friendRequestReceived', (data: any) => {
  console.log('[Socket.io] ← Received friendRequestReceived event:', data);
});

socket.on('gameInviteReceived', (data: any) => {
  console.log('[Socket.io] ← Received gameInviteReceived event:', data);
});

socket.on('messageReceived', (data: any) => {
  console.log('[Socket.io] ← Received messageReceived event:', data);
});