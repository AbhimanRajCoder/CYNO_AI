import React from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface UploadProgressProps {
    fileName: string;
    progress: number;
    status: 'uploading' | 'uploaded' | 'failed';
}

export default function UploadProgress({ fileName, progress, status }: UploadProgressProps) {
    const getStatusConfig = () => {
        switch (status) {
            case 'uploading':
                return {
                    icon: Loader2,
                    iconClass: 'text-sky-500 animate-spin',
                    barClass: 'bg-sky-500',
                    text: `${progress}%`,
                    textClass: 'text-sky-600',
                };
            case 'uploaded':
                return {
                    icon: CheckCircle,
                    iconClass: 'text-emerald-500',
                    barClass: 'bg-emerald-500',
                    text: 'Uploaded',
                    textClass: 'text-emerald-600',
                };
            case 'failed':
                return {
                    icon: XCircle,
                    iconClass: 'text-red-500',
                    barClass: 'bg-red-500',
                    text: 'Failed',
                    textClass: 'text-red-600',
                };
        }
    };

    const config = getStatusConfig();
    const StatusIcon = config.icon;

    return (
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <StatusIcon className={`w-5 h-5 ${config.iconClass}`} />
                    <span className="text-sm font-medium text-slate-700 truncate max-w-[200px]">
                        {fileName}
                    </span>
                </div>
                <span className={`text-sm font-semibold ${config.textClass}`}>
                    {config.text}
                </span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-300 ease-out ${config.barClass}`}
                    style={{ width: `${status === 'uploaded' ? 100 : progress}%` }}
                />
            </div>
        </div>
    );
}
