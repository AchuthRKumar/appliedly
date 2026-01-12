import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthProvider';

interface SidebarProps {
    className?: string;
}

export function Sidebar({ className }: SidebarProps) {
    const { user, logout } = useAuth();
    const handleLogout = () => {
        logout();
    };

    const links = [
        { href: '/', label: 'Overview', icon: LayoutDashboard },
        { href: '/jobs', label: 'Applications', icon: Briefcase },
        { href: '/settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className={cn("h-screen border-r border-black bg-white flex flex-col", className)}>
            {/* Logo Section */}
            <div className="px-6 py-8 border-b border-black">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 border-2 border-black rounded-lg flex items-center justify-center">
                        <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            className="w-5 h-5 text-black"
                        >
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                            <line x1="12" y1="22.08" x2="12" y2="12"></line>
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-black tracking-tight">Appliedly</h2>
                </div>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 px-4 py-6">
                <nav className="space-y-1">
                    {links.map((link) => (
                        <NavLink
                            key={link.href}
                            to={link.href}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all rounded-lg",
                                    isActive
                                        ? "bg-black text-white"
                                        : "text-black hover:bg-gray-100"
                                )
                            }
                        >
                            <link.icon className="h-5 w-5" />
                            {link.label}
                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* User Section */}
            <div className="px-4 py-6 border-t border-black space-y-3">
                <div className="flex items-center gap-3 px-3 py-2">
                    <Avatar className="h-10 w-10 border-2 border-black">
                        <AvatarImage src={user?.avatar} />
                        <AvatarFallback className="bg-black text-white font-semibold">
                            {user?.name?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden min-w-0">
                        <p className="text-sm font-semibold text-black truncate">
                            {user?.name || 'User'}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                            {user?.email || 'No email'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-black hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <LogOut className="h-5 w-5" />
                    Log out
                </button>
            </div>
        </div>
    );
}
