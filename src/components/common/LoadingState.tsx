import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  title?: string;
  description?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  title = 'Processing Document...',
  description = 'Applying changes securely in your browser. This only takes a few moments.',
  className = '',
}) => {
  return (
    <div
      id="pdftool-loading-state"
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
};
