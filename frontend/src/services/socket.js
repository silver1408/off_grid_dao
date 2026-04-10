import { io } from 'socket.io-client';
import { API_BASE_URL } from './api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_BASE_URL;

let socket;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
