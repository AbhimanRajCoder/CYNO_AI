import React from 'react';
import {
    User,
    Brain,
    Stethoscope,
    Microscope,
    AlertTriangle,
    Zap,
    Minus,
    TrendingUp,
    TrendingDown,
    Target,
    AlertCircle,
    CheckSquare
} from 'lucide-react';

// --- Types (Copied from original page.tsx to ensure compatibility) ---
export interface CaseSummary {
    patient_name: string | null;
    age: string | null;
    gender: string | null;
    primary_diagnosis: string | null;
    suspected_category: string;
    case_complexity: string;
}

export interface RadiologySummary {
    modality: string | null;
    anatomical_region: string | null;
    key_findings: string[];
    impression: string | null;
    limitations: string | null;
}

export interface PathologySummary {
    specimen_type: string | null;
    hematologic_findings: string[];
    immunophenotype: string[];
    pathologist_impression: string | null;
}

export interface CriticalAlert {
    parameter: string;
    value: string;
    trend: string;
    clinical_significance: string;
}

export interface IntegratedAnalysis {
    concordance: string;
    key_insights: string[];
    data_gaps: string[];
}

export interface TumorBoardConsensus {
    summary: string | null;
    suggested_next_steps: string[];
    confidence_level: string;
}

export interface TumorBoardAIView {
    case_summary: CaseSummary;
    radiology_summary: RadiologySummary;
    pathology_summary: PathologySummary;
    critical_alerts: CriticalAlert[];
    integrated_analysis: IntegratedAnalysis;
    tumor_board_consensus: TumorBoardConsensus;
    warnings: string[];
    confidence: number;
    generated_at: string;
}

// --- Constants ---
const categoryColors: Record<string, string> = {
    Hematologic: 'bg-purple-100 text-purple-700',
    'Solid Tumor': 'bg-rose-100 text-rose-700',
    Unknown: 'bg-slate-100 text-slate-600',
};

const complexityColors: Record<string, string> = {
    Low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Moderate: 'bg-amber-100 text-amber-700 border-amber-200',
    High: 'bg-red-100 text-red-700 border-red-200',
};

const trendIcons: Record<string, React.ReactNode> = {
    Rising: <TrendingUp className="w-4 h-4 text-red-500" />,
    Falling: <TrendingDown className="w-4 h-4 text-emerald-500" />,
    Persistent: <Minus className="w-4 h-4 text-amber-500" />,
    New: <Zap className="w-4 h-4 text-purple-500" />,
};

// --- Components ---

export const CaseSummaryCard = ({ summary, patientName, patientId }: { summary: CaseSummary; patientName: string; patientId: string }) => (
    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border border-blue-100 mb-6">
        <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                    <User className="w-7 h-7 text-indigo-600" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-800">
                        {summary.patient_name || patientName || 'Unknown Patient'}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                        ID: {patientId} • {summary.age || 'Age N/A'} • {summary.gender || 'Gender N/A'}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${categoryColors[summary.suspected_category] || categoryColors.Unknown}`}>
                    {summary.suspected_category}
                </span>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${complexityColors[summary.case_complexity] || complexityColors.Moderate}`}>
                    {summary.case_complexity} Complexity
                </span>
            </div>
        </div>
        {summary.primary_diagnosis && (
            <div className="mt-4 p-3 bg-white/60 rounded-lg border border-white/50">
                <p className="text-xs font-semibold text-indigo-900 uppercase tracking-wide mb-1 opacity-70">Primary Diagnosis</p>
                <p className="font-semibold text-slate-800 text-lg">{summary.primary_diagnosis}</p>
            </div>
        )}
    </div>
);

export const RadiologyTab = ({ summary, doctorNotes, onNotesChange }: {
    summary: RadiologySummary;
    doctorNotes: string;
    onNotesChange: (notes: string) => void;
}) => (
    <div className="space-y-4">
        {/* AI Generated Section */}
        <div className="p-4 bg-sky-50 rounded-xl border border-sky-100/50">
            <div className="flex items-center gap-2 text-sky-700 mb-4">
                <Brain className="w-4 h-4" />
                <span className="text-sm font-semibold">AI Analysis</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-white rounded-lg border border-sky-100">
                    <p className="text-xs text-slate-500 mb-1">Modality</p>
                    <p className="font-medium text-slate-800">{summary.modality || 'Not specified'}</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-sky-100">
                    <p className="text-xs text-slate-500 mb-1">Region</p>
                    <p className="font-medium text-slate-800">{summary.anatomical_region || 'Not specified'}</p>
                </div>
            </div>

            <div className="mb-4">
                <p className="text-xs text-slate-500 mb-2 font-medium uppercase">Key Findings</p>
                {summary.key_findings.length > 0 ? (
                    <ul className="space-y-2">
                        {summary.key_findings.map((finding, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 bg-white p-2 rounded-lg border border-sky-50">
                                <span className="text-sky-500 mt-0.5">•</span>
                                {finding}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-slate-400 italic">No key findings recorded</p>
                )}
            </div>

            {summary.impression && (
                <div className="p-3 bg-sky-100/50 rounded-lg border border-sky-200/50">
                    <p className="text-xs text-sky-700 font-bold mb-1">IMPRESSION</p>
                    <p className="text-sm text-slate-800">{summary.impression}</p>
                </div>
            )}
        </div>

        {/* Doctor Notes Section */}
        <div>
            <div className="flex items-center gap-2 text-slate-700 mb-2 mt-6">
                <Stethoscope className="w-4 h-4 text-sky-500" />
                <span className="text-sm font-semibold">Radiologist Notes</span>
            </div>
            <textarea
                value={doctorNotes}
                onChange={(e) => onNotesChange(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none bg-slate-50 focus:bg-white transition-colors text-sm"
                placeholder="Enter radiologist observations..."
            />
        </div>
    </div>
);

export const PathologyTab = ({ summary, doctorNotes, onNotesChange }: {
    summary: PathologySummary;
    doctorNotes: string;
    onNotesChange: (notes: string) => void;
}) => (
    <div className="space-y-4">
        {/* AI Generated Section */}
        <div className="p-4 bg-teal-50 rounded-xl border border-teal-100/50">
            <div className="flex items-center gap-2 text-teal-700 mb-4">
                <Brain className="w-4 h-4" />
                <span className="text-sm font-semibold">AI Analysis</span>
            </div>

            {summary.specimen_type && (
                <div className="mb-4 p-3 bg-white rounded-lg border border-teal-100">
                    <p className="text-xs text-slate-500 mb-1">Specimen Type</p>
                    <p className="font-medium text-slate-800">{summary.specimen_type}</p>
                </div>
            )}

            <div className="mb-4">
                <p className="text-xs text-slate-500 mb-2 font-medium uppercase">Hematologic Findings</p>
                {summary.hematologic_findings.length > 0 ? (
                    <ul className="space-y-2">
                        {summary.hematologic_findings.map((finding, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 bg-white p-2 rounded-lg border border-teal-50">
                                <span className="text-teal-500 mt-0.5">•</span>
                                {finding}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-slate-400 italic">No hematologic findings</p>
                )}
            </div>

            <div className="mb-4">
                <p className="text-xs text-slate-500 mb-2 font-medium uppercase">Immunophenotype</p>
                {summary.immunophenotype.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {summary.immunophenotype.map((marker, idx) => (
                            <span key={idx} className="px-2 py-1 text-xs bg-white border border-teal-100 text-teal-700 rounded-full font-medium">
                                {marker}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-slate-400 italic">No immunophenotype data</p>
                )}
            </div>

            {summary.pathologist_impression && (
                <div className="p-3 bg-teal-100/50 rounded-lg border border-teal-200/50">
                    <p className="text-xs text-teal-700 font-bold mb-1">IMPRESSION</p>
                    <p className="text-sm text-slate-800">{summary.pathologist_impression}</p>
                </div>
            )}
        </div>

        {/* Doctor Notes Section */}
        <div>
            <div className="flex items-center gap-2 text-slate-700 mb-2 mt-6">
                <Microscope className="w-4 h-4 text-teal-500" />
                <span className="text-sm font-semibold">Pathologist Notes</span>
            </div>
            <textarea
                value={doctorNotes}
                onChange={(e) => onNotesChange(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none bg-slate-50 focus:bg-white transition-colors text-sm"
                placeholder="Enter pathology findings..."
            />
        </div>
    </div>
);

export const CriticalAlertsTab = ({ alerts }: { alerts: CriticalAlert[] }) => (
    <div className="space-y-3">
        {alerts.length === 0 ? (
            <div className="p-8 text-center">
                <p className="text-slate-500">No critical alerts detected.</p>
            </div>
        ) : (
            alerts.map((alert, idx) => (
                <div key={idx} className="p-4 bg-red-50 rounded-xl border border-red-100 flex items-start gap-4 hover:shadow-sm transition-shadow">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-red-100">
                        {trendIcons[alert.trend] || <AlertTriangle className="w-5 h-5 text-red-500" />}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-slate-800">{alert.parameter}</span>
                            <span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-red-100 text-red-700 rounded-full tracking-wider">
                                {alert.trend}
                            </span>
                        </div>
                        <p className="text-xl font-bold text-red-600 mb-1">{alert.value}</p>
                        <p className="text-sm text-slate-600 leading-relaxed">{alert.clinical_significance}</p>
                    </div>
                </div>
            ))
        )}
    </div>
);

export const IntegratedAnalysisTab = ({ analysis }: { analysis: IntegratedAnalysis }) => (
    <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-500">Data Concordance</span>
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${analysis.concordance === 'High' ? 'bg-emerald-100 text-emerald-700' :
                analysis.concordance === 'Moderate' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                }`}>
                {analysis.concordance}
            </span>
        </div>

        <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
            <div className="flex items-center gap-2 text-purple-700 mb-3">
                <Target className="w-4 h-4" />
                <span className="text-sm font-bold uppercase">Key Insights</span>
            </div>
            {analysis.key_insights.length > 0 ? (
                <ul className="space-y-3">
                    {analysis.key_insights.map((insight, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 flex-shrink-0"></span>
                            {insight}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-slate-400 italic">No key insights available</p>
            )}
        </div>

        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
            <div className="flex items-center gap-2 text-amber-700 mb-3">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-bold uppercase">Data Gaps</span>
            </div>
            {analysis.data_gaps.length > 0 ? (
                <ul className="space-y-3">
                    {analysis.data_gaps.map((gap, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></span>
                            {gap}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-slate-400 italic">No data gaps identified</p>
            )}
        </div>
    </div>
);

export const ConsensusTab = ({ consensus, finalDecision, onFinalDecisionChange }: {
    consensus: TumorBoardConsensus;
    finalDecision: string;
    onFinalDecisionChange: (decision: string) => void;
}) => (
    <div className="space-y-6">
        {/* AI Generated Consensus */}
        <div className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-indigo-700">
                    <Brain className="w-5 h-5" />
                    <span className="text-base font-bold">AI Recommendation</span>
                </div>
                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${consensus.confidence_level === 'High' ? 'bg-emerald-100 text-emerald-700' :
                    consensus.confidence_level === 'Moderate' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                    }`}>
                    {consensus.confidence_level} Confidence
                </span>
            </div>

            {consensus.summary && (
                <p className="text-sm text-slate-700 mb-6 leading-relaxed relative pl-4 border-l-2 border-indigo-200">
                    {consensus.summary}
                </p>
            )}

            <div>
                <p className="text-xs font-bold text-indigo-900/50 uppercase mb-3 tracking-wide">Suggested Next Steps</p>
                {consensus.suggested_next_steps.length > 0 ? (
                    <div className="space-y-2">
                        {consensus.suggested_next_steps.map((step, idx) => (
                            <div key={idx} className="flex items-start gap-3 text-sm text-slate-700 bg-white/60 p-3 rounded-lg border border-indigo-100">
                                <CheckSquare className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                                {step}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-slate-400 italic">No specific next steps suggested</p>
                )}
            </div>
        </div>

        {/* Final Decision */}
        <div>
            <div className="flex items-center gap-2 text-slate-800 mb-3">
                <CheckSquare className="w-5 h-5 text-emerald-500" />
                <span className="text-base font-bold">Final Treatment Decision</span>
                <span className="px-2 py-0.5 text-[10px] bg-emerald-100 text-emerald-700 rounded-full font-bold uppercase tracking-wide">Required</span>
            </div>
            <textarea
                value={finalDecision}
                onChange={(e) => onFinalDecisionChange(e.target.value)}
                rows={6}
                className="w-full px-5 py-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none shadow-sm text-sm leading-relaxed"
                placeholder="Enter the final treatment decision agreed upon by the tumor board..."
            />
        </div>

        {/* Disclaimer */}
        <div className="flex gap-3 p-4 bg-amber-50/50 border border-amber-100 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-700 leading-relaxed">
                <strong>Disclaimer:</strong> AI-generated content is for decision support only. All treatment decisions must be reviewed and approved by qualified medical professionals.
            </p>
        </div>
    </div>
);
