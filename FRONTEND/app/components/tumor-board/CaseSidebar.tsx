import React, { useState } from 'react';
import {
    Search,
    Plus,
    ChevronRight,
    User,
    Clock,
    CheckCircle,
    AlertTriangle,
    XCircle,
    FileText,
    Loader2
} from 'lucide-react';
import { StatusBadge } from './StateComponents';

interface Patient {
    id: string;
    patientId: string;
    name: string;
}

interface TumorBoardCase {
    id: string;
    patientId: string;
    status: string;
    updatedAt: string;
    patient?: {
        name: string;
        patientId: string;
        cancerType: string | null;
    };
}

interface CaseSidebarProps {
    cases: TumorBoardCase[];
    patients: Patient[];
    selectedCaseId: string | null;
    onSelectCase: (caseId: string) => void;
    onCreateCase: (patientId: string) => void;
    loading: boolean;
}

export const CaseSidebar = ({
    cases,
    patients,
    selectedCaseId,
    onSelectCase,
    onCreateCase,
    loading
}: CaseSidebarProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [selectedPatientId, setSelectedPatientId] = useState('');

    const filteredCases = cases.filter(c =>
        c.patient?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.patient?.patientId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCreate = () => {
        if (!selectedPatientId) return;
        onCreateCase(selectedPatientId);
        setIsCreating(false);
        setSelectedPatientId('');
    };

    return (
        <div className="w-80 border-r border-slate-200 h-[calc(100vh-64px)] bg-white flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-800">Tumor Board</h2>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                        title="New Case"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search patients..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {isCreating && (
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 mb-2 animate-in fade-in slide-in-from-top-2">
                        <p className="text-xs font-semibold text-blue-700 mb-2">Select Patient</p>
                        <select
                            className="w-full p-2 text-sm border border-blue-200 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={selectedPatientId}
                            onChange={(e) => setSelectedPatientId(e.target.value)}
                        >
                            <option value="">Choose patient...</option>
                            {patients.map(p => (
                                <option key={p.id} value={p.patientId}>
                                    {p.name} ({p.patientId})
                                </option>
                            ))}
                        </select>
                        <div className="flex gap-2">
                            <button
                                onClick={handleCreate}
                                disabled={!selectedPatientId}
                                className="flex-1 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                Create
                            </button>
                            <button
                                onClick={() => setIsCreating(false)}
                                className="flex-1 py-1.5 bg-white text-slate-600 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mb-2" />
                        <span className="text-xs">Loading cases...</span>
                    </div>
                ) : filteredCases.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                        <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No cases found</p>
                    </div>
                ) : (
                    filteredCases.map(caseItem => (
                        <div
                            key={caseItem.id}
                            onClick={() => onSelectCase(caseItem.id)}
                            className={`
                                group p-3 rounded-xl border cursor-pointer transition-all duration-200
                                ${selectedCaseId === caseItem.id
                                    ? 'bg-blue-50 border-blue-200 shadow-sm'
                                    : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
                                }
                            `}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className={`
                                        w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                                        ${selectedCaseId === caseItem.id ? 'bg-blue-200 text-blue-700' : 'bg-slate-100 text-slate-500'}
                                    `}>
                                        {caseItem.patient?.name.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-800 text-sm">{caseItem.patient?.name}</p>
                                        <p className="text-xs text-slate-500">{caseItem.patient?.patientId}</p>
                                    </div>
                                </div>
                                {selectedCaseId === caseItem.id && (
                                    <ChevronRight className="w-4 h-4 text-blue-500" />
                                )}
                            </div>

                            <div className="flex items-center justify-between pl-1">
                                <StatusBadge status={caseItem.status} />
                                <span className="text-[10px] text-slate-400">
                                    {new Date(caseItem.updatedAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
