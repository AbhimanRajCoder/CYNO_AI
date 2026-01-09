'use client';

import React from 'react';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import { AuthGuard } from '@/app/components/auth/AuthProvider';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <AuthGuard>
            <div className="min-h-screen bg-slate-50">
                {/* Fixed Sidebar */}
                <Sidebar />

                {/* Fixed Top Header */}
                <TopHeader />

                {/* Main Content - offset by sidebar and header */}
                <main className="ml-64 pt-16">
                    <div className="p-6">
                        {children}
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
