'use client';

import React from 'react';
import {
    Brain,
    Scan,
    Microscope,
    Stethoscope,
    BookOpen,
    AlertTriangle,
    CheckCircle,
    Clock,
    ChevronDown,
    ChevronUp,
    Target,
    Pill,
    FlaskConical
} from 'lucide-react';

// Types for multi-agent view
interface Finding {
    category: string;
    title: string;
    value: string;
    severity: string;
    source_agent: string;
    interpretation?: string;
}

interface Recommendation {
    category: string;
    text: string;
    priority: string;
    rationale?: string;
    evidence_level?: string;
}

interface MultiAgentView {
    patient_id: string;
    patient_name: string;
    patient_age?: string;
    patient_gender?: string;
    executive_summary: string;
    findings: {
        imaging: Finding[];
        pathology: Finding[];
        clinical: Finding[];
        biomarkers: Finding[];
    };
    recommendations: {
        treatment: Recommendation[];
        imaging: Recommendation[];
        other: Recommendation[];
    };
    clinical_trials?: { name: string; source?: string; eligibility?: string }[];
    warnings: string[];
    overall_confidence: string;
    processing_time_seconds: number;
    agents_used: string[];
}

interface AgentsViewProps {
    view: MultiAgentView | null;
    loading?: boolean;
}

// Severity colors
const severityColors: Record<string, string> = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    moderate: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    info: 'bg-slate-100 text-slate-600 border-slate-200',
};

const confidenceColors: Record<string, string> = {
    high: 'bg-emerald-100 text-emerald-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-red-100 text-red-700',
};

// Agent info
const agentInfo: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    radiology: { icon: <Scan className="w-4 h-4" />, color: 'text-sky-600', bg: 'bg-sky-50' },
    pathology: { icon: <Microscope className="w-4 h-4" />, color: 'text-violet-600', bg: 'bg-violet-50' },
    clinical: { icon: <Stethoscope className="w-4 h-4" />, color: 'text-teal-600', bg: 'bg-teal-50' },
    research: { icon: <BookOpen className="w-4 h-4" />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    coordinator: { icon: <Brain className="w-4 h-4" />, color: 'text-purple-600', bg: 'bg-purple-50' },
};

// Agent Section Component
const AgentSection = ({
    title,
    agentType,
    findings,
    expanded,
    onToggle
}: {
    title: string;
    agentType: string;
    findings: Finding[];
    expanded: boolean;
    onToggle: () => void;
}) => {
    const agent = agentInfo[agentType] || agentInfo.clinical;

    return (
        <div className={`rounded-xl border ${agent.bg} border-slate-200 overflow-hidden`}>
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-4 hover:bg-white/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${agent.bg} flex items-center justify-center ${agent.color}`}>
                        {agent.icon}
                    </div>
                    <div className="text-left">
                        <h3 className="font-semibold text-slate-800">{title}</h3>
                        <p className="text-xs text-slate-500">{findings.length} findings</p>
                    </div>
                </div>
                {expanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
            </button>

            {expanded && (
                <div className="px-4 pb-4 space-y-2">
                    {findings.length === 0 ? (
                        <p className="text-sm text-slate-400 italic py-2">No findings from this agent</p>
                    ) : (
                        findings.map((finding, idx) => (
                            <div
                                key={idx}
                                className="bg-white rounded-lg p-3 border border-slate-100 hover:shadow-sm transition-shadow"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-800 text-sm">{finding.title}</p>
                                        <p className="text-slate-600 text-sm mt-0.5">{finding.value}</p>
                                        {finding.interpretation && (
                                            <p className="text-xs text-slate-500 mt-1 italic">{finding.interpretation}</p>
                                        )}
                                    </div>
                                    <span
                                        className={`px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase ${severityColors[finding.severity] || severityColors.info
                                            }`}
                                    >
                                        {finding.severity}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

// Recommendations Section
const RecommendationsSection = ({ recommendations }: { recommendations: Recommendation[] }) => (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-5">
        <div className="flex items-center gap-2 text-indigo-700 mb-4">
            <Target className="w-5 h-5" />
            <h3 className="font-bold">Treatment Recommendations</h3>
        </div>

        {recommendations.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No recommendations available</p>
        ) : (
            <div className="space-y-3">
                {recommendations.map((rec, idx) => (
                    <div
                        key={idx}
                        className="bg-white/70 rounded-lg p-3 border border-indigo-100"
                    >
                        <div className="flex items-start gap-2">
                            <Pill className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-slate-800">{rec.text}</p>
                                {rec.rationale && (
                                    <p className="text-xs text-slate-500 mt-1">{rec.rationale}</p>
                                )}
                                {rec.evidence_level && (
                                    <span className="inline-block mt-1 px-2 py-0.5 text-[10px] bg-indigo-100 text-indigo-700 rounded-full">
                                        {rec.evidence_level}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
);

// Clinical Trials Section
const ClinicalTrialsSection = ({ trials }: { trials: { name: string; source?: string; eligibility?: string }[] }) => {
    if (!trials || trials.length === 0) return null;

    return (
        <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-5">
            <div className="flex items-center gap-2 text-emerald-700 mb-4">
                <FlaskConical className="w-5 h-5" />
                <h3 className="font-bold">Clinical Trials</h3>
            </div>

            <div className="space-y-2">
                {trials.map((trial, idx) => (
                    <div key={idx} className="bg-white/70 rounded-lg p-3 border border-emerald-100">
                        <p className="text-sm font-medium text-slate-800">{trial.name}</p>
                        {trial.source && (
                            <p className="text-xs text-emerald-600 mt-1">{trial.source}</p>
                        )}
                        {trial.eligibility && (
                            <p className="text-xs text-slate-500 mt-1">{trial.eligibility}</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

// Main Component
export const AgentsView: React.FC<AgentsViewProps> = ({ view, loading }) => {
    const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
        imaging: true,
        pathology: true,
        clinical: true,
        biomarkers: true,
    });

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="ml-3 text-slate-600">Running specialized agents...</span>
            </div>
        );
    }

    if (!view) {
        return (
            <div className="p-8 text-center text-slate-400">
                <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No multi-agent analysis available</p>
                <p className="text-sm mt-1">Generate AI analysis to see agent outputs</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with agents used */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                    {view.agents_used.map((agent, idx) => (
                        <span
                            key={idx}
                            className="px-3 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-full flex items-center gap-1"
                        >
                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                            {agent}
                        </span>
                    ))}
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-500">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${confidenceColors[view.overall_confidence] || confidenceColors.medium}`}>
                        {view.overall_confidence} confidence
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {view.processing_time_seconds.toFixed(1)}s
                    </span>
                </div>
            </div>

            {/* Executive Summary */}
            {view.executive_summary && (
                <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-5 border border-slate-200">
                    <div className="flex items-center gap-2 text-slate-700 mb-2">
                        <Brain className="w-5 h-5 text-indigo-500" />
                        <h3 className="font-bold">Executive Summary</h3>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">{view.executive_summary}</p>
                </div>
            )}

            {/* Agent Findings */}
            <div className="space-y-3">
                <AgentSection
                    title="Radiology Agent"
                    agentType="radiology"
                    findings={view.findings.imaging}
                    expanded={expandedSections.imaging}
                    onToggle={() => toggleSection('imaging')}
                />

                <AgentSection
                    title="Pathology Agent"
                    agentType="pathology"
                    findings={view.findings.pathology}
                    expanded={expandedSections.pathology}
                    onToggle={() => toggleSection('pathology')}
                />

                <AgentSection
                    title="Clinical Agent"
                    agentType="clinical"
                    findings={view.findings.clinical}
                    expanded={expandedSections.clinical}
                    onToggle={() => toggleSection('clinical')}
                />

                {view.findings.biomarkers.length > 0 && (
                    <AgentSection
                        title="Biomarkers"
                        agentType="pathology"
                        findings={view.findings.biomarkers}
                        expanded={expandedSections.biomarkers}
                        onToggle={() => toggleSection('biomarkers')}
                    />
                )}
            </div>

            {/* Recommendations */}
            <RecommendationsSection recommendations={view.recommendations.treatment} />

            {/* Clinical Trials */}
            <ClinicalTrialsSection trials={view.clinical_trials || []} />

            {/* Warnings */}
            {view.warnings.length > 0 && (
                <div className="bg-amber-50 rounded-xl border border-amber-100 p-4">
                    <div className="flex items-center gap-2 text-amber-700 mb-2">
                        <AlertTriangle className="w-4 h-4" />
                        <h3 className="font-semibold text-sm">Warnings & Notes</h3>
                    </div>
                    <ul className="space-y-1">
                        {view.warnings.map((warning, idx) => (
                            <li key={idx} className="text-xs text-amber-700 flex items-start gap-2">
                                <span className="text-amber-400">•</span>
                                {warning}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default AgentsView;
