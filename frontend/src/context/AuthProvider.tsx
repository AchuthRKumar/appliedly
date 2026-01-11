import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';

interface User {
    _id: string;
    email?: string;
    name?: string;
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
            // 1. Check for uid in URL (redirect from login)
            const uid = searchParams.get('uid');
            if (uid) {
                setUser({ _id: uid });
                // Clean URL
                window.history.replaceState({}, '', '/');
                setIsLoading(false);
                return;
            }

            // 2. Or check session via API (if we had a /me endpoint)
            // For now, we'll assume if we have a socket/cookie we are good, 
            // but without a /me endpoint we verify state by trying to fetch data or generic ping
            try {
                // Placeholder: If we wanted to verify session, we'd hit backend.
                // setUser({ _id: 'stored-id' }); // If we persisted it
            } catch (e) {
                // Not logged in
            }
            setIsLoading(false);
        };

        checkAuth();
    }, [searchParams]);

    const login = () => {
        window.location.href = 'https://appliedly.onrender.com/auth/google';
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
