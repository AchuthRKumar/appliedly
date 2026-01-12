import { useEffect, useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal, Search, Filter, ChevronDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSocket } from '@/hooks/use-socket';
import { useAuth } from '@/context/AuthProvider';
import { useToast } from '@/components/ui/toast';
import { JobDetails } from './JobDetails';
import api from '@/lib/api';

interface Job {
    _id: string;
    companyName: string;
    jobTitle: string;
    status: string;
    lastUpdated: string;
    email?: string;
    location?: string;
}

interface JobsTableProps {
    onJobAdded?: () => void;
}

type SortField = 'companyName' | 'jobTitle' | 'status' | 'lastUpdated';
type SortDirection = 'asc' | 'desc' | null;

const STATUS_OPTIONS = ['All', 'Applied', 'Interviewing', 'Offer', 'Rejection'];

export function JobsTable({ onJobAdded }: JobsTableProps = {}) {
    const { user } = useAuth();
    const { socket, isConnected } = useSocket(user?._id);
    const { addToast, ToastContainer } = useToast();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortField, setSortField] = useState<SortField>('lastUpdated');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
    const [statusMenuOpen, setStatusMenuOpen] = useState<string | null>(null);
    const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());

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

    useEffect(() => {
        fetchJobs();
    }, []);

    // Listen for real-time job updates
    useEffect(() => {
        if (!socket || !isConnected) return;

        const handleJobUpdate = (updatedJob: Job) => {
            console.log('Job updated via socket:', updatedJob);
            
            setJobs((prevJobs) => {
                const existingIndex = prevJobs.findIndex((j) => j._id === updatedJob._id);
                const isNew = existingIndex < 0;
                
                if (existingIndex >= 0) {
                    // Update existing job
                    const newJobs = [...prevJobs];
                    newJobs[existingIndex] = updatedJob;
                    
                    // Show notification
                    addToast({
                        title: 'Application Updated',
                        description: `${updatedJob.companyName} - ${updatedJob.status}`,
                        type: 'info',
                        duration: 5000,
                    });
                    
                    return newJobs;
                } else {
                    // Add new job
                    addToast({
                        title: 'New Application Added',
                        description: `${updatedJob.companyName} - ${updatedJob.status}`,
                        type: 'info',
                        duration: 5000,
                    });
                    return [updatedJob, ...prevJobs];
                }
            });
        };

        const handleJobDelete = (data: { id: string }) => {
            console.log('Job deleted via socket:', data.id);
            setJobs((prevJobs) => prevJobs.filter((j) => j._id !== data.id));
            setSelectedJobs((prev) => {
                const newSet = new Set(prev);
                newSet.delete(data.id);
                return newSet;
            });
            if (selectedJobId === data.id) {
                setSelectedJobId(null);
            }
            addToast({
                title: 'Application Deleted',
                description: 'The application has been removed',
                type: 'info',
                duration: 3000,
            });
        };

        socket.on('job-updated', handleJobUpdate);
        socket.on('job-deleted', handleJobDelete);

        return () => {
            socket.off('job-updated', handleJobUpdate);
            socket.off('job-deleted', handleJobDelete);
        };
    }, [socket, isConnected, addToast, selectedJobId]);

    // Filter and sort jobs
    useEffect(() => {
        let filtered = [...jobs];

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (job) =>
                    job.companyName.toLowerCase().includes(query) ||
                    job.jobTitle.toLowerCase().includes(query) ||
                    job.email?.toLowerCase().includes(query) ||
                    job.location?.toLowerCase().includes(query)
            );
        }

        // Apply status filter
        if (statusFilter !== 'All') {
            filtered = filtered.filter((job) => job.status === statusFilter);
        }

        // Apply sorting
        if (sortField && sortDirection) {
            filtered.sort((a, b) => {
                let aValue: string | number = a[sortField];
                let bValue: string | number = b[sortField];

                if (sortField === 'lastUpdated') {
                    aValue = new Date(aValue as string).getTime();
                    bValue = new Date(bValue as string).getTime();
                } else {
                    aValue = (aValue as string).toLowerCase();
                    bValue = (bValue as string).toLowerCase();
                }

                if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }

        setFilteredJobs(filtered);
    }, [jobs, searchQuery, statusFilter, sortField, sortDirection]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            // Cycle through: desc -> asc -> null -> desc
            if (sortDirection === 'desc') {
                setSortDirection('asc');
            } else if (sortDirection === 'asc') {
                setSortDirection(null);
                setSortField('lastUpdated');
                setSortDirection('desc');
            }
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) {
            return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
        }
        if (sortDirection === 'asc') {
            return <ArrowUp className="h-4 w-4 text-black" />;
        }
        if (sortDirection === 'desc') {
            return <ArrowDown className="h-4 w-4 text-black" />;
        }
        return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    };

    const handleStatusUpdate = async (jobId: string, newStatus: string) => {
        try {
            await api.put(`/jobs/${jobId}`, { status: newStatus });
            setStatusMenuOpen(null);
            // Socket will update the UI automatically
        } catch (error) {
            console.error('Error updating status:', error);
            addToast({
                title: 'Update Failed',
                description: 'Failed to update job status',
                type: 'error',
            });
        }
    };

    const handleBulkStatusUpdate = async (newStatus: string) => {
        if (selectedJobs.size === 0) return;
        try {
            await Promise.all(
                Array.from(selectedJobs).map((jobId) =>
                    api.put(`/jobs/${jobId}`, { status: newStatus })
                )
            );
            setSelectedJobs(new Set());
            addToast({
                title: 'Bulk Update Successful',
                description: `Updated ${selectedJobs.size} application(s) to ${newStatus}`,
                type: 'success',
            });
        } catch (error) {
            console.error('Error bulk updating:', error);
            addToast({
                title: 'Bulk Update Failed',
                description: 'Failed to update some applications',
                type: 'error',
            });
        }
    };

    const handleBulkDelete = async () => {
        if (selectedJobs.size === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedJobs.size} application(s)?`)) return;
        
        try {
            await Promise.all(
                Array.from(selectedJobs).map((jobId) => api.delete(`/jobs/${jobId}`))
            );
            setSelectedJobs(new Set());
            addToast({
                title: 'Bulk Delete Successful',
                description: `Deleted ${selectedJobs.size} application(s)`,
                type: 'success',
            });
        } catch (error) {
            console.error('Error bulk deleting:', error);
            addToast({
                title: 'Bulk Delete Failed',
                description: 'Failed to delete some applications',
                type: 'error',
            });
        }
    };

    const toggleJobSelection = (jobId: string) => {
        setSelectedJobs((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(jobId)) {
                newSet.delete(jobId);
            } else {
                newSet.add(jobId);
            }
            return newSet;
        });
    };

    const toggleAllSelection = () => {
        if (selectedJobs.size === filteredJobs.length) {
            setSelectedJobs(new Set());
        } else {
            setSelectedJobs(new Set(filteredJobs.map((j) => j._id)));
        }
    };

    const getStatusBadge = (status: string) => {
        const baseClasses = "px-3 py-1 text-xs font-bold uppercase tracking-wide rounded";
        switch (status) {
            case 'Applied':
                return `${baseClasses} bg-gray-100 text-black border border-black`;
            case 'Interviewing':
                return `${baseClasses} bg-black text-white`;
            case 'Offer':
                return `${baseClasses} bg-black text-white`;
            case 'Rejection':
                return `${baseClasses} bg-gray-900 text-white border border-black`;
            default:
                return `${baseClasses} bg-gray-100 text-black border border-black`;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-600">Loading applications...</p>
            </div>
        );
    }

    return (
        <>
            <ToastContainer />
            <JobDetails
                open={!!selectedJobId}
                onOpenChange={(open) => !open && setSelectedJobId(null)}
                jobId={selectedJobId}
                onUpdate={() => {
                    fetchJobs();
                    setSelectedJobId(null);
                }}
                onDelete={() => {
                    fetchJobs();
                    setSelectedJobId(null);
                }}
            />
            <div className="space-y-4" onClick={() => setStatusMenuOpen(null)}>
            {/* Filters and Search */}
            <div className="bg-white border-2 border-black rounded-lg p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by company, role, email, or location..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 bg-white text-black placeholder-gray-400"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-2">
                        <Filter className="h-5 w-5 text-gray-600" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2.5 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 bg-white text-black font-medium"
                        >
                            {STATUS_OPTIONS.map((status) => (
                                <option key={status} value={status}>
                                    {status}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Results count and bulk actions */}
                <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                        Showing <span className="font-bold text-black">{filteredJobs.length}</span> of{' '}
                        <span className="font-bold text-black">{jobs.length}</span> applications
                    </p>
                    {selectedJobs.size > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                                <span className="font-bold text-black">{selectedJobs.size}</span> selected
                            </span>
                            <select
                                onChange={(e) => {
                                    if (e.target.value) {
                                        handleBulkStatusUpdate(e.target.value);
                                        e.target.value = '';
                                    }
                                }}
                                className="px-3 py-1.5 text-sm border-2 border-black rounded-lg bg-white text-black focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                            >
                                <option value="">Update Status...</option>
                                {STATUS_OPTIONS.map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleBulkDelete}
                                className="text-red-600 border-red-600 hover:bg-red-50"
                            >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-black text-white">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider w-12">
                                    <input
                                        type="checkbox"
                                        checked={selectedJobs.size === filteredJobs.length && filteredJobs.length > 0}
                                        onChange={toggleAllSelection}
                                        className="w-4 h-4 border-2 border-white rounded focus:ring-2 focus:ring-white"
                                    />
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                                    <button
                                        onClick={() => handleSort('companyName')}
                                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                                    >
                                        Company
                                        {getSortIcon('companyName')}
                                    </button>
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                                    <button
                                        onClick={() => handleSort('jobTitle')}
                                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                                    >
                                        Position
                                        {getSortIcon('jobTitle')}
                                    </button>
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                                    <button
                                        onClick={() => handleSort('status')}
                                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                                    >
                                        Status
                                        {getSortIcon('status')}
                                    </button>
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                                    Location
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                                    <button
                                        onClick={() => handleSort('lastUpdated')}
                                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                                    >
                                        Last Updated
                                        {getSortIcon('lastUpdated')}
                                    </button>
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredJobs.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <p className="text-sm font-medium text-gray-600">
                                                No applications found
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {searchQuery || statusFilter !== 'All'
                                                    ? 'Try adjusting your filters'
                                                    : 'Get started by adding your first application'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredJobs.map((job) => (
                                    <tr
                                        key={job._id}
                                        className="hover:bg-gray-50 transition-colors border-b border-gray-200 last:border-0"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                checked={selectedJobs.has(job._id)}
                                                onChange={() => toggleJobSelection(job._id)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-4 h-4 border-2 border-gray-300 rounded focus:ring-2 focus:ring-black"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-bold text-black">{job.companyName}</div>
                                            {job.email && (
                                                <div className="text-xs text-gray-500 mt-1">{job.email}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-black">
                                                {job.jobTitle || '—'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="relative">
                                                <button
                                                    onClick={() => setStatusMenuOpen(statusMenuOpen === job._id ? null : job._id)}
                                                    className="flex items-center gap-1"
                                                >
                                                    <span className={getStatusBadge(job.status)}>
                                                        {job.status}
                                                    </span>
                                                    <ChevronDown className="h-4 w-4 text-gray-400" />
                                                </button>
                                                {statusMenuOpen === job._id && (
                                                    <div className="absolute z-10 mt-1 bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] min-w-[150px]">
                                                        {STATUS_OPTIONS.filter(s => s !== job.status).map((status) => (
                                                            <button
                                                                key={status}
                                                                onClick={() => handleStatusUpdate(job._id, status)}
                                                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg transition-colors"
                                                            >
                                                                {status}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-600">
                                                {job.location || '—'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-600">
                                                {new Date(job.lastUpdated).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                })}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1">
                                                {new Date(job.lastUpdated).toLocaleTimeString('en-US', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setSelectedJobId(job._id)}
                                                className="h-8 w-8 text-gray-600 hover:text-black hover:bg-gray-100"
                                            >
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        </>
    );
}
