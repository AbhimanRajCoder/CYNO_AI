'use client';

import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/app/components/dashboard/DashboardLayout';
import { useAuth } from '@/app/components/auth/AuthProvider';
import {
    Upload,
    FileText,
    Image,
    FileType,
    X,
    CheckCircle,
    AlertCircle,
    ChevronDown,
    User,
    FolderOpen
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface UploadedFile {
    id: string;
    name: string;
    size: number;
    type: string;
    category: string;
    status: 'uploading' | 'uploaded' | 'failed';
    progress: number;
    file: File;
}

interface Patient {
    id: string;
    patientId: string;
    name: string;
    age?: number;
    gender?: string;
    cancerType?: string;
    status?: string;
}

interface PatientReport {
    id: string;
    fileName: string;
    fileType: string;
    category: string;
    status: string;
    uploadedAt: string;
}

const CATEGORIES = [
    { id: 'imaging', label: 'Imaging (CT/MRI/PET)', icon: Image },
    { id: 'pathology', label: 'Pathology', icon: FileText },
    { id: 'lab', label: 'Lab Reports', icon: FileType },
    { id: 'clinical', label: 'Clinical Notes', icon: FileText },
];

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getFileType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (['pdf'].includes(ext)) return 'PDF';
    if (['dcm', 'dicom'].includes(ext)) return 'DICOM';
    if (['jpg', 'jpeg', 'png'].includes(ext)) return 'Image';
    return 'Document';
}

function getCategoryLabel(category: string): string {
    const cat = CATEGORIES.find(c => c.id === category);
    return cat ? cat.label : category;
}

function getCategoryBadgeColor(category: string): string {
    switch (category) {
        case 'imaging':
            return 'bg-purple-100 text-purple-700';
        case 'pathology':
            return 'bg-rose-100 text-rose-700';
        case 'lab':
            return 'bg-amber-100 text-amber-700';
        case 'clinical':
            return 'bg-sky-100 text-sky-700';
        default:
            return 'bg-slate-100 text-slate-700';
    }
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

export default function UploadPage() {
    const { hospital } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [selectedCategory, setSelectedCategory] = useState('imaging');
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Patient selection state
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [patientReports, setPatientReports] = useState<PatientReport[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [loadingPatients, setLoadingPatients] = useState(false);
    const [loadingReports, setLoadingReports] = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch patients on mount
    useEffect(() => {
        if (hospital?.id) {
            fetchPatients();
        }
    }, [hospital?.id]);

    // Fetch patient reports when selected patient changes
    useEffect(() => {
        if (selectedPatient) {
            fetchPatientReports(selectedPatient.id);
        } else {
            setPatientReports([]);
        }
    }, [selectedPatient]);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchPatients = async () => {
        setLoadingPatients(true);
        try {
            const res = await fetch(`${API_BASE}/api/patients?hospitalId=${hospital?.id}`);
            if (res.ok) {
                const data = await res.json();
                setPatients(data.patients || []);
            }
        } catch (error) {
            console.error('Failed to fetch patients:', error);
        } finally {
            setLoadingPatients(false);
        }
    };

    const fetchPatientReports = async (patientId: string) => {
        setLoadingReports(true);
        try {
            const res = await fetch(`${API_BASE}/api/patients/${patientId}`);
            if (res.ok) {
                const data = await res.json();
                setPatientReports(data.reports || []);
            }
        } catch (error) {
            console.error('Failed to fetch patient reports:', error);
        } finally {
            setLoadingReports(false);
        }
    };

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.patientId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFiles = Array.from(e.dataTransfer.files);
        processFiles(droppedFiles);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            processFiles(Array.from(e.target.files));
        }
    };

    const processFiles = (newFiles: File[]) => {
        const uploadedFiles: UploadedFile[] = newFiles.map((file, index) => ({
            id: `file-${Date.now()}-${index}`,
            name: file.name,
            size: file.size,
            type: getFileType(file.name),
            category: selectedCategory,
            status: 'uploading' as const,
            progress: 0,
            file: file,
        }));
        setFiles((prev) => [...uploadedFiles, ...prev]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleRemoveFile = (id: string) => {
        setFiles((prev) => prev.filter((f) => f.id !== id));
    };

    const handleUpload = async () => {
        if (!selectedPatient) {
            setMessage({ type: 'error', text: 'Please select a patient' });
            return;
        }

        const filesToUpload = files.filter((f) => f.status !== 'uploaded' && f.file);
        if (filesToUpload.length === 0) {
            setMessage({ type: 'error', text: 'No files to upload' });
            return;
        }

        setIsUploading(true);
        setMessage(null);

        const formData = new FormData();
        formData.append('patientId', selectedPatient.patientId);
        formData.append('patientName', selectedPatient.name);
        formData.append('category', selectedCategory);
        formData.append('hospitalId', hospital?.id || '');

        filesToUpload.forEach((f) => {
            formData.append('files', f.file);
        });

        setFiles((prev) =>
            prev.map((f) =>
                filesToUpload.find((u) => u.id === f.id)
                    ? { ...f, status: 'uploading' as const, progress: 50 }
                    : f
            )
        );

        try {
            const res = await fetch(`${API_BASE}/api/reports/upload`, {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                setFiles((prev) =>
                    prev.map((f) =>
                        filesToUpload.find((u) => u.id === f.id)
                            ? { ...f, status: 'uploaded' as const, progress: 100 }
                            : f
                    )
                );
                setMessage({ type: 'success', text: `${data.uploaded} file(s) uploaded successfully!` });
                // Refresh patient reports
                if (selectedPatient) {
                    fetchPatientReports(selectedPatient.id);
                }
            } else {
                const error = await res.json();
                throw new Error(error.detail || 'Upload failed');
            }
        } catch (error) {
            setFiles((prev) =>
                prev.map((f) =>
                    filesToUpload.find((u) => u.id === f.id)
                        ? { ...f, status: 'failed' as const }
                        : f
                )
            );
            setMessage({
                type: 'error',
                text: error instanceof Error ? error.message : 'Upload failed'
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Upload className="w-7 h-7 text-sky-500" />
                    Upload Reports
                </h1>
                <p className="text-slate-500 mt-1">Upload patient medical files and reports</p>
            </div>

            {/* Message Toast */}
            {message && (
                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${message.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                    }`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="font-medium">{message.text}</span>
                    <button onClick={() => setMessage(null)} className="ml-auto">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Upload Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-sky-500" />
                            Upload Patient Reports
                        </h2>

                        {/* Patient Dropdown */}
                        <div className="mb-6" ref={dropdownRef}>
                            <label className="block text-sm font-medium text-slate-600 mb-2">
                                Select Patient *
                            </label>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all bg-white text-left flex items-center justify-between"
                                >
                                    {selectedPatient ? (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center">
                                                <User className="w-4 h-4 text-sky-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-800">{selectedPatient.name}</p>
                                                <p className="text-xs text-slate-500">{selectedPatient.patientId}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-slate-400">Choose a patient...</span>
                                    )}
                                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isDropdownOpen && (
                                    <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-64 overflow-hidden">
                                        {/* Search Input */}
                                        <div className="p-3 border-b border-slate-100">
                                            <input
                                                type="text"
                                                placeholder="Search patients..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                                            />
                                        </div>

                                        {/* Patient List */}
                                        <div className="max-h-48 overflow-y-auto">
                                            {loadingPatients ? (
                                                <div className="p-4 text-center text-slate-500">
                                                    <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                                    Loading patients...
                                                </div>
                                            ) : filteredPatients.length === 0 ? (
                                                <div className="p-4 text-center text-slate-500">
                                                    No patients found
                                                </div>
                                            ) : (
                                                filteredPatients.map((patient) => (
                                                    <button
                                                        key={patient.id}
                                                        onClick={() => {
                                                            setSelectedPatient(patient);
                                                            setIsDropdownOpen(false);
                                                            setSearchQuery('');
                                                        }}
                                                        className={`w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 transition-colors ${selectedPatient?.id === patient.id ? 'bg-sky-50' : ''
                                                            }`}
                                                    >
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                                            <User className="w-4 h-4 text-slate-600" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-medium text-slate-800">{patient.name}</p>
                                                            <p className="text-xs text-slate-500">{patient.patientId} {patient.cancerType && `• ${patient.cancerType}`}</p>
                                                        </div>
                                                        {selectedPatient?.id === patient.id && (
                                                            <CheckCircle className="w-4 h-4 text-sky-500" />
                                                        )}
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Category Pills */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-600 mb-3">Report Category</label>
                            <div className="flex flex-wrap gap-2">
                                {CATEGORIES.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${selectedCategory === cat.id
                                            ? 'bg-sky-500 text-white shadow-md'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        <cat.icon className="w-4 h-4" />
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Drag & Drop Zone */}
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${isDragging
                                ? 'border-sky-500 bg-sky-50'
                                : 'border-slate-300 hover:border-sky-400 hover:bg-slate-50'
                                }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept=".pdf,.dcm,.dicom,.jpg,.jpeg,.png"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-all ${isDragging ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-400'
                                }`}>
                                <Upload className="w-8 h-8" />
                            </div>
                            <p className="text-slate-700 font-medium mb-1">
                                {isDragging ? 'Drop files here' : 'Drag & drop reports here or click to upload'}
                            </p>
                            <p className="text-sm text-slate-500">Supported formats: PDF, DICOM, JPG, PNG</p>
                        </div>

                        {/* Upload Button */}
                        <button
                            onClick={handleUpload}
                            disabled={isUploading || files.length === 0 || !selectedPatient}
                            className={`w-full mt-6 py-3.5 rounded-xl font-semibold text-base transition-all shadow-lg ${isUploading || files.length === 0 || !selectedPatient
                                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-sky-500 to-teal-500 text-white hover:from-sky-600 hover:to-teal-600'
                                }`}
                        >
                            {isUploading ? 'Uploading...' : `Upload ${files.length} Report${files.length !== 1 ? 's' : ''}`}
                        </button>
                    </div>

                    {/* File Queue */}
                    {files.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                    <Upload className="w-5 h-5 text-sky-500" />
                                    Upload Queue
                                </h3>
                                <span className="text-sm text-slate-500">
                                    {files.filter((f) => f.status === 'uploaded').length}/{files.length} completed
                                </span>
                            </div>
                            <div className="space-y-2">
                                {files.map((file) => (
                                    <div key={file.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${file.status === 'uploaded' ? 'bg-emerald-100 text-emerald-600' :
                                                file.status === 'failed' ? 'bg-red-100 text-red-600' :
                                                    'bg-sky-100 text-sky-600'
                                                }`}>
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-700 text-sm">{file.name}</p>
                                                <p className="text-xs text-slate-500">{formatFileSize(file.size)} • {file.type}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {file.status === 'uploaded' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                                            {file.status === 'failed' && <AlertCircle className="w-5 h-5 text-red-500" />}
                                            {file.status === 'uploading' && (
                                                <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                                            )}
                                            <button
                                                onClick={() => handleRemoveFile(file.id)}
                                                className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
                                            >
                                                <X className="w-4 h-4 text-slate-400" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar - Patient Reports */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <FolderOpen className="w-5 h-5 text-sky-500" />
                            Patient Reports
                        </h3>

                        {!selectedPatient ? (
                            <div className="text-center py-8">
                                <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500 text-sm">Select a patient to view their reports</p>
                            </div>
                        ) : loadingReports ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : patientReports.length === 0 ? (
                            <div className="text-center py-8">
                                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500 text-sm">No reports uploaded yet</p>
                                <p className="text-xs text-slate-400 mt-1">Upload files to see them here</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {patientReports.map((report) => (
                                    <div key={report.id} className="p-3 bg-slate-50 rounded-xl">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-slate-700 text-sm truncate">
                                                    {report.fileName}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    {report.fileType} • {formatDate(report.uploadedAt)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-2">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryBadgeColor(report.category)}`}>
                                                {getCategoryLabel(report.category)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
