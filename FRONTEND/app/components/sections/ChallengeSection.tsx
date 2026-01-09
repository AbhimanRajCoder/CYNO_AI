import React from 'react';
import { CHALLENGES } from '@/app/lib/constants';
import FeatureCard from '@/app/components/ui/FeatureCard';

export default function ChallengeSection() {
    return (
        <section className="py-20 bg-white border-y border-slate-100">
            <div className="max-w-7xl mx-auto px-6">
                {/* Section Header */}
                <div className="text-center mb-16 max-w-2xl mx-auto">
                    <h2 className="text-sm font-bold text-sky-600 tracking-widest uppercase mb-3">
                        The Challenge
                    </h2>
                    <h3 className="text-3xl font-bold text-slate-900">
                        Why coordination matters
                    </h3>
                </div>

                {/* Challenge Cards */}
                <div className="grid md:grid-cols-3 gap-8">
                    {CHALLENGES.map((challenge, index) => (
                        <FeatureCard
                            key={index}
                            icon={challenge.icon}
                            title={challenge.title}
                            description={challenge.description}
                            iconColor={challenge.iconColor}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
