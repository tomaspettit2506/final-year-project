import { Socket, Server } from 'socket.io';
import { Room } from '../types';
import { generateRoomId, createRoom, assignColor, cleanupRoomTimeout, setRoomTimeout } from '../utils/room';

const ROOM_WAIT_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export function registerSocketHandlers(io: Server, rooms: Record<string, Room>): void {
  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('createRoom', ({ name, timerEnabled, timerDuration }, callback) => {
      const roomId = generateRoomId();
      const newRoom = createRoom();
      newRoom.users = [{ id: socket.id, name, color: 'white' }];
      newRoom.timerEnabled = timerEnabled || false;
      newRoom.timerDuration = timerDuration || 600;

      rooms[roomId] = newRoom;
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.playerColor = 'white';
      socket.data.playerName = name;

      setRoomTimeout(roomId, newRoom, rooms, io, 'Room expired: No opponent joined within 5 minutes', ROOM_WAIT_TIMEOUT);

      if (callback) callback({ success: true, roomId, color: 'white' });
      io.to(roomId).emit('roomUpdated', {
        roomId,
        users: rooms[roomId].users,
        status: rooms[roomId].status
      });
      console.log(`Room created: ${roomId} by ${name}. Waiting for Player 2...`);
    });

    socket.on('joinRoom', ({ name, roomId }, callback) => {
      // ...existing handler code...
      if (!rooms[roomId]) {
        const newRoom = createRoom();
        newRoom.users = [{ id: socket.id, name, color: 'white' }];
        rooms[roomId] = newRoom;
        socket.join(roomId);
        socket.data.roomId = roomId;
        socket.data.playerColor = 'white';
        socket.data.playerName = name;

        setRoomTimeout(roomId, newRoom, rooms, io, 'Room expired: No opponent joined within 5 minutes', ROOM_WAIT_TIMEOUT);

        if (callback) callback({ success: true, color: 'white', users: newRoom.users });
        io.to(roomId).emit('roomUpdated', { roomId, users: rooms[roomId].users, status: rooms[roomId].status });
        return;
      }

      const room = rooms[roomId];
      const existingUser = room.users.find(u => u.id === socket.id);
      if (existingUser) {
        socket.join(roomId);
        socket.data.roomId = roomId;
        socket.data.playerColor = existingUser.color;
        socket.data.playerName = name;
        if (callback) callback({ success: true, color: existingUser.color, users: room.users });
        return;
      }

      if (room.users.length >= 2) {
        if (callback) callback({ success: false, message: 'Room is full' });
        return;
      }

      const color = assignColor(room);
      room.users.push({ id: socket.id, name, color });
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.playerColor = color;
      socket.data.playerName = name;

      cleanupRoomTimeout(room);

      if (room.users.length === 2) {
        room.status = 'playing';
        room.gameStartTime = Date.now();
        io.to(roomId).emit('gameReady', {
          players: room.users,
          status: room.status,
          startTime: room.gameStartTime,
          timerEnabled: room.timerEnabled,
          timerDuration: room.timerDuration
        });
      } else {
        io.to(roomId).emit('roomUpdated', { roomId, users: room.users, status: room.status });
      }

      if (callback) callback({ success: true, color, users: room.users });
    });

    socket.on('cancelRoom', ({ roomId }, callback) => {
      if (!rooms[roomId]) {
        if (callback) callback({ success: false, message: 'Room not found' });
        return;
      }

      const room = rooms[roomId];
      const userIndex = room.users.findIndex(u => u.id === socket.id);

      if (userIndex !== -1) {
        room.users.splice(userIndex, 1);
        socket.leave(roomId);
      }

      if (room.users.length === 0) {
        cleanupRoomTimeout(room);
        delete rooms[roomId];
        console.log(`Room ${roomId} cancelled and deleted`);
      } else {
        io.to(roomId).emit('playerLeft', {
          remainingPlayers: room.users,
          message: 'A player has left the room'
        });
      }

      if (callback) callback({ success: true });
    });

    socket.on('syncGameState', ({ roomId }: { roomId: string }, callback?: (response: any) => void) => {
      const room = rooms[roomId];
      if (!room) {
        if (callback) callback({ success: false, message: 'Room not found' });
        return;
      }

      if (callback) callback({
        success: true,
        status: room.status,
        players: room.users,
        moveHistory: room.moveHistory || [],
        timerEnabled: room.timerEnabled,
        timerDuration: room.timerDuration
      });
    });

    socket.on('makeMove', ({ roomId, move }, callback) => {
      const room = rooms[roomId];
      if (!room) {
        if (callback) callback({ success: false, message: 'Room not found' });
        return;
      }

      const moveData = {
        move,
        playerColor: socket.data.playerColor,
        playerName: socket.data.playerName
      };

      io.to(roomId).emit('moveMade', moveData);

      if (!room.moveHistory) room.moveHistory = [];
      room.moveHistory.push({
        move,
        playerColor: socket.data.playerColor,
        playerName: socket.data.playerName,
        timestamp: Date.now()
      });

      if (callback) callback({ success: true });
    });

    socket.on('endGame', ({ roomId, result, winner }, callback) => {
      const room = rooms[roomId];
      if (!room) {
        if (callback) callback({ success: false, message: 'Room not found' });
        return;
      }

      room.status = 'finished';
      io.to(roomId).emit('gameEnded', { result, winner, players: room.users });
      if (callback) callback({ success: true });
    });

    socket.on('disconnect', () => {
      const roomId = socket.data.roomId;
      if (roomId && rooms[roomId]) {
        const room = rooms[roomId];
        const idx = room.users.findIndex(u => u.id === socket.id);
        if (idx !== -1) {
          room.users.splice(idx, 1);

          if (room.users.length === 0) {
            cleanupRoomTimeout(room);
            delete rooms[roomId];
            console.log(`Room deleted: ${roomId}`);
          } else {
            if (room.status === 'waiting' && !room.timeoutHandle) {
              setRoomTimeout(
                roomId,
                room,
                rooms,
                io,
                'Room expired: Opponent disconnected and no new player joined within 5 minutes',
                ROOM_WAIT_TIMEOUT
              );
            }
            io.to(roomId).emit('opponentDisconnected', { remainingPlayers: room.users });
            console.log(`Player disconnected from room ${roomId}. Remaining: ${room.users.length}`);
          }
        }
      }
      console.log(`User disconnected: ${socket.id}`);
    });
  });
}
