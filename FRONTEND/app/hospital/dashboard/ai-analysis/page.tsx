'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/dashboard/DashboardLayout';
import { useAuth } from '@/app/components/auth/AuthProvider';
import {
    Brain,
    User,
    Loader2,
    CheckCircle,
    ChevronRight,
    AlertTriangle,
    FileText,
    Activity,
    ClipboardList,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    FlaskConical,
    Stethoscope,
    Calendar,
    Building2,
    Shield
} from 'lucide-react';

// Microsoft Azure Badge Component
const AzureBadge = ({ size = 'default' }: { size?: 'small' | 'default' }) => {
    const isSmall = size === 'small';
    return (
        <div className={`inline-flex items-center gap-1.5 ${isSmall ? 'px-2 py-0.5' : 'px-3 py-1.5'} bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-full`}>
            <svg
                viewBox="0 0 23 23"
                className={`${isSmall ? 'w-3 h-3' : 'w-4 h-4'}`}
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path d="M0 11.5C0 5.14873 5.14873 0 11.5 0C17.8513 0 23 5.14873 23 11.5C23 17.8513 17.8513 23 11.5 23C5.14873 23 0 17.8513 0 11.5Z" fill="url(#azure-gradient)" />
                <path d="M8.5 6.5L5 17H8L10 12.5L14 17H18L11 10L14.5 6.5H11L8.5 10V6.5Z" fill="white" />
                <defs>
                    <linearGradient id="azure-gradient" x1="0" y1="0" x2="23" y2="23">
                        <stop stopColor="#0078D4" />
                        <stop offset="1" stopColor="#00BCF2" />
                    </linearGradient>
                </defs>
            </svg>
            <span className={`font-medium ${isSmall ? 'text-[10px]' : 'text-xs'} text-blue-700`}>
                Verified by Microsoft Azure
            </span>
            <Shield className={`${isSmall ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-blue-500`} />
        </div>
    );
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Patient {
    id: string;
    patientId: string;
    name: string;
    cancerType: string | null;
}

interface Finding {
    test_name: string;
    value: string;
    unit: string | null;
    reference_range: string | null;
    status: 'NORMAL' | 'ABNORMAL' | 'CRITICAL' | 'WARNING' | null;
    interpretation: string | null;
    source_page?: number;
}

interface PageAnalysis {
    page: number;
    patient_identity: {
        name: string | null;
        id: string | null;
        dob: string | null;
        gender: string | null;
        age: string | null;
    };
    report_metadata: {
        report_type: string | null;
        date: string | null;
        lab_name: string | null;
        referring_physician: string | null;
    };
    findings: Finding[];
    diagnosis: string | null;
    recommendations: string[];
    warnings: string[];
    extraction_confidence: number;
}

interface ReportResult {
    file_name: string;
    status: string;
    total_pages?: number;
    source_type?: string;
    pages?: PageAnalysis[];
    merged_analysis?: {
        patient_identity: any;
        report_metadata: any;
        all_findings: Finding[];
        diagnoses: string[];
        recommendations: string[];
        aggregate_confidence: number;
    };
    warnings?: string[];
    error?: string;
    message?: string;
}

// Status badge component
const StatusBadge = ({ status }: { status: string | null }) => {
    if (!status || status === 'null') return null;

    const styles: Record<string, string> = {
        NORMAL: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        ABNORMAL: 'bg-amber-100 text-amber-700 border-amber-200',
        CRITICAL: 'bg-red-100 text-red-700 border-red-200',
        WARNING: 'bg-orange-100 text-orange-700 border-orange-200',
    };

    return (
        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
            {status}
        </span>
    );
};

// Finding card component
const FindingCard = ({ finding }: { finding: Finding }) => {
    const hasValue = finding.value && finding.value !== 'None' && finding.value !== 'null';

    return (
        <div className={`p-3 rounded-lg border ${finding.status === 'CRITICAL' ? 'bg-red-50 border-red-200' :
            finding.status === 'ABNORMAL' ? 'bg-amber-50 border-amber-200' :
                'bg-white border-slate-200'
            }`}>
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-800 text-sm">{finding.test_name}</span>
                        <StatusBadge status={finding.status} />
                    </div>
                    {hasValue && (
                        <div className="mt-1 flex items-baseline gap-1 flex-wrap">
                            <span className={`text-lg font-bold ${finding.status === 'CRITICAL' ? 'text-red-600' :
                                finding.status === 'ABNORMAL' ? 'text-amber-600' :
                                    'text-emerald-600'
                                }`}>
                                {finding.value}
                            </span>
                            {finding.unit && finding.unit !== 'null' && (
                                <span className="text-sm text-slate-500">{finding.unit}</span>
                            )}
                            {finding.reference_range && finding.reference_range !== 'null' && (
                                <span className="text-xs text-slate-400 ml-2">
                                    (Ref: {finding.reference_range})
                                </span>
                            )}
                        </div>
                    )}
                    {finding.interpretation && finding.interpretation !== 'null' && (
                        <p className="mt-1 text-xs text-slate-600 italic">{finding.interpretation}</p>
                    )}
                </div>
                {finding.source_page && (
                    <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        P{finding.source_page}
                    </span>
                )}
            </div>
        </div>
    );
};

// Page accordion component
const PageAccordion = ({ page, isOpen, onToggle }: { page: PageAnalysis; isOpen: boolean; onToggle: () => void }) => {
    const hasFindings = page.findings && page.findings.length > 0;
    const criticalCount = page.findings?.filter(f => f.status === 'CRITICAL').length || 0;
    const abnormalCount = page.findings?.filter(f => f.status === 'ABNORMAL').length || 0;

    return (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full p-4 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center font-bold text-sm">
                        {page.page}
                    </div>
                    <div className="text-left">
                        <p className="font-medium text-slate-800">
                            {page.report_metadata?.report_type || `Page ${page.page}`}
                        </p>
                        {page.report_metadata?.date && (
                            <p className="text-xs text-slate-500">{page.report_metadata.date}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {criticalCount > 0 && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                            {criticalCount} Critical
                        </span>
                    )}
                    {abnormalCount > 0 && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                            {abnormalCount} Abnormal
                        </span>
                    )}
                    <div className="px-2 py-0.5 bg-slate-200 text-slate-600 text-xs rounded-full">
                        {Math.round(page.extraction_confidence * 100)}% conf
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </div>
            </button>

            {isOpen && (
                <div className="p-4 bg-white border-t border-slate-200">
                    {/* Patient Identity */}
                    {page.patient_identity?.name && (
                        <div className="mb-4 p-3 bg-sky-50 rounded-lg border border-sky-100">
                            <div className="flex items-center gap-2 text-sky-700 mb-2">
                                <User className="w-4 h-4" />
                                <span className="text-sm font-semibold">Patient Identity</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                {page.patient_identity.name && <div><span className="text-slate-500">Name:</span> <span className="font-medium">{page.patient_identity.name}</span></div>}
                                {page.patient_identity.id && <div><span className="text-slate-500">ID:</span> <span className="font-medium">{page.patient_identity.id}</span></div>}
                                {page.patient_identity.age && <div><span className="text-slate-500">Age:</span> <span className="font-medium">{page.patient_identity.age}</span></div>}
                                {page.patient_identity.gender && <div><span className="text-slate-500">Gender:</span> <span className="font-medium">{page.patient_identity.gender}</span></div>}
                            </div>
                        </div>
                    )}

                    {/* Findings */}
                    {hasFindings && (
                        <div className="mb-4">
                            <h6 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                <FlaskConical className="w-4 h-4" />
                                Findings ({page.findings.length})
                            </h6>
                            <div className="grid gap-2">
                                {page.findings.map((finding, idx) => (
                                    <FindingCard key={idx} finding={finding} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Diagnosis */}
                    {page.diagnosis && page.diagnosis !== 'null' && (
                        <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-100">
                            <div className="flex items-center gap-2 text-purple-700 mb-1">
                                <Stethoscope className="w-4 h-4" />
                                <span className="text-sm font-semibold">Diagnosis</span>
                            </div>
                            <p className="text-sm text-slate-700">{page.diagnosis}</p>
                        </div>
                    )}

                    {/* Recommendations */}
                    {page.recommendations && page.recommendations.filter(r => r && r !== 'null').length > 0 && (
                        <div className="mb-4 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                            <div className="flex items-center gap-2 text-emerald-700 mb-1">
                                <ClipboardList className="w-4 h-4" />
                                <span className="text-sm font-semibold">Recommendations</span>
                            </div>
                            <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                                {page.recommendations.filter(r => r && r !== 'null').map((rec, idx) => (
                                    <li key={idx}>{rec}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Warnings */}
                    {page.warnings && page.warnings.filter(w => w && w !== 'null').length > 0 && (
                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                            <div className="flex items-center gap-2 text-amber-700 mb-1">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-sm font-semibold">Warnings</span>
                            </div>
                            <ul className="list-disc list-inside text-sm text-amber-700 space-y-1">
                                {page.warnings.filter(w => w && w !== 'null').map((warn, idx) => (
                                    <li key={idx}>{warn}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Report card with pages
const ReportCard = ({ result }: { result: ReportResult }) => {
    const [openPages, setOpenPages] = useState<Set<number>>(new Set([1]));
    const [showMerged, setShowMerged] = useState(false);

    const togglePage = (pageNum: number) => {
        const newSet = new Set(openPages);
        if (newSet.has(pageNum)) {
            newSet.delete(pageNum);
        } else {
            newSet.add(pageNum);
        }
        setOpenPages(newSet);
    };

    if (result.status !== 'success') {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <h5 className="font-medium text-slate-800 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-500" />
                        {result.file_name}
                    </h5>
                    <span className="px-2.5 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                        {result.status}
                    </span>
                </div>
                <div className="p-5">
                    <p className="text-sm text-slate-500 italic">
                        {result.error || result.message || "Data unavailable"}
                    </p>
                </div>
            </div>
        );
    }

    const merged = result.merged_analysis;
    const criticalFindings = merged?.all_findings?.filter(f => f.status === 'CRITICAL') || [];
    const abnormalFindings = merged?.all_findings?.filter(f => f.status === 'ABNORMAL') || [];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-slate-200">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <h5 className="font-semibold text-slate-800">{result.file_name}</h5>
                            <p className="text-xs text-slate-500">
                                {result.total_pages} pages • {result.source_type?.toUpperCase()}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {criticalFindings.length > 0 && (
                            <span className="px-2.5 py-1 text-xs font-bold bg-red-500 text-white rounded-full animate-pulse">
                                {criticalFindings.length} Critical
                            </span>
                        )}
                        {abnormalFindings.length > 0 && (
                            <span className="px-2.5 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                                {abnormalFindings.length} Abnormal
                            </span>
                        )}
                        <span className="px-2.5 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
                            {Math.round((merged?.aggregate_confidence || 0) * 100)}% confidence
                        </span>
                    </div>
                </div>

                {/* Patient Summary */}
                {merged?.patient_identity?.name && (
                    <div className="mt-3 p-3 bg-white/70 rounded-lg">
                        <div className="flex items-center gap-4 text-sm flex-wrap">
                            <div className="flex items-center gap-1">
                                <User className="w-4 h-4 text-slate-400" />
                                <span className="font-medium">{merged.patient_identity.name}</span>
                            </div>
                            {merged.patient_identity.age && (
                                <div><span className="text-slate-400">Age:</span> {merged.patient_identity.age}</div>
                            )}
                            {merged.patient_identity.gender && (
                                <div><span className="text-slate-400">Gender:</span> {merged.patient_identity.gender}</div>
                            )}
                            {merged.patient_identity.id && (
                                <div><span className="text-slate-400">ID:</span> {merged.patient_identity.id}</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowMerged(false)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${!showMerged ? 'bg-purple-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        Page View
                    </button>
                    <button
                        onClick={() => setShowMerged(true)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${showMerged ? 'bg-purple-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        Merged Analysis
                    </button>
                </div>
                {!showMerged && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setOpenPages(new Set(result.pages?.map(p => p.page) || []))}
                            className="text-xs text-purple-600 hover:underline"
                        >
                            Expand All
                        </button>
                        <button
                            onClick={() => setOpenPages(new Set())}
                            className="text-xs text-slate-500 hover:underline"
                        >
                            Collapse All
                        </button>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                {showMerged ? (
                    <div className="space-y-4">
                        {/* Critical Alerts */}
                        {criticalFindings.length > 0 && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                                <h6 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5" />
                                    Critical Findings
                                </h6>
                                <div className="grid gap-2">
                                    {criticalFindings.map((f, idx) => (
                                        <FindingCard key={idx} finding={f} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* All Findings */}
                        <div>
                            <h6 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                <Activity className="w-4 h-4" />
                                All Findings ({merged?.all_findings?.length || 0})
                            </h6>
                            <div className="grid gap-2 max-h-[400px] overflow-y-auto">
                                {merged?.all_findings?.map((finding, idx) => (
                                    <FindingCard key={idx} finding={finding} />
                                ))}
                            </div>
                        </div>

                        {/* Recommendations */}
                        {merged?.recommendations && merged.recommendations.filter(r => r && r !== 'null').length > 0 && (
                            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                                <h6 className="font-semibold text-emerald-800 mb-2 flex items-center gap-2">
                                    <ClipboardList className="w-4 h-4" />
                                    Recommendations
                                </h6>
                                <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                                    {merged.recommendations.filter(r => r && r !== 'null').map((rec, idx) => (
                                        <li key={idx}>{rec}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {result.pages?.map((page) => (
                            <PageAccordion
                                key={page.page}
                                page={page}
                                isOpen={openPages.has(page.page)}
                                onToggle={() => togglePage(page.page)}
                            />
                        ))}
                    </div>
                )}

                {/* Global Warnings */}
                {result.warnings && result.warnings.filter(w => w && w !== 'null').length > 0 && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <h6 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Document Warnings
                        </h6>
                        <ul className="list-disc list-inside text-sm text-amber-700 space-y-1 max-h-32 overflow-y-auto">
                            {result.warnings.filter(w => w && w !== 'null').map((warn, idx) => (
                                <li key={idx}>{warn}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

// Helper to format time
const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
};

// Progress bar component
// Processing indicator component with pipeline stages
const ProcessingIndicator = ({ estimated, elapsed }: { estimated: number | null; elapsed: number }) => {
    // Calculate which stage we're likely in based on elapsed time
    const getStage = () => {
        if (!estimated) return 1;
        const progress = elapsed / estimated;
        if (progress < 0.3) return 1; // OCR
        if (progress < 0.65) return 2; // LLM-A
        return 3; // LLM-B
    };

    const stage = getStage();
    const stages = [
        { name: 'OCR', desc: 'Extracting text from documents' },
        { name: 'LLM-A', desc: 'AI analyzing medical data' },
        { name: 'LLM-B', desc: 'Validating findings' }
    ];

    return (
        <div className="w-full max-w-md mx-auto">
            {/* Pipeline Stages */}
            <div className="flex items-center justify-center gap-2 mb-4">
                {stages.map((s, idx) => (
                    <div key={s.name} className="flex items-center">
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${idx + 1 === stage
                            ? 'bg-purple-600 text-white shadow-lg scale-105'
                            : idx + 1 < stage
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-400'
                            }`}>
                            {idx + 1 < stage && <span>✓</span>}
                            {idx + 1 === stage && <span className="animate-pulse">●</span>}
                            {s.name}
                        </div>
                        {idx < stages.length - 1 && (
                            <div className={`w-4 h-0.5 mx-1 ${idx + 1 < stage ? 'bg-emerald-300' : 'bg-slate-200'}`} />
                        )}
                    </div>
                ))}
            </div>

            {/* Current Stage Description */}
            <p className="text-center text-sm text-purple-700 mb-3 animate-pulse">
                {stages[stage - 1]?.desc}...
            </p>

            {/* Progress Bar */}
            <div className="h-2 bg-purple-100 rounded-full overflow-hidden relative mb-2">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-500 to-purple-400 animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
            </div>

            {/* Time Info */}
            <div className="flex justify-between text-xs text-slate-500">
                <span>{formatTime(elapsed)} elapsed</span>
                {estimated && <span>~{formatTime(estimated)} total</span>}
            </div>

            {/* Friendly Message */}
            <p className="text-center text-xs text-slate-400 mt-3">
                This typically takes 10-15 minutes. You can safely leave this page.
            </p>
        </div>
    );
};


// Job status response interface
interface JobStatusResponse {
    jobId: string | null;
    status: 'idle' | 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'no_reports';
    generatedAt: string | null;
    startedAt: string | null;
    completedAt: string | null;
    reportCount: number;
    estimatedSeconds: number | null;
    elapsedSeconds: number | null;
    result: any | null;
    error: string | null;
}

// localStorage key for job tracking
const getJobStorageKey = (patientId: string) => `ai-analysis-job-${patientId}`;

export default function AIAnalysisPage() {
    const { hospital } = useAuth();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [loadingPatients, setLoadingPatients] = useState(true);

    // Analysis State - updated for new API
    const [status, setStatus] = useState<'idle' | 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'>('idle');
    const [jobId, setJobId] = useState<string | null>(null);
    const [resultData, setResultData] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
    const [reportCount, setReportCount] = useState(0);
    const [activeTab, setActiveTab] = useState<'formatted' | 'raw'>('formatted');
    const [serverStartTime, setServerStartTime] = useState<string | null>(null);

    useEffect(() => {
        fetchPatients();
    }, [hospital?.id]);

    // Poll for status when processing or queued
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if ((status === 'processing' || status === 'queued') && jobId) {
            interval = setInterval(() => {
                checkJobStatus(jobId);
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [status, jobId]);

    // Update elapsed time based on server startedAt
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (status === 'processing' && serverStartTime) {
            const updateElapsed = () => {
                const startDate = new Date(serverStartTime);
                const now = new Date();
                const elapsed = Math.floor((now.getTime() - startDate.getTime()) / 1000);
                setElapsedTime(Math.max(0, elapsed));
            };
            updateElapsed();
            interval = setInterval(updateElapsed, 1000);
        }
        return () => clearInterval(interval);
    }, [status, serverStartTime]);

    // Clear elapsed when not processing
    useEffect(() => {
        if (status !== 'processing' && status !== 'queued') {
            setServerStartTime(null);
        }
    }, [status]);

    const fetchPatients = async () => {
        if (!hospital?.id) return;
        setLoadingPatients(true);
        try {
            const res = await fetch(`${API_BASE}/api/patients?hospitalId=${hospital.id}&limit=100`);
            if (res.ok) {
                const data = await res.json();
                setPatients(data.patients);
            }
        } catch (err) {
            console.error('Error fetching patients:', err);
            setError('Failed to load patients');
        } finally {
            setLoadingPatients(false);
        }
    };

    const checkJobStatus = async (jId: string) => {
        try {
            const res = await fetch(`${API_BASE}/api/ai-analysis/job/${jId}`);
            if (res.ok) {
                const data: JobStatusResponse = await res.json();
                handleJobResponse(data);
            }
        } catch (err) {
            console.error('Job status check error:', err);
        }
    };

    const checkPatientStatus = async (patientId: string) => {
        try {
            const res = await fetch(`${API_BASE}/api/ai-analysis/status/${patientId}`);
            if (res.ok) {
                const data: JobStatusResponse = await res.json();
                handleJobResponse(data);
            }
        } catch (err) {
            console.error('Status check error:', err);
        }
    };

    const handleJobResponse = (data: JobStatusResponse) => {
        if (!data.jobId) {
            setStatus('idle');
            setJobId(null);
            return;
        }

        setJobId(data.jobId);
        setStatus(data.status as any);
        setReportCount(data.reportCount || 0);
        setEstimatedTime(data.estimatedSeconds);

        if (data.startedAt) {
            setServerStartTime(data.startedAt);
        }

        if (data.elapsedSeconds !== null && data.elapsedSeconds !== undefined) {
            setElapsedTime(data.elapsedSeconds);
        }

        if (data.status === 'completed' && data.result) {
            setResultData(data.result);
            // Clear from localStorage on completion
            if (selectedPatient) {
                localStorage.removeItem(getJobStorageKey(selectedPatient.id));
            }
        } else if (data.status === 'failed') {
            setError(data.error || 'Analysis failed');
            if (selectedPatient) {
                localStorage.removeItem(getJobStorageKey(selectedPatient.id));
            }
        } else if (data.status === 'cancelled') {
            if (selectedPatient) {
                localStorage.removeItem(getJobStorageKey(selectedPatient.id));
            }
        }
    };

    const handleSelectPatient = (patient: Patient) => {
        setSelectedPatient(patient);
        setResultData(null);
        setError(null);
        setStatus('idle');
        setJobId(null);
        setElapsedTime(0);
        setEstimatedTime(null);

        // Check for active job in localStorage
        const storedJobId = localStorage.getItem(getJobStorageKey(patient.id));
        if (storedJobId) {
            setJobId(storedJobId);
            checkJobStatus(storedJobId);
        } else {
            // Check with server for any active jobs
            checkPatientStatus(patient.id);
        }
    };

    const handleAnalyze = async () => {
        if (!selectedPatient) return;

        setStatus('queued');
        setError(null);
        setResultData(null);
        setElapsedTime(0);

        try {
            const res = await fetch(`${API_BASE}/api/ai-analysis/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ patientId: selectedPatient.id }),
            });

            if (res.ok) {
                const data: JobStatusResponse = await res.json();
                if (data.jobId) {
                    setJobId(data.jobId);
                    setEstimatedTime(data.estimatedSeconds);
                    setReportCount(data.reportCount || 0);
                    // Store jobId in localStorage for persistence
                    localStorage.setItem(getJobStorageKey(selectedPatient.id), data.jobId);
                }
                handleJobResponse(data);
            } else {
                const errData = await res.json();
                setError(errData.detail || errData.error || 'Failed to analyze reports');
                setStatus('idle');
            }
        } catch (err) {
            console.error('Analysis error:', err);
            setError('Failed to connect to server');
            setStatus('idle');
        }
    };

    const handleStopAnalysis = async () => {
        if (!selectedPatient) return;

        try {
            await fetch(`${API_BASE}/api/ai-analysis/cancel/${selectedPatient.id}`, {
                method: 'POST',
            });
        } catch (err) {
            console.error('Cancel error:', err);
        }

        // Clear localStorage
        localStorage.removeItem(getJobStorageKey(selectedPatient.id));
        setStatus('cancelled');
        setJobId(null);
        setElapsedTime(0);
    };

    return (
        <DashboardLayout>
            <div className="mb-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <Brain className="w-7 h-7 text-purple-500" />
                            AI Report Analysis
                        </h1>
                        <p className="text-slate-500 mt-1">Select a patient to analyze their medical reports with AI-powered extraction</p>
                    </div>
                    <AzureBadge />
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
                    <AlertTriangle className="w-5 h-5" />
                    <span>{error}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Patient Selection Panel */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-sky-500" />
                        Select Patient
                    </h2>

                    {loadingPatients ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 text-sky-500 animate-spin" />
                        </div>
                    ) : patients.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-slate-500 text-sm">No patients found</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                            {patients.map((patient) => (
                                <button
                                    key={patient.id}
                                    onClick={() => handleSelectPatient(patient)}
                                    className={`w-full text-left p-4 rounded-xl transition-all flex items-center justify-between group ${selectedPatient?.id === patient.id
                                        ? 'bg-purple-50 border-2 border-purple-300 shadow-sm'
                                        : 'bg-slate-50 hover:bg-slate-100 border-2 border-transparent'
                                        }`}
                                >
                                    <div>
                                        <p className="font-semibold text-slate-800">{patient.name}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            ID: {patient.patientId}
                                        </p>
                                    </div>
                                    <ChevronRight
                                        className={`w-5 h-5 transition-transform ${selectedPatient?.id === patient.id
                                            ? 'text-purple-500'
                                            : 'text-slate-400 group-hover:translate-x-1'
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Analysis Panel */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 h-full flex flex-col">
                        {!selectedPatient ? (
                            <div className="flex flex-col items-center justify-center text-center h-full">
                                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                                    <User className="w-10 h-10 text-slate-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-800">No Patient Selected</h3>
                                <p className="text-slate-500 mt-2 max-w-sm">
                                    Please select a patient from the list on the left to analyze their reports.
                                </p>
                            </div>
                        ) : (
                            <div className="w-full">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800">
                                            Analyze {selectedPatient.name}&apos;s Reports
                                        </h3>
                                        <p className="text-slate-500 mt-1">
                                            Process all reports with page-by-page AI analysis
                                        </p>
                                    </div>
                                    {(status === 'idle' || status === 'failed' || status === 'completed' || status === 'cancelled') && (
                                        <button
                                            onClick={handleAnalyze}
                                            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium shadow-md hover:from-purple-700 hover:to-pink-700 hover:shadow-lg transition-all flex items-center gap-2"
                                        >
                                            <Brain className="w-5 h-5" />
                                            {status === 'failed' || status === 'completed' || status === 'cancelled' ? 'Re-Analyze' : 'Start Analysis'}
                                        </button>
                                    )}
                                </div>

                                {/* Queued State */}
                                {status === 'queued' && (
                                    <div className="bg-sky-50 border border-sky-100 rounded-2xl p-8 text-center max-w-lg mx-auto">
                                        <div className="relative w-16 h-16 mx-auto mb-4">
                                            <div className="absolute inset-0 border-4 border-sky-200 rounded-full"></div>
                                            <div className="absolute inset-0 border-4 border-sky-600 rounded-full border-t-transparent animate-spin" style={{ animationDuration: '2s' }}></div>
                                        </div>
                                        <h4 className="text-lg font-semibold text-sky-900 mb-2">
                                            Analysis Queued
                                        </h4>
                                        <p className="text-sky-600 mb-4">
                                            Your analysis job is queued and will start processing shortly.
                                        </p>
                                        <div className="flex flex-wrap justify-center gap-3 text-sm text-sky-700 mb-4">
                                            <span className="px-3 py-1 bg-white rounded-full shadow-sm">
                                                {reportCount} report{reportCount !== 1 ? 's' : ''} to analyze
                                            </span>
                                            {estimatedTime && (
                                                <span className="px-3 py-1 bg-white rounded-full shadow-sm">
                                                    ETA: ~{formatTime(estimatedTime)}
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={handleStopAnalysis}
                                            className="px-5 py-2.5 bg-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-300 transition-all flex items-center gap-2 mx-auto"
                                        >
                                            <AlertTriangle className="w-4 h-4" />
                                            Cancel
                                        </button>
                                    </div>
                                )}

                                {/* Processing State */}
                                {status === 'processing' && (
                                    <div className="bg-purple-50 border border-purple-100 rounded-2xl p-8 text-center max-w-lg mx-auto">
                                        <div className="relative w-16 h-16 mx-auto mb-4">
                                            <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
                                            <div className="absolute inset-0 border-4 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
                                        </div>
                                        <h4 className="text-lg font-semibold text-purple-900 mb-2">
                                            Analyzing {reportCount} Report{reportCount !== 1 ? 's' : ''}...
                                        </h4>
                                        <p className="text-purple-600 mb-4">
                                            AI is extracting structured medical data from each page.
                                        </p>

                                        {/* Processing Indicator */}
                                        <div className="mb-6">
                                            <ProcessingIndicator elapsed={elapsedTime} estimated={estimatedTime} />
                                        </div>

                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full shadow-sm text-sm font-medium text-purple-700 mb-6">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Elapsed: {formatTime(elapsedTime)}
                                        </div>

                                        <div className="flex items-center justify-center gap-3">
                                            <button
                                                onClick={handleStopAnalysis}
                                                className="px-5 py-2.5 bg-red-100 text-red-700 rounded-xl font-medium hover:bg-red-200 transition-all flex items-center gap-2"
                                            >
                                                <AlertTriangle className="w-4 h-4" />
                                                Stop
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {status === 'failed' && (
                                    <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-lg mx-auto">
                                        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                                            <AlertTriangle className="w-8 h-8 text-red-500" />
                                        </div>
                                        <h4 className="text-lg font-semibold text-red-900 mb-2">
                                            Analysis Failed
                                        </h4>
                                        <p className="text-red-600 mb-4">
                                            {error || 'The AI analysis encountered an error.'}
                                        </p>
                                        <button
                                            onClick={handleAnalyze}
                                            className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-all flex items-center gap-2 mx-auto"
                                        >
                                            <Brain className="w-5 h-5" />
                                            Try Again
                                        </button>
                                    </div>
                                )}

                                {status === 'completed' && resultData && (
                                    <div className="mt-4 animate-in fade-in slide-in-from-bottom-4">
                                        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <CheckCircle className="w-6 h-6 text-emerald-500" />
                                                <span className="font-semibold text-emerald-800">Analysis Complete</span>
                                                <span className="ml-2 text-sm text-slate-500">
                                                    Processed {resultData.report_count} reports in {resultData.processing_time_seconds}s
                                                </span>
                                                <AzureBadge size="small" />
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={handleAnalyze}
                                                    className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium hover:bg-purple-200 transition-all flex items-center gap-2 text-sm"
                                                >
                                                    <Brain className="w-4 h-4" />
                                                    Re-Analyze
                                                </button>
                                            </div>
                                        </div>

                                        {/* Tabs */}
                                        <div className="flex items-center justify-end mb-4">
                                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                                <button
                                                    onClick={() => setActiveTab('formatted')}
                                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'formatted'
                                                        ? 'bg-white text-slate-800 shadow-sm'
                                                        : 'text-slate-500 hover:text-slate-700'
                                                        }`}
                                                >
                                                    Formatted View
                                                </button>
                                                <button
                                                    onClick={() => setActiveTab('raw')}
                                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'raw'
                                                        ? 'bg-white text-slate-800 shadow-sm'
                                                        : 'text-slate-500 hover:text-slate-700'
                                                        }`}
                                                >
                                                    JSON Data
                                                </button>
                                            </div>
                                        </div>

                                        {activeTab === 'raw' ? (
                                            <pre className="bg-slate-900 p-6 rounded-xl text-xs text-slate-300 font-mono overflow-auto max-h-[600px] border border-slate-700 shadow-inner">
                                                {JSON.stringify(resultData, null, 2)}
                                            </pre>
                                        ) : (
                                            <div className="grid gap-6">
                                                {resultData.results?.map((res: ReportResult, idx: number) => (
                                                    <ReportCard key={idx} result={res} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
