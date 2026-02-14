import { Room, RoomUser } from '../types';
import { Server } from 'socket.io';

export function generateRoomId(length = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function createRoom(): Room {
  return {
    users: [],
    status: 'waiting',
    timerEnabled: false,
    timerDuration: 600,
    rated: false,
    createdAt: Date.now(),
    moveHistory: []
  };
}

export function assignColor(room: Room): 'white' | 'black' {
  const existingColors = room.users.map(u => u.color);
  return existingColors.includes('white') ? 'black' : 'white';
}

export function cleanupRoomTimeout(room: Room): void {
  if (room.timeoutHandle) {
    clearTimeout(room.timeoutHandle);
    room.timeoutHandle = undefined;
  }
}

export function setRoomTimeout(
  roomId: string,
  room: Room,
  rooms: Record<string, Room>,
  io: Server,
  message: string,
  timeout: number
): void {
  room.timeoutHandle = setTimeout(() => {
    if (rooms[roomId] && rooms[roomId].users.length <= 1) {
      io.to(roomId).emit('roomTimeout', { message });
      delete rooms[roomId];
      console.log(`Room ${roomId} timed out`);
    }
  }, timeout);
}
