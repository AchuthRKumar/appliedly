import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

interface Job {
    _id: string;
    companyName: string;
    jobTitle: string;
    status: string;
    lastUpdated: string;
}

const COLUMNS = [
    { id: 'Applied', label: 'Applied', color: 'bg-blue-500/10 text-blue-500 border-blue-200' },
    { id: 'Interviewing', label: 'Interviewing', color: 'bg-amber-500/10 text-amber-500 border-amber-200' },
    { id: 'Offer', label: 'Offer', color: 'bg-green-500/10 text-green-500 border-green-200' },
    { id: 'Rejection', label: 'Rejection', color: 'bg-red-500/10 text-red-500 border-red-200' },
];

export function KanbanBoard() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const { data } = await api.get('/jobs');
                setJobs(data);
            } catch (error) {
                console.error('Failed to fetch jobs', error);
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, []);

    if (loading) {
        return <div className="p-4 text-center text-muted-foreground">Loading application data...</div>;
    }

    return (
        <div className="flex h-full gap-4 overflow-x-auto pb-4">
            {COLUMNS.map(col => {
                const columnJobs = jobs.filter(j =>
                    // Normalize status checking (backend might capitalize differently?)
                    j.status === col.id || (col.id === 'Applied' && !['Interviewing', 'Offer', 'Rejection'].includes(j.status))
                );

                return (
                    <div key={col.id} className="w-80 flex-shrink-0 flex flex-col rounded-lg bg-secondary/20 border border-border/50">
                        <div className={cn("p-3 border-b border-border/50 font-semibold flex items-center justify-between", col.color)}>
                            {col.label}
                            <Badge variant="secondary" className="bg-background/50">{columnJobs.length}</Badge>
                        </div>

                        <div className="flex-1 p-2 space-y-2 min-h-[100px] overflow-y-auto">
                            {columnJobs.map((job) => (
                                <Card key={job._id} className="hover:shadow-md transition-shadow">
                                    <CardHeader className="p-3 pb-0 space-y-0 relative">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-semibold text-sm leading-none">{job.companyName}</h4>
                                                <p className="text-xs text-muted-foreground mt-1">{job.jobTitle}</p>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-6 w-6">
                                                <MoreHorizontal className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-3 pt-2">
                                        <div className="text-xs text-muted-foreground">
                                            Updated: {new Date(job.lastUpdated).toLocaleDateString()}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            {columnJobs.length === 0 && (
                                <div className="text-xs text-muted-foreground text-center py-4 opacity-50">
                                    No jobs
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
