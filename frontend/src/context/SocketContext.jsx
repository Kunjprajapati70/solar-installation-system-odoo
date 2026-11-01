import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    let newSocket = null;
    try {
      newSocket = io(window.location.origin, {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        timeout: 5000,
        reconnectionAttempts: 3
      });

      setSocket(newSocket);

      newSocket.on('connect_error', () => {
        // Quiet fallback - offline mode
      });

      newSocket.on('connect', () => {
        console.log('⚡ Connected to SunPower Live Socket.IO');
        if (user?._id) {
          newSocket.emit('join-user', user._id);
        }
        if (user?.role) {
          newSocket.emit('join-role', user.role);
        }
        if (user?.role === 'customer' && user?.customerProfile?._id) {
          newSocket.emit('join-customer', user.customerProfile._id);
        }
      });

      newSocket.on('new-notification', (notif) => {
        setNotifications((prev) => [notif, ...prev]);
      });
    } catch (e) {
      console.warn('Socket connection skipped:', e.message);
    }

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, notifications, setNotifications }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  return context;
};
