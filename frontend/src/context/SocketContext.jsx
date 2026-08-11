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
        transports: ['websocket', 'polling']
      });
      setSocket(newSocket);

      if (user.role === 'volunteer' || user.role === 'admin') {
        // -----------------------------------------------------------------
        // 1. SOCKET.IO: Real-time in-app alerts (app tab is open)
        //    When a neighbour raises a request, backend emits this event.
        // -----------------------------------------------------------------
        newSocket.on('volunteer:new_task_alert', (payload) => {
          console.log('[SocketContext] Socket task alert received:', payload);
          fcmClient.showTaskNotification(payload, (_taskId) => {
            window.location.href = '/volunteer';
          });
        });

        // -----------------------------------------------------------------
        // 2. FIREBASE FCM FOREGROUND: Real push when app is open
        //    Firebase doesn't auto-show notifications when the tab is focused.
        //    listenForeground() handles this gap by showing a manual popup.
        // -----------------------------------------------------------------
        fcmClient.listenForeground((_taskId) => {
          window.location.href = '/volunteer';
        });
      }

      return () => {
        newSocket.off('volunteer:new_task_alert');
        newSocket.close();
      };
    } else {
      if (socket) socket.close();
      setSocket(null);
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
