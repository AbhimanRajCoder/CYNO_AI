import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface SectionCardProps {
    title: string;
    icon: LucideIcon;
    color: 'blue' | 'purple' | 'emerald' | 'amber' | 'rose' | 'teal';
    children: ReactNode;
    isEmpty?: boolean;
    emptyMessage?: string;
    action?: ReactNode;
}

const colorMap = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-700', icon: 'text-blue-500' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-700', icon: 'text-purple-500' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700', icon: 'text-emerald-500' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700', icon: 'text-amber-500' },
    rose: { bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-700', icon: 'text-rose-500' },
    teal: { bg: 'bg-teal-50', border: 'border-teal-100', text: 'text-teal-700', icon: 'text-teal-500' },
};

export const SectionCard = ({
    title,
    icon: Icon,
    color,
    children,
    isEmpty,
    emptyMessage = 'No data available',
    action
}: SectionCardProps) => {
    const styles = colorMap[color];

    return (
        <div className={`rounded-xl border ${isEmpty ? 'border-dashed border-slate-200 bg-slate-50/50' : 'border-slate-200 bg-white shadow-sm'} overflow-hidden transition-all duration-300`}>
            {/* Header */}
            <div className={`px-5 py-4 border-b ${isEmpty ? 'border-dashed border-slate-200' : 'border-slate-100'} flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${styles.bg}`}>
                        <Icon className={`w-5 h-5 ${styles.icon}`} />
                    </div>
                    <h3 className={`font-semibold ${isEmpty ? 'text-slate-500' : 'text-slate-800'}`}>
                        {title}
                    </h3>
                </div>
                {action}
            </div>

            {/* Content */}
            <div className="p-5">
                {isEmpty ? (
                    <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                        <Icon className="w-8 h-8 opacity-20 mb-2" />
                        <p className="text-sm font-medium">{emptyMessage}</p>
                    </div>
                ) : (
                    children
                )}
            </div>
        </div>
    );
};
