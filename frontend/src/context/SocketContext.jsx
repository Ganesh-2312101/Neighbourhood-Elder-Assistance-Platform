import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import fcmClient from '../services/fcmClient';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const newSocket = io('http://localhost:5000', {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });
      setSocket(newSocket);

      if (user.role === 'volunteer' || user.role === 'admin') {
        newSocket.on('volunteer:new_task_alert', (payload) => {
          console.log('[SocketContext] Socket task alert received:', payload);
          fcmClient.showTaskNotification(payload, (_taskId) => {
            window.location.href = '/volunteer';
          });
        });

        fcmClient.listenForeground((_taskId) => {
          window.location.href = '/volunteer';
        });
      }

      return () => {
        newSocket.off('volunteer:new_task_alert');
        if (newSocket.connected) {
          newSocket.disconnect();
        } else {
          newSocket.on('connect', () => newSocket.disconnect());
        }
      };
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [user?.id]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
