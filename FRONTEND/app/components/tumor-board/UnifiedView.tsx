'use client';

import React from 'react';
import {
    User,
    Brain,
    Scan,
    Microscope,
    Stethoscope,
    BookOpen,
    AlertTriangle,
    Target,
    Clock,
    Sparkles,
    Activity,
    Pill,
    FlaskConical,
    CheckCircle2,
    AlertCircle,
    TrendingUp,
    TrendingDown,
    Minus,
    Zap,
    FileText
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

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
    staging?: {
        clinical_stage?: string;
        pathological_stage?: string;
        tnm_staging?: string;
    };
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
        diagnostic?: Recommendation[];
    };
    clinical_trials?: { name: string; source?: string; eligibility?: string }[];
    warnings: string[];
    overall_confidence: string;
    processing_time_seconds: number;
    agents_used: string[];
    // New safety fields
    diagnostic_status?: string;
    data_completeness_score?: number;
    missing_critical_data?: string[];
    confidence_justification?: string;
}

interface UnifiedViewProps {
    view: MultiAgentView;
    patientData?: any;
    onNotesChange?: (field: string, value: string) => void;
    notes?: {
        radiology?: string;
        pathology?: string;
        clinical?: string;
        finalDecision?: string;
    };
}

// ============================================================================
// STYLING CONSTANTS
// ============================================================================

const severityStyles: Record<string, { bg: string; text: string; border: string }> = {
    critical: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    high: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    moderate: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    low: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    info: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
};

const confidenceStyles: Record<string, { bg: string; text: string; border: string }> = {
    high: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
    moderate: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
    medium: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
    low: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
    very_low: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
};

const diagnosticStatusStyles: Record<string, { bg: string; text: string; label: string }> = {
    ready_for_review: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Ready for Review' },
    preliminary: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Preliminary' },
    pending_confirmation: { bg: 'bg-orange-50', text: 'text-orange-700', label: 'Pending Confirmation' },
    diagnostic_workup_required: { bg: 'bg-red-50', text: 'text-red-700', label: 'Diagnostic Workup Required' },
};

const trendIcons: Record<string, React.ReactNode> = {
    Rising: <TrendingUp className="w-4 h-4 text-red-500" />,
    Falling: <TrendingDown className="w-4 h-4 text-emerald-500" />,
    Persistent: <Minus className="w-4 h-4 text-amber-500" />,
    New: <Zap className="w-4 h-4 text-purple-500" />,
};

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

// Patient Header with Staging
const PatientHeader = ({ view, patientData }: { view: MultiAgentView; patientData?: any }) => (
    <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 rounded-2xl p-6 text-white shadow-xl shadow-indigo-200/50 mb-6">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                    <User className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">
                        {view.patient_name || patientData?.name || 'Patient'}
                    </h1>
                    <div className="flex items-center gap-3 mt-1 text-indigo-100">
                        {(view.patient_id || patientData?.patientId) && (
                            <><span>ID: {view.patient_id || patientData?.patientId}</span><span>•</span></>
                        )}
                        {(view.patient_age || patientData?.age) && (
                            <><span>{view.patient_age || patientData?.age} yrs</span><span>•</span></>
                        )}
                        {(view.patient_gender || patientData?.gender) && (
                            <span className="capitalize">{view.patient_gender || patientData?.gender}</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Staging Badge */}
                {view.staging?.clinical_stage && (
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                        <p className="text-[10px] uppercase tracking-wider text-indigo-200">Stage</p>
                        <p className="text-lg font-bold">{view.staging.clinical_stage}</p>
                    </div>
                )}

                {/* Confidence */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                    <p className="text-[10px] uppercase tracking-wider text-indigo-200">Confidence</p>
                    <p className="text-lg font-bold capitalize">{view.overall_confidence}</p>
                </div>

                {/* Processing Time */}
                {view.processing_time_seconds > 0 && (
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{(view.processing_time_seconds || 0).toFixed(1)}s</span>
                    </div>
                )}
            </div>
        </div>

        {/* Agents Used */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/20">
            <Sparkles className="w-4 h-4 text-indigo-200" />
            <span className="text-sm text-indigo-200">Powered by:</span>
            {view.agents_used.map((agent, idx) => (
                <span key={idx} className="px-2 py-1 text-xs bg-white/10 rounded-full">
                    {agent}
                </span>
            ))}
        </div>
    </div>
);

// Executive Summary Card
const ExecutiveSummary = ({ summary }: { summary: string }) => (
    <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-6 border border-slate-200 mb-6">
        <div className="flex items-center gap-2 text-indigo-700 mb-3">
            <Brain className="w-5 h-5" />
            <h2 className="font-bold text-lg">Executive Summary</h2>
        </div>
        <p className="text-slate-700 leading-relaxed text-lg">{summary}</p>
    </div>
);

// Diagnostic Status Banner - Shows when diagnosis is pending
const DiagnosticStatusBanner = ({ view }: { view: MultiAgentView }) => {
    const status = view.diagnostic_status || 'pending_confirmation';
    const style = diagnosticStatusStyles[status] || diagnosticStatusStyles.pending_confirmation;
    const isPending = status !== 'ready_for_review';

    if (!isPending) return null;

    return (
        <div className={`${style.bg} ${style.text} rounded-xl p-4 mb-6 border-2 border-dashed ${style.text.replace('text-', 'border-')}`}>
            <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="font-bold text-lg">{style.label}</p>
                    <p className="text-sm mt-1 opacity-90">
                        This analysis is for decision-support only. Treatment recommendations require pathology confirmation.
                    </p>
                    {view.missing_critical_data && view.missing_critical_data.length > 0 && (
                        <div className="mt-3">
                            <p className="text-sm font-medium">Missing Data:</p>
                            <ul className="text-sm list-disc list-inside mt-1">
                                {view.missing_critical_data.map((item, idx) => (
                                    <li key={idx}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Confidence Badge with color coding
const ConfidenceBadge = ({ confidence, score }: { confidence: string; score?: number }) => {
    const style = confidenceStyles[confidence] || confidenceStyles.low;
    return (
        <div className={`${style.bg} ${style.text} border ${style.border} rounded-xl px-4 py-2`}>
            <p className="text-[10px] uppercase tracking-wider opacity-70">Confidence</p>
            <p className="text-lg font-bold capitalize">{confidence.replace('_', ' ')}</p>
            {score !== undefined && (
                <p className="text-xs opacity-70">{Math.round(score * 100)}% data complete</p>
            )}
        </div>
    );
};

// Findings Section
const FindingsSection = ({
    title,
    icon: Icon,
    findings,
    color,
    notes,
    onNotesChange,
    noteField
}: {
    title: string;
    icon: React.ElementType;
    findings: Finding[];
    color: string;
    notes?: string;
    onNotesChange?: (value: string) => void;
    noteField?: string;
}) => {
    const colorClasses: Record<string, { header: string; bg: string; border: string; accent: string }> = {
        sky: { header: 'bg-sky-600', bg: 'bg-sky-50', border: 'border-sky-100', accent: 'text-sky-600' },
        violet: { header: 'bg-violet-600', bg: 'bg-violet-50', border: 'border-violet-100', accent: 'text-violet-600' },
        teal: { header: 'bg-teal-600', bg: 'bg-teal-50', border: 'border-teal-100', accent: 'text-teal-600' },
        indigo: { header: 'bg-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', accent: 'text-indigo-600' },
    };

    const styles = colorClasses[color] || colorClasses.sky;

    return (
        <div className={`rounded-xl border ${styles.border} overflow-hidden shadow-sm hover:shadow-md transition-shadow`}>
            {/* Header */}
            <div className={`${styles.header} px-5 py-3 flex items-center gap-3 text-white`}>
                <Icon className="w-5 h-5" />
                <h3 className="font-semibold">{title}</h3>
                <span className="ml-auto bg-white/20 px-2 py-0.5 rounded-full text-xs">
                    {findings.length} findings
                </span>
            </div>

            {/* Findings */}
            <div className={`${styles.bg} p-4`}>
                {findings.length === 0 ? (
                    <p className="text-slate-400 text-sm italic text-center py-4">No findings from this agent</p>
                ) : (
                    <div className="grid gap-2">
                        {findings.map((finding, idx) => {
                            const severity = severityStyles[finding.severity] || severityStyles.info;
                            return (
                                <div
                                    key={idx}
                                    className={`bg-white rounded-lg p-3 border ${severity.border} hover:shadow-sm transition-shadow`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                            <p className={`font-semibold ${styles.accent}`}>{finding.title || 'Finding'}</p>
                                            {finding.value && finding.value !== 'null' && finding.value !== 'None' && (
                                                <p className="text-slate-800 mt-0.5">{finding.value}</p>
                                            )}
                                            {finding.interpretation && finding.interpretation !== 'null' && finding.interpretation !== 'None' && (
                                                <p className="text-sm text-slate-500 mt-1 italic">{finding.interpretation}</p>
                                            )}
                                        </div>
                                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${severity.bg} ${severity.text}`}>
                                            {finding.severity}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Doctor Notes */}
                {onNotesChange && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                        <label className="text-sm font-medium text-slate-600 mb-2 block">
                            <Stethoscope className="w-4 h-4 inline mr-1" />
                            Doctor Notes
                        </label>
                        <textarea
                            value={notes || ''}
                            onChange={(e) => onNotesChange(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                            placeholder={`Add ${title.toLowerCase()} notes...`}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

// Treatment Recommendations
const TreatmentRecommendations = ({ recommendations }: { recommendations: Recommendation[] }) => (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 text-emerald-700 mb-4">
            <Target className="w-5 h-5" />
            <h2 className="font-bold text-lg">Treatment Recommendations</h2>
        </div>

        {recommendations.length === 0 ? (
            <p className="text-slate-400 italic text-center py-4">No treatment recommendations available</p>
        ) : (
            <div className="space-y-3">
                {recommendations.map((rec, idx) => (
                    <div key={idx} className="bg-white rounded-lg p-4 border border-emerald-100 hover:shadow-sm transition-shadow">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Pill className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-slate-800">{rec.text}</p>
                                {rec.rationale && (
                                    <p className="text-sm text-slate-500 mt-1">{rec.rationale}</p>
                                )}
                                <div className="flex items-center gap-2 mt-2">
                                    {rec.evidence_level && (
                                        <span className="px-2 py-0.5 text-[10px] bg-emerald-100 text-emerald-700 rounded-full font-medium">
                                            {rec.evidence_level}
                                        </span>
                                    )}
                                    <span className={`px-2 py-0.5 text-[10px] rounded-full font-medium ${rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                                        rec.priority === 'moderate' ? 'bg-amber-100 text-amber-700' :
                                            'bg-slate-100 text-slate-600'
                                        }`}>
                                        {rec.priority} priority
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
);

// Clinical Trials
const ClinicalTrials = ({ trials }: { trials: { name: string; source?: string; eligibility?: string }[] }) => {
    if (!trials || trials.length === 0) return null;

    return (
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-6">
            <div className="flex items-center gap-2 text-blue-700 mb-4">
                <FlaskConical className="w-5 h-5" />
                <h2 className="font-bold text-lg">Clinical Trials</h2>
            </div>

            <div className="space-y-3">
                {trials.map((trial, idx) => (
                    <div key={idx} className="bg-white rounded-lg p-4 border border-blue-100">
                        <p className="font-medium text-slate-800">{trial.name}</p>
                        {trial.source && <p className="text-sm text-blue-600 mt-1">{trial.source}</p>}
                        {trial.eligibility && <p className="text-sm text-slate-500 mt-1">{trial.eligibility}</p>}
                    </div>
                ))}
            </div>
        </div>
    );
};

// Final Decision Section
const FinalDecision = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-6">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-indigo-700">
                <FileText className="w-5 h-5" />
                <h2 className="font-bold text-lg">Final Treatment Decision</h2>
            </div>
            <span className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-full font-medium">
                Required
            </span>
        </div>

        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-lg"
            placeholder="Enter the final treatment decision agreed upon by the tumor board..."
        />

        <div className="flex items-start gap-2 mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
                <strong>Disclaimer:</strong> AI-generated content is for decision support only. All treatment decisions must be reviewed and approved by qualified medical professionals.
            </p>
        </div>
    </div>
);

// Warnings Panel
const WarningsPanel = ({ warnings }: { warnings: string[] }) => {
    if (!warnings || warnings.length === 0) return null;

    return (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
            <div className="flex items-center gap-2 text-amber-700 mb-3">
                <AlertCircle className="w-5 h-5" />
                <h3 className="font-semibold">Warnings & Notes</h3>
            </div>
            <ul className="space-y-1">
                {warnings.map((warning, idx) => (
                    <li key={idx} className="text-sm text-amber-700 flex items-start gap-2">
                        <span className="text-amber-400 mt-1">•</span>
                        {warning}
                    </li>
                ))}
            </ul>
        </div>
    );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const UnifiedView: React.FC<UnifiedViewProps> = ({
    view,
    patientData,
    onNotesChange,
    notes = {}
}) => {
    return (
        <div className="space-y-6">
            {/* Patient Header */}
            <PatientHeader view={view} patientData={patientData} />

            {/* Executive Summary */}
            {view.executive_summary && (
                <ExecutiveSummary summary={view.executive_summary} />
            )}

            {/* Main Grid - Agent Findings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Radiology */}
                <FindingsSection
                    title="Radiology Analysis"
                    icon={Scan}
                    findings={view.findings?.imaging || []}
                    color="sky"
                    notes={notes.radiology}
                    onNotesChange={onNotesChange ? (v) => onNotesChange('radiology', v) : undefined}
                />

                {/* Pathology */}
                <FindingsSection
                    title="Pathology Analysis"
                    icon={Microscope}
                    findings={view.findings?.pathology || []}
                    color="violet"
                    notes={notes.pathology}
                    onNotesChange={onNotesChange ? (v) => onNotesChange('pathology', v) : undefined}
                />

                {/* Clinical */}
                <FindingsSection
                    title="Clinical Analysis"
                    icon={Activity}
                    findings={view.findings?.clinical || []}
                    color="teal"
                    notes={notes.clinical}
                    onNotesChange={onNotesChange ? (v) => onNotesChange('clinical', v) : undefined}
                />

                {/* Biomarkers */}
                {(view.findings?.biomarkers?.length || 0) > 0 && (
                    <FindingsSection
                        title="Biomarkers"
                        icon={Sparkles}
                        findings={view.findings?.biomarkers || []}
                        color="indigo"
                    />
                )}
            </div>

            {/* Treatment Recommendations */}
            <TreatmentRecommendations recommendations={view.recommendations?.treatment || []} />

            {/* Clinical Trials */}
            <ClinicalTrials trials={view.clinical_trials || []} />

            {/* Final Decision */}
            <FinalDecision
                value={notes.finalDecision || ''}
                onChange={(v) => onNotesChange?.('finalDecision', v)}
            />

            {/* Warnings */}
            <WarningsPanel warnings={view.warnings} />
        </div>
    );
};

export default UnifiedView;
