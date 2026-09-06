import React from 'react';
import { ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { PageThumbnail } from './PageThumbnail';

interface PagePanelProps {
  pageCount: number;
  currentPage: number;
  onSelectPage: (pageNumber: number) => void;
  isOpen: boolean;
  onToggle: () => void;
  rotations?: Record<number, number>;
}

export const PagePanel: React.FC<PagePanelProps> = ({
  pageCount,
  currentPage,
  onSelectPage,
  isOpen,
  onToggle,
  rotations = {},
}) => {
  if (!isOpen) {
    return (
      <div className="border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-1 flex flex-col items-center">
        <button
          type="button"
          onClick={onToggle}
          aria-label="Open Page Panel"
          title="Open Pages Panel"
          className="p-2 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <Layers className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <aside
      aria-label="Document Pages"
      className="w-48 sm:w-52 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col h-full z-10 select-none flex-shrink-0"
    >
      {/* Panel Header */}
      <div className="h-10 px-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs font-semibold text-neutral-800 dark:text-neutral-200">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Pages</span>
          <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
            {pageCount}
          </span>
        </div>
        <button
          type="button"
          onClick={onToggle}
          title="Collapse page panel"
          className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Thumbnails Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {Array.from({ length: pageCount }, (_, i) => i + 1).map((pageNum) => (
          <PageThumbnail
            key={pageNum}
            pageNumber={pageNum}
            isActive={pageNum === currentPage}
            onSelect={onSelectPage}
            rotation={rotations[pageNum] || 0}
          />
        ))}
      </div>

      {/* Quick Navigation Footer */}
      <div className="p-2 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onSelectPage(currentPage - 1)}
          className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          title="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-[11px] font-bold">
          {currentPage} / {pageCount}
        </span>
        <button
          type="button"
          disabled={currentPage >= pageCount}
          onClick={() => onSelectPage(currentPage + 1)}
          className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          title="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
