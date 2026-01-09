'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/dashboard/DashboardLayout';
import { useAuth } from '@/app/components/auth/AuthProvider';
import {
    FileText,
    User,
    Search,
    Download,
    Eye,
    Loader2,
    ChevronRight,
    Filter,
    Calendar,
    FileImage,
    FileType,
    X,
    AlertCircle,
    FolderOpen,
    Clock,
    HardDrive,
    Trash2,
    File
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Patient {
    id: string;
    patientId: string;
    name: string;
    age: number | null;
    gender: string | null;
    cancerType: string | null;
    status: string;
}

interface Report {
    id: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    fileType: string;
    category: string;
    categoryLabel: string;
    status: string;
    uploadedAt: string;
}

export default function AIReportsPage() {
    const { hospital } = useAuth();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [reports, setReports] = useState<Report[]>([]);
    const [loadingPatients, setLoadingPatients] = useState(true);
    const [loadingReports, setLoadingReports] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [viewingReport, setViewingReport] = useState<Report | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [analysisResults, setAnalysisResults] = useState<any | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisTime, setAnalysisTime] = useState<number | null>(null);

    const handleRunAnalysis = async () => {
        if (!selectedPatient) return;
        setIsAnalyzing(true);
        setAnalysisResults(null);
        setAnalysisTime(null);
        setError(null);

        try {
            const res = await fetch(`${API_BASE}/api/ai-analysis/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ patientId: selectedPatient.id }),
            });

            if (res.ok) {
                const data = await res.json();
                setAnalysisResults(data.results);
                setAnalysisTime(data.processing_time_seconds);
            } else {
                throw new Error('Analysis failed');
            }
        } catch (err) {
            console.error('Analysis error:', err);
            setError('Failed to run AI analysis');
        } finally {
            setIsAnalyzing(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, [hospital?.id]);

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

    const fetchReports = async (patientDbId: string) => {
        setLoadingReports(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/api/reports/patient/${patientDbId}`);
            if (res.ok) {
                const data = await res.json();
                setReports(data);
            } else {
                setReports([]);
            }
        } catch (err) {
            console.error('Error fetching reports:', err);
            setError('Failed to load reports');
            setReports([]);
        } finally {
            setLoadingReports(false);
        }
    };

    const handleSelectPatient = (patient: Patient) => {
        setSelectedPatient(patient);
        setReports([]);
        setCategoryFilter('all');
        fetchReports(patient.id);
    };

    const handleDownload = async (report: Report) => {
        try {
            const response = await fetch(`${API_BASE}/api/reports/download/${report.id}`);
            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = report.fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error('Download error:', err);
            setError('Failed to download file');
        }
    };

    const handleDelete = async (report: Report) => {
        if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/api/reports/${report.id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setReports(reports.filter(r => r.id !== report.id));
                if (viewingReport?.id === report.id) {
                    setViewingReport(null);
                }
            } else {
                throw new Error('Failed to delete report');
            }
        } catch (err) {
            console.error('Delete error:', err);
            setError('Failed to delete report');
        }
    };

    const handleViewReport = (report: Report) => {
        setViewingReport(report);
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateStr: string): string => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'imaging':
                return <FileImage className="w-5 h-5 text-blue-500" />;
            case 'pathology':
                return <FileType className="w-5 h-5 text-purple-500" />;
            case 'lab':
                return <FileText className="w-5 h-5 text-emerald-500" />;
            case 'clinical':
                return <FileText className="w-5 h-5 text-amber-500" />;
            default:
                return <FileText className="w-5 h-5 text-slate-500" />;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'imaging':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'pathology':
                return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'lab':
                return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'clinical':
                return 'bg-amber-100 text-amber-700 border-amber-200';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    // Filter patients by search
    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.patientId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Filter reports by category
    const filteredReports = categoryFilter === 'all'
        ? reports
        : reports.filter(r => r.category === categoryFilter);

    const categories = ['all', 'imaging', 'pathology', 'lab', 'clinical'];

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="w-7 h-7 text-sky-500" />
                        Patient Reports
                    </h1>
                    <p className="text-slate-500 mt-1">Select a patient to view and download their reports</p>
                </div>
                {selectedPatient && (
                    <button
                        onClick={handleRunAnalysis}
                        disabled={isAnalyzing || reports.length === 0}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all shadow-sm ${isAnalyzing || reports.length === 0
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md'
                            }`}
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Analyzing Reports...
                            </>
                        ) : (
                            <>
                                <User className="w-5 h-5" />
                                Run AI Analysis for All Reports
                            </>
                        )}
                    </button>
                )}
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                    <button
                        onClick={() => setError(null)}
                        className="ml-auto text-red-500 hover:text-red-700"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Analysis Results Section */}
            {analysisResults && (
                <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
                                <User className="w-6 h-6 text-indigo-600" />
                                AI Analysis Results
                            </h2>
                            {analysisTime !== null && (
                                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-indigo-100 shadow-sm">
                                    <Clock className="w-4 h-4 text-indigo-500" />
                                    <span className="text-sm font-medium text-indigo-700">
                                        Processed in {analysisTime}s
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="grid gap-4">
                            {analysisResults.map((result: any, index: number) => (
                                <div key={index} className="bg-white rounded-xl shadow-sm border border-indigo-100 overflow-hidden">
                                    <div className="p-4 bg-slate-50 border-b border-indigo-100 flex items-center justify-between">
                                        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-slate-500" />
                                            {result.file_name}
                                        </h3>
                                        {result.status === 'success' ? (
                                            <span className="px-2.5 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full border border-emerald-200">
                                                Analyzed Successfully
                                            </span>
                                        ) : (
                                            <span className="px-2.5 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full border border-amber-200">
                                                {result.status}
                                            </span>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        {result.status === 'success' && result.analysis ? (
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Findings</p>
                                                    <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
                                                        {result.analysis.findings && Array.isArray(result.analysis.findings)
                                                            ? result.analysis.findings.map((finding: string, i: number) => (
                                                                <li key={i}>{finding}</li>
                                                            ))
                                                            : <li className="text-slate-400 italic">No specific findings listed</li>
                                                        }
                                                    </ul>
                                                </div>
                                                <div className="space-y-4">
                                                    <div>
                                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Diagnosis</p>
                                                        <p className="text-sm font-medium text-slate-800">
                                                            {result.analysis.diagnosis || <span className="text-slate-400 italic">Not mentioned</span>}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Summary</p>
                                                        <p className="text-sm text-slate-600 leading-relaxed">
                                                            {result.analysis.raw_text_summary || <span className="text-slate-400 italic">No summary available</span>}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Full JSON Toggle could be added here if needed, but keeping it clean for "professional look" */}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-slate-500 italic">
                                                {result.error || result.message || "Analysis data unavailable"}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Patient Selection Panel */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-sky-500" />
                        Select Patient
                    </h2>

                    {/* Search */}
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        />
                    </div>

                    {loadingPatients ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 text-sky-500 animate-spin" />
                        </div>
                    ) : filteredPatients.length === 0 ? (
                        <div className="text-center py-12">
                            <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 text-sm">No patients found</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                            {filteredPatients.map((patient) => (
                                <button
                                    key={patient.id}
                                    onClick={() => handleSelectPatient(patient)}
                                    className={`w-full text-left p-4 rounded-xl transition-all flex items-center justify-between group ${selectedPatient?.id === patient.id
                                        ? 'bg-gradient-to-r from-sky-50 to-blue-50 border-2 border-sky-300 shadow-sm'
                                        : 'bg-slate-50 hover:bg-slate-100 border-2 border-transparent'
                                        }`}
                                >
                                    <div>
                                        <p className="font-semibold text-slate-800">{patient.name}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            ID: {patient.patientId}
                                        </p>
                                        {patient.cancerType && (
                                            <span className="inline-block mt-1.5 px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                                                {patient.cancerType}
                                            </span>
                                        )}
                                    </div>
                                    <ChevronRight className={`w-5 h-5 transition-transform ${selectedPatient?.id === patient.id
                                        ? 'text-sky-500'
                                        : 'text-slate-400 group-hover:translate-x-1'
                                        }`} />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Reports Panel */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        {!selectedPatient ? (
                            <div className="text-center py-16">
                                <FolderOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500 text-lg font-medium">Select a patient</p>
                                <p className="text-slate-400 text-sm mt-1">Choose a patient from the list to view their reports</p>
                            </div>
                        ) : (
                            <>
                                {/* Patient Info Header */}
                                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                                    <div>
                                        <h2 className="text-lg font-semibold text-slate-800">
                                            {selectedPatient.name}&apos;s Reports
                                        </h2>
                                        <p className="text-sm text-slate-500">
                                            Patient ID: {selectedPatient.patientId}
                                            {selectedPatient.age && ` • Age: ${selectedPatient.age}`}
                                            {selectedPatient.gender && ` • ${selectedPatient.gender}`}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-sky-600">{reports.length}</p>
                                        <p className="text-xs text-slate-500">Total Reports</p>
                                    </div>
                                </div>

                                {/* Category Filter */}
                                <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                                    <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                    {categories.map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => setCategoryFilter(cat)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${categoryFilter === cat
                                                ? 'bg-sky-500 text-white shadow-md'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                }`}
                                        >
                                            {cat === 'all' ? 'All Reports' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                                        </button>
                                    ))}
                                </div>

                                {loadingReports ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
                                    </div>
                                ) : filteredReports.length === 0 ? (
                                    <div className="text-center py-12">
                                        <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                        <p className="text-slate-500">No reports found</p>
                                        <p className="text-sm text-slate-400 mt-1">
                                            {categoryFilter !== 'all'
                                                ? 'Try selecting a different category'
                                                : 'Upload reports for this patient first'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {filteredReports.map((report) => (
                                            <div
                                                key={report.id}
                                                className="group p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 hover:border-slate-300 transition-all"
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                                        <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                                                            {getCategoryIcon(report.category)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-slate-800 truncate">
                                                                {report.fileName}
                                                            </p>
                                                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                                                <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${getCategoryColor(report.category)}`}>
                                                                    {report.categoryLabel}
                                                                </span>
                                                                <span className="flex items-center gap-1 text-xs text-slate-500">
                                                                    <HardDrive className="w-3 h-3" />
                                                                    {formatFileSize(report.fileSize)}
                                                                </span>
                                                                <span className="flex items-center gap-1 text-xs text-slate-500">
                                                                    <Clock className="w-3 h-3" />
                                                                    {formatDate(report.uploadedAt)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {report.fileType === 'PDF' && (
                                                            <button
                                                                onClick={() => handleViewReport(report)}
                                                                className="p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                                title="View PDF"
                                                            >
                                                                <File className="w-5 h-5" />
                                                            </button>
                                                        )}
                                                        {report.fileType !== 'PDF' && (
                                                            <button
                                                                onClick={() => handleViewReport(report)}
                                                                className="p-2 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all"
                                                                title="View Report"
                                                            >
                                                                <Eye className="w-5 h-5" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDownload(report)}
                                                            className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                            title="Download Report"
                                                        >
                                                            <Download className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(report)}
                                                            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                            title="Delete Report"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Report Viewer Modal */}
            {viewingReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-200">
                            <div className="flex items-center gap-3">
                                {getCategoryIcon(viewingReport.category)}
                                <div>
                                    <h3 className="font-semibold text-slate-800">{viewingReport.fileName}</h3>
                                    <p className="text-sm text-slate-500">{formatDate(viewingReport.uploadedAt)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleDownload(viewingReport)}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                    Download
                                </button>
                                <button
                                    onClick={() => setViewingReport(null)}
                                    className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-auto p-6 bg-slate-50">
                            {viewingReport.fileType === 'PDF' ? (
                                <iframe
                                    src={`${API_BASE}/api/reports/download/${viewingReport.id}`}
                                    className="w-full h-[600px] rounded-lg border border-slate-200"
                                    title="PDF Viewer"
                                />
                            ) : viewingReport.fileType === 'Image' ? (
                                <div className="flex items-center justify-center">
                                    <img
                                        src={`${API_BASE}/api/reports/download/${viewingReport.id}`}
                                        alt={viewingReport.fileName}
                                        className="max-w-full max-h-[600px] rounded-lg shadow-lg"
                                    />
                                </div>
                            ) : (
                                <div className="text-center py-16">
                                    <FileText className="w-20 h-20 text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-600 font-medium">Preview not available</p>
                                    <p className="text-sm text-slate-500 mt-1">
                                        This file type ({viewingReport.fileType}) cannot be previewed. Please download to view.
                                    </p>
                                    <button
                                        onClick={() => handleDownload(viewingReport)}
                                        className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-sky-500 text-white rounded-xl hover:bg-sky-600 transition-colors font-medium"
                                    >
                                        <Download className="w-5 h-5" />
                                        Download File
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-slate-200 bg-white">
                            <div className="flex items-center justify-between text-sm text-slate-500">
                                <div className="flex items-center gap-4">
                                    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${getCategoryColor(viewingReport.category)}`}>
                                        {viewingReport.categoryLabel}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <HardDrive className="w-3.5 h-3.5" />
                                        {formatFileSize(viewingReport.fileSize)}
                                    </span>
                                </div>
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" />
                                    Uploaded on {formatDate(viewingReport.uploadedAt)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
