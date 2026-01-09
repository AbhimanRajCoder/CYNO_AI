'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/app/components/dashboard/DashboardLayout';
import { useAuth } from '@/app/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import {
    Settings,
    Building2,
    Mail,
    Phone,
    MapPin,
    FileText,
    Shield,
    Bell,
    Palette,
    LogOut,
    Save,
    CheckCircle
} from 'lucide-react';

export default function SettingsPage() {
    const { hospital, logout } = useAuth();
    const router = useRouter();
    const [saved, setSaved] = useState(false);

    // Settings state
    const [notifications, setNotifications] = useState({
        emailAlerts: true,
        reportReady: true,
        tumorBoardUpdates: true,
        weeklyDigest: false
    });

    const handleLogout = () => {
        logout();
        router.push('/hospital/signin');
    };

    const handleSaveNotifications = () => {
        // In a real app, save to backend
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Settings className="w-7 h-7 text-slate-500" />
                    Settings
                </h1>
                <p className="text-slate-500 mt-1">Manage your hospital account and preferences</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Hospital Information */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-sky-500" />
                            Hospital Information
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-2">Hospital Name</label>
                                <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800">
                                    {hospital?.name || 'Not set'}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-slate-400" />
                                        Email
                                    </label>
                                    <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800">
                                        {hospital?.email || 'Not set'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-slate-400" />
                                        Phone
                                    </label>
                                    <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800">
                                        {hospital?.phone || 'Not set'}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-slate-400" />
                                    Registration Number
                                </label>
                                <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800">
                                    {hospital?.registrationNumber || 'Not set'}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-slate-400" />
                                    Address
                                </label>
                                <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800">
                                    {hospital?.address || 'Not set'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notification Settings */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <Bell className="w-5 h-5 text-amber-500" />
                                Notification Preferences
                            </h2>
                            {saved && (
                                <span className="flex items-center gap-1 text-sm text-emerald-600">
                                    <CheckCircle className="w-4 h-4" />
                                    Saved!
                                </span>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                                <div>
                                    <p className="font-medium text-slate-800">Email Alerts</p>
                                    <p className="text-sm text-slate-500">Receive email notifications for important events</p>
                                </div>
                                <button
                                    onClick={() => setNotifications({ ...notifications, emailAlerts: !notifications.emailAlerts })}
                                    className={`w-12 h-6 rounded-full transition-colors ${notifications.emailAlerts ? 'bg-sky-500' : 'bg-slate-300'
                                        }`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${notifications.emailAlerts ? 'translate-x-6' : 'translate-x-0.5'
                                        }`}></div>
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                                <div>
                                    <p className="font-medium text-slate-800">Report Ready Notifications</p>
                                    <p className="text-sm text-slate-500">Get notified when AI reports are ready</p>
                                </div>
                                <button
                                    onClick={() => setNotifications({ ...notifications, reportReady: !notifications.reportReady })}
                                    className={`w-12 h-6 rounded-full transition-colors ${notifications.reportReady ? 'bg-sky-500' : 'bg-slate-300'
                                        }`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${notifications.reportReady ? 'translate-x-6' : 'translate-x-0.5'
                                        }`}></div>
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                                <div>
                                    <p className="font-medium text-slate-800">Tumor Board Updates</p>
                                    <p className="text-sm text-slate-500">Notifications for tumor board case updates</p>
                                </div>
                                <button
                                    onClick={() => setNotifications({ ...notifications, tumorBoardUpdates: !notifications.tumorBoardUpdates })}
                                    className={`w-12 h-6 rounded-full transition-colors ${notifications.tumorBoardUpdates ? 'bg-sky-500' : 'bg-slate-300'
                                        }`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${notifications.tumorBoardUpdates ? 'translate-x-6' : 'translate-x-0.5'
                                        }`}></div>
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                                <div>
                                    <p className="font-medium text-slate-800">Weekly Digest</p>
                                    <p className="text-sm text-slate-500">Receive a weekly summary of activities</p>
                                </div>
                                <button
                                    onClick={() => setNotifications({ ...notifications, weeklyDigest: !notifications.weeklyDigest })}
                                    className={`w-12 h-6 rounded-full transition-colors ${notifications.weeklyDigest ? 'bg-sky-500' : 'bg-slate-300'
                                        }`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${notifications.weeklyDigest ? 'translate-x-6' : 'translate-x-0.5'
                                        }`}></div>
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={handleSaveNotifications}
                            className="mt-6 flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-sky-500 to-teal-500 text-white rounded-xl font-medium hover:from-sky-600 hover:to-teal-600 transition-all"
                        >
                            <Save className="w-4 h-4" />
                            Save Preferences
                        </button>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Security */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-emerald-500" />
                            Security
                        </h2>
                        <div className="space-y-3">
                            <button className="w-full text-left p-3 rounded-xl hover:bg-slate-50 transition-colors text-slate-700">
                                Change Password
                            </button>
                            <button className="w-full text-left p-3 rounded-xl hover:bg-slate-50 transition-colors text-slate-700">
                                Two-Factor Authentication
                            </button>
                            <button className="w-full text-left p-3 rounded-xl hover:bg-slate-50 transition-colors text-slate-700">
                                Active Sessions
                            </button>
                        </div>
                    </div>

                    {/* Appearance */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <Palette className="w-5 h-5 text-purple-500" />
                            Appearance
                        </h2>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                <span className="text-slate-700">Theme</span>
                                <select className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-sm">
                                    <option>Light</option>
                                    <option>Dark</option>
                                    <option>System</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Sign Out */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
