import express, { Express } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import { AutoEncryptionLoggerLevel } from 'mongodb';
// import { GameManager } from './game/GameManager';

dotenv.config();

const app: Express = express();
const httpServer = createServer(app);

// Allow frontend connections from localhost, env-configured URL, and Codespaces (*.app.github.dev)
const allowedOrigins = [
  process.env.CLIENT_URL,
  // Allow a secure variant of CLIENT_URL if only http is provided
  process.env.CLIENT_URL?.replace('http://', 'https://'),
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173'
].filter(Boolean) as string[];

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // Allow same-origin and non-browser clients
      if (!origin) return callback(null, true);

      // Direct matches
      if (allowedOrigins.includes(origin)) return callback(null, true);

      // Allow any GitHub Codespaces host (e.g., *.app.github.dev)
      try {
        const hostname = new URL(origin).hostname;
        if (hostname.endsWith('.app.github.dev')) {
          return callback(null, true);
        }
      } catch (err) {
        // Fall through to rejection below
      }

      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
// Support both MONGO_URI (used in .env) and MONGODB_URI (older name)
const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/chessapp';
// Log which source is used (do NOT print full URI to avoid leaking secrets)
console.log(`Using MongoDB source: ${process.env.MONGO_URI ? 'MONGO_URI' : process.env.MONGODB_URI ? 'MONGODB_URI' : 'local fallback'}`);
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Firebase Admin Initialization
// Note: In production, use service account key from environment
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin initialized');
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
} else {
  console.warn('Firebase service account not configured');
}


// --- Simple in-memory room logic for demo ---
function generateRoomId(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

interface RoomUser {
  id: string;
  name: string;
  color: 'white' | 'black';
}

interface Room {
  users: RoomUser[];
  status: 'waiting' | 'playing' | 'finished';
  gameStartTime?: number;
  timerEnabled?: boolean;
  timerDuration?: number;
}

const rooms: Record<string, Room> = {};

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

const gameSchema = new mongoose.Schema({
  opponent: String,
  date: { type: Date, default: Date.now },
  result: String,
  timeControl: Number,
  moves: Number,
  myAccuracy: Number,
  opponentAccuracy: Number
});

const friendSchema = new mongoose.Schema({
  friendName: String,
  friendEmail: String,
  friendRating: Number
});

const requestSchema = new mongoose.Schema({
  requestName: String,
  requestEmail: String,
  requestRating: Number
});

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  rating: Number,
  gameRecents: [gameSchema],
  friends: [friendSchema]
});

const User = mongoose.model('User', userSchema);
const Game = mongoose.model('Game', gameSchema);
const Request = mongoose.model('Request', requestSchema);
const Friend = mongoose.model('Friend', friendSchema);

// GET Users
app.get('/users', async (req, res) => {
  try {
    const users = await User.find().limit(10).sort({ rating: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

// POST User
app.post('/user', async (req, res) => {
  const { name, email, rating } = req.body;
  try {
    const newUser = new User({ name, email, rating });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save user data' });
  }
});

// GET Games
app.get('/games', async (req, res) => {
  try {
    const games = await Game.find().limit(10).sort({ date: -1 });
    res.json(games);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch game data' });
  }
});

// POST Game
app.post('/game', async (req, res) => {
  const { opponent, date, result, timeControl, moves, myAccuracy, opponentAccuracy } = req.body;
  try {
    const newGame = new Game({ opponent, date, result, timeControl, moves, myAccuracy, opponentAccuracy });
    await newGame.save();
    res.status(201).json(newGame);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save game data' });
  }
});

// DELETE Game
app.delete('/game/:id', async (req, res) => {
  const gameId = req.params.id;
  try {
    await Game.findByIdAndDelete(gameId);
    res.status(200).json({ message: 'Game deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete game data' });
  }
});

// GET Requests
app.get('/requests', async (req, res) => {
  try {
    const requests = await Request.find().limit(10).sort({ requestName: 1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch request data' });
  }
});

// POST Request
app.post('/request', async (req, res) => {
  const { requestName, requestEmail, requestRating } = req.body;
  try {
    const newRequest = new Request({ requestName, requestEmail, requestRating });
    await newRequest.save();
    res.status(201).json(newRequest);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save request data' });
  }
});

// GET Friends
app.get('/friends', async (req, res) => {
  try {
    const friends = await Friend.find().limit(10).sort({ userId: 1 });
    res.json(friends);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch friend data' });
  }
});

// POST Friend
app.post('/friend', async (req, res) => {
  const { friendName, friendEmail, friendRating } = req.body;
  try {
    const newFriend = new Friend({ friendName, friendEmail, friendRating });
    await newFriend.save();
    res.status(201).json(newFriend);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save friend data' });
  }
});

// Mock /players endpoint for frontend
app.get('/players', (req, res) => {
  // Return mock recent games data
  res.json([
    {
      id: 'game1',
      players: ['Alice', 'Bob'],
      result: '1-0',
      date: new Date().toISOString(),
    },
    {
      id: 'game2',
      players: ['Carol', 'Dave'],
      result: '0-1',
      date: new Date(Date.now() - 86400000).toISOString(),
    }
  ]);
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Create Room: user provides name, gets roomId
  socket.on('createRoom', ({ name, timerEnabled, timerDuration }, callback) => {
    const roomId = generateRoomId();
    // First user is always white
    rooms[roomId] = { 
      users: [{ id: socket.id, name, color: 'white' }],
      status: 'waiting',
      timerEnabled: timerEnabled || false,
      timerDuration: timerDuration || 600
    };
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.playerColor = 'white';
    socket.data.playerName = name;
    
    if (callback) callback({ success: true, roomId, color: 'white' });
    io.to(roomId).emit('roomUpdated', {
      roomId,
      users: rooms[roomId].users,
      status: rooms[roomId].status
    });
    console.log(`Room created: ${roomId} by ${name}`);
  });

  // Join Room: user provides name and roomId
  socket.on('joinRoom', ({ name, roomId }, callback) => {
    if (!rooms[roomId]) {
      if (callback) callback({ success: false, message: 'Room not found' });
      return;
    }

    const room = rooms[roomId];
    
    // Check if room is full (max 2 players)
    if (room.users.length >= 2) {
      if (callback) callback({ success: false, message: 'Room is full' });
      return;
    }

    // Assign color: if white taken, assign black, else white
    const existingColors = room.users.map(u => u.color);
    let color: 'white' | 'black' = existingColors.includes('white') ? 'black' : 'white';
    
    room.users.push({ id: socket.id, name, color });
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.playerColor = color;
    socket.data.playerName = name;

    // Once both players join, start the game
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
      console.log(`Game started in room ${roomId} between ${room.users.map(u => u.name).join(' vs ')}`);
    } else {
      io.to(roomId).emit('roomUpdated', {
        roomId,
        users: room.users,
        status: room.status
      });
    }

    if (callback) callback({ success: true, color, users: room.users });
  });

  // Handle game moves
  socket.on('makeMove', ({ roomId, move }, callback) => {
    const room = rooms[roomId];
    if (!room) {
      if (callback) callback({ success: false, message: 'Room not found' });
      return;
    }

    // Broadcast move to both players
    io.to(roomId).emit('moveMade', {
      move,
      playerColor: socket.data.playerColor,
      playerName: socket.data.playerName
    });

    if (callback) callback({ success: true });
  });

  // Handle game end
  socket.on('endGame', ({ roomId, result, winner }, callback) => {
    const room = rooms[roomId];
    if (!room) {
      if (callback) callback({ success: false, message: 'Room not found' });
      return;
    }

    room.status = 'finished';
    io.to(roomId).emit('gameEnded', {
      result,
      winner,
      players: room.users
    });

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
          delete rooms[roomId];
          console.log(`Room deleted: ${roomId}`);
        } else {
          // Notify remaining player that opponent disconnected
          io.to(roomId).emit('opponentDisconnected', {
            remainingPlayers: room.users
          });
          console.log(`Player disconnected from room ${roomId}. Remaining: ${room.users.length}`);
        }
      }
    }
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 8000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
