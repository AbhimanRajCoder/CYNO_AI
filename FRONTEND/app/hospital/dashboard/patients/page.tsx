'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/dashboard/DashboardLayout';
import { useAuth } from '@/app/components/auth/AuthProvider';
import { useSearchParams } from 'next/navigation';
import {
    Users,
    Plus,
    Search,
    Filter,
    X,
    Edit2,
    Trash2,
    Eye,
    AlertCircle,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    FileText,
    Brain
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
    createdAt: string;
    updatedAt: string;
}

interface PatientDetail extends Patient {
    reports: Array<{
        id: string;
        fileName: string;
        category: string;
        status: string;
        uploadedAt: string;
    }>;
    aiReports: Array<{
        id: string;
        status: string;
        riskScore: number | null;
        generatedAt: string;
    }>;
}

const statusColors: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    discharged: 'bg-slate-100 text-slate-700 border-slate-200',
    critical: 'bg-red-100 text-red-700 border-red-200',
    under_review: 'bg-amber-100 text-amber-700 border-amber-200',
};

const cancerTypes = ['lung', 'breast', 'blood', 'colon', 'prostate', 'skin', 'brain', 'liver', 'other'];
const genderOptions = ['male', 'female', 'other'];
const statusOptions = ['active', 'discharged', 'critical', 'under_review'];

export default function PatientsPage() {
    const { hospital } = useAuth();
    const searchParams = useSearchParams();
    const initialSearch = searchParams.get('search') || '';

    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [statusFilter, setStatusFilter] = useState('');
    const [cancerTypeFilter, setCancerTypeFilter] = useState('');

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<PatientDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        patientId: '',
        name: '',
        age: '',
        gender: '',
        cancerType: '',
        status: 'active'
    });
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const limit = 10;

    useEffect(() => {
        fetchPatients();
    }, [hospital?.id, page, statusFilter, cancerTypeFilter]);

    const fetchPatients = async () => {
        if (!hospital?.id) return;

        setLoading(true);
        try {
            let url = `${API_BASE}/api/patients?hospitalId=${hospital.id}&skip=${page * limit}&limit=${limit}`;
            if (statusFilter) url += `&status=${statusFilter}`;
            if (cancerTypeFilter) url += `&cancerType=${cancerTypeFilter}`;
            if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setPatients(data.patients);
                setTotal(data.total);
            }
        } catch (err) {
            console.error('Error fetching patients:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(0);
        fetchPatients();
    };

    const handleAddPatient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!hospital?.id) return;

        setFormError('');
        setFormSuccess('');
        setSubmitting(true);

        try {
            const res = await fetch(`${API_BASE}/api/patients?hospitalId=${hospital.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientId: formData.patientId,
                    name: formData.name,
                    age: formData.age ? parseInt(formData.age) : null,
                    gender: formData.gender || null,
                    cancerType: formData.cancerType || null,
                    status: formData.status
                })
            });

            if (res.ok) {
                setFormSuccess('Patient added successfully!');
                setFormData({ patientId: '', name: '', age: '', gender: '', cancerType: '', status: 'active' });
                fetchPatients();
                setTimeout(() => {
                    setShowAddModal(false);
                    setFormSuccess('');
                }, 1500);
            } else {
                const error = await res.json();
                setFormError(error.detail || 'Failed to add patient');
            }
        } catch (err) {
            setFormError('Failed to connect to server');
        } finally {
            setSubmitting(false);
        }
    };

    const handleViewPatient = async (patientId: string) => {
        setDetailLoading(true);
        setShowDetailModal(true);

        try {
            const res = await fetch(`${API_BASE}/api/patients/${patientId}`);
            if (res.ok) {
                const data = await res.json();
                setSelectedPatient(data);
            }
        } catch (err) {
            console.error('Error fetching patient details:', err);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleDeletePatient = async (patientId: string) => {
        if (!confirm('Are you sure you want to delete this patient? This will also delete all associated reports and AI analyses.')) return;

        try {
            const res = await fetch(`${API_BASE}/api/patients/${patientId}`, { method: 'DELETE' });
            if (res.ok || res.status === 204) {
                fetchPatients();
            } else {
                const error = await res.json().catch(() => ({ detail: 'Failed to delete patient' }));
                alert(error.detail || 'Failed to delete patient');
            }
        } catch (err) {
            console.error('Error deleting patient:', err);
            alert('Failed to connect to server. Please try again.');
        }
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Users className="w-7 h-7 text-sky-500" />
                        Patient Management
                    </h1>
                    <p className="text-slate-500 mt-1">View and manage patient records</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-500 to-teal-500 text-white rounded-xl font-medium hover:from-sky-600 hover:to-teal-600 transition-all shadow-lg shadow-sky-500/25"
                >
                    <Plus className="w-5 h-5" />
                    Add Patient
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    <form onSubmit={handleSearch} className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by name or patient ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                        </div>
                    </form>
                    <div className="flex gap-3">
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                            className="px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                        >
                            <option value="">All Status</option>
                            {statusOptions.map(s => (
                                <option key={s} value={s}>{s.replace('_', ' ')}</option>
                            ))}
                        </select>
                        <select
                            value={cancerTypeFilter}
                            onChange={(e) => { setCancerTypeFilter(e.target.value); setPage(0); }}
                            className="px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                        >
                            <option value="">All Cancer Types</option>
                            {cancerTypes.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Patient Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : patients.length === 0 ? (
                    <div className="text-center py-16">
                        <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-700">No patients found</h3>
                        <p className="text-slate-500 mt-1">Add your first patient to get started</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Patient ID</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Name</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Cancer Type</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Status</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Last Updated</th>
                                        <th className="text-right px-6 py-4 text-sm font-semibold text-slate-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {patients.map((patient) => (
                                        <tr key={patient.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-sm text-slate-700">{patient.patientId}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-medium text-slate-800">{patient.name}</span>
                                                {patient.age && (
                                                    <span className="text-sm text-slate-500 ml-2">({patient.age}y)</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-slate-600 capitalize">
                                                    {patient.cancerType || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full border ${statusColors[patient.status] || statusColors.active}`}>
                                                    {patient.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-slate-500">
                                                    {new Date(patient.updatedAt).toLocaleDateString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleViewPatient(patient.id)}
                                                        className="p-2 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePatient(patient.id)}
                                                        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
                                <p className="text-sm text-slate-500">
                                    Showing {page * limit + 1} to {Math.min((page + 1) * limit, total)} of {total} patients
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPage(Math.max(0, page - 1))}
                                        disabled={page === 0}
                                        className="p-2 rounded-lg border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="text-sm text-slate-600">
                                        Page {page + 1} of {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                                        disabled={page >= totalPages - 1}
                                        className="p-2 rounded-lg border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Add Patient Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between p-6 border-b border-slate-200">
                            <h2 className="text-xl font-semibold text-slate-800">Add New Patient</h2>
                            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        <form onSubmit={handleAddPatient} className="p-6 space-y-4">
                            {formError && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                                    <AlertCircle className="w-4 h-4" />
                                    {formError}
                                </div>
                            )}
                            {formSuccess && (
                                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-700 text-sm">
                                    <CheckCircle className="w-4 h-4" />
                                    {formSuccess}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Patient ID *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.patientId}
                                    onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                                    placeholder="e.g., PT-2024-001"
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Patient full name"
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
                                    <input
                                        type="number"
                                        value={formData.age}
                                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                        placeholder="Age"
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                                    <select
                                        value={formData.gender}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                                    >
                                        <option value="">Select</option>
                                        {genderOptions.map(g => (
                                            <option key={g} value={g}>{g}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Cancer Type</label>
                                <select
                                    value={formData.cancerType}
                                    onChange={(e) => setFormData({ ...formData, cancerType: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                                >
                                    <option value="">Select cancer type</option>
                                    {cancerTypes.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                                >
                                    {statusOptions.map(s => (
                                        <option key={s} value={s}>{s.replace('_', ' ')}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-3 bg-gradient-to-r from-sky-500 to-teal-500 text-white rounded-xl font-semibold hover:from-sky-600 hover:to-teal-600 transition-all disabled:opacity-50"
                            >
                                {submitting ? 'Adding...' : 'Add Patient'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Patient Detail Modal */}
            {showDetailModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-slate-200">
                            <h2 className="text-xl font-semibold text-slate-800">Patient Details</h2>
                            <button onClick={() => { setShowDetailModal(false); setSelectedPatient(null); }} className="p-2 hover:bg-slate-100 rounded-lg">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                            {detailLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : selectedPatient ? (
                                <div className="space-y-6">
                                    {/* Patient Info */}
                                    <div className="bg-slate-50 rounded-xl p-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-slate-500">Patient ID</p>
                                                <p className="font-mono font-medium text-slate-800">{selectedPatient.patientId}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-500">Name</p>
                                                <p className="font-medium text-slate-800">{selectedPatient.name}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-500">Age / Gender</p>
                                                <p className="text-slate-800">
                                                    {selectedPatient.age || '-'} / {selectedPatient.gender || '-'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-500">Cancer Type</p>
                                                <p className="text-slate-800 capitalize">{selectedPatient.cancerType || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-500">Status</p>
                                                <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full border ${statusColors[selectedPatient.status]}`}>
                                                    {selectedPatient.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Reports */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-sky-500" />
                                            Reports ({selectedPatient.reports?.length || 0})
                                        </h3>
                                        {selectedPatient.reports?.length > 0 ? (
                                            <div className="space-y-2">
                                                {selectedPatient.reports.map(r => (
                                                    <div key={r.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                        <div>
                                                            <p className="font-medium text-slate-700">{r.fileName}</p>
                                                            <p className="text-sm text-slate-500 capitalize">{r.category}</p>
                                                        </div>
                                                        <span className="text-xs text-slate-400">
                                                            {new Date(r.uploadedAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-slate-500 text-sm">No reports uploaded</p>
                                        )}
                                    </div>

                                    {/* AI Reports */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                            <Brain className="w-5 h-5 text-purple-500" />
                                            AI Reports ({selectedPatient.aiReports?.length || 0})
                                        </h3>
                                        {selectedPatient.aiReports?.length > 0 ? (
                                            <div className="space-y-2">
                                                {selectedPatient.aiReports.map(a => (
                                                    <div key={a.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                        <div>
                                                            <p className="font-medium text-slate-700">AI Analysis</p>
                                                            <p className="text-sm text-slate-500">
                                                                Risk Score: {a.riskScore || '-'}/10 • Status: {a.status}
                                                            </p>
                                                        </div>
                                                        <span className="text-xs text-slate-400">
                                                            {new Date(a.generatedAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-slate-500 text-sm">No AI reports generated</p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-slate-500 text-center py-8">Failed to load patient details</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
