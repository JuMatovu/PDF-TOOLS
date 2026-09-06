import React from 'react';
import { Plus, Trash2, FileText, Upload } from 'lucide-react';
import { EditorElement } from '../../types/editor';

interface PageThumbnailListProps {
  totalPages: number;
  currentPage: number;
  onSelectPage: (page: number) => void;
  onAddPage: () => void;
  onDeletePage: (page: number) => void;
  onUploadNewPdf: () => void;
  pageThumbnails: Record<number, string>;
  elements: EditorElement[];
}

export const PageThumbnailList: React.FC<PageThumbnailListProps> = ({
  totalPages,
  currentPage,
  onSelectPage,
  onAddPage,
  onDeletePage,
  onUploadNewPdf,
  pageThumbnails,
  elements,
}) => {
  return (
    <aside className="w-48 sm:w-56 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col flex-shrink-0 z-10 shadow-xs select-none">
      {/* Sidebar Header */}
      <div className="p-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          Pages ({totalPages})
        </span>
        <button
          type="button"
          onClick={onUploadNewPdf}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
          title="Open a different PDF file"
        >
          <Upload className="w-3 h-3" />
          <span>Upload</span>
        </button>
      </div>

      {/* Pages Scrollable List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
          const isActive = pageNum === currentPage;
          const thumbnail = pageThumbnails[pageNum];
          const pageElementCount = elements.filter((el) => el.page === pageNum).length;

          return (
            <div
              key={pageNum}
              onClick={() => onSelectPage(pageNum)}
              className={`group relative rounded-xl border p-2 flex flex-col gap-1.5 cursor-pointer transition-all ${
                isActive
                  ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 ring-2 ring-emerald-500/50 shadow-xs'
                  : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50/40 dark:bg-neutral-900/40'
              }`}
            >
              {/* Header inside thumbnail card */}
              <div className="flex items-center justify-between text-[11px]">
                <span className={`font-bold ${isActive ? 'text-emerald-700 dark:text-emerald-300' : 'text-neutral-500'}`}>
                  Page {pageNum}
                </span>

                {pageElementCount > 0 && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    {pageElementCount} {pageElementCount === 1 ? 'edit' : 'edits'}
                  </span>
                )}
              </div>

              {/* Thumbnail Image */}
              <div className="aspect-[3/4] w-full bg-white dark:bg-neutral-950 rounded-lg border border-neutral-200/80 dark:border-neutral-800 flex items-center justify-center overflow-hidden relative shadow-2xs">
                {thumbnail ? (
                  <img
                    src={thumbnail}
                    alt={`Page ${pageNum}`}
                    className="w-full h-full object-contain pointer-events-none"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-neutral-300 dark:text-neutral-700">
                    <FileText className="w-8 h-8 stroke-1" />
                    <span className="text-[9px] font-mono mt-1">Page {pageNum}</span>
                  </div>
                )}

                {/* Hover delete button if more than 1 page */}
                {totalPages > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePage(pageNum);
                    }}
                    title="Delete this page"
                    className="absolute top-1 right-1 p-1 rounded-md bg-white/90 dark:bg-neutral-800/90 text-rose-500 hover:text-rose-700 opacity-0 group-hover:opacity-100 transition-opacity shadow-xs cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Page Footer Button */}
      <div className="p-3 border-t border-neutral-100 dark:border-neutral-800">
        <button
          type="button"
          onClick={onAddPage}
          className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 hover:border-emerald-500 hover:text-emerald-600 text-neutral-600 dark:text-neutral-300 text-xs font-semibold transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Blank Page</span>
        </button>
      </div>
    </aside>
  );
};
