import { io } from 'socket.io-client';
import env from '../config/env';

let socket = null;

export const initiateSocketConnection = () => {
  if (socket) return socket;

  socket = io(env.socketUrl, {
    transports: ['websocket', 'polling'],
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => {
  return socket || initiateSocketConnection();
};

export default {
  initiateSocketConnection,
  disconnectSocket,
  getSocket,
};
