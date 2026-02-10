import mongoose from 'mongoose';

const gameSchema = new mongoose.Schema({
  myRating: Number,
  myNewRating: Number,
  ratingChange: Number,
  opponent: String,
  opponentRating: Number,
  opponentNewRating: Number,
  opponentRatingChange: Number,
  date: { type: Date, default: Date.now },
  result: String,
  isRated: { type: Boolean, default: false },
  timeControl: Number,
  termination: { type: String, enum: ['checkmate', 'resignation', 'timeout', 'draw', 'abandonment', 'stalemate', 'unknown'] },
  moves: Number,
  duration: Number,
  myAccuracy: Number,
  opponentAccuracy: Number,
  playerColor: { type: String, enum: ['white', 'black'] }
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
  timeControl: { type: String, default: '10' },
  rated: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'accepted', 'declined', 'expired'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 5 * 60 * 1000) }
});

const messageSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  recipientId: { type: String, required: true },
  text: { type: String, required: true },
  replyTo: { type: String },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
  edited: { type: Boolean, default: false },
  deleted: { type: Boolean, default: false }
});

// Add compound index for efficient queries
messageSchema.index({ senderId: 1, recipientId: 1, timestamp: -1 });
messageSchema.index({ recipientId: 1, read: 1 });

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  firebaseUid: { type: String, unique: true, sparse: true },
  rating: Number,
  gameRecents: [gameSchema],
  friends: [friendSchema]
});

// Add unique indexes to prevent duplicate user creation
userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ firebaseUid: 1 }, { unique: true, sparse: true });

export const User = mongoose.model('User', userSchema);
export const Game = mongoose.model('Game', gameSchema);
export const Request = mongoose.model('Request', requestSchema);
export const GameInvite = mongoose.model('GameInvite', gameInviteSchema);
export const Friend = mongoose.model('Friend', friendSchema);
export const Message = mongoose.model('Message', messageSchema);
