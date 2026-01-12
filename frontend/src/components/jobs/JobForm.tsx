import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';

interface Job {
    _id?: string;
    companyName: string;
    jobTitle: string;
    status: string;
    location?: string;
    email?: string;
    notes?: string;
}

interface JobFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    job?: Job | null;
    onSuccess?: () => void;
}

const STATUS_OPTIONS = ['Applied', 'Interviewing', 'Offer', 'Rejection'];

export function JobForm({ open, onOpenChange, job, onSuccess }: JobFormProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Job>({
        companyName: '',
        jobTitle: '',
        status: 'Applied',
        location: '',
        email: '',
        notes: '',
    });

    useEffect(() => {
        if (job) {
            setFormData({
                companyName: job.companyName || '',
                jobTitle: job.jobTitle || '',
                status: job.status || 'Applied',
                location: job.location || '',
                email: job.email || '',
                notes: job.notes || '',
            });
        } else {
            setFormData({
                companyName: '',
                jobTitle: '',
                status: 'Applied',
                location: '',
                email: '',
                notes: '',
            });
        }
    }, [job, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (job?._id) {
                // Update existing job
                await api.put(`/jobs/${job._id}`, formData);
            } else {
                // Create new job
                await api.post('/jobs', formData);
            }
            onSuccess?.();
            onOpenChange(false);
        } catch (error) {
            console.error('Error saving job:', error);
            alert('Failed to save job. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{job?._id ? 'Edit Application' : 'Add New Application'}</DialogTitle>
                    <DialogDescription>
                        {job?._id ? 'Update the application details below.' : 'Enter the details for your new job application.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="companyName">Company Name *</Label>
                        <Input
                            id="companyName"
                            value={formData.companyName}
                            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                            placeholder="e.g., Google"
                            required
                            className="border-2 border-black"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="jobTitle">Job Title</Label>
                        <Input
                            id="jobTitle"
                            value={formData.jobTitle}
                            onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                            placeholder="e.g., Software Engineer"
                            className="border-2 border-black"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <select
                            id="status"
                            value={formData.status}
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
                        <Label htmlFor="location">Location</Label>
                        <Input
                            id="location"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            placeholder="e.g., San Francisco, CA"
                            className="border-2 border-black"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Contact Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="recruiter@company.com"
                            className="border-2 border-black"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Additional notes about this application..."
                            rows={4}
                            className="w-full px-3 py-2 border-2 border-black rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 resize-none"
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || !formData.companyName}
                            className="bg-black text-white hover:bg-gray-900"
                        >
                            {loading ? 'Saving...' : job?._id ? 'Update' : 'Create'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
