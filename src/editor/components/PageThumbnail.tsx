import React, { useState, useEffect } from 'react';
import { PdfRendererService } from '../services/pdfRendererService';
import { Loader2 } from 'lucide-react';

interface PageThumbnailProps {
  pageNumber: number;
  isActive: boolean;
  onSelect: (pageNumber: number) => void;
  rotation?: number;
}

export const PageThumbnail: React.FC<PageThumbnailProps> = ({
  pageNumber,
  isActive,
  onSelect,
  rotation = 0,
}) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);

    const renderer = PdfRendererService.getInstance();
    renderer
      .renderThumbnail(pageNumber, 160)
      .then((url) => {
        if (!isCancelled) {
          setDataUrl(url);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.warn(`[PageThumbnail] Thumbnail load error for pg ${pageNumber}:`, err);
          setDataUrl(renderer.generatePlaceholderThumbnail(pageNumber, 160));
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [pageNumber]);

  return (
    <div
      onClick={() => onSelect(pageNumber)}
      className={`group relative rounded-xl border p-2 cursor-pointer transition-all duration-150 flex flex-col items-center ${
        isActive
          ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/40 shadow-sm'
          : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-xs'
      }`}
    >
      {/* Page Number Badge */}
      <div className="w-full flex items-center justify-between mb-1.5 px-0.5">
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
            isActive
              ? 'bg-amber-400 text-neutral-900 font-extrabold shadow-2xs'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
          }`}
        >
          {pageNumber}
        </span>
        {isActive && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
        )}
      </div>

      {/* Thumbnail Image Container */}
      <div className="w-full aspect-[1/1.414] bg-neutral-50 dark:bg-neutral-800/80 rounded border border-neutral-100 dark:border-neutral-800 flex items-center justify-center overflow-hidden">
        {loading ? (
          <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
        ) : dataUrl ? (
          <img
            src={dataUrl}
            alt={`Page ${pageNumber}`}
            className="w-full h-full object-contain pointer-events-none transition-transform duration-200"
            style={{ transform: rotation ? `rotate(${rotation}deg)` : undefined }}
            loading="lazy"
          />
        ) : (
          <div className="text-[10px] text-neutral-400">Page {pageNumber}</div>
        )}
      </div>
    </div>
  );
};
