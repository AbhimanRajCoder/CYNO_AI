import React from 'react';
import { ShieldCheck, Lock, UserCheck } from 'lucide-react';

interface EthicsCardProps {
    icon: React.ElementType;
    title: string;
    description: string;
}

function EthicsCard({ icon: Icon, title, description }: EthicsCardProps) {
    return (
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 animate-on-scroll">
            <h4 className="font-bold mb-2 flex items-center gap-2">
                <Icon className="w-4 h-4 text-teal-500" />
                {title}
            </h4>
            <p className="text-sm text-slate-400">{description}</p>
        </div>
    );
}

export default function EthicsSection() {
    return (
        <section id="ethics" className="py-20 bg-slate-900 text-white">
            <div className="max-w-4xl mx-auto px-6 text-center">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-700 bg-slate-800 text-slate-300 text-xs font-mono mb-8">
                    <ShieldCheck className="w-3 h-3" />
                    SAFETY & COMPLIANCE
                </div>

                {/* Headline */}
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                    Built for Doctors. <br />
                    Designed with Responsibility.
                </h2>

                <p className="text-slate-400 mb-12 text-lg">
                    CYNO is a non-diagnostic clinical decision support system. We believe in the &quot;Human-in-the-Loop&quot; architecture.
                </p>

                {/* Ethics Cards */}
                <div className="grid md:grid-cols-2 gap-6 text-left">
                    <EthicsCard
                        icon={Lock}
                        title="Data Privacy"
                        description="HIPAA compliant architecture with end-to-end encryption. Patient data is anonymized for processing."
                    />
                    <EthicsCard
                        icon={UserCheck}
                        title="No Auto-Decisions"
                        description="AI suggests summaries and organizes data. It never prescribes medication or finalizes a diagnosis without MD approval."
                    />
                </div>
            </div>
        </section>
    );
}
