import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

const socketURL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace('/api', '');

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Khởi tạo socket connection
    const newSocket = io(socketURL, {
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Connected to socket server:', newSocket.id);
      
      // Emit join để phân room dựa trên user đăng nhập hiện tại
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          newSocket.emit('join', {
            user_id: user.id,
            role: user.role
          });
        } catch (e) {
           console.error("Error parsing user for socket", e);
        }
      }
    });

    const handleAuthChange = () => {
      const userStr = localStorage.getItem('user');
      if (userStr && newSocket.connected) {
        try {
          const user = JSON.parse(userStr);
          newSocket.emit('join', { user_id: user.id, role: user.role });
        } catch(e) {}
      }
    };
    window.addEventListener('auth-change', handleAuthChange);

    newSocket.on('disconnect', () => {
      console.log('Disconnected from socket server');
    });

    setSocket(newSocket);

    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};
