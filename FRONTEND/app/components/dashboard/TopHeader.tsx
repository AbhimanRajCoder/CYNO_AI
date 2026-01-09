'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Bell, ChevronDown, LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '@/app/components/auth/AuthProvider';

export default function TopHeader() {
    const { hospital, logout } = useAuth();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const notificationRef = useRef<HTMLDivElement>(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/hospital/dashboard/patients?search=${encodeURIComponent(searchQuery)}`);
        }
    };

    const handleLogout = () => {
        logout();
        router.push('/hospital/signin');
    };

    return (
        <header className="fixed top-0 left-64 right-0 h-16 bg-white border-b border-slate-200 z-30 flex items-center justify-between px-6 shadow-sm">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-xl">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search patient / report..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all placeholder:text-slate-400"
                    />
                </div>
            </form>

            {/* Right Section */}
            <div className="flex items-center gap-4">
                {/* Notifications */}
                <div className="relative" ref={notificationRef}>
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                        <Bell className="w-5 h-5 text-slate-600" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="px-4 py-2 border-b border-slate-100">
                                <h3 className="font-semibold text-slate-800">Notifications</h3>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                <div className="px-4 py-3 hover:bg-slate-50 cursor-pointer">
                                    <p className="text-sm text-slate-700">New AI report ready for review</p>
                                    <p className="text-xs text-slate-400 mt-1">2 minutes ago</p>
                                </div>
                                <div className="px-4 py-3 hover:bg-slate-50 cursor-pointer">
                                    <p className="text-sm text-slate-700">Patient report uploaded successfully</p>
                                    <p className="text-xs text-slate-400 mt-1">1 hour ago</p>
                                </div>
                            </div>
                            <div className="px-4 py-2 border-t border-slate-100">
                                <button className="text-sm text-sky-600 hover:text-sky-700 font-medium">
                                    View all notifications
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* User Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        <div className="w-9 h-9 bg-gradient-to-br from-sky-500 to-teal-500 rounded-xl flex items-center justify-center shadow-md">
                            <User className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left hidden md:block">
                            <p className="text-sm font-semibold text-slate-800">
                                {hospital?.name || 'Hospital'}
                            </p>
                            <p className="text-xs text-slate-500">Administrator</p>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showDropdown && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="px-4 py-2 border-b border-slate-100">
                                <p className="text-sm font-medium text-slate-800">{hospital?.name}</p>
                                <p className="text-xs text-slate-500">{hospital?.email}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowDropdown(false);
                                    router.push('/hospital/dashboard/settings');
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                            >
                                <Settings className="w-4 h-4" />
                                Settings
                            </button>
                            <hr className="my-1 border-slate-100" />
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                            >
                                <LogOut className="w-4 h-4" />
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
