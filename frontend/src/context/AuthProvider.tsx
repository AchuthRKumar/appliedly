import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '@/lib/api';

interface User {
    _id: string;
    email?: string;
    name?: string;
    avatar?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: () => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const checkAuth = async () => {
            // If we have a uid in params, it means we just logged in.
            // We can optimistically set it, but we should verify with backend.
            const uid = searchParams.get('uid');
            if (uid) {
                // Clean URL
                window.history.replaceState({}, '', '/');
            }

            try {
                // Always try to fetch full profile to verify session is valid
                const { data } = await api.get('/auth/me');
                setUser(data);
            } catch (error) {
                // If 401, we are not logged in.
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, [searchParams]);

    const login = () => {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        window.location.href = `${apiUrl}/auth/google`;
    };

    const logout = () => {
        setUser(null);
        window.location.href = '/login';
        // api.post('/auth/logout');
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
