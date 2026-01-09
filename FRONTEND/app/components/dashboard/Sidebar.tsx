'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    Upload,
    Brain,
    ClipboardList,
    History,
    ClipboardMinus,
    Settings,
    HeartPulse
} from 'lucide-react';

interface NavItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
    { name: 'Dashboard Overview', href: '/hospital/dashboard', icon: LayoutDashboard },
    { name: 'Patients', href: '/hospital/dashboard/patients', icon: Users },
    { name: 'Upload Reports', href: '/hospital/dashboard/upload', icon: Upload },
    { name: 'See Reports', href: '/hospital/dashboard/ai-report', icon: ClipboardMinus },
    { name: 'Report Generation (AI)', href: '/hospital/dashboard/ai-analysis', icon: Brain },
    { name: 'Tumor Board', href: '/hospital/dashboard/tumor-board', icon: ClipboardList },
    { name: 'History & Timeline', href: '/hospital/dashboard/history', icon: History },
    { name: 'Settings', href: '/hospital/dashboard/settings', icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === '/hospital/dashboard') {
            return pathname === href;
        }
        return pathname.startsWith(href);
    };

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white shadow-2xl z-40 flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-slate-700/50">
                <Link href="/hospital/dashboard" className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-teal-400 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/25">
                        <HeartPulse className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <span className="text-xl font-bold bg-gradient-to-r from-sky-400 to-teal-400 text-transparent bg-clip-text">
                            CYNO
                        </span>
                        <p className="text-xs text-slate-400">Healthcare Platform</p>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${active
                                ? 'bg-gradient-to-r from-sky-500/20 to-teal-500/20 text-white border border-sky-500/30'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                }`}
                        >
                            <Icon className={`w-5 h-5 transition-colors ${active ? 'text-sky-400' : 'text-slate-500 group-hover:text-sky-400'
                                }`} />
                            <span className="font-medium text-sm">{item.name}</span>
                            {active && (
                                <div className="ml-auto w-1.5 h-1.5 bg-sky-400 rounded-full shadow-lg shadow-sky-400/50"></div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-700/50">
                <div className="px-4 py-3 bg-slate-800/50 rounded-xl">
                    <p className="text-xs text-slate-500">CYNO Healthcare</p>
                    <p className="text-xs text-slate-400">v1.0.0</p>
                </div>
            </div>
        </aside>
    );
}
