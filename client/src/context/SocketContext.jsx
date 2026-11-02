import React, { createContext, useContext, useEffect, useState } from 'react';
import { initiateSocketConnection, disconnectSocket } from '../services/socket';

const SocketContext = createContext({
  socket: null,
  connected: false,
});

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socketInstance = initiateSocketConnection();
    setSocket(socketInstance);

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socketInstance.on('connect', onConnect);
    socketInstance.on('disconnect', onDisconnect);

    if (socketInstance.connected) {
      setConnected(true);
    }

    return () => {
      socketInstance.off('connect', onConnect);
      socketInstance.off('disconnect', onDisconnect);
      disconnectSocket();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketContext = () => useContext(SocketContext);
export default SocketContext;

