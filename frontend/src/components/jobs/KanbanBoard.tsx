import { useEffect, useState } from 'react';
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
    { id: 'Applied', label: 'Applied' },
    { id: 'Interviewing', label: 'Interviewing' },
    { id: 'Offer', label: 'Offer' },
    { id: 'Rejection', label: 'Rejection' },
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
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-600">Loading applications...</p>
            </div>
        );
    }

    return (
        <div className="flex h-full gap-4 overflow-x-auto pb-4">
            {COLUMNS.map((col) => {
                const columnJobs = jobs.filter(
                    (j) =>
                        j.status === col.id ||
                        (col.id === 'Applied' &&
                            !['Interviewing', 'Offer', 'Rejection'].includes(j.status))
                );

                return (
                    <div
                        key={col.id}
                        className="w-80 flex-shrink-0 flex flex-col bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    >
                        {/* Column Header */}
                        <div className="p-4 border-b-2 border-black bg-black text-white">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-sm uppercase tracking-wide">
                                    {col.label}
                                </h3>
                                <span className="px-2.5 py-1 text-xs font-bold bg-white text-black rounded">
                                    {columnJobs.length}
                                </span>
                            </div>
                        </div>

                        {/* Jobs List */}
                        <div className="flex-1 p-3 space-y-3 min-h-[200px] overflow-y-auto">
                            {columnJobs.map((job) => (
                                <div
                                    key={job._id}
                                    className="bg-white border-2 border-black rounded-lg p-4 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-sm text-black truncate">
                                                {job.companyName}
                                            </h4>
                                            <p className="text-xs text-gray-600 mt-1 truncate">
                                                {job.jobTitle}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-gray-600 hover:text-black hover:bg-gray-100"
                                        >
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="pt-2 border-t border-gray-200">
                                        <p className="text-xs text-gray-500">
                                            {new Date(job.lastUpdated).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {columnJobs.length === 0 && (
                                <div className="flex items-center justify-center h-32 text-sm text-gray-400">
                                    No applications
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
