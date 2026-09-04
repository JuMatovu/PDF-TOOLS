import React, { useEffect, useState } from 'react';
import { UploadedFileItem } from '../../types';
import { formatFileSize } from '../../lib/icons';
import { Trash2, File, CheckCircle2, RefreshCw, AlertCircle, Image as ImageIcon } from 'lucide-react';

interface FileItemProps {
  item: UploadedFileItem;
  onRemove: (id: string) => void;
  index?: number;
  className?: string;
}

export const FileItem: React.FC<FileItemProps> = ({
  item,
  onRemove,
  index,
  className = '',
}) => {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);

  useEffect(() => {
    if (item.file && item.file.type.startsWith('image/')) {
      const url = URL.createObjectURL(item.file);
      setThumbUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [item.file]);

  const isImage = item.file?.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(item.name);
  const isPdf = item.name.toLowerCase().endsWith('.pdf');

  return (
    <div
      id={`file-item-${item.id}`}
      className={`group flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 transition-all hover:border-emerald-300 dark:hover:border-neutral-700 shadow-xs ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0 pr-3">
        {/* Thumbnail / Icon */}
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0 border border-neutral-200/60 dark:border-neutral-700/60">
          {thumbUrl ? (
            <img
              src={thumbUrl}
              alt={item.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : isPdf ? (
            <div className="w-full h-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold text-xs flex items-center justify-center">
              PDF
            </div>
          ) : isImage ? (
            <ImageIcon className="w-5 h-5 text-emerald-600" />
          ) : (
            <File className="w-5 h-5 text-neutral-500" />
          )}
        </div>

        {/* Info */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {typeof index === 'number' && (
              <span className="text-[10px] font-mono font-bold text-neutral-400">
                #{index + 1}
              </span>
            )}
            <span className="text-sm font-semibold text-neutral-900 dark:text-white truncate max-w-[200px] sm:max-w-xs md:max-w-md">
              {item.name}
            </span>
          </div>

          <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-2 mt-0.5">
            <span>{formatFileSize(item.size)}</span>
            {item.status === 'ready' && (
              <span className="text-neutral-400">• Ready</span>
            )}
            {item.status === 'processing' && (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                <RefreshCw className="w-3 h-3 animate-spin" /> Processing
              </span>
            )}
            {item.status === 'completed' && (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3 h-3" /> Ready
              </span>
            )}
            {item.status === 'error' && (
              <span className="text-red-600 dark:text-red-400 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3 h-3" /> {item.error || 'Error'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action */}
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        className="p-2 rounded-xl text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer flex-shrink-0"
        title="Remove file"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};
