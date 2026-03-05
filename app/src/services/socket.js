import { io } from 'socket.io-client';

let socket = null;
const SOCKET_URL = 'http://10.0.2.2:5000';

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) { socket.disconnect(); socket = null; }
};
