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
  const configured = import.meta.env.VITE_API_URL;
  if (configured && !configured.includes("localhost")) {
    return configured;
  }

  // 3. Default to localhost
  return "http://localhost:8000";
}

const API_BASE_URL = resolveApiBaseUrl();

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`API error ${response.status}: ${body}`);
  }
  return response.json() as Promise<T>;
}

// Example function to list friends
export async function listFriends(): Promise<Friend[]> {
  const response = await fetch(`${API_BASE_URL}/friends`);
  return handleResponse<Friend[]>(response);
}

// Example function to create a new friend
export async function createFriend(friend: { name: string; email: string; password: string; }): Promise<Friend> {
  const response = await fetch(`${API_BASE_URL}/friends`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(friend),
  });
  return handleResponse<Friend>(response);
}

// Define Friend interface
export interface Friend {
  id: string;
  name: string;
  email: string;
}