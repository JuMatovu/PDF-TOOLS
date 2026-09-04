import React from 'react';
import { ProgressBar } from '../common/ProgressBar';
import { UploadedFileItem } from '../../types';
import { formatFileSize } from '../../lib/icons';
import { RefreshCw, X, ShieldCheck, FileText, Image as ImageIcon } from 'lucide-react';

interface ProcessingPanelProps {
  progress: number;
  statusText?: string;
  files: UploadedFileItem[];
  toolName?: string;
  onCancel?: () => void;
  className?: string;
}

export const ProcessingPanel: React.FC<ProcessingPanelProps> = ({
  progress,
  statusText = 'Processing your document...',
  files,
  toolName = 'Tool',
  onCancel,
  className = '',
}) => {
  return (
    <div
      id="pdftool-processing-panel"
      className={`p-6 sm:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-6 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
              Converting with {toolName}...
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Please keep this window open while processing
            </p>
          </div>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <ProgressBar
        progress={progress}
        statusText={statusText}
        showPercent={true}
      />

      {/* Processed Files Preview Card */}
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Source Files ({files.length})
        </div>
        <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
          {files.map((f, i) => (
            <div
              key={f.id || i}
              className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/80 text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <ImageIcon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="font-semibold text-neutral-900 dark:text-white truncate max-w-xs">
                  {f.name}
                </span>
              </div>
              <span className="text-neutral-400 font-mono flex-shrink-0">
                {formatFileSize(f.size)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy guarantee */}
      <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/80 flex items-center gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
        <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <span>Your uploaded files are strictly encrypted and automatically deleted after processing.</span>
      </div>
    </div>
  );
};
