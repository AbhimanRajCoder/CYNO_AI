'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Brain, Play, Sparkles, Cloud, Shield, CheckCircle2 } from 'lucide-react';
import { CaseHeader } from './CaseHeader';
import { ProcessingView } from './StateComponents';
import { TumorBoardAIView } from './DetailTabs';
import { UnifiedView } from './UnifiedView';
import { generateTumorBoardPDF } from './PDFExport';

// Azure AI Agent Service Badge
const AzureOrchestrationBadge = ({ orchestration }: { orchestration?: any }) => {
    if (!orchestration?.azure_enabled) return null;

    return (
        <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl mb-4">
            <div className="flex items-center gap-1.5">
                <Cloud className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-sm text-blue-700">Azure AI Agent Service</span>
                <Shield className="w-3 h-3 text-blue-500" />
            </div>
            <div className="h-4 w-px bg-blue-200" />
            <div className="flex items-center gap-2 text-xs text-blue-600">
                {orchestration.azure_agents_completed?.length > 0 && (
                    <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        {orchestration.azure_agents_completed.length} agents completed
                    </span>
                )}
                <span className="text-blue-400">|</span>
                <span className="italic">Orchestration only • Medical reasoning local</span>
            </div>
        </div>
    );
};

interface CaseDetailProps {
    caseData: any;
    aiView: TumorBoardAIView | null;
    processingStatus: any;
    isProcessing: boolean;
    onGenerateAI: (caseId: string) => void;
    onSave: (data: any) => void;
    onDelete: (caseId: string) => void;
    onRefresh: () => void;
    onCancelProcessing?: () => void;
    hospitalId?: string;
}

export const CaseDetail = ({
    caseData,
    aiView,
    processingStatus,
    isProcessing,
    onGenerateAI,
    onSave,
    onDelete,
    onRefresh,
    onCancelProcessing,
    hospitalId
}: CaseDetailProps) => {

    // Notes state
    const [notes, setNotes] = useState({
        radiology: caseData?.radiologyNotes || '',
        pathology: caseData?.pathologyNotes || '',
        clinical: caseData?.oncologyNotes || '',
        finalDecision: caseData?.finalDecision || ''
    });

    // Extract multi_agent_view from aiView if it exists (it's now embedded in the saved JSON)
    const multiAgentView = useMemo(() => {
        if (aiView && (aiView as any).multi_agent_view) {
            return (aiView as any).multi_agent_view;
        }
        return null;
    }, [aiView]);

    // Sync notes when caseData changes
    useEffect(() => {
        if (caseData) {
            setNotes({
                radiology: caseData.radiologyNotes || '',
                pathology: caseData.pathologyNotes || '',
                clinical: caseData.oncologyNotes || '',
                finalDecision: caseData.finalDecision || ''
            });
        }
    }, [caseData]);

    // Handle notes change
    const handleNotesChange = (field: string, value: string) => {
        setNotes(prev => ({ ...prev, [field]: value }));
    };

    // Handle save
    const handleSave = () => {
        onSave({
            ...caseData,
            radiologyNotes: notes.radiology,
            pathologyNotes: notes.pathology,
            oncologyNotes: notes.clinical,
            finalDecision: notes.finalDecision
        });
    };

    // Handle PDF download
    const handleDownload = () => {
        if (caseData && (aiView || multiAgentView)) {
            const dataForPDF = {
                ...caseData,
                ...notes
            };
            generateTumorBoardPDF(dataForPDF, aiView, multiAgentView);
        }
    };

    // --- RENDER STATES ---

    // 1. Processing View
    if (processingStatus || isProcessing) {
        return (
            <div className="h-full flex flex-col p-8 items-center justify-center bg-slate-50/50">
                <ProcessingView
                    patientName={caseData.patient?.name || 'Patient'}
                    percent={processingStatus?.percent || 0}
                    message={processingStatus?.message}
                    startedAt={processingStatus?.startedAt}
                    onCancel={onCancelProcessing}
                />
            </div>
        );
    }

    // 2. Empty/Draft View (No AI Data yet)
    if (!aiView) {
        return (
            <div className="h-full flex flex-col">
                <CaseHeader
                    patientName={caseData.patient?.name || 'Patient'}
                    patientId={caseData.patient?.patientId || 'N/A'}
                    status={caseData.status}
                    lastUpdated={caseData.updatedAt}
                    onDownload={() => { }}
                    onDelete={() => onDelete(caseData.id)}
                    onRefresh={onRefresh}
                />

                <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-200/50">
                        <Brain className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-800 mb-3">Ready to Analyze</h2>
                    <p className="text-slate-500 max-w-lg mb-8 text-lg">
                        Generate a comprehensive AI tumor board analysis using specialized agents for radiology, pathology, clinical data, and treatment recommendations.
                    </p>
                    <button
                        onClick={() => onGenerateAI(caseData.id)}
                        className="px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-2xl shadow-xl shadow-indigo-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center gap-3 text-lg"
                    >
                        <Sparkles className="w-6 h-6" />
                        Generate AI Analysis
                    </button>
                    <p className="mt-4 text-sm text-slate-400">Powered by specialized AI agents • ~5-10 minutes</p>
                </div>
            </div>
        );
    }

    // 3. Full Data View with UnifiedView (if multi-agent available) or basic view
    return (
        <div className="h-full flex flex-col bg-slate-50/30 overflow-y-auto">
            <CaseHeader
                patientName={caseData.patient?.name || 'Patient'}
                patientId={caseData.patient?.patientId || 'N/A'}
                status={caseData.status}
                lastUpdated={caseData.updatedAt}
                onDownload={handleDownload}
                onDelete={() => onDelete(caseData.id)}
                onRefresh={onRefresh}
            />

            <div className="p-8 max-w-6xl mx-auto w-full">
                {/* Azure AI Agent Service Orchestration Badge */}
                <AzureOrchestrationBadge orchestration={(multiAgentView as any)?.orchestration} />

                {multiAgentView ? (
                    /* Use UnifiedView when multi-agent data is available */
                    <UnifiedView
                        view={multiAgentView}
                        patientData={caseData.patient}
                        notes={notes}
                        onNotesChange={handleNotesChange}
                    />
                ) : (
                    /* Fallback: show basic summary if no multi-agent data */
                    <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
                        <div className="flex items-center gap-2 text-indigo-600 mb-4">
                            <Brain className="w-5 h-5" />
                            <h2 className="font-bold">AI Analysis Summary</h2>
                        </div>
                        <p className="text-slate-700">
                            {aiView.tumor_board_consensus?.summary || aiView.case_summary?.primary_diagnosis || 'Analysis data available'}
                        </p>
                        <p className="text-sm text-slate-500 mt-4">
                            Multi-agent detailed view not available for this case. Re-generate analysis for enhanced view.
                        </p>
                    </div>
                )}

                {/* Save Actions */}
                <div className="sticky bottom-4 z-10 mt-6">
                    <div className="bg-white/90 backdrop-blur-md border border-slate-200 p-4 rounded-2xl shadow-xl flex items-center justify-between">
                        <p className="text-sm text-slate-500">
                            {Object.values(notes).some(n => n) ? '✓ Notes added' : 'Add notes before saving'}
                        </p>
                        <button
                            onClick={handleSave}
                            className="px-8 py-3 bg-gradient-to-r from-slate-800 to-slate-900 text-white font-medium rounded-xl hover:shadow-lg transition-all"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
