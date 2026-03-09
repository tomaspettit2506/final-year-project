function resolveApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL;
  const defaultProductionFallback = 'https://gotcg-backend-production.up.railway.app';

  // In dev, prefer same-origin requests so Vite proxy handles API calls.
  if (import.meta.env.DEV) {
    if (configured) {
      return configured.replace(/\/$/, '');
    }
    return '';
  }

  // In production, always prioritize explicit environment configuration.
  if (configured) {
    return configured.replace(/\/$/, '');
  }

  // 1. Try to derive from current window location (most robust for Codespaces)
  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    
    if (hostname.endsWith(".app.github.dev")) {
      // Handle format: 5173-codespace-name.app.github.dev
      const portFirstMatch = hostname.match(/^(\d+)-(.+)\.app\.github\.dev$/);
      if (portFirstMatch) {
        return `${protocol}//${portFirstMatch[2]}-8000.app.github.dev`;
      }

      // Handle format: codespace-name-5173.app.github.dev
      const nameFirstMatch = hostname.match(/^(.+)-(\d+)\.app\.github\.dev$/);
      if (nameFirstMatch) {
        return `${protocol}//${nameFirstMatch[1]}-8000.app.github.dev`;
      }
    }
  }

  // 2. Stable production fallback for deployments missing VITE_API_URL/VITE_BACKEND_URL.
  //    This avoids same-origin requests hitting static hosts (e.g., Vercel) and returning 404.
  console.warn('[api] Missing VITE_API_URL/VITE_BACKEND_URL in production build; using fallback backend URL.');
  return defaultProductionFallback;
}

const API_BASE_URL = resolveApiBaseUrl();

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`API error ${response.status}: ${body}`);
  }
  return response.json() as Promise<T>;
}

// Define Game interface
export interface GameData {
  userId?: string;
  firebaseUid?: string;
  myRating: number;
  myNewRating?: number;
  ratingChange?: number;
  opponent: string;
  opponentRating: number;
  opponentNewRating?: number;
  opponentRatingChange?: number;
  date: string;
  result: 'win' | 'loss' | 'draw';
  isRated: boolean;
  timeControl: number;
  termination: string;
  moves: number;
  duration: number;
  myAccuracy: number;
  opponentAccuracy: number;
  playerColor?: 'white' | 'black';
}

// Save a completed game
export async function saveGame(gameData: GameData): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/game`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(gameData),
  });
  return handleResponse<any>(response);
}

export interface PredictRequestData {
  requestId?: string;
  topK?: number;
  boardState: {
    fen: string;
    moves?: string[];
    playerColor?: 'white' | 'black';
    moveNumber?: number;
  };
}

export interface PredictResponseData {
  requestId: string;
  prediction: {
    bestMove: string;
    confidence: number;
    topMoves: Array<{
      move: string;
      score: number;
    }>;
  };
  model: {
    name: string;
    version: string;
    source?: string;
  };
  source: 'model-service';
  latencyMs: number;
}

export async function predictPosition(payload: PredictRequestData): Promise<PredictResponseData> {
  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<PredictResponseData>(response);
}