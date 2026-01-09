import React from 'react';

interface TimelineItemProps {
    dotColor: string;
    title: string;
    time: string;
    content?: string;
    highlight?: boolean;
    isScheduled?: boolean;
}

export function TimelineItem({
    dotColor,
    title,
    time,
    content,
    highlight = false,
    isScheduled = false
}: TimelineItemProps) {
    return (
        <div className={`flex gap-4 relative ${isScheduled ? 'opacity-50' : ''}`}>
            <div className={`w-4 h-4 rounded-full ${dotColor} border-2 border-white shadow-sm z-10 shrink-0`}></div>
            <div className={`p-3 rounded-lg w-full ${highlight
                    ? 'bg-sky-50 border border-sky-100'
                    : 'bg-slate-50'
                }`}>
                <div className="flex justify-between text-xs mb-1">
                    <span className={`font-semibold ${highlight ? 'text-sky-800' : 'text-slate-700'}`}>
                        {title}
                    </span>
                    <span className={highlight ? 'text-sky-600' : 'text-slate-400'}>
                        {time}
                    </span>
                </div>
                {content ? (
                    <p className={`text-[10px] leading-relaxed ${highlight ? 'text-sky-700' : 'text-slate-600'}`}>
                        {content}
                    </p>
                ) : (
                    <div className="h-2 bg-slate-200 rounded w-3/4"></div>
                )}
            </div>
        </div>
    );
}

export default function TimelineCard() {
    return (
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 relative z-10 max-w-md mx-auto transform rotate-[-2deg] transition-transform hover:rotate-0 duration-500">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b border-slate-50 pb-4">
                <div>
                    <div className="text-xs text-slate-400 uppercase font-semibold tracking-wider">
                        Patient Timeline
                    </div>
                    <div className="font-bold text-slate-800">Sarah Jenkins (ID: #9201)</div>
                </div>
                <div className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded font-medium">
                    Active Care
                </div>
            </div>

            {/* Timeline Items */}
            <div className="space-y-4 relative">
                <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-slate-100"></div>

                <TimelineItem
                    dotColor="bg-sky-500"
                    title="Pathology Report"
                    time="2h ago"
                />

                <TimelineItem
                    dotColor="bg-teal-500"
                    title="AI Summary Generated"
                    time="Just now"
                    content="Biopsy confirms Stage II carcinoma. Genetic markers identified. Recommend discussion at Tuesday Tumor Board."
                    highlight
                />

                <TimelineItem
                    dotColor="bg-slate-300"
                    title="Oncology Consult"
                    time="Scheduled"
                    isScheduled
                />
            </div>
        </div>
    );
}
