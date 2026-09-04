import React from 'react';
import { TOOL_CATEGORIES, getToolsByCategory } from '../../data/tools';
import { ToolIcon } from '../../lib/icons';
import { useRouter } from '../../hooks/useRouter';
import { ArrowRight, Sparkles } from 'lucide-react';

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MegaMenu: React.FC<MegaMenuProps> = ({ isOpen, onClose }) => {
  const { navigate } = useRouter();

  if (!isOpen) return null;

  const handleToolClick = (route: string) => {
    onClose();
    navigate(route);
  };

  return (
    <div
      id="pdftool-mega-menu"
      onMouseLeave={onClose}
      className="absolute top-full left-0 right-0 z-50 bg-white dark:bg-neutral-900 border-b border-neutral-200/90 dark:border-neutral-800 shadow-xl transition-all animate-in fade-in slide-in-from-top-2 duration-150"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top header within menu */}
        <div className="flex items-center justify-between pb-5 mb-6 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              All 27 PDF & Document Utilities
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate('/tools');
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 cursor-pointer"
          >
            <span>View All in Directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 7 Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6 text-left">
          {TOOL_CATEGORIES.map((cat) => {
            const tools = getToolsByCategory(cat.id);
            return (
              <div key={cat.id} className="space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 pb-1 border-b border-neutral-100 dark:border-neutral-800/80">
                  {cat.id}
                </div>
                <ul className="space-y-1">
                  {tools.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => handleToolClick(t.route)}
                        className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-emerald-600 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 transition-colors cursor-pointer group"
                      >
                        <span className="text-neutral-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 flex-shrink-0 transition-colors">
                          <ToolIcon name={t.iconName} className="w-3.5 h-3.5" />
                        </span>
                        <span className="truncate">{t.name}</span>
                        {t.badge && (
                          <span className="ml-auto text-[9px] px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-300 font-bold">
                            {t.badge}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Bottom Banner */}
        <div className="mt-8 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Need an interactive editor? Try our rich web PDF editor without installing any software.</span>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate('/edit-pdf');
            }}
            className="font-bold text-neutral-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            Launch PDF Editor →
          </button>
        </div>
      </div>
    </div>
  );
};
