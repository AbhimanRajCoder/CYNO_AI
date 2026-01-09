import React from 'react';
import { BlogPost } from '@/app/lib/constants';

interface BlogCardProps extends BlogPost { }

export default function BlogCard({ category, color, title, desc }: BlogCardProps) {
    const colorClasses: Record<string, { category: string; overlay: string }> = {
        sky: {
            category: 'text-sky-600',
            overlay: 'bg-sky-900/10'
        },
        teal: {
            category: 'text-teal-600',
            overlay: 'bg-teal-900/10'
        },
        slate: {
            category: 'text-slate-600',
            overlay: 'bg-slate-900/10'
        }
    };

    const classes = colorClasses[color] || colorClasses.slate;

    return (
        <div className="group cursor-pointer animate-on-scroll">
            <div className="h-48 bg-slate-100 rounded-xl mb-4 overflow-hidden relative">
                <div className={`absolute inset-0 ${classes.overlay} group-hover:bg-transparent transition-colors`}></div>
            </div>
            <div className={`text-xs font-bold ${classes.category} mb-2`}>
                {category}
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2 group-hover:text-sky-600 transition-colors">
                {title}
            </h3>
            <p className="text-sm text-slate-500">{desc}</p>
        </div>
    );
}
