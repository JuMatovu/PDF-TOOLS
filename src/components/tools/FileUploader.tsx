import React from 'react';
import { UploadedFileItem } from '../../types';
import { DropZone } from './DropZone';
import { FileList } from './FileList';
import { Plus } from 'lucide-react';

interface FileUploaderProps {
  files: UploadedFileItem[];
  onFilesAdded: (files: File[]) => void;
  onFileRemoved: (id: string) => void;
  onClearFiles?: () => void;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
  acceptedFormats?: string[];
  maxFileSizeMB?: number;
  multiple?: boolean;
  toolName?: string;
  className?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  files,
  onFilesAdded,
  onFileRemoved,
  onClearFiles,
  onMoveUp,
  onMoveDown,
  acceptedFormats = ['.pdf'],
  maxFileSizeMB = 100,
  multiple = true,
  toolName = 'files',
  className = '',
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {files.length === 0 ? (
        <DropZone
          onFilesSelected={onFilesAdded}
          acceptedFormats={acceptedFormats}
          maxFileSizeMB={maxFileSizeMB}
          multiple={multiple}
          toolName={toolName}
        />
      ) : (
        <div className="space-y-4">
          <FileList
            files={files}
            onRemove={onFileRemoved}
            onClearAll={onClearFiles}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
          />

          {multiple && (
            <div className="flex justify-center">
              <label
                htmlFor="add-more-files-input"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-emerald-500/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/60 dark:hover:bg-emerald-950/40 text-xs font-semibold cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add more files</span>
                <input
                  id="add-more-files-input"
                  type="file"
                  multiple
                  accept={acceptedFormats.join(',')}
                  onChange={(e) => {
                    if (e.target.files) {
                      onFilesAdded(Array.from(e.target.files));
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
