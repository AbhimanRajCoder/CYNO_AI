import React from 'react';
import { Step } from '@/app/lib/constants';

interface StepCardProps extends Step { }

export default function StepCard({ icon: Icon, title, desc }: StepCardProps) {
    return (
        <div className="relative z-10 group animate-on-scroll">
            <div className="w-24 h-24 bg-white border border-slate-200 rounded-full flex items-center justify-center mb-6 shadow-sm group-hover:border-sky-500 group-hover:text-sky-600 transition-colors mx-auto md:mx-0">
                <Icon className="w-8 h-8 text-slate-400 group-hover:text-sky-600" />
            </div>
            <h4 className="font-bold text-lg mb-2 text-center md:text-left">{title}</h4>
            <p className="text-sm text-slate-500 text-center md:text-left">{desc}</p>
        </div>
    );
}
