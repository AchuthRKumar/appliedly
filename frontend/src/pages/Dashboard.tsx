import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';

interface Job {
    _id: string;
    status: string;
    companyName: string;
    lastUpdated: string;
}

export default function Dashboard() {
    const [stats, setStats] = useState({ applied: 0, interviewing: 0, offers: 0, rejections: 0 });
    const [recentActivity, setRecentActivity] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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

                    // Fallback for case sensitivity or slight mismatches
                    // In real app, rely on enum constants
                });

                // Set Stats
                setStats(newStats);

                // Set Recent Activity (assuming backend sorts by date, or take top 5)
                setRecentActivity(data.slice(0, 5));

            } catch (error) {
                console.error('Failed to load dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return <div className="p-8">Loading dashboard...</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Applied</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.applied}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Interviewing</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.interviewing}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Offers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.offers}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rejections</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.rejections}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[200px] flex items-center justify-center text-muted-foreground border border-dashed rounded-md">
                            Activity Chart (Coming Soon)
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentActivity.length === 0 ? (
                                <div className="text-sm text-muted-foreground">No recent activity</div>
                            ) : (
                                recentActivity.map(job => (
                                    <div key={job._id} className="flex items-center justify-between border-b pb-2 last:border-0">
                                        <div>
                                            <p className="text-sm font-medium">{job.companyName}</p>
                                            <p className="text-xs text-muted-foreground">Updated {new Date(job.lastUpdated).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-xs px-2 py-1 rounded bg-secondary">{job.status}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
