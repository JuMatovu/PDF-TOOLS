import React, { useState } from 'react';
import { DownloadButton } from '../common/DownloadButton';
import { CheckCircle2, RotateCcw, Eye, FileText, Trash2, ExternalLink } from 'lucide-react';
import { formatFileSize } from '../../lib/icons';

interface ResultPanelProps {
  fileName: string;
  fileSize?: number;
  originalSize?: number;
  downloadUrl?: string;
  previewUrl?: string;
  onDownload?: () => void;
  onReset?: () => void;
  onDelete?: () => void;
  isDeleted?: boolean;
  toolName?: string;
  className?: string;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({
  fileName,
  fileSize = 1845000,
  originalSize,
  downloadUrl,
  previewUrl,
  onDownload,
  onReset,
  onDelete,
  isDeleted = false,
  toolName = 'Processed File',
  className = '',
}) => {
  const [showPreview, setShowPreview] = useState(false);

  const savingsPercent =
    originalSize && fileSize && originalSize > fileSize
      ? Math.round(((originalSize - fileSize) / originalSize) * 100)
      : null;

  return (
    <div
      id="pdftool-result-panel"
      className={`p-6 sm:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-emerald-200/90 dark:border-emerald-800/80 shadow-sm space-y-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
              Your PDF is ready!
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Successfully generated with {toolName}
            </p>
          </div>
        </div>

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-xs font-semibold text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Process another</span>
          </button>
        )}
      </div>

      {/* Main File Details & Download Block */}
      <div className="p-4 sm:p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/70 dark:border-neutral-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
            PDF
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-neutral-900 dark:text-white text-sm truncate max-w-[220px] sm:max-w-xs md:max-w-sm">
              {fileName}
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-2 mt-0.5">
              <span>{formatFileSize(fileSize)}</span>
              {savingsPercent && (
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 font-semibold text-[11px]">
                  Reduced by {savingsPercent}%
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {previewUrl && !isDeleted && (
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>{showPreview ? 'Hide Preview' : 'Preview'}</span>
            </button>
          )}

          {isDeleted ? (
            <div className="px-4 py-2.5 rounded-xl bg-neutral-200 text-neutral-600 text-xs font-semibold">
              Deleted from Server
            </div>
          ) : (
            <DownloadButton
              label="Download PDF"
              subLabel={formatFileSize(fileSize)}
              variant="yellow"
              href={downloadUrl}
              download={fileName}
              onClick={onDownload}
            />
          )}
        </div>
      </div>

      {/* Embedded Preview if toggled */}
      {showPreview && previewUrl && !isDeleted && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-500 px-1">
            <span className="font-semibold">Document Preview</span>
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-emerald-600 hover:underline"
            >
              <span>Open in new tab</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="w-full h-96 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-neutral-100 dark:bg-neutral-950">
            <iframe
              src={previewUrl}
              title="PDF Preview"
              className="w-full h-full"
            />
          </div>
        </div>
      )}

      {/* Footer with Privacy Notice and Immediate Delete Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-500">
        <div className="flex items-center gap-2">
          <span>🔒 Files are automatically deleted from the server in 30 minutes.</span>
        </div>

        {onDelete && !isDeleted && (
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 text-neutral-400 hover:text-red-600 transition-colors cursor-pointer text-xs"
            title="Delete files from server immediately"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete now</span>
          </button>
        )}
      </div>
    </div>
  );
};
