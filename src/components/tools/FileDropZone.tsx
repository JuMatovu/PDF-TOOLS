import React, { useRef, useState } from 'react';
import { UploadCloud, ChevronDown, FolderOpen } from 'lucide-react';

export interface FileDropZoneProps {
  onFilesSelected: (files: File[]) => void;
  acceptedFormats?: string[];
  maxFileSizeMB?: number;
  multiple?: boolean;
  toolName?: string;
  className?: string;
}

export const FileDropZone: React.FC<FileDropZoneProps> = ({
  onFilesSelected,
  acceptedFormats = ['.pdf'],
  maxFileSizeMB = 50,
  multiple = true,
  toolName = 'files',
  className = '',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      onFilesSelected(filesArray);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      onFilesSelected(filesArray);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerPicker = () => {
    fileInputRef.current?.click();
  };

  const formatsDisplay = acceptedFormats.map((f) => f.toUpperCase().replace('.', '')).join(', ');

  return (
    <div
      id="pdftool-dropzone"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={triggerPicker}
      className={`relative group flex flex-col items-center justify-center p-8 sm:p-14 rounded-3xl border-2 border-dashed transition-all duration-200 cursor-pointer text-center select-none ${
        isDragOver
          ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 scale-[1.008]'
          : 'border-amber-300/80 hover:border-emerald-500 bg-white dark:bg-neutral-900 shadow-sm hover:shadow-md'
      } ${className}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={acceptedFormats.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
        id="hidden-file-input"
      />

      {/* Upload icon badge */}
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-600 group-hover:bg-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 mb-4 transition-transform group-hover:scale-105">
        <UploadCloud className="w-8 h-8 sm:w-10 sm:h-10" />
      </div>

      <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white mb-1">
        Drag & drop your {toolName.includes('PDF') ? 'PDF' : 'files'} here
      </h3>

      <div className="text-xs uppercase font-semibold tracking-wider text-neutral-400 my-2">or</div>

      {/* Choose Files Button */}
      <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition-all duration-150 active:scale-[0.99] mb-4">
        <FolderOpen className="w-4 h-4" />
        <span>Choose Files</span>
        <ChevronDown className="w-4 h-4 opacity-75" />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
        <span>Max file size: {maxFileSizeMB}MB</span>
        <span>•</span>
        <span>Supports: {formatsDisplay || 'Any'}</span>
      </div>
    </div>
  );
};

export const DropZone = FileDropZone;
