import React from 'react';
import { FileText, Image, Clock, User } from 'lucide-react';

interface RecentUploadCardProps {
    patientName: string;
    patientId: string;
    fileType: string;
    timestamp: string;
    status: 'pending' | 'ready';
}

export default function RecentUploadCard({
    patientName,
    patientId,
    fileType,
    timestamp,
    status,
}: RecentUploadCardProps) {
    const getTypeBadgeConfig = () => {
        switch (fileType) {
            case 'Imaging':
                return { icon: Image, class: 'bg-purple-100 text-purple-700' };
            case 'Pathology':
                return { icon: FileText, class: 'bg-rose-100 text-rose-700' };
            case 'Lab':
                return { icon: FileText, class: 'bg-amber-100 text-amber-700' };
            default:
                return { icon: FileText, class: 'bg-slate-100 text-slate-700' };
        }
    };

    const getStatusBadge = () => {
        if (status === 'pending') {
            return (
                <span className="px-2.5 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                    Pending Review
                </span>
            );
        }
        return (
            <span className="px-2.5 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
                Ready for Analysis
            </span>
        );
    };

    const typeConfig = getTypeBadgeConfig();
    const TypeIcon = typeConfig.icon;

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-800">{patientName}</p>
                        <p className="text-xs text-slate-500">ID: {patientId}</p>
                    </div>
                </div>
                {getStatusBadge()}
            </div>
            <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${typeConfig.class}`}>
                    <TypeIcon className="w-3 h-3" />
                    {fileType}
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    {timestamp}
                </span>
            </div>
        </div>
    );
}
