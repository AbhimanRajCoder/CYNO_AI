'use client';

import React from 'react';
import {
    Clock,
    FileEdit,
    Loader2,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Play,
    Trash2
} from 'lucide-react';

// Status colors and configurations
const statusConfig: Record<string, {
    color: string;
    bgColor: string;
    borderColor: string;
    icon: React.ReactNode;
    label: string;
}> = {
    draft: {
        color: 'text-slate-600',
        bgColor: 'bg-slate-100',
        borderColor: 'border-slate-200',
        icon: <FileEdit className="w-4 h-4" />,
        label: 'Draft'
    },
    queued: {
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        borderColor: 'border-blue-200',
        icon: <Clock className="w-4 h-4" />,
        label: 'Queued'
    },
    processing: {
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        borderColor: 'border-purple-200',
        icon: <Loader2 className="w-4 h-4 animate-spin" />,
        label: 'Processing'
    },
    partial_ready: {
        color: 'text-amber-600',
        bgColor: 'bg-amber-100',
        borderColor: 'border-amber-200',
        icon: <AlertTriangle className="w-4 h-4" />,
        label: 'Partial'
    },
    completed: {
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-100',
        borderColor: 'border-emerald-200',
        icon: <CheckCircle className="w-4 h-4" />,
        label: 'Completed'
    },
    failed: {
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        borderColor: 'border-red-200',
        icon: <XCircle className="w-4 h-4" />,
        label: 'Failed'
    },
    deleted: {
        color: 'text-slate-400',
        bgColor: 'bg-slate-50',
        borderColor: 'border-slate-200',
        icon: <Trash2 className="w-4 h-4" />,
        label: 'Deleted'
    }
};

// Status Badge Component
export const StatusBadge = ({ status }: { status: string }) => {
    const config = statusConfig[status] || statusConfig.draft;

    return (
        <span className={`
            inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full
            ${config.bgColor} ${config.color} border ${config.borderColor}
        `}>
            {config.icon}
            {config.label}
        </span>
    );
};

// Progress Bar Component
export const ProgressBar = ({
    percent,
    message,
    showPercent = true
}: {
    percent: number;
    message?: string | null;
    showPercent?: boolean;
}) => {
    const safePercent = Math.min(100, Math.max(0, percent));

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500">
                    {message || 'Processing...'}
                </span>
                {showPercent && (
                    <span className="text-xs font-medium text-purple-600">
                        {safePercent}%
                    </span>
                )}
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${safePercent}%` }}
                />
            </div>
        </div>
    );
};

// Delete Confirm Modal
export const DeleteConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    patientName,
    status,
    isDeleting
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    patientName: string;
    status: string;
    isDeleting: boolean;
}) => {
    if (!isOpen) return null;

    const isProcessing = status === 'processing';

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                            <Trash2 className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-slate-800">Delete Case?</h2>
                            <p className="text-sm text-slate-500">This action cannot be undone</p>
                        </div>
                    </div>

                    <p className="text-slate-600 mb-4">
                        Are you sure you want to delete the tumor board case for <strong>{patientName}</strong>?
                    </p>

                    {isProcessing && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                            <p className="text-sm text-amber-700 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                This case is currently being processed. Deleting may leave orphaned data.
                            </p>
                        </div>
                    )}

                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={onClose}
                            disabled={isDeleting}
                            className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 disabled:opacity-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isDeleting}
                            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Error Display with Retry
export const ErrorDisplay = ({
    message,
    onRetry,
    isRetrying
}: {
    message: string;
    onRetry: () => void;
    isRetrying: boolean;
}) => (
    <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
        <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Processing Failed</p>
                <p className="text-sm text-red-600 mt-1">{message}</p>
            </div>
            <button
                onClick={onRetry}
                disabled={isRetrying}
                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
            >
                {isRetrying ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                    <Play className="w-3 h-3" />
                )}
                Retry
            </button>
        </div>
    </div>
);

// Save Confirmation Toast
export const SaveToast = ({
    show,
    message = 'Changes saved successfully'
}: {
    show: boolean;
    message?: string;
}) => {
    if (!show) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
            <div className="flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-lg">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">{message}</span>
            </div>
        </div>
    );
};

// Processing View Component - Full view for when AI is generating
export const ProcessingView = ({
    patientName,
    percent,
    message,
    startedAt,
    onCancel
}: {
    patientName: string;
    percent: number;
    message?: string | null;
    startedAt?: string | null;
    onCancel?: () => void;
}) => {
    const [elapsedSeconds, setElapsedSeconds] = React.useState(0);

    React.useEffect(() => {
        const interval = setInterval(() => {
            if (startedAt) {
                const started = new Date(startedAt).getTime();
                const now = Date.now();
                setElapsedSeconds(Math.floor((now - started) / 1000));
            } else {
                setElapsedSeconds(prev => prev + 1);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [startedAt]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="bg-gradient-to-br from-slate-50 to-purple-50 rounded-2xl border border-purple-100 p-8">
            <div className="max-w-md mx-auto text-center">
                {/* Animated Icon */}
                <div className="relative w-24 h-24 mx-auto mb-6">
                    <div className="absolute inset-0 bg-purple-200 rounded-full animate-ping opacity-25"></div>
                    <div className="relative w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <Loader2 className="w-12 h-12 text-white animate-spin" />
                    </div>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                    Generating AI Analysis
                </h3>
                <p className="text-slate-600 mb-6">
                    Processing tumor board data for <strong>{patientName}</strong>
                </p>

                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-500">{message || 'Processing...'}</span>
                        <span className="text-sm font-bold text-purple-600">{percent}%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${percent}%` }}
                        />
                    </div>
                </div>

                {/* Timer and Estimate */}
                <div className="flex items-center justify-center gap-6 mb-6">
                    <div className="text-center">
                        <p className="text-2xl font-mono font-bold text-slate-800">{formatTime(elapsedSeconds)}</p>
                        <p className="text-xs text-slate-500">Elapsed Time</p>
                    </div>
                    <div className="w-px h-10 bg-slate-200"></div>
                    <div className="text-center">
                        <p className="text-2xl font-mono font-bold text-purple-600">10-15</p>
                        <p className="text-xs text-slate-500">Est. Minutes</p>
                    </div>
                </div>

                {/* Info Message */}
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4">
                    <p className="text-sm text-amber-700">
                        <Clock className="w-4 h-4 inline mr-1" />
                        <strong>Please wait.</strong> AI analysis typically takes 10-15 minutes depending on the complexity of the case.
                    </p>
                </div>

                {onCancel && (
                    <button
                        onClick={onCancel}
                        className="mb-6 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 hover:border-red-300 transition-colors shadow-sm flex items-center justify-center gap-2 mx-auto"
                    >
                        <XCircle className="w-4 h-4" />
                        Stop / Cancel Analysis
                    </button>
                )}

                {/* What's happening */}
                <div className="text-left p-4 bg-white/50 rounded-xl border border-slate-200">
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-2">What's happening:</p>
                    <ul className="text-sm text-slate-600 space-y-1">
                        <li className={percent >= 10 ? 'text-purple-600' : ''}>
                            {percent >= 25 ? '✓' : '○'} Fetching patient data
                        </li>
                        <li className={percent >= 35 ? 'text-purple-600' : ''}>
                            {percent >= 50 ? '✓' : '○'} Running clinical AI analysis
                        </li>
                        <li className={percent >= 60 ? 'text-purple-600' : ''}>
                            {percent >= 75 ? '✓' : '○'} Formatting tumor board report
                        </li>
                        <li className={percent >= 75 ? 'text-purple-600' : ''}>
                            {percent >= 100 ? '✓' : '○'} Saving results
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
