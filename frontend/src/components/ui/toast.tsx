import { useEffect, useState } from 'react';
import { X, CheckCircle2, Info, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Toast {
    id: string;
    title: string;
    description?: string;
    type?: 'success' | 'info' | 'error';
    duration?: number;
}

interface ToastProps {
    toast: Toast;
    onClose: (id: string) => void;
}

function ToastComponent({ toast, onClose }: ToastProps) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => onClose(toast.id), 300);
        }, toast.duration || 5000);

        return () => clearTimeout(timer);
    }, [toast.id, toast.duration, onClose]);

    const icons = {
        success: CheckCircle2,
        info: Info,
        error: AlertCircle,
    };

    const styles = {
        success: 'bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
        info: 'bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
        error: 'bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
    };

    const Icon = icons[toast.type || 'info'];

    return (
        <div
            className={cn(
                'min-w-[300px] max-w-md p-4 rounded-lg transition-all duration-300',
                isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full',
                styles[toast.type || 'info']
            )}
        >
            <div className="flex items-start gap-3">
                <Icon className={cn(
                    'h-5 w-5 flex-shrink-0 mt-0.5',
                    toast.type === 'success' ? 'text-black' : 'text-black'
                )} />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-black">{toast.title}</p>
                    {toast.description && (
                        <p className="text-xs text-gray-600 mt-1">{toast.description}</p>
                    )}
                </div>
                <button
                    onClick={() => {
                        setIsVisible(false);
                        setTimeout(() => onClose(toast.id), 300);
                    }}
                    className="flex-shrink-0 text-gray-400 hover:text-black transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

export function ToastContainer({ toasts, onClose }: { toasts: Toast[]; onClose: (id: string) => void }) {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
            {toasts.map((toast) => (
                <ToastComponent key={toast.id} toast={toast} onClose={onClose} />
            ))}
        </div>
    );
}

// Hook for managing toasts
export function useToast() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = (toast: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substring(7);
        setToasts((prev) => [...prev, { ...toast, id }]);
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return {
        toasts,
        addToast,
        removeToast,
        ToastContainer: () => <ToastContainer toasts={toasts} onClose={removeToast} />,
    };
}
