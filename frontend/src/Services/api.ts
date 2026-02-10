function resolveApiBaseUrl(): string {
  // In dev, prefer same-origin requests so Vite proxy handles API calls.
  if (import.meta.env.DEV) {
    return '';
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

  // 2. Use configured API/base URL if provided
  const configured = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL;
  if (configured) {
    return configured;
  }

  // 3. Default to localhost
  return "http://localhost:8000";
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

// Get a specific user's friends by Firebase UID
export async function listFriends(firebaseUid: string): Promise<Friend[]> {
  const response = await fetch(`${API_BASE_URL}/friend/${firebaseUid}`);
  return handleResponse<Friend[]>(response);
}

// Create a new friend entry
export async function createFriend(friend: { friendName: string; friendEmail: string; friendRating: number; }): Promise<Friend> {
  const response = await fetch(`${API_BASE_URL}/friend`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(friend),
  });
  return handleResponse<Friend>(response);
}

// Define Friend interface (matches backend response)
export interface Friend {
  friendUser?: string;
  friendFirebaseUid: string;
  friendName: string;
  friendEmail: string;
  friendRating: number;
  gameRecents?: any;
  addedAt?: Date;
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