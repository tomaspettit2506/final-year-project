import express, { Express } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

import { connectDatabase } from './config/database';
import { initializeFirebase } from './config/firebase';
import { registerSocketHandlers } from './socket/handlers';
import { Room } from './types';

import userRoutes from './routes/users';
import gameRoutes from './routes/games';
import friendRoutes from './routes/friends';
import requestRoutes from './routes/requests';
import gameInviteRoutes from './routes/gameInvites';
import messageRoutes from './routes/messages';
import { validateCorsOrigin } from './config/cors';

dotenv.config();

const app: Express = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: validateCorsOrigin,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(
  cors({
    origin: validateCorsOrigin,
    credentials: true
  })
);
app.use(express.json());

// Attach io instance to app for use in routes
app.locals.io = io;

// Track initialization state
let isInitialized = false;
let initError: string | null = null;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date(),
    initialized: isInitialized,
    ...(initError && { error: initError })
  });
});

// Initialize
async function initialize(): Promise<void> {
  try {
    console.log('Initializing services...');
    await connectDatabase();
    console.log('Database connected');
    initializeFirebase();
    console.log('Firebase initialized');
    isInitialized = true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    initError = errorMsg;
    console.error('Initialization error (non-fatal):', error);
    // Don't exit - allow server to run in degraded mode
    // This is important for Railway healthchecks
  }
}

// Routes
app.use('/user', userRoutes);
app.use('/game', gameRoutes);
app.use('/friend', friendRoutes);
app.use('/friends', friendRoutes); // Alias for /friend routes
app.use('/request', requestRoutes);
app.use('/game-invite', gameInviteRoutes);
app.use('/message', messageRoutes);

// Socket.IO
const rooms: Record<string, Room> = {};
registerSocketHandlers(io, rooms);

// Start server immediately (don't wait for initialization)
const PORT = process.env.PORT || 8000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Initialize services in background (non-blocking)
initialize().catch((error) => {
  console.error('Background initialization failed:', error);
});