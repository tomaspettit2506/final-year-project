import { Socket, Server } from 'socket.io';
import { Room } from '../types';
import { Message } from '../schemas';
import { generateRoomId, createRoom, assignColor, cleanupRoomTimeout, setRoomTimeout } from '../utils/room';

const ROOM_WAIT_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export function registerSocketHandlers(io: Server, rooms: Record<string, Room>): void {
  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join user-specific room for direct messaging
    socket.on('join_user_room', ({ userId }) => {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined their personal room`);
    });

    // Send message handler
    socket.on('send_message', async ({ messageId, senderId, recipientId, text, timestamp, replyTo }) => {
      try {
        const message = new Message({
          senderId,
          recipientId,
          text,
          replyTo,
          timestamp: new Date(timestamp),
          read: false,
          edited: false,
          deleted: false
        });

        await message.save();

        const messageData = {
          id: message._id.toString(),
          senderId,
          recipientId,
          text,
          replyTo: message.replyTo,
          timestamp: message.timestamp.toISOString(),
          read: false
        };

        // Send to recipient's room
        io.to(`user_${recipientId}`).emit('receive_message', messageData);
        
        // Confirm to sender with full message data
        socket.emit('message_sent', { messageId, serverMessageId: message._id.toString(), messageData, success: true });
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message_error', { messageId, error: 'Failed to send message' });
      }
    });

    // Edit message handler
    socket.on('edit_message', async ({ messageId, senderId, recipientId, newText, timestamp }) => {
      try {
        const message = await Message.findOneAndUpdate(
          { _id: messageId, senderId },
          { $set: { text: newText, edited: true } },
          { new: true }
        );

        if (!message) {
          socket.emit('message_error', { messageId, error: 'Message not found or unauthorized' });
          return;
        }

        const messageData = {
          id: message._id.toString(),
          senderId,
          recipientId,
          text: newText,
          replyTo: message.replyTo,
          timestamp: message.timestamp.toISOString(),
          read: message.read,
          edited: true
        };

        // Send to both sender and recipient
        io.to(`user_${recipientId}`).emit('message_edited', messageData);
        socket.emit('message_edited', messageData);
        
        console.log(`Message ${messageId} edited by ${senderId}`);
      } catch (error) {
        console.error('Error editing message:', error);
        socket.emit('message_error', { messageId, error: 'Failed to edit message' });
      }
    });

    // Delete message handler
    socket.on('delete_message', async ({ messageId, senderId, recipientId, timestamp }) => {
      try {
        const message = await Message.findOneAndUpdate(
          { _id: messageId, senderId },
          { $set: { deleted: true } },
          { new: true }
        );

        if (!message) {
          socket.emit('message_error', { messageId, error: 'Message not found or unauthorized' });
          return;
        }

        const deleteData = {
          id: message._id.toString(),
          senderId,
          recipientId
        };

        // Send to both sender and recipient
        io.to(`user_${recipientId}`).emit('message_deleted', deleteData);
        socket.emit('message_deleted', deleteData);
        
        console.log(`Message ${messageId} deleted by ${senderId}`);
      } catch (error) {
        console.error('Error deleting message:', error);
        socket.emit('message_error', { messageId, error: 'Failed to delete message' });
      }
    });

    socket.on('createRoom', ({ name, timerEnabled, timerDuration, rating }, callback) => {
      const roomId = generateRoomId();
      const newRoom = createRoom();
      newRoom.users = [{ id: socket.id, name, color: 'white', rating }];
      // Timer enabled by default for multiplayer
      newRoom.timerEnabled = timerEnabled !== undefined ? timerEnabled : true;
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
      console.log(`Room created: ${roomId} by ${name}. Timer: ${newRoom.timerEnabled ? newRoom.timerDuration + 's' : 'disabled'}. Waiting for Player 2...`);
    });

    socket.on('joinRoom', ({ name, roomId, rating }, callback) => {
      // ...existing handler code...
      if (!rooms[roomId]) {
        const newRoom = createRoom();
        newRoom.users = [{ id: socket.id, name, color: 'white', rating }];
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
      room.users.push({ id: socket.id, name, color, rating });
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.playerColor = color;
      socket.data.playerName = name;

      cleanupRoomTimeout(room);

      if (room.users.length === 2) {
        room.status = 'playing';
        room.gameStartTime = Date.now();
        console.log(`Game ready in room ${roomId}. Timer: ${room.timerEnabled ? room.timerDuration + 's' : 'disabled'}`);
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

    socket.on('endGame', ({ roomId, result, winner, loser, isDraw, reason }, callback) => {
      const room = rooms[roomId];
      if (!room) {
        if (callback) callback({ success: false, message: 'Room not found' });
        return;
      }

      room.status = 'finished';
      io.to(roomId).emit('gameEnded', { 
        result, 
        winner, 
        loser, 
        isDraw: Boolean(isDraw),
        reason: reason ?? result,
        players: room.users 
      });
      if (callback) callback({ success: true });
    });

    socket.on('pauseGame', ({ roomId }, callback) => {
      const room = rooms[roomId];
      if (!room) {
        if (callback) callback({ success: false, message: 'Room not found' });
        return;
      }

      if (room.status !== 'playing') {
        if (callback) callback({ success: false, message: 'Game is not in progress' });
        return;
      }

      room.isPaused = true;
      room.pausedBy = socket.data.playerColor;
      io.to(roomId).emit('gamePaused', { 
        isPaused: true, 
        pausedBy: socket.data.playerColor,
        pausedByName: socket.data.playerName 
      });
      console.log(`Game paused in room ${roomId} by ${socket.data.playerName} (${socket.data.playerColor})`);

      if (callback) callback({ success: true });
    });

    socket.on('resumeGame', ({ roomId }, callback) => {
      const room = rooms[roomId];
      if (!room) {
        if (callback) callback({ success: false, message: 'Room not found' });
        return;
      }

      if (!room.isPaused) {
        if (callback) callback({ success: false, message: 'Game is not paused' });
        return;
      }

      room.isPaused = false;
      room.pausedBy = undefined;
      io.to(roomId).emit('gameResumed', { isPaused: false });
      console.log(`Game resumed in room ${roomId}`);

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
