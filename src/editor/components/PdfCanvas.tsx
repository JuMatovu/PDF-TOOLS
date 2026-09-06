import React, { useRef, useEffect, useState } from 'react';
import { PdfRendererService } from '../services/pdfRendererService';
import {
  PdfPageDimensions,
  EditorElement,
  TextElement,
  ShapeElement,
  ImageElement,
  SignatureElement,
  StampElement,
  RedactElement,
  CommentElement,
  DrawElement,
  EditorTool,
  ShapeType,
  ExtractedPdfWord,
} from '../types/editorTypes';
import { TextElementItem } from './TextElementItem';
import { ShapeElementItem } from './ShapeElementItem';
import { ImageElementItem } from './ImageElementItem';
import { StampElementItem } from './StampElementItem';
import { RedactElementItem } from './RedactElementItem';
import { CommentElementItem } from './CommentElementItem';
import { DrawElementItem } from './DrawElementItem';
import { DrawingLayer } from './DrawingLayer';
import {
  Minus,
  Plus,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RotateCw,
} from 'lucide-react';

interface PdfCanvasProps {
  currentPage: number;
  totalPages: number;
  zoom: number; // e.g. 100
  pageDimensions: PdfPageDimensions | null;
  elements: EditorElement[];
  selectedId: string | null;
  activeTool: EditorTool;
  activeShapeType?: ShapeType;
  onSelectElement: (id: string | null, e?: React.MouseEvent) => void;
  onAddElement: (element: EditorElement) => void;
  onUpdateElement: (id: string, updates: Partial<EditorElement>, recordHistory?: boolean) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  onNextPage: () => void;
  onPrevPage: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitWidth: (containerWidth: number, pageWidth: number) => void;
  onFitPage: (containerWidth: number, containerHeight: number, pageWidth: number, pageHeight: number) => void;
  rotation?: number;
  onRotatePage?: () => void;
}

export const PdfCanvas: React.FC<PdfCanvasProps> = ({
  currentPage,
  totalPages,
  zoom,
  pageDimensions,
  elements,
  selectedId,
  activeTool,
  activeShapeType = 'rectangle',
  onSelectElement,
  onAddElement,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onNextPage,
  onPrevPage,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitWidth,
  onFitPage,
  rotation = 0,
  onRotatePage,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const documentCardRef = useRef<HTMLDivElement>(null);
  const [isRendering, setIsRendering] = useState<boolean>(true);
  const [renderError, setRenderError] = useState<string | null>(null);

  // PDF Text Extraction State for in-place text editing
  const [extractedWords, setExtractedWords] = useState<ExtractedPdfWord[]>([]);
  const [loadingWords, setLoadingWords] = useState<boolean>(false);

  const zoomScale = zoom / 100;
  const pageWidth = pageDimensions?.width || 595.28;
  const pageHeight = pageDimensions?.height || 841.89;

  // Load extracted words when activeTool is edit-pdf-text or currentPage changes
  useEffect(() => {
    let isCancelled = false;

    if (activeTool === 'edit-pdf-text') {
      setLoadingWords(true);
      PdfRendererService.getInstance()
        .getPageTextItems(currentPage)
        .then((items) => {
          if (!isCancelled) {
            setExtractedWords(items);
            setLoadingWords(false);
          }
        })
        .catch((err) => {
          if (!isCancelled) {
            console.warn('[PdfCanvas] Could not extract text for page:', err);
            setExtractedWords([]);
            setLoadingWords(false);
          }
        });
    } else {
      setExtractedWords([]);
      setLoadingWords(false);
    }

    return () => {
      isCancelled = true;
    };
  }, [activeTool, currentPage]);

  // Render active page onto canvas whenever currentPage, zoom, or rotation changes
  useEffect(() => {
    let isCancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsRendering(true);
    setRenderError(null);

    const renderer = PdfRendererService.getInstance();

    renderer
      .renderPageToCanvas(canvas, currentPage, zoomScale)
      .then(() => {
        if (!isCancelled) {
          setIsRendering(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('[PdfCanvas] Page render error:', err);
          setRenderError('Could not render page canvas.');
          setIsRendering(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [currentPage, zoom]);

  // Fit Width / Fit Page helper calls
  const handleFitWidth = () => {
    if (!containerRef.current || !pageDimensions) return;
    onFitWidth(containerRef.current.clientWidth, pageDimensions.width);
  };

  const handleFitPage = () => {
    if (!containerRef.current || !pageDimensions) return;
    onFitPage(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight,
      pageDimensions.width,
      pageDimensions.height
    );
  };

  // Convert extracted PDF word into in-place editable TextElement
  const handleEditPdfWord = (word: ExtractedPdfWord, e: React.MouseEvent) => {
    e.stopPropagation();
    const generateId = (prefix: string) =>
      crypto.randomUUID ? crypto.randomUUID() : `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newText: TextElement = {
      id: generateId('text_pdf'),
      type: 'text',
      pageNumber: currentPage,
      x: Math.max(0, word.x - 2),
      y: Math.max(0, word.y - 2),
      width: Math.max(word.width + 16, 60),
      height: Math.max(word.height + 6, 26),
      text: word.text,
      fontSize: word.fontSize,
      fontFamily: word.fontFamily || 'Roboto',
      color: word.color || '#0f172a',
      isBold: word.isBold,
      isItalic: word.isItalic,
      isUnderline: false,
      alignment: 'left',
      coverOriginal: true,
      backgroundColor: '#ffffff',
    };

    onAddElement(newText);
    onSelectElement(newText.id);
  };

  // Handle clicking on page document area to create elements or deselect
  const handleDocumentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // If drawing or highlighting, the DrawingLayer handles mouse events
    if (activeTool === 'draw' || activeTool === 'highlight') return;

    const rect = documentCardRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const pdfX = Math.max(10, Math.round(clickX / zoomScale));
    const pdfY = Math.max(10, Math.round(clickY / zoomScale));

    const generateId = (prefix: string) =>
      crypto.randomUUID ? crypto.randomUUID() : `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // 1. Text Tool & Edit PDF Text Tool (empty space click)
    if (activeTool === 'text' || activeTool === 'edit-pdf-text') {
      const newText: TextElement = {
        id: generateId('text'),
        type: 'text',
        pageNumber: currentPage,
        x: pdfX,
        y: pdfY,
        width: 160,
        height: 36,
        text: activeTool === 'edit-pdf-text' ? 'Editable text' : 'Type your text here',
        fontSize: 16,
        fontFamily: 'Roboto',
        color: '#0f172a',
        isBold: false,
        isItalic: false,
        isUnderline: false,
        alignment: 'left',
        coverOriginal: activeTool === 'edit-pdf-text',
        backgroundColor: activeTool === 'edit-pdf-text' ? '#ffffff' : undefined,
      };
      onAddElement(newText);
      onSelectElement(newText.id);
      return;
    }

    // 2. Shape Tool
    if (activeTool === 'shape') {
      const isLine = activeShapeType === 'line' || activeShapeType === 'arrow';
      const isRound = activeShapeType === 'rounded-rectangle';
      const newShape: ShapeElement = {
        id: generateId('shape'),
        type: 'shape',
        shapeType: activeShapeType,
        pageNumber: currentPage,
        x: pdfX,
        y: pdfY,
        width: isLine ? 140 : 120,
        height: isLine ? 30 : 80,
        strokeColor: '#16a34a',
        strokeWidth: 2.5,
        strokeStyle: 'solid',
        cornerRadius: isRound ? 12 : 0,
        fillColor: 'transparent',
        isFilled: false,
        fillOpacity: 1,
      };
      onAddElement(newShape);
      onSelectElement(newShape.id);
      return;
    }

    // 3. Redact Tool
    if (activeTool === 'redact') {
      const newRedact: RedactElement = {
        id: generateId('redact'),
        type: 'redact',
        pageNumber: currentPage,
        x: pdfX,
        y: pdfY,
        width: 160,
        height: 40,
        fillColor: '#000000',
      };
      onAddElement(newRedact);
      return;
    }

    // 4. Comment Tool
    if (activeTool === 'comment') {
      const newComment: CommentElement = {
        id: generateId('comment'),
        type: 'comment',
        pageNumber: currentPage,
        x: pdfX,
        y: pdfY,
        width: 28,
        height: 28,
        commentText: '',
        author: 'Reviewer',
        color: '#f59e0b',
        isOpen: true,
      };
      onAddElement(newComment);
      return;
    }

    // 5. Select Tool: click on empty canvas deselects
    if (activeTool === 'select') {
      if (e.target === e.currentTarget || e.target === canvasRef.current) {
        onSelectElement(null);
      }
    }
  };

  // Element click handler with Eraser support
  const handleItemSelect = (id: string, e: React.MouseEvent) => {
    if (activeTool === 'eraser') {
      e.stopPropagation();
      onDeleteElement(id);
      return;
    }
    onSelectElement(id, e);
  };

  // Filter elements on current active page
  const currentPageElements = elements.filter((el) => el.pageNumber === currentPage);
  const drawingElements = currentPageElements.filter((el) => el.type === 'draw') as DrawElement[];
  const nonDrawingElements = currentPageElements.filter((el) => el.type !== 'draw');

  return (
    <main
      ref={containerRef}
      aria-label="PDF Document Canvas Workspace"
      onClick={(e) => {
        if (e.target === containerRef.current) {
          onSelectElement(null);
        }
      }}
      className="flex-1 relative bg-slate-100/90 dark:bg-neutral-950 overflow-auto flex items-center justify-center p-6 md:p-10 select-none"
    >
      {/* Subtle workspace dot-grid pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Real Document Page Card */}
      <div className="relative z-10 transition-transform duration-200">
        <div
          ref={documentCardRef}
          onClick={handleDocumentClick}
          className={`relative bg-white shadow-2xl shadow-neutral-900/15 dark:shadow-black/70 rounded-xs ring-1 ring-neutral-300/70 dark:ring-neutral-800 transition-all duration-200 overflow-visible ${
            activeTool === 'text' || activeTool === 'edit-pdf-text'
              ? 'cursor-text'
              : activeTool === 'eraser'
              ? 'cursor-not-allowed'
              : activeTool === 'draw' || activeTool === 'highlight'
              ? 'cursor-crosshair'
              : 'cursor-default'
          }`}
          style={{
            transform: rotation ? `rotate(${rotation}deg)` : undefined,
          }}
        >
          {/* Main Rendering Canvas */}
          <canvas
            ref={canvasRef}
            className="block max-w-none transition-opacity duration-150 pointer-events-none"
          />

          {/* SVG Layer for Freehand Strokes & Highlighter */}
          <svg
            className="absolute inset-0 pointer-events-auto overflow-visible z-15"
            style={{ width: `${pageWidth * zoomScale}px`, height: `${pageHeight * zoomScale}px` }}
          >
            {drawingElements.map((drawEl) => (
              <DrawElementItem
                key={drawEl.id}
                element={drawEl}
                isSelected={selectedId === drawEl.id}
                zoom={zoom}
                onSelect={handleItemSelect}
                onDelete={onDeleteElement}
              />
            ))}
          </svg>

          {/* Active Live Drawing Layer (pen / highlight) */}
          <DrawingLayer
            currentPage={currentPage}
            zoom={zoom}
            pageWidth={pageWidth}
            pageHeight={pageHeight}
            isActive={activeTool === 'draw' || activeTool === 'highlight'}
            isHighlighter={activeTool === 'highlight'}
            strokeColor={activeTool === 'highlight' ? '#facc15' : '#0f172a'}
            strokeWidth={activeTool === 'highlight' ? 18 : 3}
            onFinishStroke={(newStroke) => onAddElement(newStroke)}
          />

          {/* Interactive Annotation & Objects Layer */}
          <div className="absolute inset-0 pointer-events-auto overflow-visible z-20">
            {nonDrawingElements.map((el) => {
              if (el.type === 'text') {
                return (
                  <TextElementItem
                    key={el.id}
                    element={el as TextElement}
                    isSelected={selectedId === el.id}
                    zoom={zoom}
                    pageWidth={pageWidth}
                    pageHeight={pageHeight}
                    onSelect={handleItemSelect}
                    onUpdate={onUpdateElement}
                    onDelete={onDeleteElement}
                    onDuplicate={onDuplicateElement}
                  />
                );
              }

              if (el.type === 'shape') {
                return (
                  <ShapeElementItem
                    key={el.id}
                    element={el as ShapeElement}
                    isSelected={selectedId === el.id}
                    zoom={zoom}
                    pageWidth={pageWidth}
                    pageHeight={pageHeight}
                    onSelect={handleItemSelect}
                    onUpdate={onUpdateElement}
                    onDelete={onDeleteElement}
                    onDuplicate={onDuplicateElement}
                  />
                );
              }

              if (el.type === 'image' || el.type === 'signature') {
                return (
                  <ImageElementItem
                    key={el.id}
                    element={el as ImageElement | SignatureElement}
                    isSelected={selectedId === el.id}
                    zoom={zoom}
                    pageWidth={pageWidth}
                    pageHeight={pageHeight}
                    onSelect={handleItemSelect}
                    onUpdate={onUpdateElement}
                    onDelete={onDeleteElement}
                    onDuplicate={onDuplicateElement}
                  />
                );
              }

              if (el.type === 'stamp') {
                return (
                  <StampElementItem
                    key={el.id}
                    element={el as StampElement}
                    isSelected={selectedId === el.id}
                    zoom={zoom}
                    pageWidth={pageWidth}
                    pageHeight={pageHeight}
                    onSelect={handleItemSelect}
                    onUpdate={onUpdateElement}
                    onDelete={onDeleteElement}
                    onDuplicate={onDuplicateElement}
                  />
                );
              }

              if (el.type === 'redact') {
                return (
                  <RedactElementItem
                    key={el.id}
                    element={el as RedactElement}
                    isSelected={selectedId === el.id}
                    zoom={zoom}
                    pageWidth={pageWidth}
                    pageHeight={pageHeight}
                    onSelect={handleItemSelect}
                    onUpdate={onUpdateElement}
                    onDelete={onDeleteElement}
                  />
                );
              }

              if (el.type === 'comment') {
                return (
                  <CommentElementItem
                    key={el.id}
                    element={el as CommentElement}
                    isSelected={selectedId === el.id}
                    zoom={zoom}
                    pageWidth={pageWidth}
                    pageHeight={pageHeight}
                    onSelect={handleItemSelect}
                    onUpdate={onUpdateElement}
                    onDelete={onDeleteElement}
                  />
                );
              }

              return null;
            })}
          </div>

          {/* Interactive PDF Text Extraction Overlay */}
          {activeTool === 'edit-pdf-text' && (
            <div
              className="absolute inset-0 pointer-events-auto z-25"
              style={{ width: `${pageWidth * zoomScale}px`, height: `${pageHeight * zoomScale}px` }}
            >
              {extractedWords.map((word) => {
                // Check if an existing text element already covers this exact word
                const isCovered = nonDrawingElements.some(
                  (el) =>
                    el.type === 'text' &&
                    (el as TextElement).coverOriginal &&
                    Math.abs(el.x - word.x) < 18 &&
                    Math.abs(el.y - word.y) < 14
                );

                if (isCovered) return null;

                const left = word.x * zoomScale;
                const top = word.y * zoomScale;
                const width = Math.max(word.width * zoomScale, 14);
                const height = Math.max(word.height * zoomScale, 14);

                return (
                  <button
                    key={word.id}
                    type="button"
                    onClick={(e) => handleEditPdfWord(word, e)}
                    title={`Click to edit text: "${word.text}"`}
                    style={{
                      position: 'absolute',
                      left: `${left}px`,
                      top: `${top}px`,
                      width: `${width}px`,
                      height: `${height}px`,
                    }}
                    className="group border border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/30 hover:border-emerald-600 rounded-xs transition-all cursor-pointer text-left focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <span className="sr-only">Edit {word.text}</span>
                  </button>
                );
              })}

              {/* Informative Floating Notification */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-neutral-900/90 text-white backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-lg text-[11px] font-medium flex items-center gap-2 pointer-events-none z-30">
                {loadingWords ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    <span>Detecting text in page {currentPage}...</span>
                  </>
                ) : extractedWords.length > 0 ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>
                      <strong>{extractedWords.length} text items detected.</strong> Click any word to edit in place.
                    </span>
                  </>
                ) : (
                  <span>Click anywhere on the document to add editable text.</span>
                )}
              </div>
            </div>
          )}

          {/* Loading Indicator Overlay */}
          {isRendering && (
            <div className="absolute inset-0 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2 z-30">
              <Loader2 className="w-7 h-7 text-emerald-600 animate-spin" />
              <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                Rendering page {currentPage}...
              </span>
            </div>
          )}

          {/* Render Error Overlay */}
          {renderError && !isRendering && (
            <div className="absolute inset-0 bg-rose-50/90 dark:bg-rose-950/90 flex flex-col items-center justify-center gap-2 p-4 text-center z-30">
              <span className="text-xs font-bold text-rose-700 dark:text-rose-300">{renderError}</span>
            </div>
          )}
        </div>

        {/* Page Tag at Bottom-Right of Document */}
        <div className="mt-2 text-right">
          <span className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 font-mono">
            Page {currentPage} of {totalPages}
            {pageDimensions && (
              <> • {Math.round(pageDimensions.width)} × {Math.round(pageDimensions.height)} pt</>
            )}
          </span>
        </div>
      </div>

      {/* Floating Bottom Navigation & Zoom Bar */}
      <nav
        aria-label="Viewport and Page Navigation"
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md rounded-2xl border border-neutral-200/90 dark:border-neutral-800 shadow-xl px-3 py-2 flex items-center gap-2 text-xs font-medium text-neutral-700 dark:text-neutral-200"
      >
        {/* Page Step Navigation */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={onPrevPage}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="Previous Page (Left Arrow)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 py-0.5 rounded-md font-bold text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800 font-mono">
            {currentPage} <span className="text-neutral-400 font-normal">/ {totalPages}</span>
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={onNextPage}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="Next Page (Right Arrow)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800 mx-1" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onZoomOut}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
            title="Zoom Out (Ctrl -)"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onResetZoom}
            className="px-2 py-0.5 rounded font-bold min-w-[50px] text-center hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer font-mono"
            title="Click to reset zoom to 100%"
          >
            {zoom}%
          </button>

          <button
            type="button"
            onClick={onZoomIn}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
            title="Zoom In (Ctrl +)"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800 mx-1 hidden sm:block" />

        {/* Fit Width / Fit Page */}
        <div className="hidden sm:flex items-center gap-1">
          <button
            type="button"
            onClick={handleFitWidth}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
            title="Fit to Width"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleFitPage}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
            title="Fit whole Page"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {onRotatePage && (
          <>
            <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800 mx-1" />
            <button
              type="button"
              onClick={onRotatePage}
              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
              title="Rotate view (+90°)"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </nav>
    </main>
  );
};
