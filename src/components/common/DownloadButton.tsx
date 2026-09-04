import React from 'react';
import { Download, ChevronDown, Check } from 'lucide-react';

interface DownloadButtonProps {
  label?: string;
  subLabel?: string;
  variant?: 'yellow' | 'green' | 'outline';
  onClick?: () => void;
  href?: string;
  download?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({
  label = 'Download',
  subLabel,
  variant = 'yellow',
  onClick,
  href,
  download,
  disabled = false,
  className = '',
  id = 'pdftool-download-btn',
}) => {
  const variantStyles = {
    yellow:
      'bg-amber-400 hover:bg-amber-500 text-neutral-950 font-semibold shadow-sm hover:shadow active:scale-[0.99] border border-amber-500/40',
    green:
      'bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm hover:shadow active:scale-[0.99]',
    outline:
      'border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-medium',
  };

  const sharedClasses = `inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${className}`;

  if (href) {
    return (
      <a
        id={id}
        href={href}
        download={download}
        onClick={onClick}
        className={sharedClasses}
      >
        <Download className="h-5 w-5 flex-shrink-0" />
        <div className="flex flex-col items-start text-left">
          <span className="leading-tight">{label}</span>
          {subLabel && <span className="text-xs opacity-80 font-normal">{subLabel}</span>}
        </div>
      </a>
    );
  }

  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={sharedClasses}
    >
      <Download className="h-5 w-5 flex-shrink-0" />
      <div className="flex flex-col items-start text-left">
        <span className="leading-tight">{label}</span>
        {subLabel && <span className="text-xs opacity-80 font-normal">{subLabel}</span>}
      </div>
    </button>
  );
};
