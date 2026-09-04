import React from 'react';
import { PDFTool } from '../../types';
import { ToolIcon } from '../../lib/icons';
import { ArrowUpRight } from 'lucide-react';
import { useRouter } from '../../hooks/useRouter';

interface ToolCardProps {
  tool: PDFTool;
  compact?: boolean;
  className?: string;
}

// Category color accents for crisp visual organization
const CATEGORY_ACCENTS: Record<string, { bg: string; text: string; ring: string }> = {
  'ORGANIZE PDF': { bg: 'bg-emerald-50 dark:bg-emerald-950/50', text: 'text-emerald-600 dark:text-emerald-400', ring: 'group-hover:border-emerald-300 dark:group-hover:border-emerald-700' },
  'OPTIMIZE PDF': { bg: 'bg-emerald-50 dark:bg-emerald-950/50', text: 'text-emerald-600 dark:text-emerald-400', ring: 'group-hover:border-emerald-300 dark:group-hover:border-emerald-700' },
  'CONVERT TO PDF': { bg: 'bg-amber-50 dark:bg-amber-950/50', text: 'text-amber-600 dark:text-amber-400', ring: 'group-hover:border-amber-300 dark:group-hover:border-amber-700' },
  'CONVERT FROM PDF': { bg: 'bg-blue-50 dark:bg-blue-950/50', text: 'text-blue-600 dark:text-blue-400', ring: 'group-hover:border-blue-300 dark:group-hover:border-blue-700' },
  'EDIT PDF': { bg: 'bg-purple-50 dark:bg-purple-950/50', text: 'text-purple-600 dark:text-purple-400', ring: 'group-hover:border-purple-300 dark:group-hover:border-purple-700' },
  'PDF SECURITY': { bg: 'bg-teal-50 dark:bg-teal-950/50', text: 'text-teal-600 dark:text-teal-400', ring: 'group-hover:border-teal-300 dark:group-hover:border-teal-700' },
  'PDF INTELLIGENCE': { bg: 'bg-indigo-50 dark:bg-indigo-950/50', text: 'text-indigo-600 dark:text-indigo-400', ring: 'group-hover:border-indigo-300 dark:group-hover:border-indigo-700' },
};

export const ToolCard: React.FC<ToolCardProps> = ({ tool, compact = false, className = '' }) => {
  const { navigate } = useRouter();
  const accent = CATEGORY_ACCENTS[tool.category] || CATEGORY_ACCENTS['ORGANIZE PDF'];

  return (
    <div
      id={`tool-card-${tool.id}`}
      role="button"
      tabIndex={0}
      onClick={() => navigate(tool.route)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(tool.route);
        }
      }}
      className={`group relative flex flex-col justify-between text-left p-5 sm:p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${accent.ring} ${className}`}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${accent.bg} ${accent.text}`}>
            <ToolIcon name={tool.iconName} className="w-6 h-6" />
          </div>

          <div className="flex items-center gap-1.5">
            {tool.badge && (
              <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                {tool.badge}
              </span>
            )}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        <h3 className="text-base font-semibold text-neutral-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          {tool.name}
        </h3>

        {!compact && (
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
            {tool.description}
          </p>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400 dark:text-neutral-500">
        <span className="truncate">{tool.outputFormat.replace('.', '').toUpperCase()} Output</span>
        <span className="font-medium text-emerald-600 dark:text-emerald-400 group-hover:underline">Use tool</span>
      </div>
    </div>
  );
};
