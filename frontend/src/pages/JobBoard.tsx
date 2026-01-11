import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { KanbanBoard } from '@/components/jobs/KanbanBoard';

export default function JobBoard() {
    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Job Application Board</h1>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Job
                </Button>
            </div>

            <div className="flex-1 overflow-hidden">
                <KanbanBoard />
            </div>
        </div>
    );
}
