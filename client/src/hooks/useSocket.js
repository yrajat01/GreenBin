import { useEffect } from 'react';
import { useSocketContext } from '../context/SocketContext';

/**
 * Convenient hook to subscribe to socket events with automatic cleanup
 * @param {string} eventName
 * @param {Function} handler
 */
export const useSocketEvent = (eventName, handler) => {
  const { socket, connected } = useSocketContext();

  useEffect(() => {
    if (!socket || !eventName || typeof handler !== 'function') return;

    socket.on(eventName, handler);

    return () => {
      socket.off(eventName, handler);
    };
  }, [socket, eventName, handler]);

  return { socket, connected };
};

export const useSocket = () => useSocketContext();
export default useSocket;

