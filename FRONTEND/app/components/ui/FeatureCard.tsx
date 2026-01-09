import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
    icon: LucideIcon;
    title: string;
    description: string;
    iconColor?: string;
}

export default function FeatureCard({
    icon: Icon,
    title,
    description,
    iconColor = 'text-slate-500'
}: FeatureCardProps) {
    return (
        <div className="feature-card bg-slate-50 p-8 rounded-2xl border border-transparent animate-on-scroll">
            <div className={`w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center ${iconColor} mb-6`}>
                <Icon className="w-6 h-6" />
            </div>
            <h4 className="text-xl font-bold text-slate-900 mb-3">{title}</h4>
            <p className="text-slate-500 leading-relaxed text-sm">
                {description}
            </p>
        </div>
    );
}
