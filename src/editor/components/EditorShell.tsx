import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { usePdfDocument } from '../hooks/usePdfDocument';
import { useZoom } from '../hooks/useZoom';
import { useHistory } from '../hooks/useHistory';
import {
  EditorTool,
  PageAction,
  EditorElement,
  ShapeType,
  ImageElement,
  SignatureElement,
  StampElement,
} from '../types/editorTypes';
import { TopToolbar } from './TopToolbar';
import { LeftToolbar } from './LeftToolbar';
import { PagePanel } from './PagePanel';
import { PdfCanvas } from './PdfCanvas';
import { RightSidebar } from './RightSidebar';
import { SignatureModal } from './SignatureModal';
import { StampSelectorModal } from './StampSelectorModal';
import { PdfExporter } from '../services/pdfExporter';
import { PdfRendererService } from '../services/pdfRendererService';
import { indexedDbService } from '../services/indexedDbService';
import { Upload, AlertCircle, CheckCircle2 } from 'lucide-react';

interface EditorShellProps {
  initialFile?: File;
}

export const EditorShell: React.FC<EditorShellProps> = ({ initialFile }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [activeTool, setActiveTool] = useState<EditorTool>('select');
  const [activeShapeType, setActiveShapeType] = useState<ShapeType>('rectangle');
  const [isPagesOpen, setIsPagesOpen] = useState<boolean>(true);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState<boolean>(true);
  const [pageRotations, setPageRotations] = useState<Record<number, number>>({});
  const [isDragOverWindow, setIsDragOverWindow] = useState<boolean>(false);

  // Modal Dialogs
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState<boolean>(false);
  const [isStampModalOpen, setIsStampModalOpen] = useState<boolean>(false);

  // Export State
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  const {
    docInfo,
    currentPage,
    pageCount,
    currentDimensions,
    error,
    loadFromFile,
    loadSampleDocument,
    loadFromBuffer,
    goToPage,
    nextPage,
    prevPage,
    renameDocument,
    clearError,
    addBlankPage,
    duplicateCurrentPage,
    deleteCurrentPage,
    getPdfBuffer,
  } = usePdfDocument();

  const {
    zoom,
    fitWidth,
    fitPage,
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,
  } = useZoom(100);

  // Undo / Redo & Elements State
  const {
    elements,
    selectedId,
    canUndo,
    canRedo,
    setSelectedId,
    setElementsDirect,
    pushState,
    undo,
    redo,
    resetHistory,
  } = useHistory([]);

  // Load initial file, restore from IndexedDB session, or load welcome sample
  useEffect(() => {
    let isCancelled = false;

    const init = async () => {
      if (initialFile) {
        await loadFromFile(initialFile);
        resetHistory([]);
        return;
      }

      // Check if previous session exists in IndexedDB
      const previousSession = await indexedDbService.getLatestSession();
      if (!isCancelled && previousSession && previousSession.pdfData && previousSession.pdfData.byteLength > 0) {
        try {
          await loadFromBuffer(previousSession.pdfData, previousSession.name);
          resetHistory(previousSession.elements || []);
          if (previousSession.rotations) {
            setPageRotations(previousSession.rotations);
          }
          return;
        } catch (restoreErr) {
          console.warn('[EditorShell] Could not restore previous session:', restoreErr);
        }
      }

      // Fallback: Welcome sample document
      if (!isCancelled) {
        await loadSampleDocument();
        resetHistory([
          {
            id: 'sample_text_1',
            type: 'text',
            pageNumber: 1,
            x: 65,
            y: 480,
            width: 380,
            height: 38,
            text: 'PDFTOOL: Click me to edit text, format, or move me!',
            fontSize: 15,
            fontFamily: 'Roboto',
            color: '#16a34a',
            isBold: true,
            isItalic: false,
            isUnderline: false,
            alignment: 'left',
          },
        ]);
      }
    };

    init();

    return () => {
      isCancelled = true;
    };
  }, [initialFile]);

  // Debounced Autosave to IndexedDB
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!docInfo) return;
      const rawBuffer = PdfRendererService.getInstance().getRawBuffer();
      if (rawBuffer && rawBuffer.byteLength > 0) {
        await indexedDbService.saveSession({
          id: docInfo.id || 'default_session',
          name: docInfo.name || 'document.pdf',
          pdfData: rawBuffer,
          elements,
          rotations: pageRotations,
          pageCount,
          lastModified: Date.now(),
        });
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [docInfo, elements, pageRotations, pageCount]);

  // Selected element lookup across all types
  const selectedElement = useMemo(() => {
    if (!selectedId) return null;
    return elements.find((el) => el.id === selectedId) || null;
  }, [elements, selectedId]);

  // Add new element (generic)
  const handleAddElement = useCallback(
    (newElement: EditorElement) => {
      const nextElements = [...elements, newElement];
      pushState(nextElements, `Add ${newElement.type}`, newElement.id);
      // Automatically switch back to select tool so user can manipulate or move right away
      if (activeTool !== 'draw' && activeTool !== 'highlight') {
        setActiveTool('select');
      }
    },
    [elements, pushState, activeTool]
  );

  // Update existing element
  const handleUpdateElement = useCallback(
    (id: string, updates: Partial<EditorElement>, recordHistory = true) => {
      const updatedElements = elements.map((el) => {
        if (el.id === id) {
          return { ...el, ...updates } as EditorElement;
        }
        return el;
      });

      if (recordHistory) {
        pushState(updatedElements, 'Update element');
      } else {
        setElementsDirect(updatedElements);
      }
    },
    [elements, pushState, setElementsDirect]
  );

  // Delete element
  const handleDeleteElement = useCallback(
    (id: string) => {
      const filtered = elements.filter((el) => el.id !== id);
      const nextSelected = selectedId === id ? null : selectedId;
      pushState(filtered, 'Delete element', nextSelected);
    },
    [elements, selectedId, pushState]
  );

  // Duplicate element
  const handleDuplicateElement = useCallback(
    (id: string) => {
      const original = elements.find((el) => el.id === id);
      if (!original) return;

      const duplicated: EditorElement = {
        ...original,
        id: crypto.randomUUID ? crypto.randomUUID() : `${original.type}_${Date.now()}_copy`,
        x: (original.x || 0) + 16,
        y: (original.y || 0) + 16,
      };

      const nextElements = [...elements, duplicated];
      pushState(nextElements, `Duplicate ${original.type}`, duplicated.id);
    },
    [elements, pushState]
  );

  // Tool Selection Handlers
  const handleSelectTool = (tool: EditorTool, shapeType?: ShapeType) => {
    if (shapeType) {
      setActiveShapeType(shapeType);
    }

    if (tool === 'signature') {
      setIsSignatureModalOpen(true);
      return;
    }

    if (tool === 'stamp') {
      setIsStampModalOpen(true);
      return;
    }

    if (tool === 'image') {
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
        imageInputRef.current.click();
      }
      return;
    }

    setActiveTool(tool);
  };

  // Image Upload Handler
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const img = new Image();
        img.onload = () => {
          const aspect = img.width / (img.height || 1);
          const maxDisplayW = Math.min(220, (currentDimensions?.width || 600) * 0.4);
          const targetH = maxDisplayW / aspect;

          const newImgEl: ImageElement = {
            id: crypto.randomUUID ? crypto.randomUUID() : `img_${Date.now()}`,
            type: 'image',
            pageNumber: currentPage,
            x: 80,
            y: 120,
            width: maxDisplayW,
            height: targetH,
            dataUrl: reader.result as string,
            originalWidth: img.width,
            originalHeight: img.height,
            aspectRatio: aspect,
            mimeType: file.type,
            opacity: 1.0,
          };

          handleAddElement(newImgEl);
          setActiveTool('select');
        };
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  };

  // Signature Save from Modal
  const handleSaveSignature = (dataUrl: string, sigType: 'draw' | 'type' | 'upload') => {
    const newSigEl: SignatureElement = {
      id: crypto.randomUUID ? crypto.randomUUID() : `sig_${Date.now()}`,
      type: 'signature',
      signatureType: sigType,
      pageNumber: currentPage,
      x: 100,
      y: 200,
      width: 180,
      height: 70,
      dataUrl,
      opacity: 1.0,
    };
    handleAddElement(newSigEl);
    setActiveTool('select');
  };

  // Stamp Select from Modal
  const handleSelectStamp = (stamp: Omit<StampElement, 'id' | 'pageNumber' | 'x' | 'y'>) => {
    const newStampEl: StampElement = {
      ...stamp,
      id: crypto.randomUUID ? crypto.randomUUID() : `stamp_${Date.now()}`,
      pageNumber: currentPage,
      x: 120,
      y: 160,
    };
    handleAddElement(newStampEl);
    setActiveTool('select');
  };

  // Export / Download PDF (Flattening all annotations)
  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      const rawPdfBytes = getPdfBuffer() || PdfRendererService.getInstance().getRawBuffer();
      if (!rawPdfBytes || rawPdfBytes.byteLength === 0) {
        throw new Error('PDF document buffer is not ready. Please wait a moment or reload the document.');
      }

      const exportedBytes = await PdfExporter.exportPdf({
        originalPdfBytes: rawPdfBytes,
        elements,
        pageRotations,
        fileName: docInfo?.name || 'document_edited.pdf',
      });

      const fileName = docInfo?.name ? (docInfo.name.endsWith('.pdf') ? docInfo.name : `${docInfo.name}.pdf`) : 'edited_document.pdf';
      PdfExporter.downloadBlob(exportedBytes, fileName);

      setExportSuccessMessage(`Downloaded ${fileName} successfully!`);
      setTimeout(() => setExportSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('[EditorShell] Export error:', err);
      alert('Failed to export PDF: ' + (err?.message || 'Unknown error.'));
    } finally {
      setIsExporting(false);
    }
  };

  // Page Actions (Rotate, Add, Duplicate, Delete)
  const handleRotateCurrentPage = () => {
    setPageRotations((prev) => {
      const current = prev[currentPage] || 0;
      return {
        ...prev,
        [currentPage]: (current + 90) % 360,
      };
    });
  };

  const handlePageAction = async (action: PageAction) => {
    if (action === 'rotate') {
      handleRotateCurrentPage();
    } else if (action === 'add') {
      await addBlankPage(currentPage);
    } else if (action === 'duplicate') {
      await duplicateCurrentPage(currentPage);
    } else if (action === 'delete') {
      await deleteCurrentPage(currentPage);
    }
  };

  // Handle global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isTyping =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable;

      // Undo: Ctrl+Z / Cmd+Z
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        if (!isTyping && canUndo) {
          e.preventDefault();
          undo();
        }
      }
      // Redo: Ctrl+Y / Cmd+Y or Ctrl+Shift+Z
      else if (
        ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z'))
      ) {
        if (!isTyping && canRedo) {
          e.preventDefault();
          redo();
        }
      }
      // Delete selected element: Delete or Backspace
      else if ((e.key === 'Delete' || e.key === 'Backspace') && !isTyping && selectedId) {
        e.preventDefault();
        handleDeleteElement(selectedId);
      }
      // Duplicate: Ctrl+D / Cmd+D
      else if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D') && !isTyping && selectedId) {
        e.preventDefault();
        handleDuplicateElement(selectedId);
      }
      // Escape: Deselect
      else if (e.key === 'Escape') {
        setSelectedId(null);
      }
      // Tool shortcuts: V = Select, T = Text
      else if (!isTyping && !e.ctrlKey && !e.metaKey) {
        if (e.key === 'v' || e.key === 'V') {
          setActiveTool('select');
        } else if (e.key === 't' || e.key === 'T') {
          setActiveTool('text');
        }
      }
      // Zoom in
      else if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        zoomIn();
      }
      // Zoom out
      else if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        zoomOut();
      }
      // Reset zoom
      else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        resetZoom();
      }
      // Page Navigation
      else if (!isTyping && (e.key === 'ArrowLeft' || e.key === 'PageUp')) {
        e.preventDefault();
        prevPage();
      } else if (!isTyping && (e.key === 'ArrowRight' || e.key === 'PageDown')) {
        e.preventDefault();
        nextPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    canUndo,
    canRedo,
    undo,
    redo,
    selectedId,
    handleDeleteElement,
    handleDuplicateElement,
    setSelectedId,
    zoomIn,
    zoomOut,
    resetZoom,
    prevPage,
    nextPage,
  ]);

  // File Upload Dialog Handler
  const handleOpenFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && files[0].name.toLowerCase().endsWith('.pdf')) {
      loadFromFile(files[0]);
      resetHistory([]);
      setPageRotations({});
    }
  };

  // Drag & drop handlers for opening files directly onto editor
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverWindow(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
      setIsDragOverWindow(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverWindow(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith('.pdf')) {
        loadFromFile(file);
        resetHistory([]);
        setPageRotations({});
      }
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 dark:bg-neutral-950 font-sans text-neutral-900 dark:text-neutral-100"
      style={{ fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      {/* Hidden File Input for PDF uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Hidden File Input for Image insertions */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        className="hidden"
        onChange={handleImageFileChange}
      />

      {/* Top Navigation & Status Bar with Undo & Redo and Export */}
      <TopToolbar
        docInfo={docInfo}
        onRename={renameDocument}
        onUploadClick={handleOpenFileDialog}
        onLoadSample={() => {
          loadSampleDocument();
          resetHistory([]);
          setPageRotations({});
        }}
        onExport={handleExportPdf}
        isExporting={isExporting}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
      />

      {/* Main Center Area: Left Toolbar + Page Panel + Canvas + Right Sidebar */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Vertical Tool Rack */}
        <LeftToolbar
          activeTool={activeTool}
          activeShapeType={activeShapeType}
          onSelectTool={handleSelectTool}
          onPageAction={handlePageAction}
          canDeletePage={pageCount > 1}
        />

        {/* Page Thumbnails Panel (Collapsible) */}
        <PagePanel
          pageCount={pageCount}
          currentPage={currentPage}
          onSelectPage={(pageNum) => {
            goToPage(pageNum);
            setSelectedId(null);
          }}
          isOpen={isPagesOpen}
          onToggle={() => setIsPagesOpen((prev) => !prev)}
          rotations={pageRotations}
        />

        {/* Main PDF Canvas Workspace */}
        <PdfCanvas
          currentPage={currentPage}
          totalPages={pageCount}
          zoom={zoom}
          pageDimensions={currentDimensions}
          elements={elements}
          selectedId={selectedId}
          activeTool={activeTool}
          activeShapeType={activeShapeType}
          onSelectElement={(id) => setSelectedId(id)}
          onAddElement={handleAddElement}
          onUpdateElement={handleUpdateElement}
          onDeleteElement={handleDeleteElement}
          onDuplicateElement={handleDuplicateElement}
          onNextPage={() => {
            nextPage();
            setSelectedId(null);
          }}
          onPrevPage={() => {
            prevPage();
            setSelectedId(null);
          }}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onResetZoom={resetZoom}
          onFitWidth={fitWidth}
          onFitPage={fitPage}
          rotation={pageRotations[currentPage] || 0}
          onRotatePage={handleRotateCurrentPage}
        />

        {/* Right Properties & Viewport Sidebar (Collapsible & Contextual) */}
        <RightSidebar
          docInfo={docInfo}
          currentPage={currentPage}
          totalPages={pageCount}
          pageDimensions={currentDimensions}
          zoom={zoom}
          selectedElement={selectedElement}
          onUpdateSelectedElement={(updates) => selectedId && handleUpdateElement(selectedId, updates, true)}
          onDeleteSelected={() => selectedId && handleDeleteElement(selectedId)}
          onDuplicateSelected={() => selectedId && handleDuplicateElement(selectedId)}
          onDeselect={() => setSelectedId(null)}
          onSetZoom={setZoom}
          onGoToPage={(pageNum) => {
            goToPage(pageNum);
            setSelectedId(null);
          }}
          onRotatePage={handleRotateCurrentPage}
          isOpen={isPropertiesOpen}
          onToggle={() => setIsPropertiesOpen((prev) => !prev)}
        />
      </div>

      {/* Signature Modal Dialog */}
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSaveSignature={handleSaveSignature}
      />

      {/* Stamp Selector Modal Dialog */}
      <StampSelectorModal
        isOpen={isStampModalOpen}
        onClose={() => setIsStampModalOpen(false)}
        onSelectStamp={handleSelectStamp}
      />

      {/* Drag and Drop Fullscreen Overlay */}
      {isDragOverWindow && (
        <div className="fixed inset-0 bg-emerald-950/60 backdrop-blur-xs z-50 flex flex-col items-center justify-center p-6 border-4 border-dashed border-amber-400">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl space-y-4 border border-emerald-500">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto">
              <Upload className="w-8 h-8 animate-bounce" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
              Drop PDF to Open in Editor
            </h3>
            <p className="text-xs text-neutral-500">
              The document will be processed locally and immediately rendered on your canvas.
            </p>
          </div>
        </div>
      )}

      {/* Success Notification Toast */}
      {exportSuccessMessage && (
        <div className="fixed bottom-8 right-8 z-50 max-w-sm bg-emerald-600 text-white rounded-2xl p-4 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1 text-xs font-semibold">{exportSuccessMessage}</div>
        </div>
      )}

      {/* Error Banner Modal */}
      {error && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-rose-600 text-white rounded-2xl p-4 shadow-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <div className="font-bold">Error Processing Document</div>
            <div className="mt-0.5 opacity-90">{error}</div>
          </div>
          <button
            type="button"
            onClick={clearError}
            className="text-white/80 hover:text-white font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
