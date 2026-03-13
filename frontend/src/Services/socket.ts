import { io, Socket } from 'socket.io-client';
import { showNotification as showPwaNotification } from '../Utils/Notifications';

interface RequestReceivedEvent {
  requestId?: string;
  fromUserId?: string;
  fromUserName?: string;
}

interface RequestAcceptedEvent {
  requestId?: string;
  acceptedByUserId?: string;
  acceptedByName?: string;
}

interface GameInviteReceivedEvent {
  inviteId?: string;
  roomId?: string;
  rated?: boolean;
  timeControl?: string;
  fromUserId?: string;
  fromUserName?: string;
}

interface ReceiveMessageEvent {
  id?: string;
  senderId?: string;
  senderName?: string;
  text?: string;
}

interface ReplayMessageEvent extends ReceiveMessageEvent {
  replyToMessageId?: string;
}

interface UserNameLookupResponse {
  name?: string;
  email?: string;
}

interface GameUpdateEvent {
  gameId?: string;
  type?: 'opponentMoved' | 'gameEnded' | 'gameAbandoned' | string;
  result?: string;
}

function resolveApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL;

  // 1. Check for backend port override in query parameter (for testing multiple instances)
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const backendPort = params.get('backendPort');
    if (backendPort) {
      console.log('[Socket.io] Using backend port from query param:', backendPort);
      return `http://localhost:${backendPort}`;
    }
  }

  // 2. Use configured backend URL when provided.
  if (configured) {
    return configured.replace(/\/$/, '');
  }

  // 3. Try to derive from current window location (most robust for Codespaces)
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

  // 4. In development, default to localhost backend.
  if (import.meta.env.DEV) {
    return "http://localhost:8000";
  }

  // 5. Production fallback: same host as frontend.
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return '';
}

const URL = resolveApiBaseUrl();
const senderNameCache = new Map<string, string>();

const resolveSenderDisplayName = async (payload: ReceiveMessageEvent): Promise<string> => {
  const embeddedName = typeof payload.senderName === 'string' ? payload.senderName.trim() : '';
  if (embeddedName) {
    if (payload.senderId) senderNameCache.set(payload.senderId, embeddedName);
    return embeddedName;
  }

  const senderId = typeof payload.senderId === 'string' ? payload.senderId.trim() : '';
  if (!senderId) return 'Friend';

  const cached = senderNameCache.get(senderId);
  if (cached) return cached;

  try {
    const res = await fetch(`${URL}/user/${encodeURIComponent(senderId)}`, {
      credentials: 'include',
    });
    if (res.ok) {
      const user = (await res.json()) as UserNameLookupResponse;
      const resolved =
        (typeof user.name === 'string' && user.name.trim().length > 0 ? user.name.trim() : undefined) ||
        (typeof user.email === 'string' && user.email.includes('@') ? user.email.split('@')[0] : undefined);
      if (resolved) {
        senderNameCache.set(senderId, resolved);
        return resolved;
      }
    }
  } catch (error) {
    console.warn('[Socket.io] sender name resolution failed:', error);
  }

  return senderId;
};

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

socket.on('connect_error', (error: unknown) => {
  console.error('[Socket.io] ✗ Connection error:', error);
});

socket.on('error', (error: unknown) => {
  console.error('[Socket.io] ✗ Socket error:', error);
});

socket.on('gameReady', (data: unknown) => {
  console.log('[Socket.io] ← Received gameReady event:', data);
});

socket.on('roomUpdated', (data: unknown) => {
  console.log('[Socket.io] ← Received roomUpdated event:', data);
});

socket.on('roomTimeout', (data: unknown) => {
  console.log('[Socket.io] ← Received roomTimeout event:', data);
});

socket.io.on('reconnect_attempt', () => {
  console.log('[Socket.io] → Attempting to reconnect...');
});

socket.io.on('reconnect', () => {
  console.log('[Socket.io] ✓ Reconnected');
});

// Socket event listeners for browser notifications
socket.on('request_received', (data: RequestReceivedEvent) => {
  console.log('[Socket.io] ← Received request_received event:', data);
  const senderName = data?.fromUserName || data?.fromUserId || 'Someone';
  showPwaNotification({
    body: `${senderName} sent you a friend request`,
    tag: `friend-request-${data?.requestId || senderName}`,
    data: { requestId: data?.requestId, fromUserId: data?.fromUserId },
  }, 'Friend Request');
});

socket.on('request_accepted', (data: RequestAcceptedEvent) => {
  console.log('[Socket.io] ← Received request_accepted event:', data);
  const accepterName = data?.acceptedByName || data?.acceptedByUserId || 'Your friend';
  showPwaNotification({
    body: `${accepterName} accepted your friend request`,
    tag: `friend-accepted-${data?.requestId || accepterName}`,
    data: { requestId: data?.requestId, acceptedByUserId: data?.acceptedByUserId },
  }, 'Friend Request Accepted');
});

socket.on('game_invite_received', (data: GameInviteReceivedEvent) => {
  console.log('[Socket.io] ← Received game_invite_received event:', data);
  const senderName = data?.fromUserName || data?.fromUserId || 'Someone';
  const gameType = data?.rated ? `Rated • ${data?.timeControl || '10'} mins` : 'Casual • No Timer';
  showPwaNotification({
    body: `${senderName} invited you to play (${gameType})`,
    tag: `game-invite-${data?.inviteId || data?.roomId || senderName}`,
    data: { inviteId: data?.inviteId, roomId: data?.roomId, fromUserId: data?.fromUserId },
  }, 'Game Invite');
});

socket.on('receive_message', async (data: ReceiveMessageEvent) => {
  console.log('[Socket.io] ← Received receive_message event:', data);
  const sender = await resolveSenderDisplayName(data);
  const text = String(data?.text || '').trim();
  const preview = text.length > 80 ? `${text.slice(0, 77)}...` : text;
  showPwaNotification({
    body: preview ? `${sender}: ${preview}` : `${sender} sent you a message`,
    tag: `chat-${sender}`,
    data: { senderId: data?.senderId, messageId: data?.id },
  }, `New Message from ${sender}`);
});

socket.on('receive_reply_message', async (data: ReplayMessageEvent) => {
  console.log('[Socket.io] ← Received receive_reply_message event:', data);
  const sender = await resolveSenderDisplayName(data);
  const text = String(data?.text || '').trim();
  const preview = text.length > 80 ? `${text.slice(0, 77)}...` : text;
  showPwaNotification({
    body: preview ? `${sender} replied: ${preview}` : `${sender} sent you a reply`,
    tag: `chat-reply-${sender}`,
    data: { senderId: data?.senderId, messageId: data?.id, replyToMessageId: data?.replyToMessageId },
  }, `Reply from ${sender}`);
});

socket.on('gameUpdate', (data: GameUpdateEvent) => {
  console.log('[Socket.io] ← Received gameUpdate event:', data);
  const { gameId, type } = data;
  let body = 'Your game has been updated';
  let title = 'Game Update';

  if (type === 'opponentMoved') {
    body = 'Your opponent made a move';
    title = 'Opponent Moved';
  } else if (type === 'gameEnded') {
    body = data.result || 'The game has ended';
    title = 'Game Ended';
  } else if (type === 'gameAbandoned') {
    body = 'Your opponent abandoned the game';
    title = 'Game Abandoned';
  }

  showPwaNotification({
    body,
    tag: 'game-update-' + gameId,
    data: { gameId },
  }, title);
});