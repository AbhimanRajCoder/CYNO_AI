import React from 'react';
import {
    Download,
    Trash2,
    RefreshCw,
    ChevronLeft,
    MoreVertical,
    FileEdit
} from 'lucide-react';
import { StatusBadge } from './StateComponents';

interface CaseHeaderProps {
    patientName: string;
    patientId: string;
    status: string;
    lastUpdated: string;
    onDownload: () => void;
    onDelete: () => void;
    onRefresh: () => void;
    isProcessing?: boolean;
}

export const CaseHeader = ({
    patientName,
    patientId,
    status,
    lastUpdated,
    onDownload,
    onDelete,
    onRefresh,
    isProcessing
}: CaseHeaderProps) => {
    return (
        <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        {patientName}
                        <StatusBadge status={status} />
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                        <span>ID: <span className="font-mono text-slate-700">{patientId}</span></span>
                        <span>•</span>
                        <span>Updated: {new Date(lastUpdated).toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={onRefresh}
                    disabled={isProcessing}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Refresh Data"
                >
                    <RefreshCw className={`w-5 h-5 ${isProcessing ? 'animate-spin' : ''}`} />
                </button>

                <div className="h-6 w-px bg-slate-200 mx-1"></div>

                <button
                    onClick={onDownload}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
                >
                    <Download className="w-4 h-4" />
                    Export Report
                </button>

                <button
                    onClick={onDelete}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-100 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                    Delete
                </button>
            </div>
        </div>
    );
};
