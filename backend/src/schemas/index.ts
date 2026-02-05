import mongoose from 'mongoose';

const gameSchema = new mongoose.Schema({
  myRating: Number,
  opponent: String,
  opponentRating: Number,
  date: { type: Date, default: Date.now },
  result: String,
  timeControl: Number,
  termination: { type: String, enum: ['checkmate', 'resignation', 'timeout', 'draw', 'abandonment'] },
  moves: Number,
  duration: Number,
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
  timeControl: { type: String, default: '10' },
  rated: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'accepted', 'declined', 'expired'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 5 * 60 * 1000) }
});

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  firebaseUid: { type: String, unique: true, sparse: true },
  rating: Number,
  gameRecents: [gameSchema],
  friends: [friendSchema]
});

export const User = mongoose.model('User', userSchema);
export const Game = mongoose.model('Game', gameSchema);
export const Request = mongoose.model('Request', requestSchema);
export const GameInvite = mongoose.model('GameInvite', gameInviteSchema);
export const Friend = mongoose.model('Friend', friendSchema);
