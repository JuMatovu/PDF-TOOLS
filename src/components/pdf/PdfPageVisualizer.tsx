import React, { useState, useEffect, useMemo } from 'react';
import {
  RotateCw,
  RotateCcw,
  CheckSquare,
  Square,
  Scissors,
  Check,
  RotateCcw as ResetIcon,
  Sparkles,
  Layers,
  FileText,
  Loader2,
  Trash2,
  FileX,
  FileSymlink,
  GripVertical,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { renderPdfPages, RenderedPdfPage } from '../../utils/pdfRenderer';

export type VisualizerMode = 'rotate' | 'split' | 'remove' | 'extract' | 'organize';

interface PdfPageVisualizerProps {
  file: File;
  mode: VisualizerMode;
  // Rotate mode props
  pageRotations: Record<number, number>; // pageNumber (1-indexed) -> additional degrees (0, 90, 180, 270)
  onRotatePage: (pageNumber: number, deltaAngle: number) => void;
  onRotateAll: (deltaAngle: number) => void;
  onResetRotations: () => void;
  // Split / Remove / Extract mode props
  selectedPages: number[]; // 1-indexed page numbers
  onTogglePageSelection: (pageNumber: number) => void;
  onSetSelectedPages: (pages: number[]) => void;
  pageRangeInput: string;
  onChangePageRangeInput: (input: string) => void;
  // Organize mode reordering
  pageOrder?: number[];
  onChangePageOrder?: (order: number[]) => void;
}

/**
 * Parses user input like "1-3, 5, 8" into unique sorted 1-indexed page numbers
 */
export function parseRangeToPageNumbers(input: string, totalPages: number): number[] {
  if (!input || !input.trim()) return [];
  const trimmed = input.trim().toLowerCase();
  if (trimmed === 'all') {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const result = new Set<number>();
  const parts = trimmed.split(/[,;\s]+/).filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const [s, e] = part.split('-');
      const start = parseInt(s.trim(), 10);
      const end = parseInt(e.trim(), 10);
      if (!isNaN(start) && !isNaN(end)) {
        const from = Math.max(1, Math.min(start, end));
        const to = Math.min(totalPages, Math.max(start, end));
        for (let p = from; p <= to; p++) {
          result.add(p);
        }
      }
    } else {
      const num = parseInt(part.trim(), 10);
      if (!isNaN(num) && num >= 1 && num <= totalPages) {
        result.add(num);
      }
    }
  }

  return Array.from(result).sort((a, b) => a - b);
}

/**
 * Formats an array of page numbers into a clean readable range string e.g. "1-3, 5, 7"
 */
export function formatPageNumbersToRange(pages: number[]): string {
  if (!pages || pages.length === 0) return '';
  const sorted = Array.from(new Set(pages)).sort((a, b) => a - b);

  const ranges: string[] = [];
  let start = sorted[0];
  let end = start;

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i];
    } else {
      ranges.push(start === end ? `${start}` : `${start}-${end}`);
      start = sorted[i];
      end = start;
    }
  }
  ranges.push(start === end ? `${start}` : `${start}-${end}`);

  return ranges.join(', ');
}

export const PdfPageVisualizer: React.FC<PdfPageVisualizerProps> = ({
  file,
  mode,
  pageRotations,
  onRotatePage,
  onRotateAll,
  onResetRotations,
  selectedPages,
  onTogglePageSelection,
  onSetSelectedPages,
  pageRangeInput,
  onChangePageRangeInput,
  pageOrder,
  onChangePageOrder,
}) => {
  const [pages, setPages] = useState<RenderedPdfPage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [renderProgress, setRenderProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [selectedForRotation, setSelectedForRotation] = useState<Set<number>>(new Set());

  // Drag and drop state for organize mode
  const [internalPageOrder, setInternalPageOrder] = useState<number[]>([]);
  const [draggedPageIndex, setDraggedPageIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Render pages when file changes
  useEffect(() => {
    let isCancelled = false;

    const loadDoc = async () => {
      setLoading(true);
      setRenderProgress({ current: 0, total: 0 });

      try {
        const result = await renderPdfPages(file, (curr, tot) => {
          if (!isCancelled) {
            setRenderProgress({ current: curr, total: tot });
          }
        });

        if (!isCancelled) {
          setPages(result.pages);
          setLoading(false);
          const initialOrder = Array.from({ length: result.pages.length }, (_, i) => i + 1);
          setInternalPageOrder(pageOrder && pageOrder.length === result.pages.length ? pageOrder : initialOrder);
          onChangePageOrder?.(initialOrder);

          // If split/extract mode and no pages are selected yet, default to page 1
          if ((mode === 'split' || mode === 'extract') && selectedPages.length === 0 && result.pageCount > 0) {
            onSetSelectedPages([1]);
            onChangePageRangeInput('1');
          }
        }
      } catch (err) {
        console.error('[PdfPageVisualizer] Error loading document:', err);
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadDoc();

    return () => {
      isCancelled = true;
    };
  }, [file]);

  // Keep internalPageOrder synced if prop changes
  useEffect(() => {
    if (pageOrder && pageOrder.length === pages.length) {
      setInternalPageOrder(pageOrder);
    }
  }, [pageOrder, pages.length]);

  const totalPages = pages.length;

  // Reordered pages for organize mode
  const displayPages = useMemo(() => {
    if (mode === 'organize' && internalPageOrder.length === pages.length && pages.length > 0) {
      const pageMap = new Map(pages.map((p) => [p.pageNumber, p]));
      return internalPageOrder.map((num) => pageMap.get(num)).filter(Boolean) as RenderedPdfPage[];
    }
    return pages;
  }, [mode, internalPageOrder, pages]);

  const isOrderModified = useMemo(() => {
    if (mode !== 'organize' || internalPageOrder.length !== pages.length) return false;
    return internalPageOrder.some((num, idx) => num !== idx + 1);
  }, [mode, internalPageOrder, pages.length]);

  // Drag and drop handlers for organize mode
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (mode !== 'organize') return;
    setDraggedPageIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (mode !== 'organize') return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    if (mode !== 'organize') return;
    e.preventDefault();
    const sourceIndex =
      draggedPageIndex !== null
        ? draggedPageIndex
        : parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (isNaN(sourceIndex) || sourceIndex === targetIndex) {
      setDraggedPageIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newOrder = [...internalPageOrder];
    const [moved] = newOrder.splice(sourceIndex, 1);
    newOrder.splice(targetIndex, 0, moved);

    setInternalPageOrder(newOrder);
    onChangePageOrder?.(newOrder);
    setDraggedPageIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedPageIndex(null);
    setDragOverIndex(null);
  };

  const handleMovePage = (index: number, direction: number) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= internalPageOrder.length) return;

    const newOrder = [...internalPageOrder];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);

    setInternalPageOrder(newOrder);
    onChangePageOrder?.(newOrder);
  };

  const handleResetOrder = () => {
    const defaultOrder = pages.map((p) => p.pageNumber);
    setInternalPageOrder(defaultOrder);
    onChangePageOrder?.(defaultOrder);
  };

  // Selected count for split / remove / extract
  const selectedCount = selectedPages.length;
  const isSelectionMode = mode === 'split' || mode === 'remove' || mode === 'extract';
  const isRemoveMode = mode === 'remove';

  // Rotate mode helpers
  const handleToggleRotateSelect = (pageNum: number) => {
    setSelectedForRotation((prev) => {
      const next = new Set(prev);
      if (next.has(pageNum)) {
        next.delete(pageNum);
      } else {
        next.add(pageNum);
      }
      return next;
    });
  };

  const handleSelectAllForRotation = () => {
    if (selectedForRotation.size === totalPages) {
      setSelectedForRotation(new Set());
    } else {
      setSelectedForRotation(new Set(pages.map((p) => p.pageNumber)));
    }
  };

  const handleRotateSelected = (deltaAngle: number) => {
    if (selectedForRotation.size === 0) {
      onRotateAll(deltaAngle);
    } else {
      selectedForRotation.forEach((p) => {
        onRotatePage(p, deltaAngle);
      });
    }
  };

  // Selection mode: handle manual typing into input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChangePageRangeInput(val);
    const parsed = parseRangeToPageNumbers(val, totalPages);
    onSetSelectedPages(parsed);
  };

  // Quick select helpers for selection mode
  const handleSelectAllSelection = () => {
    const all = Array.from({ length: totalPages }, (_, i) => i + 1);
    onSetSelectedPages(all);
    onChangePageRangeInput(formatPageNumbersToRange(all));
  };

  const handleClearSelection = () => {
    onSetSelectedPages([]);
    onChangePageRangeInput('');
  };

  const handleSelectOddSelection = () => {
    const odd = Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => p % 2 !== 0);
    onSetSelectedPages(odd);
    onChangePageRangeInput(formatPageNumbersToRange(odd));
  };

  const handleSelectEvenSelection = () => {
    const even = Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => p % 2 === 0);
    onSetSelectedPages(even);
    onChangePageRangeInput(formatPageNumbersToRange(even));
  };

  // When user clicks a card in selection mode
  const handleCardClickSelection = (pageNum: number) => {
    onTogglePageSelection(pageNum);
    const updated = selectedPages.includes(pageNum)
      ? selectedPages.filter((p) => p !== pageNum)
      : [...selectedPages, pageNum].sort((a, b) => a - b);
    onChangePageRangeInput(formatPageNumbersToRange(updated));
  };

  // Modified rotations count
  const modifiedRotations = useMemo(() => {
    return Object.entries(pageRotations).filter(([, angle]) => angle % 360 !== 0);
  }, [pageRotations]);

  const headerTitle =
    mode === 'rotate'
      ? 'Interactive Page Rotation'
      : mode === 'remove'
      ? 'Pick Pages to Remove'
      : mode === 'extract'
      ? 'Pick Pages to Extract'
      : mode === 'organize'
      ? 'Organize, Reorder & Rotate Pages'
      : 'Pick Pages to Split Off';

  const headerDescription =
    mode === 'rotate'
      ? 'Click rotation buttons on any page card, or select multiple pages to rotate in batch.'
      : mode === 'remove'
      ? 'Click on any page card to mark it for deletion, or enter specific page numbers below.'
      : mode === 'extract'
      ? 'Select specific pages to extract into an independent PDF document.'
      : mode === 'organize'
      ? 'Drag and drop page cards to reorder them, rotate individual pages, or mark unwanted pages for removal.'
      : 'Insert page numbers to split off, or click on any page thumbnail below.';

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/90 dark:border-neutral-800 p-6 space-y-6 shadow-sm">
      {/* Visualizer Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`p-1.5 rounded-lg ${
                isRemoveMode
                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                  : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {mode === 'rotate' ? (
                <RotateCw className="w-4 h-4" />
              ) : mode === 'remove' ? (
                <Trash2 className="w-4 h-4" />
              ) : mode === 'extract' ? (
                <FileSymlink className="w-4 h-4" />
              ) : (
                <Scissors className="w-4 h-4" />
              )}
            </span>
            <h3 className="font-bold text-base text-neutral-900 dark:text-white">{headerTitle}</h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
              {totalPages} {totalPages === 1 ? 'Page' : 'Pages'}
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{headerDescription}</p>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {mode === 'rotate' ? (
            <>
              <button
                type="button"
                onClick={() => handleRotateSelected(90)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
                title="Rotate Clockwise (+90°)"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>{selectedForRotation.size > 0 ? `Rotate Selected (+90°)` : `Rotate All (+90°)`}</span>
              </button>
              <button
                type="button"
                onClick={() => handleRotateSelected(270)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-semibold cursor-pointer active:scale-95 transition-all"
                title="Rotate Counter-Clockwise (-90°)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>-90°</span>
              </button>
              {modifiedRotations.length > 0 && (
                <button
                  type="button"
                  onClick={onResetRotations}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs text-neutral-500 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                  title="Reset all rotations to 0°"
                >
                  <ResetIcon className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </>
          ) : (
            /* Split/Remove/Extract Quick Actions */
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleSelectAllSelection}
                className="px-2.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer"
              >
                All
              </button>
              <button
                type="button"
                onClick={handleSelectOddSelection}
                className="px-2.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer"
              >
                Odd
              </button>
              <button
                type="button"
                onClick={handleSelectEvenSelection}
                className="px-2.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer"
              >
                Even
              </button>
              <button
                type="button"
                onClick={handleClearSelection}
                className="px-2.5 py-1.5 rounded-xl text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Direct Page Range Input Bar for Selection Modes */}
      {isSelectionMode && (
        <div
          className={`p-4 rounded-2xl border space-y-3 ${
            isRemoveMode
              ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-800/60'
              : 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/60'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1">
              <label
                htmlFor="page-range-input"
                className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1"
              >
                {isRemoveMode
                  ? 'Insert Pages to Remove:'
                  : mode === 'extract'
                  ? 'Insert Pages to Extract:'
                  : 'Insert Pages to Split Off:'}
              </label>
              <div className="relative">
                <input
                  id="page-range-input"
                  type="text"
                  value={pageRangeInput}
                  onChange={handleInputChange}
                  placeholder={
                    isRemoveMode
                      ? 'e.g. 2, 4 or 1-3 (or click cards below)'
                      : 'e.g. 1, 3 or 2-4 (or click cards below)'
                  }
                  className={`w-full pl-3 pr-24 py-2 text-sm bg-white dark:bg-neutral-900 border rounded-xl focus:outline-none focus:ring-2 font-mono ${
                    isRemoveMode
                      ? 'border-rose-300 dark:border-rose-700 focus:ring-rose-500'
                      : 'border-neutral-300 dark:border-neutral-700 focus:ring-emerald-500'
                  }`}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-neutral-400">
                  {totalPages > 0 ? `Max: ${totalPages}` : ''}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <span
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold ${
                  selectedCount > 0
                    ? isRemoveMode
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                    : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                }`}
              >
                {isRemoveMode ? <Trash2 className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                <span>
                  {selectedCount} of {totalPages} {totalPages === 1 ? 'page' : 'pages'}{' '}
                  {isRemoveMode ? 'to remove' : mode === 'extract' ? 'to extract' : 'to split'}
                </span>
              </span>
            </div>
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
            Tip: You can enter numbers (e.g. <code className="font-mono font-bold">1, 3, 5</code>) or ranges (e.g.{' '}
            <code className="font-mono font-bold">2-4</code>), or click directly on any page preview below.
          </p>
        </div>
      )}

      {/* Rotate Mode: Summary of configured rotations if any */}
      {mode === 'rotate' && modifiedRotations.length > 0 && (
        <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200">
            <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              <strong>{modifiedRotations.length}</strong> {modifiedRotations.length === 1 ? 'page' : 'pages'} configured for rotation:{' '}
              {modifiedRotations
                .map(([p, angle]) => `Page ${p} (+${angle}°)`)
                .slice(0, 5)
                .join(', ')}
              {modifiedRotations.length > 5 ? ` and ${modifiedRotations.length - 5} more` : ''}
            </span>
          </div>
          <button
            type="button"
            onClick={onResetRotations}
            className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 underline cursor-pointer hover:text-emerald-800"
          >
            Reset All
          </button>
        </div>
      )}

      {/* Organize Mode: Drag-and-drop page position reordering banner */}
      {mode === 'organize' && (
        <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
            <GripVertical className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              <strong>Drag & Drop to Reorder:</strong> Drag any page card to change its position, or use the arrow buttons (<code className="font-mono">← / →</code>).
              {isOrderModified && (
                <span className="ml-1 text-emerald-700 dark:text-emerald-400 font-bold">
                  (Custom order active)
                </span>
              )}
            </span>
          </div>
          {isOrderModified && (
            <button
              type="button"
              onClick={handleResetOrder}
              className="text-[11px] font-bold text-amber-800 dark:text-amber-300 underline cursor-pointer hover:text-amber-900"
            >
              Reset to Original Order
            </button>
          )}
        </div>
      )}

      {/* Loading State while rendering pages */}
      {loading && (
        <div className="py-12 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
            Rendering PDF page previews...{' '}
            {renderProgress.total > 0 && `(${renderProgress.current}/${renderProgress.total})`}
          </p>
        </div>
      )}

      {/* Pages Grid */}
      {!loading && displayPages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
          {displayPages.map((page, idx) => {
            const pageNum = page.pageNumber;
            const currentAngle = (pageRotations[pageNum] || 0) % 360;
            const isRotated = currentAngle !== 0;

            const isSelected = selectedPages.includes(pageNum);
            const isCheckedForRotation = selectedForRotation.has(pageNum);
            const isDraggingThis = draggedPageIndex === idx;
            const isTargetOfDrag = dragOverIndex === idx && !isDraggingThis;

            return (
              <div
                key={`${pageNum}-${idx}`}
                id={`page-card-${pageNum}`}
                draggable={mode === 'organize'}
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, idx)}
                onDragEnd={handleDragEnd}
                onClick={() => {
                  if (isSelectionMode) {
                    handleCardClickSelection(pageNum);
                  } else if (mode === 'rotate') {
                    handleToggleRotateSelect(pageNum);
                  }
                }}
                className={`group relative rounded-2xl border transition-all duration-200 flex flex-col p-3 ${
                  mode === 'organize' ? 'cursor-grab active:cursor-grabbing select-none' : 'cursor-pointer'
                } ${
                  isDraggingThis
                    ? 'opacity-40 border-dashed border-amber-400 scale-95'
                    : isTargetOfDrag
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/40 ring-2 ring-amber-500/80 shadow-md scale-102'
                    : isSelectionMode
                    ? isSelected
                      ? isRemoveMode
                        ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 ring-2 ring-rose-500/50 shadow-sm'
                        : 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 ring-2 ring-emerald-500/50 shadow-sm'
                      : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/40 hover:border-neutral-300 dark:hover:border-neutral-700'
                    : mode === 'organize'
                    ? isSelected
                      ? 'border-rose-300 dark:border-rose-800 bg-rose-50/30 dark:bg-rose-950/20'
                      : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/40 hover:border-amber-400/80 dark:hover:border-amber-500/60 shadow-xs'
                    : isCheckedForRotation
                    ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 ring-2 ring-emerald-500/50'
                    : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/40 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                {/* Card Header: Page Number & Selection */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    {mode === 'organize' && (
                      <div className="flex items-center gap-1 text-neutral-400 dark:text-neutral-500 mr-0.5" title="Position in document">
                        <GripVertical className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-extrabold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-1.5 py-0.5 rounded">
                          #{idx + 1}
                        </span>
                      </div>
                    )}
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                        isSelectionMode && isSelected
                          ? isRemoveMode
                            ? 'bg-rose-600 text-white'
                            : 'bg-emerald-600 text-white'
                          : 'bg-neutral-200/80 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      {mode === 'organize' ? `Pg ${pageNum}` : pageNum}
                    </span>
                    {isRotated && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                        +{currentAngle}°
                      </span>
                    )}
                  </div>

                  {/* Mode-specific badge / checkbox */}
                  {isSelectionMode ? (
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                        isSelected
                          ? isRemoveMode
                            ? 'bg-rose-600 text-white'
                            : 'bg-emerald-600 text-white'
                          : 'border border-neutral-300 dark:border-neutral-700 text-transparent'
                      }`}
                    >
                      {isRemoveMode ? (
                        <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                      ) : (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      )}
                    </div>
                  ) : mode === 'rotate' ? (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleRotateSelect(pageNum);
                      }}
                      className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer p-0.5"
                    >
                      {isCheckedForRotation ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4 text-neutral-300 dark:text-neutral-700" />
                      )}
                    </div>
                  ) : null}
                </div>

                {/* Page Thumbnail Image with hardware-accelerated CSS rotation */}
                <div className="relative aspect-[3/4] w-full rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200/70 dark:border-neutral-800/80 flex items-center justify-center overflow-hidden p-1 shadow-inner">
                  <img
                    src={page.dataUrl}
                    alt={`Page ${pageNum}`}
                    className="max-w-full max-h-full object-contain rounded-sm transition-transform duration-300 ease-in-out shadow-xs pointer-events-none"
                    style={{
                      transform: `rotate(${currentAngle}deg)`,
                    }}
                  />

                  {/* Selection mode visual overlay when selected */}
                  {(isSelectionMode || mode === 'organize') && isSelected && (
                    <div
                      className={`absolute inset-0 pointer-events-none rounded-xl flex items-center justify-center ${
                        isRemoveMode || mode === 'organize' ? 'bg-rose-500/20 backdrop-blur-[0.5px]' : 'bg-emerald-500/10'
                      }`}
                    >
                      {mode === 'organize' && (
                        <span className="px-2 py-1 rounded bg-rose-600 text-white text-[11px] font-bold shadow-sm">
                          Will be removed
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Action Controls */}
                <div className="mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between gap-1">
                  {mode === 'organize' ? (
                    <div className="flex items-center gap-1 w-full">
                      {/* Left Reorder Button */}
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMovePage(idx, -1);
                        }}
                        className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
                        title="Move Page Earlier (Left)"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                      {/* Right Reorder Button */}
                      <button
                        type="button"
                        disabled={idx === displayPages.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMovePage(idx, 1);
                        }}
                        className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
                        title="Move Page Later (Right)"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      {/* Rotate CW Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRotatePage(pageNum, 90);
                        }}
                        className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
                        title="Rotate +90°"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                      {/* Remove/Keep Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCardClickSelection(pageNum);
                        }}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold text-center transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-rose-600 text-white hover:bg-rose-700'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                        }`}
                        title={isSelected ? 'Click to restore page' : 'Click to mark for removal'}
                      >
                        {isSelected ? 'Restore' : 'Delete'}
                      </button>
                    </div>
                  ) : mode === 'rotate' ? (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRotatePage(pageNum, 270);
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-[11px] font-semibold cursor-pointer active:scale-95 transition-all"
                        title="Rotate Counter-Clockwise (-90°)"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>-90°</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRotatePage(pageNum, 90);
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
                        title="Rotate Clockwise (+90°)"
                      >
                        <RotateCw className="w-3 h-3" />
                        <span>+90°</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardClickSelection(pageNum);
                      }}
                      className={`w-full py-1.5 px-2 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                        isSelected
                          ? isRemoveMode
                            ? 'bg-rose-600 text-white hover:bg-rose-700'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200'
                      }`}
                    >
                      {isSelected
                        ? isRemoveMode
                          ? '✓ Mark to Remove'
                          : mode === 'extract'
                          ? '✓ Selected to Extract'
                          : '✓ Selected to Split'
                        : isRemoveMode
                        ? 'Click to Remove'
                        : mode === 'extract'
                        ? 'Click to Extract'
                        : 'Click to Split'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
