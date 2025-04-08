import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    // Conectar socket solo si el usuario está autenticado
    if (currentUser) {
      // Crear conexión al servidor
      const socketInstance = io(import.meta.env.VITE_WS_URL || 'wss://game-battleship-production.up.railway.app', {
        transports: ['websocket'],
        autoConnect: true,
        withCredentials: true,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        path: '/socket.io'
      });

      // Eventos de conexión
      socketInstance.on('connect', () => {
        console.log('Socket conectado');
        setConnected(true);
        
        // Registrar usuario en el sistema de sockets
        socketInstance.emit('register', {
          username: currentUser.username,
          userId: currentUser.id
        });
      });

      socketInstance.on('disconnect', () => {
        console.log('Socket desconectado');
        setConnected(false);
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Error de conexión:', error);
        setConnected(false);
      });

      setSocket(socketInstance);

      // Limpiar al desmontar
      return () => {
        if (socketInstance) {
          socketInstance.disconnect();
        }
      };
    }
  }, [currentUser]);

  const value = {
    socket,
    connected
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};