import React from 'react';
import { UploadedFileItem } from '../../types';
import { FileItem } from './FileItem';

interface FileListProps {
  files: UploadedFileItem[];
  onRemove: (id: string) => void;
  onClearAll?: () => void;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
  className?: string;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  onRemove,
  onClearAll,
  onMoveUp,
  onMoveDown,
  className = '',
}) => {
  if (files.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          Selected Files ({files.length})
        </span>
        {onClearAll && files.length > 1 && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 cursor-pointer"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {files.map((item, index) => (
          <FileItem
            key={item.id}
            item={item}
            index={index}
            total={files.length}
            onRemove={onRemove}
            onMoveUp={onMoveUp ? () => onMoveUp(index) : undefined}
            onMoveDown={onMoveDown ? () => onMoveDown(index) : undefined}
          />
        ))}
      </div>
    </div>
  );
};
