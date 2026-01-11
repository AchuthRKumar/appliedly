import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'https://appliedly.onrender.com'; // Match backend URL

export const useSocket = (userId?: string) => {
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        if (!userId) return;

        const newSocket = io(SOCKET_URL, {
            withCredentials: true,
        });

        newSocket.on('connect', () => {
            console.log('Socket connected:', newSocket.id);
            newSocket.emit('join-room', userId);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [userId]);

    return socket;
};
