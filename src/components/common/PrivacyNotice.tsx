import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { SITE_CONFIG } from '../../data/features';

interface PrivacyNoticeProps {
  className?: string;
  compact?: boolean;
}

export const PrivacyNotice: React.FC<PrivacyNoticeProps> = ({ className = '', compact = false }) => {
  return (
    <div
      id="pdftool-privacy-notice"
      className={`rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-emerald-900 transition-all dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200 ${className}`}
    >
      <div className="flex items-start sm:items-center gap-3">
        <div className="flex-shrink-0 mt-0.5 sm:mt-0 p-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="text-sm">
          <span className="font-semibold">Privacy First Guarantee: </span>
          <span>
            Your files are completely secure and will be deleted automatically from memory and servers after {SITE_CONFIG.retentionHours} hour.
          </span>
          {!compact && (
            <span className="hidden md:inline text-emerald-800 dark:text-emerald-300/80">
              {' '}No logs or document contents are ever stored, tracked, or shared.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
