import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';

import { connectDatabase } from './config/database';
import { initializeFirebase } from './config/firebase';

import userRoutes from './routes/users';
import gameRoutes from './routes/games';
import friendRoutes from './routes/friends';
import requestRoutes from './routes/requests';
import gameInviteRoutes from './routes/gameInvites';
import messageRoutes from './routes/messages';

dotenv.config();
setGlobalOptions({ region: 'europe-west1', maxInstances: 10 });

const app: Express = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.CLIENT_URL?.replace('http://', 'https://'),
  'http://localhost:5173',
  'https://localhost:5173',
  'http://localhost:5174',
  'https://localhost:5174',
  'http://localhost:5175',
  'https://localhost:5175',
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      try {
        const hostname = new URL(origin).hostname;
        if (hostname.endsWith('.app.github.dev')) return callback(null, true);
      } catch {
        // Fall through to rejection
      }
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json());

app.locals.io = null;

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.use('/user', userRoutes);
app.use('/game', gameRoutes);
app.use('/friend', friendRoutes);
app.use('/friends', friendRoutes);
app.use('/request', requestRoutes);
app.use('/game-invite', gameInviteRoutes);
app.use('/message', messageRoutes);

let initPromise: Promise<void> | null = null;

function initializeOnce(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      await connectDatabase();
      initializeFirebase();
    })().catch((error) => {
      initPromise = null;
      throw error;
    });
  }

  return initPromise;
}

export const api = onRequest(async (req, res) => {
  try {
    await initializeOnce();
    return app(req, res);
  } catch (error) {
    console.error('Function initialization error:', error);
    return res.status(500).json({ error: 'Backend initialization failed' });
  }
});
