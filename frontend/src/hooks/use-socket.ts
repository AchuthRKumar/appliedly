import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

interface UseSocketReturn {
    socket: Socket | null;
    isConnected: boolean;
    error: string | null;
}

export const useSocket = (userId?: string): UseSocketReturn => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) {
            setSocket(null);
            setIsConnected(false);
            return;
        }

        const newSocket = io(SOCKET_URL, {
            withCredentials: true,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        newSocket.on('connect', () => {
            console.log('Socket connected:', newSocket.id);
            setIsConnected(true);
            setError(null);
            // Join user's room for private updates
            newSocket.emit('join-room', userId);
        });

        newSocket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            setIsConnected(false);
            if (reason === 'io server disconnect') {
                // Server disconnected, reconnect manually
                newSocket.connect();
            }
        });

        newSocket.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
            setError('Failed to connect to server');
            setIsConnected(false);
        });

        newSocket.on('reconnect', (attemptNumber) => {
            console.log('Socket reconnected after', attemptNumber, 'attempts');
            setIsConnected(true);
            setError(null);
            newSocket.emit('join-room', userId);
        });

        newSocket.on('reconnect_error', (err) => {
            console.error('Socket reconnection error:', err);
            setError('Reconnection failed');
        });

        newSocket.on('reconnect_failed', () => {
            console.error('Socket reconnection failed');
            setError('Unable to reconnect to server');
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
            setSocket(null);
            setIsConnected(false);
            setError(null);
        };
    }, [userId]);

    return { socket, isConnected, error };
};
