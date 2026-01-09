"use client";

import React, { useState } from 'react';
import { Activity, Search, Bell, ChevronDown, User } from 'lucide-react';

export default function DashboardNavbar() {
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                {/* Logo & Title */}
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 bg-gradient-to-br from-sky-500 to-teal-500 rounded-xl flex items-center justify-center text-white shadow-md">
                            <Activity className="w-5 h-5" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-slate-900">CYNO</span>
                    </div>
                    <div className="h-6 w-px bg-slate-200" />
                    <h1 className="text-lg font-semibold text-slate-700">Dashboard</h1>
                </div>

                {/* Right Side: Search, Notifications, Profile */}
                <div className="flex items-center gap-4">
                    {/* Search Input */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search patient..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-64 pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all placeholder:text-slate-400"
                        />
                    </div>

                    {/* Notification Bell */}
                    <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                    </button>

                    {/* Profile Dropdown */}
                    <button className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                        <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-teal-400 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            <User className="w-4 h-4" />
                        </div>
                        <div className="text-left hidden sm:block">
                            <p className="text-sm font-medium text-slate-700">Dr. Smith</p>
                            <p className="text-xs text-slate-500">Oncologist</p>
                        </div>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                    </button>
                </div>
            </div>
        </nav>
    );
}
