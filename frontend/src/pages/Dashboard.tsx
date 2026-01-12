import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/use-socket';
import { useAuth } from '@/context/AuthProvider';
import { useToast } from '@/components/ui/toast';
import api from '@/lib/api';

interface Job {
    _id: string;
    status: string;
    companyName: string;
    lastUpdated: string;
}

export default function Dashboard() {
    const { user } = useAuth();
    const { socket, isConnected } = useSocket(user?._id);
    const { addToast, ToastContainer } = useToast();
    const [stats, setStats] = useState({ applied: 0, interviewing: 0, offers: 0, rejections: 0 });
    const [recentActivity, setRecentActivity] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const { data } = await api.get('/jobs');

            // Calculate stats
            const newStats = { applied: 0, interviewing: 0, offers: 0, rejections: 0 };
            data.forEach((job: Job) => {
                const status = job.status.toLowerCase();
                if (status.includes('applied')) newStats.applied++;
                else if (status.includes('interview')) newStats.interviewing++;
                else if (status.includes('offer')) newStats.offers++;
                else if (status.includes('reject')) newStats.rejections++;
            });

            setStats(newStats);
            setRecentActivity(data.slice(0, 5));
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Listen for real-time job updates
    useEffect(() => {
        if (!socket || !isConnected) return;

        const handleJobUpdate = (updatedJob: Job) => {
            console.log('Job updated via socket:', updatedJob);
            
            // Refresh data to get latest stats
            fetchData();

            // Show notification
            addToast({
                title: 'Application Updated',
                description: `${updatedJob.companyName} - ${updatedJob.status}`,
                type: 'info',
                duration: 5000,
            });
        };

        socket.on('job-updated', handleJobUpdate);

        return () => {
            socket.off('job-updated', handleJobUpdate);
        };
    }, [socket, isConnected, addToast]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-600">Loading dashboard...</p>
            </div>
        );
    }

    const statCards = [
        { label: 'Applied', value: stats.applied },
        { label: 'Interviewing', value: stats.interviewing },
        { label: 'Offers', value: stats.offers },
        { label: 'Rejections', value: stats.rejections },
    ];

    return (
        <>
            <ToastContainer />
            <div className="space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-black mb-2">Dashboard</h1>
                        <p className="text-gray-600">Overview of your job applications</p>
                    </div>
                    {/* Connection Status */}
                    <div className="flex items-center gap-2">
                        <div className={isConnected ? 'w-2 h-2 bg-black rounded-full' : 'w-2 h-2 bg-gray-400 rounded-full'} />
                        <span className="text-xs text-gray-600">
                            {isConnected ? 'Live' : 'Offline'}
                        </span>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((stat) => (
                        <div
                            key={stat.label}
                            className="bg-white border-2 border-black rounded-lg p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                                    {stat.label}
                                </p>
                            </div>
                            <p className="text-4xl font-bold text-black">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Overview Chart */}
                    <div className="lg:col-span-2 bg-white border-2 border-black rounded-lg p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <h2 className="text-xl font-bold text-black mb-4">Application Trends</h2>
                        <div className="h-64 flex flex-col justify-center">
                            <div className="space-y-4">
                                {/* Simple bar chart representation */}
                                {statCards.map((stat) => {
                                    const maxValue = Math.max(...statCards.map(s => s.value), 1);
                                    const percentage = (stat.value / maxValue) * 100;
                                    return (
                                        <div key={stat.label} className="space-y-1">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-medium text-black">{stat.label}</span>
                                                <span className="font-bold text-black">{stat.value}</span>
                                            </div>
                                            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
                                                <div
                                                    className="h-full bg-black transition-all duration-500"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {statCards.every(s => s.value === 0) && (
                                <p className="text-sm text-gray-500 text-center py-8">No data to display</p>
                            )}
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white border-2 border-black rounded-lg p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <h2 className="text-xl font-bold text-black mb-4">Recent Activity</h2>
                        <div className="space-y-3">
                            {recentActivity.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-8">No recent activity</p>
                            ) : (
                                recentActivity.map((job) => (
                                    <div
                                        key={job._id}
                                        className="flex items-center justify-between py-3 border-b border-gray-200 last:border-0"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-black truncate">
                                                {job.companyName}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {new Date(job.lastUpdated).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                })}
                                            </p>
                                        </div>
                                        <span className="ml-3 px-2.5 py-1 text-xs font-medium bg-black text-white rounded uppercase">
                                            {job.status}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
