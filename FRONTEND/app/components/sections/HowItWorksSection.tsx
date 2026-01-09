import React from 'react';
import { HOW_IT_WORKS_STEPS } from '@/app/lib/constants';
import StepCard from '@/app/components/ui/StepCard';

export default function HowItWorksSection() {
    return (
        <section id="how-it-works" className="py-24 bg-slate-50">
            <div className="max-w-7xl mx-auto px-6">
                {/* Section Header */}
                <div className="mb-16">
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">
                        Orchestration, not replacement.
                    </h2>
                    <p className="text-slate-500 max-w-xl">
                        CYNO integrates into existing clinical workflows to streamline the path from diagnosis to treatment plan.
                    </p>
                </div>

                {/* Steps Grid */}
                <div className="grid md:grid-cols-4 gap-6 relative">
                    {/* Connector Line */}
                    <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-slate-200 z-0"></div>

                    {/* Step Cards */}
                    {HOW_IT_WORKS_STEPS.map((step, index) => (
                        <StepCard
                            key={index}
                            icon={step.icon}
                            title={step.title}
                            desc={step.desc}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
