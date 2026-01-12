import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { JobsTable } from '@/components/jobs/JobsTable';

export default function JobBoard() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-black mb-2">Applications</h1>
                    <p className="text-gray-600">Manage and track your job applications</p>
                </div>
                <Button className="bg-black text-white hover:bg-gray-900 border-2 border-black rounded-lg px-6 py-2.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Application
                </Button>
            </div>

            {/* Table */}
            <JobsTable />
        </div>
    );
}
