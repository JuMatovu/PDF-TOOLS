import React from 'react';

interface ProgressBarProps {
  progress: number;
  statusText?: string;
  showPercent?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  statusText,
  showPercent = true,
  className = '',
}) => {
  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <div className={`w-full ${className}`}>
      {(statusText || showPercent) && (
        <div className="flex justify-between items-center text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1.5">
          <span>{statusText || 'Processing...'}</span>
          {showPercent && <span className="tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">{clampedProgress}%</span>}
        </div>
      )}
      <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2.5 overflow-hidden p-0.5 border border-neutral-200/80 dark:border-neutral-700">
        <div
          className="bg-emerald-500 h-full rounded-full transition-all duration-300 ease-out shadow-sm"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};
