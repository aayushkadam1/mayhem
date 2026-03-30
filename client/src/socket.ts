import { io, Socket } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export const API_BASE = SERVER_URL;

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity,
    });
  }
  return socket;
}

export async function api<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data as T;
}

export function adminApi<T = unknown>(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  return api<T>(path, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}
