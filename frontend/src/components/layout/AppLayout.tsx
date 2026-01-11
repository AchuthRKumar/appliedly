import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/context/AuthProvider';
import { Loader2 } from 'lucide-react';

export default function AppLayout() {
    const { user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Allow access if socket/cookie is present or generic "user" is set from URL
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return (
        <div className="flex min-h-screen bg-background font-sans antialiased">
            {/* Sidebar - Desktop */}
            <aside className="hidden w-64 md:block fixed inset-y-0 z-50">
                <Sidebar className="h-full" />
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-8 overflow-y-auto h-screen bg-background">
                <Outlet />
            </main>
        </div>
    );
}
