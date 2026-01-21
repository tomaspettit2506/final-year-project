import express, { Express } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import { AutoEncryptionLoggerLevel } from 'mongodb';

dotenv.config();

const app: Express = express();
const httpServer = createServer(app);

// Allow frontend connections from localhost, env-configured URL, and Codespaces (*.app.github.dev)
const allowedOrigins = [
  process.env.CLIENT_URL,
  // Allow a secure variant of CLIENT_URL if only http is provided
  process.env.CLIENT_URL?.replace('http://', 'https://'),
  'http://localhost:5173',
  'http://localhost:5174', // Player 2
  'http://localhost:4173',
  'http://localhost:4174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:4173',
  'http://127.0.0.1:4174',
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

interface Position {
  row: number;
  col: number;
}

interface RoomMove {
  move: { from: Position; to: Position; notation: string };
  playerColor: 'white' | 'black';
  playerName: string;
  timestamp: number;
}

interface Room {
  users: RoomUser[];
  status: 'waiting' | 'playing' | 'finished';
  gameStartTime?: number;
  timerEnabled?: boolean;
  timerDuration?: number;
  createdAt: number;
  timeoutHandle?: NodeJS.Timeout;
  moveHistory?: RoomMove[];
}

const rooms: Record<string, Room> = {};
const ROOM_WAIT_TIMEOUT = 5 * 60 * 1000; // 5 minutes

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
  friendUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  friendFirebaseUid: { type: String },
  friendName: String,
  friendEmail: String,
  friendRating: Number,
  addedAt: { type: Date, default: Date.now }
});

const requestSchema = new mongoose.Schema({
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const gameInviteSchema = new mongoose.Schema({
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roomId: { type: String, required: true },
  timeControl: { type: String, default: '10' }, // '10', '30', '60' (minutes)
  rated: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'accepted', 'declined', 'expired'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 5 * 60 * 1000) } // 5 minutes
});

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  firebaseUid: { type: String, unique: true, sparse: true },
  rating: Number,
  gameRecents: [gameSchema],
  friends: [friendSchema]
});

const User = mongoose.model('User', userSchema);
const Game = mongoose.model('Game', gameSchema);
const Request = mongoose.model('Request', requestSchema);
const GameInvite = mongoose.model('GameInvite', gameInviteSchema);
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

// GET or CREATE User by email
app.post('/user/email/:email', async (req, res) => {
  const email = req.params.email;
  const { name, rating, firebaseUid } = req.body;
  try {
    // Try to find existing user by firebaseUid or email
    let user = firebaseUid 
      ? await User.findOne({ $or: [{ firebaseUid }, { email }] })
      : await User.findOne({ email });
    
    if (!user) {
      // Create new user if doesn't exist
      user = new User({ 
        name: name || email.split('@')[0], 
        email, 
        firebaseUid,
        rating: rating || 500 
      });
      await user.save();
    } else if (firebaseUid && !user.firebaseUid) {
      // Update existing user with firebaseUid if not set
      user.firebaseUid = firebaseUid;
      await user.save();
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error('Error in /user/email:', error);
    res.status(500).json({ error: 'Failed to get or create user' });
  }
});

// UPDATE User
app.put('/user/:id', async (req, res) => {
  const userId = req.params.id;
  const { name, email, rating } = req.body;
  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email, rating },
      { new: true }
    );
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user data' });
  }
});

// DELETE User
app.delete('/user/:id', async (req, res) => {
  const userId = req.params.id;
  try {
    await User.findByIdAndDelete(userId);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user data' });
  }
});

// GET Games (all games globally)
app.get('/games', async (req, res) => {
  try {
    const games = await Game.find().limit(10).sort({ date: -1 });
    res.json(games);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch game data' });
  }
});

// GET User's recent games
app.get('/user/:id/games', async (req, res) => {
  const userId = req.params.id;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // gameRecents is an embedded array, not references, so no need to populate
    res.json(user.gameRecents || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user games' });
  }
});

// GET a user's friends by Firebase UID
app.get('/user/:firebaseUid/friends', async (req, res) => {
  try {
    const { firebaseUid } = req.params;

    if (!firebaseUid) {
      return res.status(400).json({ error: 'firebaseUid parameter required' });
    }

    const user = await User.findOne({ firebaseUid }).populate('friends.friendUser', 'name email rating firebaseUid');

    if (!user) {
      // If the user hasn't been synced yet, return an empty list to keep UI stable
      return res.json([]);
    }

    // Normalize friends to include populated user details when available
    const friends = (user.friends || []).map((friend: any) => {
      const populated = friend.friendUser as any;
      return {
        friendUser: friend.friendUser,
        friendFirebaseUid: populated?.firebaseUid || friend.friendFirebaseUid,
        friendName: populated?.name || friend.friendName,
        friendEmail: populated?.email || friend.friendEmail,
        friendRating: populated?.rating ?? friend.friendRating,
        addedAt: friend.addedAt
      };
    });

    res.json(friends);
  } catch (error) {
    console.error('Error fetching user friends:', error);
    res.status(500).json({ error: 'Failed to fetch user friends' });
  }
});

// POST Game (add game and link to user's gameRecents)
app.post('/game', async (req, res) => {
  const { opponent, date, result, timeControl, moves, myAccuracy, opponentAccuracy, userId } = req.body;
  try {
    const newGame = new Game({ opponent, date, result, timeControl, moves, myAccuracy, opponentAccuracy });
    await newGame.save();

    // If userId is provided, add the game to the user's gameRecents array
    // Note: gameRecents stores embedded subdocuments, not references
    if (userId) {
      await User.findByIdAndUpdate(
        userId,
        { $push: { gameRecents: { opponent, date, result, timeControl, moves, myAccuracy, opponentAccuracy, _id: newGame._id } } },
        { new: true }
      );
    }

    res.status(201).json(newGame);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save game data' });
  }
});

// DELETE Game
app.delete('/game/:id', async (req, res) => {
  const gameId = req.params.id;
  try {
    // Remove game from all users' gameRecents arrays
    // Since gameRecents stores embedded subdocuments, we need to pull by _id
    await User.updateMany(
      { 'gameRecents._id': gameId },
      { $pull: { gameRecents: { _id: gameId } } }
    );

    // Delete the game itself from the Game collection
    await Game.findByIdAndDelete(gameId);
    res.status(200).json({ message: 'Game deleted successfully' });
  } catch (error) {
    console.error('Error deleting game:', error);
    res.status(500).json({ error: 'Failed to delete game data' });
  }
});

// GET Requests (incoming friend requests for current user)
app.get('/request', async (req, res) => {
  try {
    // Accept userId as Firebase UID in query parameter
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId query parameter required' });
    }
    
    // Find the MongoDB user by Firebase UID
    const user = await User.findOne({ firebaseUid: userId });
    if (!user) {
      // Return empty array if user not found in MongoDB yet
      return res.json([]);
    }
    
    const requests = await Request.find({ toUser: user._id, status: 'pending' })
      .populate('fromUser', 'name email rating firebaseUid')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ error: 'Failed to fetch request data' });
  }
});

// POST Request (send friend request)
app.post('/request', async (req, res) => {
  const { fromUserId, toUserId } = req.body;
  try {
    // Find MongoDB users by Firebase UIDs
    const fromUser = await User.findOne({ firebaseUid: fromUserId });
    const toUser = await User.findOne({ firebaseUid: toUserId });
    
    if (!fromUser) {
      return res.status(404).json({ error: 'Sender user not found in database' });
    }
    if (!toUser) {
      return res.status(404).json({ error: 'Recipient user not found in database' });
    }
    
    // Check if request already exists
    const existingRequest = await Request.findOne({
      fromUser: fromUser._id,
      toUser: toUser._id,
      status: 'pending'
    });
    
    if (existingRequest) {
      return res.status(400).json({ error: 'Friend request already sent' });
    }
    
    const newRequest = new Request({ fromUser: fromUser._id, toUser: toUser._id });
    await newRequest.save();
    
    // Populate the fromUser field before sending response
    await newRequest.populate('fromUser', 'name email rating firebaseUid');
    res.status(201).json(newRequest);
  } catch (error) {
    console.error('Failed to save request:', error);
    res.status(500).json({ error: 'Failed to save request data' });
  }
});

// DELETE request
app.delete('/request/:id', async (req, res) => {
  const requestId = req.params.id;
  try {
    await Request.findByIdAndDelete(requestId);
    res.status(200).json({ message: 'Request deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete request data' });
  }
});

// POST Accept friend request
app.post('/request/:id/accept', async (req, res) => {
  const requestId = req.params.id;
  try {
    const request = await Request.findById(requestId).populate('fromUser toUser');
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request already processed' });
    }
    
    // Update request status
    request.status = 'accepted';
    await request.save();

    const fromUser: any = request.fromUser;
    const toUser: any = request.toUser;

    if (!fromUser || !toUser) {
      return res.status(400).json({ error: 'Invalid users on request' });
    }

    const ensureFriendsList = (user: any) => {
      if (!user.friends) user.friends = [];
    };

    const addFriendIfMissing = (user: any, target: any) => {
      ensureFriendsList(user);
      const alreadyFriend = user.friends.some((f: any) => {
        const friendUserId = f.friendUser?._id || f.friendUser;
        const targetId = target._id?.toString?.();
        return (
          (friendUserId && friendUserId.toString?.() === targetId) ||
          f.friendFirebaseUid === target.firebaseUid
        );
      });

      if (!alreadyFriend) {
        user.friends.push({
          friendUser: target._id,
          friendFirebaseUid: target.firebaseUid,
          friendName: target.name || target.email,
          friendEmail: target.email,
          friendRating: target.rating
        });
      }
    };

    // Add each user to the other's friends list
    addFriendIfMissing(toUser, fromUser);
    addFriendIfMissing(fromUser, toUser);

    await toUser.save();
    await fromUser.save();
    
    res.status(200).json({ message: 'Friend request accepted', request, friends: toUser.friends });
  } catch (error) {
    console.error('Failed to accept request:', error);
    res.status(500).json({ error: 'Failed to accept request' });
  }
});

// POST Decline friend request
app.post('/request/:id/decline', async (req, res) => {
  const requestId = req.params.id;
  try {
    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request already processed' });
    }
    
    // Update request status
    request.status = 'declined';
    await request.save();
    
    res.status(200).json({ message: 'Friend request declined' });
  } catch (error) {
    console.error('Failed to decline request:', error);
    res.status(500).json({ error: 'Failed to decline request' });
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

// DELETE Friend
app.delete('/friend/:id', async (req, res) => {
  const friendId = req.params.id;
  try {
    await Friend.findByIdAndDelete(friendId);
    res.status(200).json({ message: 'Friend deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete friend data' });
  }
});

// GET Game Invites (incoming invites for current user)
app.get('/game-invite', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId query parameter required' });
    }
    
    // Find the MongoDB user by Firebase UID
    const user = await User.findOne({ firebaseUid: userId });
    if (!user) {
      return res.json([]);
    }
    
    // Find pending invites that haven't expired
    const invites = await GameInvite.find({ 
      toUser: user._id, 
      status: 'pending',
      expiresAt: { $gt: new Date() }
    })
      .populate('fromUser', 'name email rating firebaseUid')
      .sort({ createdAt: -1 });
    res.json(invites);
  } catch (error) {
    console.error('Error fetching game invites:', error);
    res.status(500).json({ error: 'Failed to fetch game invites' });
  }
});

// POST Game Invite (send challenge with room ID to a friend)
app.post('/game-invite', async (req, res) => {
  const { fromUserId, toUserId, roomId, timeControl, rated } = req.body;
  try {
    // Find MongoDB users by Firebase UIDs
    const fromUser = await User.findOne({ firebaseUid: fromUserId });
    const toUser = await User.findOne({ firebaseUid: toUserId });
    
    if (!fromUser) {
      return res.status(404).json({ error: 'Sender user not found in database' });
    }
    if (!toUser) {
      return res.status(404).json({ error: 'Recipient user not found in database' });
    }
    
    // Check if active invite already exists
    const existingInvite = await GameInvite.findOne({
      fromUser: fromUser._id,
      toUser: toUser._id,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });
    
    if (existingInvite) {
      return res.status(400).json({ error: 'Active game invite already sent to this friend' });
    }
    
    const newInvite = new GameInvite({
      fromUser: fromUser._id,
      toUser: toUser._id,
      roomId,
      timeControl: timeControl || '10',
      rated: rated || false
    });
    await newInvite.save();
    
    // Populate the fromUser field before sending response
    await newInvite.populate('fromUser', 'name email rating firebaseUid');
    res.status(201).json(newInvite);
  } catch (error) {
    console.error('Failed to save game invite:', error);
    res.status(500).json({ error: 'Failed to save game invite' });
  }
});

// POST Accept game invite
app.post('/game-invite/:id/accept', async (req, res) => {
  const inviteId = req.params.id;
  try {
    const invite = await GameInvite.findById(inviteId);
    if (!invite) {
      return res.status(404).json({ error: 'Invite not found' });
    }
    
    if (invite.status !== 'pending') {
      return res.status(400).json({ error: 'Invite already processed' });
    }
    
    if (new Date() > invite.expiresAt) {
      invite.status = 'expired';
      await invite.save();
      return res.status(400).json({ error: 'Invite has expired' });
    }
    
    // Update invite status
    invite.status = 'accepted';
    await invite.save();
    
    res.status(200).json({ message: 'Game invite accepted', roomId: invite.roomId, invite });
  } catch (error) {
    console.error('Failed to accept game invite:', error);
    res.status(500).json({ error: 'Failed to accept game invite' });
  }
});

// POST Decline game invite
app.post('/game-invite/:id/decline', async (req, res) => {
  const inviteId = req.params.id;
  try {
    const invite = await GameInvite.findById(inviteId);
    if (!invite) {
      return res.status(404).json({ error: 'Invite not found' });
    }
    
    if (invite.status !== 'pending') {
      return res.status(400).json({ error: 'Invite already processed' });
    }
    
    // Update invite status
    invite.status = 'declined';
    await invite.save();
    
    res.status(200).json({ message: 'Game invite declined' });
  } catch (error) {
    console.error('Failed to decline game invite:', error);
    res.status(500).json({ error: 'Failed to decline game invite' });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Create Room: user provides name, gets roomId
  socket.on('createRoom', ({ name, timerEnabled, timerDuration }, callback) => {
    console.log(`[createRoom] User ${socket.id} creating room with name: ${name}`);
    const roomId = generateRoomId();
    // First user is always white
    const newRoom: Room = { 
      users: [{ id: socket.id, name, color: 'white' }],
      status: 'waiting',
      timerEnabled: timerEnabled || false,
      timerDuration: timerDuration || 600,
      createdAt: Date.now(),
      moveHistory: []
    };
    rooms[roomId] = newRoom;
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.playerColor = 'white';
    socket.data.playerName = name;
    
    // Set timeout to auto-delete room if second player doesn't join
    newRoom.timeoutHandle = setTimeout(() => {
      if (rooms[roomId] && rooms[roomId].users.length === 1) {
        io.to(roomId).emit('roomTimeout', {
          message: 'Room expired: No opponent joined within 5 minutes'
        });
        delete rooms[roomId];
        console.log(`Room ${roomId} timed out (no second player)`);
      }
    }, ROOM_WAIT_TIMEOUT);
    
    console.log(`[createRoom] Calling callback with success: true, roomId: ${roomId}`);
    if (callback) callback({ success: true, roomId, color: 'white' });
    io.to(roomId).emit('roomUpdated', {
      roomId,
      users: rooms[roomId].users,
      status: rooms[roomId].status
    });
    console.log(`Room created: ${roomId} by ${name}. Waiting for Player 2...`);
  });

  // Join Room: user provides name and roomId
  socket.on('joinRoom', ({ name, roomId }, callback) => {
    console.log(`\n[joinRoom] User ${socket.id} attempting to join room ${roomId} as ${name}`);
    console.log(`[joinRoom] Active rooms: ${Object.keys(rooms).join(', ')}`);
    console.log(`[joinRoom] Looking for room: ${roomId}`);
    
    if (!rooms[roomId]) {
      console.log(`[joinRoom] ERROR: Room ${roomId} not found!`);
      console.log(`[joinRoom] Available rooms: ${JSON.stringify(Object.keys(rooms))}`);
      if (callback) callback({ success: false, message: 'Room not found or has expired' });
      return;
    }

    const room = rooms[roomId];
    console.log(`[joinRoom] Room ${roomId} found with ${room.users.length} users:`, room.users.map(u => u.name));
    
    // Check if room is full (max 2 players)
    if (room.users.length >= 2) {
      console.log(`[joinRoom] ERROR: Room ${roomId} is full`);
      if (callback) callback({ success: false, message: 'Room is full' });
      return;
    }

    // Assign color: if white taken, assign black, else white
    const existingColors = room.users.map(u => u.color);
    let color: 'white' | 'black' = existingColors.includes('white') ? 'black' : 'white';
    
    console.log(`[joinRoom] Assigning color: ${color}`);
    room.users.push({ id: socket.id, name, color });
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.playerColor = color;
    socket.data.playerName = name;

    // Clear the timeout since second player has joined
    if (room.timeoutHandle) {
      clearTimeout(room.timeoutHandle);
      room.timeoutHandle = undefined;
      console.log(`[joinRoom] Cleared timeout for room ${roomId}`);
    }

    // Once both players join, start the game
    if (room.users.length === 2) {
      room.status = 'playing';
      room.gameStartTime = Date.now();
      console.log(`[gameReady] BOTH PLAYERS READY! Emitting gameReady for room ${roomId}`);
      console.log(`[gameReady] Players: ${room.users.map(u => `${u.name} (${u.color})`).join(' vs ')}`);
      io.to(roomId).emit('gameReady', {
        players: room.users,
        status: room.status,
        startTime: room.gameStartTime,
        timerEnabled: room.timerEnabled,
        timerDuration: room.timerDuration
      });
      console.log(`✓ Game started in room ${roomId} between ${room.users.map(u => u.name).join(' vs ')}\n`);
    } else {
      console.log(`[roomUpdated] Player joined. Waiting for second player. (${room.users.length}/2)`);
      console.log(`[roomUpdated] Emitting roomUpdated for room ${roomId}, players: ${room.users.length}/2`);
      io.to(roomId).emit('roomUpdated', {
        roomId,
        users: room.users,
        status: room.status
      });
    }

    console.log(`[joinRoom] Calling callback with success: true, color: ${color}`);
    if (callback) callback({ success: true, color, users: room.users });
  });

  // Cancel/leave room
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

    // If room is empty or game hasn't started and first player leaves, delete room
    if (room.users.length === 0) {
      if (room.timeoutHandle) clearTimeout(room.timeoutHandle);
      delete rooms[roomId];
      console.log(`Room ${roomId} cancelled and deleted`);
    } else {
      // Notify remaining players
      io.to(roomId).emit('playerLeft', {
        remainingPlayers: room.users,
        message: 'A player has left the room'
      });
    }

    if (callback) callback({ success: true });
  });

  // Allow clients to sync the latest move history if they joined just as a move was played
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

  // Handle game moves
  socket.on('makeMove', ({ roomId, move }, callback) => {
    const room = rooms[roomId];
    if (!room) {
      console.log(`[makeMove] ERROR: Room ${roomId} not found`);
      if (callback) callback({ success: false, message: 'Room not found' });
      return;
    }

    console.log(`[makeMove] Move received in room ${roomId}:`, {
      from: move.from,
      to: move.to,
      notation: move.notation,
      playerColor: socket.data.playerColor,
      playerName: socket.data.playerName,
      socketId: socket.id,
      roomPlayers: room.users.map(u => `${u.name} (${u.color})`)
    });

    // Get all sockets in the room to verify
    const socketsInRoom = io.sockets.adapter.rooms.get(roomId);
    console.log(`[makeMove] Sockets in room ${roomId}:`, socketsInRoom ? Array.from(socketsInRoom) : 'none');

    // Broadcast move to all players in the room (including sender)
    const moveData = {
      move,
      playerColor: socket.data.playerColor,
      playerName: socket.data.playerName
    };
    
    console.log(`[makeMove] Broadcasting move data:`, moveData);
    io.to(roomId).emit('moveMade', moveData);

    console.log(`[makeMove] Move broadcasted to room ${roomId}`);

    // Persist move in room history for late joiners / resync
    if (!room.moveHistory) {
      room.moveHistory = [];
    }

    room.moveHistory.push({
      move,
      playerColor: socket.data.playerColor,
      playerName: socket.data.playerName,
      timestamp: Date.now()
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
          // Clear timeout if exists
          if (room.timeoutHandle) {
            clearTimeout(room.timeoutHandle);
          }
          delete rooms[roomId];
          console.log(`Room deleted: ${roomId}`);
        } else {
          // If only one player remains and game hasn't started, set new timeout
          if (room.status === 'waiting' && !room.timeoutHandle) {
            room.timeoutHandle = setTimeout(() => {
              if (rooms[roomId] && rooms[roomId].users.length === 1) {
                io.to(roomId).emit('roomTimeout', {
                  message: 'Room expired: Opponent disconnected and no new player joined within 5 minutes'
                });
                delete rooms[roomId];
                console.log(`Room ${roomId} timed out (opponent disconnected)`);
              }
            }, ROOM_WAIT_TIMEOUT);
          }
          
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
