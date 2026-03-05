import { io } from 'socket.io-client';
import { Platform } from 'react-native';
import api from './api';

let socket = null;

const deriveSocketUrl = () => {
  // Prefer the api baseURL if available and strip any trailing /api
  const base = (api && api.defaults && api.defaults.baseURL) ? api.defaults.baseURL : null;
  if (base) return base.replace(/\/api\/?$/, '');

  // Fallbacks
  if (Platform.OS === 'android') return 'http://10.0.2.2:5000'; // emulator
  if (Platform.OS === 'web' && typeof window !== 'undefined') return window.location.origin;
  return 'http://localhost:5000';
};

export const getSocket = () => {
  if (!socket) {
    const SOCKET_URL = deriveSocketUrl();
    socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) { socket.disconnect(); socket = null; }
};
