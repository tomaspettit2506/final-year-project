// frontend/src/Services/socket.ts

import { io, Socket } from 'socket.io-client';

function resolveApiBaseUrl(): string {
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

  // 2. Fallback to environment variable if it's set and NOT localhost
  const configured = import.meta.env.VITE_BACKEND_URL;
  if (configured && !configured.includes("localhost")) {
    return configured;
  }

  // 3. Default to localhost
  return "http://localhost:8000";
}

const URL = resolveApiBaseUrl();

export const socket: Socket = io(URL, {
  autoConnect: false,
  transports: ['websocket'],
});
