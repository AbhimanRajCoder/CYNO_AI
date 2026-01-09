'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/dashboard/DashboardLayout';
import { useAuth } from '@/app/components/auth/AuthProvider';
import {
    Users,
    FileText,
    Brain,
    AlertCircle,
    TrendingUp,
    Upload,
    ClipboardList,
    ArrowRight,
    Activity
} from 'lucide-react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface DashboardStats {
    totalPatients: number;
    totalReports: number;
    totalAIReports: number;
    pendingReviews: number;
    recentActivity: Array<{
        id: string;
        action: string;
        entityType: string;
        description: string;
        performedBy: string | null;
        createdAt: string;
    }>;
}

interface StatCardProps {
    title: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    color: 'sky' | 'teal' | 'purple' | 'amber';
    href: string;
}

function StatCard({ title, value, icon: Icon, color, href }: StatCardProps) {
    const colorClasses = {
        sky: 'from-sky-500 to-sky-600 shadow-sky-500/25',
        teal: 'from-teal-500 to-teal-600 shadow-teal-500/25',
        purple: 'from-purple-500 to-purple-600 shadow-purple-500/25',
        amber: 'from-amber-500 to-amber-600 shadow-amber-500/25',
    };

    return (
        <Link href={href} className="block">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-slate-300 group">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">{title}</p>
                        <p className="text-3xl font-bold text-slate-800 mt-2">{value}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} shadow-lg flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-slate-500 group-hover:text-sky-600 transition-colors">
                    <span>View details</span>
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
        </Link>
    );
}

interface QuickActionProps {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    href: string;
    color: string;
}

function QuickAction({ title, description, icon: Icon, href, color }: QuickActionProps) {
    return (
        <Link href={href} className="block">
            <div className="bg-white rounded-xl p-4 border border-slate-200 hover:border-sky-300 hover:shadow-md transition-all group">
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold text-slate-800 group-hover:text-sky-600 transition-colors">{title}</p>
                        <p className="text-sm text-slate-500">{description}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-sky-500 group-hover:translate-x-1 transition-all" />
                </div>
            </div>
        </Link>
    );
}

function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
}

function getActionIcon(action: string) {
    switch (action) {
        case 'upload':
        case 'patient_add':
            return <Upload className="w-4 h-4" />;
        case 'ai_analysis':
        case 'ai_review':
            return <Brain className="w-4 h-4" />;
        case 'tumor_board_create':
        case 'tumor_board_update':
            return <ClipboardList className="w-4 h-4" />;
        default:
            return <Activity className="w-4 h-4" />;
    }
}

function getActionColor(action: string) {
    switch (action) {
        case 'upload':
            return 'bg-sky-100 text-sky-600';
        case 'ai_analysis':
        case 'ai_review':
            return 'bg-purple-100 text-purple-600';
        case 'patient_add':
        case 'patient_update':
            return 'bg-teal-100 text-teal-600';
        case 'tumor_board_create':
        case 'tumor_board_update':
            return 'bg-amber-100 text-amber-600';
        default:
            return 'bg-slate-100 text-slate-600';
    }
}

export default function DashboardPage() {
    const { hospital } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchStats() {
            if (!hospital?.id) return;

            try {
                const res = await fetch(`${API_BASE}/api/activity/stats?hospitalId=${hospital.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                } else {
                    setError('Failed to load dashboard stats');
                }
            } catch (err) {
                console.error('Error fetching stats:', err);
                setError('Failed to connect to server');
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, [hospital?.id]);

    return (
        <DashboardLayout>
            {/* Welcome Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800">
                    Welcome back, {hospital?.name || 'Doctor'}
                </h1>
                <p className="text-slate-500 mt-1">
                    Here&apos;s an overview of your healthcare dashboard
                </p>
            </div>

            {/* Error State */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total Patients"
                    value={loading ? 0 : (stats?.totalPatients || 0)}
                    icon={Users}
                    color="sky"
                    href="/hospital/dashboard/patients"
                />
                <StatCard
                    title="Total Reports"
                    value={loading ? 0 : (stats?.totalReports || 0)}
                    icon={FileText}
                    color="teal"
                    href="/hospital/dashboard/upload"
                />
                <StatCard
                    title="AI Analyses"
                    value={loading ? 0 : (stats?.totalAIReports || 0)}
                    icon={Brain}
                    color="purple"
                    href="/hospital/dashboard/ai-analysis"
                />
                <StatCard
                    title="Pending Reviews"
                    value={loading ? 0 : (stats?.pendingReviews || 0)}
                    icon={AlertCircle}
                    color="amber"
                    href="/hospital/dashboard/ai-analysis"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-sky-500" />
                            Quick Actions
                        </h2>
                        <div className="space-y-3">
                            <QuickAction
                                title="Add Patient"
                                description="Register new patient"
                                icon={Users}
                                href="/hospital/dashboard/patients"
                                color="bg-sky-500"
                            />
                            <QuickAction
                                title="Upload Report"
                                description="Upload medical files"
                                icon={Upload}
                                href="/hospital/dashboard/upload"
                                color="bg-teal-500"
                            />
                            <QuickAction
                                title="Generate AI Report"
                                description="Run AI analysis"
                                icon={Brain}
                                href="/hospital/dashboard/ai-analysis"
                                color="bg-purple-500"
                            />
                            <QuickAction
                                title="Tumor Board"
                                description="Care coordination"
                                icon={ClipboardList}
                                href="/hospital/dashboard/tumor-board"
                                color="bg-amber-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-sky-500" />
                                Recent Activity
                            </h2>
                            <Link
                                href="/hospital/dashboard/history"
                                className="text-sm text-sky-600 hover:text-sky-700 font-medium"
                            >
                                View all
                            </Link>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : stats?.recentActivity && stats.recentActivity.length > 0 ? (
                            <div className="space-y-3">
                                {stats.recentActivity.map((activity) => (
                                    <div
                                        key={activity.id}
                                        className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getActionColor(activity.action)}`}>
                                            {getActionIcon(activity.action)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-slate-700 truncate">
                                                {activity.description}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                {activity.performedBy || 'System'} • {formatTimeAgo(activity.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500">No recent activity</p>
                                <p className="text-sm text-slate-400 mt-1">
                                    Start by adding patients or uploading reports
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
