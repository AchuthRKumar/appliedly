import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
        <div className={cn("pb-12 h-screen border-r bg-background", className)}>
            <div className="space-y-4 py-4">
                <div className="px-4 py-2">
                    <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary" />
                        JobTracker
                    </h2>
                </div>
                <div className="px-3 py-2">
                    <div className="space-y-1">
                        {links.map((link) => (
                            <NavLink
                                key={link.href}
                                to={link.href}
                                className={({ isActive }) =>
                                    cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary",
                                        isActive
                                            ? "bg-secondary text-primary"
                                            : "text-muted-foreground hover:bg-secondary/50"
                                    )
                                }
                            >
                                <link.icon className="h-4 w-4" />
                                {link.label}
                            </NavLink>
                        ))}
                    </div>
                </div>
            </div>

            <div className="absolute bottom-4 left-0 w-full px-4">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-secondary/20 mb-3">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={user?.avatar} />
                        <AvatarFallback>{user?.name?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium leading-none truncate">{user?.name || 'User'}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email || 'No email'}</p>
                    </div>
                </div>
                <Button variant="ghost" className="w-full justify-start gap-2 text-red-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                    Log out
                </Button>
            </div>
        </div>
    );
}
