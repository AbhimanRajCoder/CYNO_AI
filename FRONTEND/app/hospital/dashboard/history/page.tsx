'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/dashboard/DashboardLayout';
import { useAuth } from '@/app/components/auth/AuthProvider';
import {
    History,
    Upload,
    Brain,
    Users,
    ClipboardList,
    LogIn,
    Edit,
    Trash2,
    Filter,
    Calendar,
    Activity
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ActivityLog {
    id: string;
    hospitalId: string;
    action: string;
    entityType: string;
    entityId: string | null;
    description: string;
    metadata: string | null;
    performedBy: string | null;
    createdAt: string;
}

const actionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    upload: Upload,
    ai_analysis: Brain,
    ai_review: Brain,
    patient_add: Users,
    patient_update: Edit,
    patient_delete: Trash2,
    tumor_board_create: ClipboardList,
    tumor_board_update: ClipboardList,
    login: LogIn,
};

const actionColors: Record<string, string> = {
    upload: 'bg-sky-100 text-sky-600',
    ai_analysis: 'bg-purple-100 text-purple-600',
    ai_review: 'bg-purple-100 text-purple-600',
    patient_add: 'bg-teal-100 text-teal-600',
    patient_update: 'bg-amber-100 text-amber-600',
    patient_delete: 'bg-red-100 text-red-600',
    tumor_board_create: 'bg-orange-100 text-orange-600',
    tumor_board_update: 'bg-orange-100 text-orange-600',
    login: 'bg-slate-100 text-slate-600',
};

const entityTypes = ['patient', 'report', 'ai_report', 'tumor_board', 'hospital'];
const actionTypes = ['upload', 'ai_analysis', 'ai_review', 'patient_add', 'patient_update', 'patient_delete', 'tumor_board_create', 'tumor_board_update'];

function formatDateTime(dateString: string): { date: string; time: string } {
    const date = new Date(dateString);
    return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
}

function groupByDate(activities: ActivityLog[]): Record<string, ActivityLog[]> {
    const groups: Record<string, ActivityLog[]> = {};
    activities.forEach(activity => {
        const date = new Date(activity.createdAt).toLocaleDateString('en-US', {
            weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
        });
        if (!groups[date]) groups[date] = [];
        groups[date].push(activity);
    });
    return groups;
}

export default function HistoryPage() {
    const { hospital } = useAuth();
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [actionFilter, setActionFilter] = useState('');
    const [entityFilter, setEntityFilter] = useState('');

    const limit = 50;

    useEffect(() => {
        fetchActivities();
    }, [hospital?.id, page, actionFilter, entityFilter]);

    const fetchActivities = async () => {
        if (!hospital?.id) return;

        setLoading(true);
        try {
            let url = `${API_BASE}/api/activity?hospitalId=${hospital.id}&skip=${page * limit}&limit=${limit}`;
            if (actionFilter) url += `&action=${actionFilter}`;
            if (entityFilter) url += `&entityType=${entityFilter}`;

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setActivities(data.activities);
                setTotal(data.total);
            }
        } catch (err) {
            console.error('Error fetching activities:', err);
        } finally {
            setLoading(false);
        }
    };

    const groupedActivities = groupByDate(activities);
    const hasMore = (page + 1) * limit < total;

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <History className="w-7 h-7 text-sky-500" />
                    History & Audit Timeline
                </h1>
                <p className="text-slate-500 mt-1">Track all activities and maintain compliance records</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                    <div className="flex items-center gap-2 text-slate-600">
                        <Filter className="w-5 h-5" />
                        <span className="font-medium">Filters:</span>
                    </div>
                    <select
                        value={actionFilter}
                        onChange={(e) => { setActionFilter(e.target.value); setPage(0); }}
                        className="px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                    >
                        <option value="">All Actions</option>
                        {actionTypes.map(a => (
                            <option key={a} value={a}>{a.replace('_', ' ')}</option>
                        ))}
                    </select>
                    <select
                        value={entityFilter}
                        onChange={(e) => { setEntityFilter(e.target.value); setPage(0); }}
                        className="px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                    >
                        <option value="">All Entity Types</option>
                        {entityTypes.map(e => (
                            <option key={e} value={e}>{e.replace('_', ' ')}</option>
                        ))}
                    </select>
                    <div className="ml-auto text-sm text-slate-500">
                        {total} total activities
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : activities.length === 0 ? (
                    <div className="text-center py-16">
                        <Activity className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-700">No Activity Records</h3>
                        <p className="text-slate-500 mt-1">Activities will appear here as you use the platform</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {Object.entries(groupedActivities).map(([date, dateActivities]) => (
                            <div key={date}>
                                {/* Date Header */}
                                <div className="px-6 py-3 bg-slate-50 sticky top-0 z-10">
                                    <p className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        {date}
                                    </p>
                                </div>

                                {/* Activities for this date */}
                                <div className="divide-y divide-slate-50">
                                    {dateActivities.map((activity) => {
                                        const Icon = actionIcons[activity.action] || Activity;
                                        const colorClass = actionColors[activity.action] || 'bg-slate-100 text-slate-600';
                                        const { time } = formatDateTime(activity.createdAt);

                                        return (
                                            <div key={activity.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                                                <div className="flex items-start gap-4">
                                                    {/* Icon */}
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                                                        <Icon className="w-5 h-5" />
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-slate-800 font-medium">{activity.description}</p>
                                                        <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                                                            <span className="capitalize">{activity.action.replace('_', ' ')}</span>
                                                            <span>•</span>
                                                            <span className="capitalize">{activity.entityType.replace('_', ' ')}</span>
                                                            {activity.performedBy && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span>by {activity.performedBy}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Timestamp */}
                                                    <div className="text-sm text-slate-400 flex-shrink-0">
                                                        {time}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Load More */}
                {hasMore && !loading && (
                    <div className="p-4 border-t border-slate-200 text-center">
                        <button
                            onClick={() => setPage(page + 1)}
                            className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                        >
                            Load More
                        </button>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
