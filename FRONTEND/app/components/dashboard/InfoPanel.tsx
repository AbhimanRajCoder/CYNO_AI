import React from 'react';
import { Lightbulb, FolderOpen, Brain, Users } from 'lucide-react';

export default function InfoPanel() {
    const steps = [
        {
            icon: FolderOpen,
            title: 'Reports Organized',
            description: 'Files are automatically categorized and linked to patient records',
        },
        {
            icon: Brain,
            title: 'AI-Assisted Review',
            description: 'Prepared for AI-powered case analysis and insights',
        },
        {
            icon: Users,
            title: 'Tumor Board Ready',
            description: 'Ready for collaborative tumor board discussion',
        },
    ];

    return (
        <div className="bg-gradient-to-br from-sky-50 to-teal-50 rounded-2xl border border-sky-100 p-6">
            <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-semibold text-slate-800">
                    What happens after upload?
                </h3>
            </div>
            <div className="space-y-4">
                {steps.map((step, index) => (
                    <div key={index} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                            <step.icon className="w-4 h-4 text-sky-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-700">{step.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{step.description}</p>
                        </div>
                    </div>
                ))}
            </div>
            <p className="text-xs text-slate-400 mt-4 pt-4 border-t border-sky-100">
                This system assists clinicians and does not provide diagnoses.
            </p>
        </div>
    );
}
