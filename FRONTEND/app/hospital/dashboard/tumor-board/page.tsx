'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import DashboardLayout from '@/app/components/dashboard/DashboardLayout';
import { useAuth } from '@/app/components/auth/AuthProvider';
import { CaseSidebar } from '@/app/components/tumor-board/CaseSidebar';
import { CaseDetail } from '@/app/components/tumor-board/CaseDetail';
import { DeleteConfirmModal, SaveToast } from '@/app/components/tumor-board/StateComponents';
import { Brain, Shield, Cloud } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Azure AI Agent Service Badge Component
const AzureAgentBadge = ({ size = 'default' }: { size?: 'small' | 'default' }) => {
    const isSmall = size === 'small';
    return (
        <div className={`inline-flex items-center gap-1.5 ${isSmall ? 'px-2 py-0.5' : 'px-3 py-1.5'} bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-full`}>
            <Cloud className={`${isSmall ? 'w-3 h-3' : 'w-4 h-4'} text-blue-600`} />
            <span className={`font-medium ${isSmall ? 'text-[10px]' : 'text-xs'} text-blue-700`}>
                Azure AI Agent Service
            </span>
            <Shield className={`${isSmall ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-blue-500`} />
        </div>
    );
};

export default function TumorBoardPage() {
    const { hospital } = useAuth();

    // --- State ---
    const [cases, setCases] = useState<any[]>([]);
    const [patients, setPatients] = useState<any[]>([]);
    const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
    const [aiView, setAiView] = useState<any | null>(null);

    const [loading, setLoading] = useState(true);
    const [processingStatus, setProcessingStatus] = useState<any | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const [deleteModal, setDeleteModal] = useState<{ show: boolean; caseId: string } | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [showSaveToast, setShowSaveToast] = useState(false);

    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    // --- Derived State ---
    const selectedCase = cases.find(c => c.id === selectedCaseId);

    // --- Data Fetching ---

    const fetchCases = useCallback(async () => {
        if (!hospital?.id) return;
        try {
            const res = await fetch(`${API_BASE}/api/tumor-board?hospitalId=${hospital.id}`);
            if (res.ok) {
                const data = await res.json();
                setCases(data);
            }
        } catch (err) {
            console.error('Error fetching cases:', err);
        } finally {
            setLoading(false);
        }
    }, [hospital?.id]);

    const fetchPatients = useCallback(async () => {
        if (!hospital?.id) return;
        try {
            const res = await fetch(`${API_BASE}/api/patients?hospitalId=${hospital.id}&limit=100`);
            if (res.ok) {
                const data = await res.json();
                setPatients(data.patients);
            }
        } catch (err) {
            console.error('Error fetching patients:', err);
        }
    }, [hospital?.id]);

    const fetchAIView = useCallback(async (caseId: string) => {
        if (!hospital?.id) return;
        try {
            const res = await fetch(`${API_BASE}/api/tumor-board-ai/${caseId}/ai-view?hospitalId=${hospital.id}`);
            if (res.ok) {
                const data = await res.json();
                if (data.tumor_board_view) {
                    setAiView(data.tumor_board_view);
                }
            }
        } catch (err) {
            console.error('Error fetching AI view:', err);
        }
    }, [hospital?.id]);

    // --- Initial Load ---
    useEffect(() => {
        fetchCases();
        fetchPatients();
    }, [fetchCases, fetchPatients]);

    // --- Case Selection Logic ---
    useEffect(() => {
        if (selectedCaseId && selectedCase) {
            // Reset AI view when switching cases
            setAiView(null);
            setProcessingStatus(null);
            stopPolling();

            if (selectedCase.status === 'completed') {
                fetchAIView(selectedCaseId);
            } else if (selectedCase.status === 'processing' || selectedCase.status === 'queued') {
                startPolling(selectedCaseId);
            }
        }
    }, [selectedCaseId, selectedCase?.status]); // Re-run if status changes (e.g. after poll completion)

    // --- Polling Logic ---
    const fetchCaseStatus = async (caseId: string) => {
        if (!hospital?.id) return null;
        try {
            const res = await fetch(`${API_BASE}/api/tumor-board/${caseId}/status?hospitalId=${hospital.id}`);
            if (res.ok) return await res.json();
        } catch (err) {
            console.error('Status fetch error:', err);
        }
        return null;
    };

    const startPolling = useCallback((caseId: string) => {
        if (pollingRef.current) clearInterval(pollingRef.current);
        setIsProcessing(true);

        pollingRef.current = setInterval(async () => {
            const status = await fetchCaseStatus(caseId);
            if (status) {
                setProcessingStatus({
                    percent: status.progressPercent || 0,
                    message: status.progressMessage,
                    errorMessage: status.errorMessage
                });

                if (status.status === 'completed' || status.status === 'failed') {
                    stopPolling();
                    fetchCases(); // Refresh list to update status
                    if (status.status === 'completed') {
                        fetchAIView(caseId);
                    }
                }
            }
        }, 3000);
    }, [hospital?.id, fetchCases, fetchAIView]);

    const stopPolling = () => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
        setIsProcessing(false);
        setProcessingStatus(null);
    };

    // Cleanup
    useEffect(() => {
        return () => stopPolling();
    }, []);

    // --- Actions ---

    const handleCreateCase = async (patientId: string) => {
        if (!hospital?.id) return;
        try {
            const res = await fetch(`${API_BASE}/api/tumor-board?hospitalId=${hospital.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ patientId })
            });

            if (res.ok) {
                const newCase = await res.json();
                await fetchCases();
                setSelectedCaseId(newCase.id);
            }
        } catch (err) {
            console.error('Create failed', err);
        }
    };

    const handleGenerateAI = async (caseId: string) => {
        if (!hospital?.id) return;
        try {
            const res = await fetch(`${API_BASE}/api/tumor-board-ai/${caseId}/generate?hospitalId=${hospital.id}`, {
                method: 'POST'
            });

            if (res.ok) {
                const data = await res.json();
                // Update local status immediately
                setCases(prev => prev.map(c => c.id === caseId ? { ...c, status: 'queued' } : c));
                startPolling(caseId);
            }
        } catch (err) {
            console.error('Generate failed', err);
        }
    };

    const handleSave = async (updatedData: any) => {
        if (!selectedCaseId || !hospital?.id) return;
        try {
            const res = await fetch(`${API_BASE}/api/tumor-board/${selectedCaseId}?hospitalId=${hospital.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });

            if (res.ok) {
                setShowSaveToast(true);
                setTimeout(() => setShowSaveToast(false), 3000);
                fetchCases(); // Refresh info
            }
        } catch (err) {
            console.error('Save failed', err);
        }
    };

    const handleDelete = async () => {
        if (!deleteModal || !hospital?.id) return;
        setDeleting(true);
        try {
            const res = await fetch(`${API_BASE}/api/tumor-board/${deleteModal.caseId}?hospitalId=${hospital.id}`, {
                method: 'DELETE'
            });

            if (res.ok || res.status === 404) {
                setCases(prev => prev.filter(c => c.id !== deleteModal.caseId));
                if (selectedCaseId === deleteModal.caseId) {
                    setSelectedCaseId(null);
                }
            }
        } catch (err) {
            console.error('Delete failed', err);
        } finally {
            setDeleting(false);
            setDeleteModal(null);
        }
    };

    return (
        <DashboardLayout>
            <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
                {/* 1. Sidebar */}
                <CaseSidebar
                    cases={cases}
                    patients={patients}
                    selectedCaseId={selectedCaseId}
                    onSelectCase={setSelectedCaseId}
                    onCreateCase={handleCreateCase}
                    loading={loading}
                />

                {/* 2. Main Content Area */}
                <div className="flex-1 h-full overflow-hidden relative">
                    {selectedCase ? (
                        <CaseDetail
                            caseData={selectedCase}
                            aiView={aiView}
                            processingStatus={processingStatus}
                            isProcessing={isProcessing}
                            onGenerateAI={handleGenerateAI}
                            onSave={handleSave}
                            onDelete={(id) => setDeleteModal({ show: true, caseId: id })}
                            onRefresh={() => {
                                fetchCases();
                                if (selectedCaseId) fetchAIView(selectedCaseId);
                            }}
                            onCancelProcessing={async () => {
                                if (selectedCaseId && hospital?.id) {
                                    try {
                                        await fetch(`${API_BASE}/api/tumor-board/${selectedCaseId}/cancel?hospitalId=${hospital.id}`, {
                                            method: 'POST'
                                        });
                                        stopPolling();
                                        fetchCases();
                                    } catch (err) {
                                        console.error('Cancel failed', err);
                                    }
                                }
                            }}
                            hospitalId={hospital?.id}
                        />
                    ) : (
                        // Empty State (No selection)
                        <div className="h-full flex flex-col items-center justify-center p-10 text-slate-400">
                            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                                <Brain className="w-12 h-12 opacity-20" />
                            </div>
                            <h2 className="text-xl font-semibold text-slate-600">No Patient Selected</h2>
                            <p className="max-w-xs text-center mt-2 text-sm">
                                Select a patient from the sidebar to view their tumor board case or start a new analysis.
                            </p>
                            <div className="mt-6">
                                <AzureAgentBadge />
                            </div>
                            <p className="text-xs text-slate-400 mt-2 max-w-sm text-center">
                                Agent orchestration powered by Azure AI. Medical reasoning performed locally.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Global Modals */}
            <DeleteConfirmModal
                isOpen={!!deleteModal}
                onClose={() => setDeleteModal(null)}
                onConfirm={handleDelete}
                patientName={cases.find(c => c.id === deleteModal?.caseId)?.patient?.name || 'Unknown'}
                status={cases.find(c => c.id === deleteModal?.caseId)?.status || 'draft'}
                isDeleting={deleting}
            />

            <SaveToast show={showSaveToast} />
        </DashboardLayout>
    );
}