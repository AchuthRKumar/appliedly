import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/context/AuthProvider';
import { Loader2 } from 'lucide-react';

export default function AppLayout() {
    const { user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-black" />
                    <p className="text-sm text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return (
        <div className="flex min-h-screen bg-white">
            {/* Sidebar - Desktop */}
            <aside className="hidden w-64 md:block fixed inset-y-0 z-50 border-r border-black bg-white">
                <Sidebar className="h-full" />
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 bg-white min-h-screen">
                <div className="p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
