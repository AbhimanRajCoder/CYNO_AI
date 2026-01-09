import React from 'react';
import { FileText, Image, FileType, X } from 'lucide-react';

interface FileListItemProps {
    id: string;
    name: string;
    type: string;
    size: number;
    onRemove: (id: string) => void;
}

export default function FileListItem({ id, name, type, size, onRemove }: FileListItemProps) {
    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getFileIcon = () => {
        switch (type) {
            case 'Image':
            case 'DICOM':
                return Image;
            case 'PDF':
                return FileText;
            default:
                return FileType;
        }
    };

    const getTypeBadgeColor = () => {
        switch (type) {
            case 'PDF':
                return 'bg-red-100 text-red-700';
            case 'DICOM':
                return 'bg-purple-100 text-purple-700';
            case 'Image':
                return 'bg-blue-100 text-blue-700';
            default:
                return 'bg-slate-100 text-slate-700';
        }
    };

    const FileIcon = getFileIcon();

    return (
        <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all group">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <FileIcon className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                    <p className="text-sm font-medium text-slate-700 truncate max-w-[180px]">
                        {name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTypeBadgeColor()}`}>
                            {type}
                        </span>
                        <span className="text-xs text-slate-500">
                            {formatFileSize(size)}
                        </span>
                    </div>
                </div>
            </div>
            <button
                onClick={() => onRemove(id)}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}
