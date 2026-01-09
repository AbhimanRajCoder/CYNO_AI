"use client";

import React, { useState, useRef } from 'react';
import { Upload, FileText, Image, FileType } from 'lucide-react';

export interface UploadedFile {
    id: string;
    name: string;
    size: number;
    type: string;
    category: string;
    status: 'uploading' | 'uploaded' | 'failed';
    progress: number;
    file: File; // Include actual File object
}

interface FileUploadZoneProps {
    onFilesSelected: (files: UploadedFile[]) => void;
    selectedCategory: string;
    onCategoryChange: (category: string) => void;
    patientId: string;
    onPatientIdChange: (id: string) => void;
}

const CATEGORIES = [
    { id: 'imaging', label: 'Imaging (CT/MRI/X-ray)', icon: Image },
    { id: 'pathology', label: 'Pathology', icon: FileText },
    { id: 'lab', label: 'Lab Reports', icon: FileType },
    { id: 'clinical', label: 'Clinical Notes', icon: FileText },
];

export default function FileUploadZone({
    onFilesSelected,
    selectedCategory,
    onCategoryChange,
    patientId,
    onPatientIdChange,
}: FileUploadZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        const files = Array.from(e.dataTransfer.files);
        processFiles(files);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            processFiles(files);
        }
    };

    const processFiles = (files: File[]) => {
        const uploadedFiles: UploadedFile[] = files.map((file, index) => ({
            id: `file-${Date.now()}-${index}`,
            name: file.name,
            size: file.size,
            type: getFileType(file.name),
            category: selectedCategory,
            status: 'uploading' as const,
            progress: 0,
            file: file, // Pass actual File object
        }));
        onFilesSelected(uploadedFiles);

        // Reset input to allow selecting same files again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const getFileType = (filename: string): string => {
        const ext = filename.split('.').pop()?.toLowerCase() || '';
        if (['pdf'].includes(ext)) return 'PDF';
        if (['dcm', 'dicom'].includes(ext)) return 'DICOM';
        if (['jpg', 'jpeg', 'png'].includes(ext)) return 'Image';
        return 'Document';
    };

    return (
        <>
            <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-500" />
                Upload Patient Reports
            </h2>

            {/* Category Pills */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-slate-600 mb-3">
                    Report Category
                </label>
                <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => onCategoryChange(cat.id)}
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

            {/* Patient ID Input */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-slate-600 mb-2">
                    Patient ID
                </label>
                <input
                    type="text"
                    value={patientId}
                    onChange={(e) => onPatientIdChange(e.target.value)}
                    placeholder="Enter patient ID (e.g., PT-2024-001)"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all placeholder:text-slate-400"
                />
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
                <p className="text-sm text-slate-500">
                    Supported formats: PDF, DICOM, JPG, PNG
                </p>
            </div>
        </>
    );
}
