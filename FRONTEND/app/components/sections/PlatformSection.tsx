import React from 'react';
import { Layout, Search } from 'lucide-react';

function DashboardMockup() {
    return (
        <div className="bg-slate-50 rounded-2xl p-2 border border-slate-200 shadow-2xl">
            <div className="bg-white rounded-xl overflow-hidden border border-slate-100">
                {/* Window Controls */}
                <div className="h-10 border-b border-slate-100 flex items-center px-4 gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400 opacity-50"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400 opacity-50"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400 opacity-50"></div>
                </div>

                {/* Mockup Content */}
                <div className="p-6">
                    <div className="flex gap-6">
                        {/* Sidebar Preview */}
                        <div className="w-1/3 space-y-3">
                            <div className="h-4 bg-slate-100 rounded w-full"></div>
                            <div className="h-32 bg-slate-50 rounded w-full border border-dashed border-slate-200 flex items-center justify-center text-xs text-slate-400">
                                Scan Preview
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="w-2/3 space-y-4">
                            <div className="flex justify-between items-center">
                                <div className="h-6 bg-slate-100 rounded w-1/3"></div>
                                <div className="px-2 py-1 bg-teal-50 text-teal-600 text-[10px] rounded font-bold uppercase">
                                    Ready for Review
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-3 bg-slate-100 rounded w-full"></div>
                                <div className="h-3 bg-slate-100 rounded w-5/6"></div>
                                <div className="h-3 bg-slate-100 rounded w-4/6"></div>
                            </div>
                            <div className="pt-4 border-t border-slate-50">
                                <div className="h-8 bg-sky-500 rounded w-32 opacity-20"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface FeatureItemProps {
    icon: React.ElementType;
    title: string;
    description: string;
}

function FeatureItem({ icon: Icon, title, description }: FeatureItemProps) {
    return (
        <div className="flex gap-4">
            <div className="mt-1">
                <Icon className="text-sky-600 w-6 h-6" />
            </div>
            <div>
                <h4 className="font-bold text-slate-900">{title}</h4>
                <p className="text-sm text-slate-500 mt-1">{description}</p>
            </div>
        </div>
    );
}

export default function PlatformSection() {
    return (
        <section id="platform" className="py-24 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Dashboard Mockup */}
                    <div className="order-2 lg:order-1 animate-on-scroll">
                        <DashboardMockup />
                    </div>

                    {/* Feature Description */}
                    <div className="order-1 lg:order-2 animate-on-scroll">
                        <h2 className="text-3xl font-bold text-slate-900 mb-6">
                            Designed for clarity.
                        </h2>
                        <div className="space-y-6">
                            <FeatureItem
                                icon={Layout}
                                title="Unified Dashboard"
                                description="No more tab switching. See Labs, Radio, and Path in one pane."
                            />
                            <FeatureItem
                                icon={Search}
                                title="Semantic Search"
                                description='Ask "Show me all interactions with immunotherapy" and get instant citations.'
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
