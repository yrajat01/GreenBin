import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const initiateSocketConnection = () => {
  if (socket) return socket;
  
  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
  });
  
  console.log('Connecting socket...');
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    console.log('Disconnecting socket...');
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => {
  return socket || initiateSocketConnection();
};
