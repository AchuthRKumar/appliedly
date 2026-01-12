import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Edit2 } from 'lucide-react';
import api from '@/lib/api';

interface Job {
    _id: string;
    companyName: string;
    jobTitle: string;
    status: string;
    location?: string;
    email?: string;
    notes?: string;
    nextSteps?: string;
    dateApplied?: string;
    lastUpdated?: string;
}

interface JobDetailsProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    jobId: string | null;
    onUpdate?: () => void;
    onDelete?: () => void;
}

const STATUS_OPTIONS = ['Applied', 'Interviewing', 'Offer', 'Rejection'];

export function JobDetails({ open, onOpenChange, jobId, onUpdate, onDelete }: JobDetailsProps) {
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<Job>>({});
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (open && jobId) {
            fetchJob();
        } else {
            setJob(null);
            setEditing(false);
        }
    }, [open, jobId]);

    const fetchJob = async () => {
        if (!jobId) return;
        setFetching(true);
        try {
            const { data } = await api.get(`/jobs/${jobId}`);
            setJob(data);
            setFormData(data);
        } catch (error) {
            console.error('Error fetching job:', error);
        } finally {
            setFetching(false);
        }
    };

    const handleUpdate = async () => {
        if (!jobId) return;
        setLoading(true);
        try {
            const { data } = await api.put(`/jobs/${jobId}`, formData);
            setJob(data);
            setEditing(false);
            onUpdate?.();
        } catch (error) {
            console.error('Error updating job:', error);
            alert('Failed to update job. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!jobId || !confirm('Are you sure you want to delete this application?')) return;
        setDeleting(true);
        try {
            await api.delete(`/jobs/${jobId}`);
            onDelete?.();
            onOpenChange(false);
        } catch (error) {
            console.error('Error deleting job:', error);
            alert('Failed to delete job. Please try again.');
        } finally {
            setDeleting(false);
        }
    };

    if (fetching) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent>
                    <div className="flex items-center justify-center py-8">
                        <p className="text-gray-600">Loading...</p>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    if (!job) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-2xl">{job.companyName}</DialogTitle>
                            <DialogDescription className="mt-1">
                                {job.jobTitle || 'No job title specified'}
                            </DialogDescription>
                        </div>
                        {!editing && (
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setEditing(true)}
                                    className="h-8 w-8"
                                >
                                    <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </DialogHeader>

                {editing ? (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-companyName">Company Name *</Label>
                            <Input
                                id="edit-companyName"
                                value={formData.companyName || ''}
                                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                className="border-2 border-black"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-jobTitle">Job Title</Label>
                            <Input
                                id="edit-jobTitle"
                                value={formData.jobTitle || ''}
                                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                                className="border-2 border-black"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-status">Status</Label>
                            <select
                                id="edit-status"
                                value={formData.status || 'Applied'}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full h-9 px-3 border-2 border-black rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                            >
                                {STATUS_OPTIONS.map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-location">Location</Label>
                            <Input
                                id="edit-location"
                                value={formData.location || ''}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                className="border-2 border-black"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-email">Contact Email</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                value={formData.email || ''}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="border-2 border-black"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-notes">Notes</Label>
                            <textarea
                                id="edit-notes"
                                value={formData.notes || ''}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows={4}
                                className="w-full px-3 py-2 border-2 border-black rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 resize-none"
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setEditing(false);
                                    setFormData(job);
                                }}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUpdate}
                                disabled={loading || !formData.companyName}
                                className="bg-black text-white hover:bg-gray-900"
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-xs text-gray-500 uppercase tracking-wide">Status</Label>
                                <div className="mt-1">
                                    <span className="px-3 py-1 text-xs font-bold uppercase tracking-wide rounded bg-black text-white">
                                        {job.status}
                                    </span>
                                </div>
                            </div>
                            {job.location && (
                                <div>
                                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Location</Label>
                                    <p className="mt-1 text-sm font-medium text-black">{job.location}</p>
                                </div>
                            )}
                        </div>

                        {job.email && (
                            <div>
                                <Label className="text-xs text-gray-500 uppercase tracking-wide">Contact Email</Label>
                                <p className="mt-1 text-sm font-medium text-black">{job.email}</p>
                            </div>
                        )}

                        {job.dateApplied && (
                            <div>
                                <Label className="text-xs text-gray-500 uppercase tracking-wide">Date Applied</Label>
                                <p className="mt-1 text-sm font-medium text-black">
                                    {new Date(job.dateApplied).toLocaleDateString('en-US', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric',
                                    })}
                                </p>
                            </div>
                        )}

                        {job.lastUpdated && (
                            <div>
                                <Label className="text-xs text-gray-500 uppercase tracking-wide">Last Updated</Label>
                                <p className="mt-1 text-sm font-medium text-black">
                                    {new Date(job.lastUpdated).toLocaleDateString('en-US', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric',
                                    })}
                                </p>
                            </div>
                        )}

                        {job.notes && (
                            <div>
                                <Label className="text-xs text-gray-500 uppercase tracking-wide">Notes</Label>
                                <p className="mt-1 text-sm text-black whitespace-pre-wrap">{job.notes}</p>
                            </div>
                        )}

                        {job.nextSteps && (
                            <div>
                                <Label className="text-xs text-gray-500 uppercase tracking-wide">Next Steps</Label>
                                <p className="mt-1 text-sm text-black">{job.nextSteps}</p>
                            </div>
                        )}

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Close
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
