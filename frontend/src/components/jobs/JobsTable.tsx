import { useEffect, useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

type SortField = 'companyName' | 'jobTitle' | 'status' | 'lastUpdated';
type SortDirection = 'asc' | 'desc' | null;

const STATUS_OPTIONS = ['All', 'Applied', 'Interviewing', 'Offer', 'Rejection'];

export function JobsTable() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortField, setSortField] = useState<SortField>('lastUpdated');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const { data } = await api.get('/jobs');
                setJobs(data);
                setFilteredJobs(data);
            } catch (error) {
                console.error('Failed to fetch jobs', error);
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, []);

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
        <div className="space-y-4">
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

                {/* Results count */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                        Showing <span className="font-bold text-black">{filteredJobs.length}</span> of{' '}
                        <span className="font-bold text-black">{jobs.length}</span> applications
                    </p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-black text-white">
                            <tr>
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
                                    <td colSpan={6} className="px-6 py-12 text-center">
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
                                            <span className={getStatusBadge(job.status)}>
                                                {job.status}
                                            </span>
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
    );
}
