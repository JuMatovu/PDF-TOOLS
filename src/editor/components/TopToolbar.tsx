import React, { useState } from 'react';
import {
  FileText,
  Undo2,
  Redo2,
  Download,
  Upload,
  MoreVertical,
  ShieldCheck,
  Info,
  ArrowLeft,
  Sparkles,
  Check,
  Loader2,
} from 'lucide-react';
import { PdfDocumentInfo } from '../types/editorTypes';
import { useRouter } from '../../hooks/useRouter';

interface TopToolbarProps {
  docInfo: PdfDocumentInfo | null;
  onRename: (newName: string) => void;
  onUploadClick: () => void;
  onLoadSample: () => void;
  onExport: () => void;
  isExporting?: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

export const TopToolbar: React.FC<TopToolbarProps> = ({
  docInfo,
  onRename,
  onUploadClick,
  onLoadSample,
  onExport,
  isExporting = false,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
}) => {
  const { navigate } = useRouter();
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(docInfo?.name || 'Untitled Document.pdf');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Sync name input when docInfo changes
  React.useEffect(() => {
    if (docInfo?.name) {
      setNameInput(docInfo.name);
    }
  }, [docInfo?.name]);

  const handleNameSubmit = () => {
    setIsEditingName(false);
    if (nameInput.trim()) {
      onRename(nameInput.trim());
    }
  };

  return (
    <header className="h-14 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-3 sm:px-4 flex items-center justify-between gap-2 z-30 select-none flex-shrink-0">
      {/* Left: Logo & Back */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={() => navigate('/tools')}
          className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          title="Back to all tools"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Brand Logo */}
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-2 cursor-pointer group"
          title="PDFTOOL Home"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs shadow-emerald-600/30 group-hover:bg-emerald-700 transition-colors">
            <FileText className="w-4 h-4" />
          </div>
          <div className="hidden sm:flex items-center gap-1">
            <span className="font-black text-sm tracking-tight text-neutral-900 dark:text-white">
              PDF<span className="text-emerald-600 dark:text-emerald-400">TOOL</span>
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="ml-1 text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/60">
              Editor
            </span>
          </div>
        </div>

        <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800 mx-1 hidden sm:block" />

        {/* Document Title (Editable) */}
        <div className="min-w-0 max-w-[160px] sm:max-w-xs md:max-w-sm">
          {isEditingName ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={handleNameSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNameSubmit();
                  if (e.key === 'Escape') setIsEditingName(false);
                }}
                autoFocus
                className="text-xs font-semibold px-2 py-1 rounded-md border border-emerald-500 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none w-full"
              />
              <button
                type="button"
                onClick={handleNameSubmit}
                className="p-1 text-emerald-600 hover:text-emerald-700 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingName(true)}
              className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:text-emerald-600 dark:hover:text-emerald-400 px-2 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 truncate block text-left transition-colors cursor-pointer"
              title="Click to rename document"
            >
              {docInfo?.name || 'Untitled Document.pdf'}
            </button>
          )}
        </div>
      </div>

      {/* Center: Save status */}
      <div className="hidden lg:flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>Autosaved on device</span>
      </div>

      {/* Right Controls: Undo, Redo, Open, Download, More */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Undo Action */}
        <button
          type="button"
          disabled={!canUndo}
          onClick={onUndo}
          className={`p-2 rounded-lg transition-colors ${
            canUndo
              ? 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer'
              : 'text-neutral-400 dark:text-neutral-600 cursor-not-allowed opacity-40'
          }`}
          title={canUndo ? 'Undo (Ctrl+Z)' : 'Nothing to undo'}
        >
          <Undo2 className="w-4 h-4" />
        </button>

        {/* Redo Action */}
        <button
          type="button"
          disabled={!canRedo}
          onClick={onRedo}
          className={`p-2 rounded-lg transition-colors ${
            canRedo
              ? 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer'
              : 'text-neutral-400 dark:text-neutral-600 cursor-not-allowed opacity-40'
          }`}
          title={canRedo ? 'Redo (Ctrl+Y)' : 'Nothing to redo'}
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800 mx-0.5 hidden sm:block" />

        {/* Upload / Open Document Button */}
        <button
          type="button"
          onClick={onUploadClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-semibold transition-colors cursor-pointer"
          title="Open another PDF file from your device"
        >
          <Upload className="w-3.5 h-3.5 text-neutral-500" />
          <span className="hidden sm:inline">Open PDF</span>
        </button>

        {/* Export / Download Button */}
        <button
          type="button"
          disabled={isExporting}
          onClick={onExport}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs shadow-emerald-600/20 transition-colors cursor-pointer disabled:opacity-50"
          title="Download edited PDF with all flattened annotations and text"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="hidden sm:inline">Exporting...</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export PDF</span>
            </>
          )}
        </button>

        {/* More Menu Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMoreMenu((prev) => !prev)}
            className="p-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title="More document options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMoreMenu && (
            <div
              className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl py-1.5 z-50 text-xs"
              onMouseLeave={() => setShowMoreMenu(false)}
            >
              <button
                type="button"
                onClick={() => {
                  setShowMoreMenu(false);
                  onLoadSample();
                }}
                className="w-full px-3 py-2 flex items-center gap-2 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Load Sample Document</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMoreMenu(false);
                  setShowInfoModal(true);
                }}
                className="w-full px-3 py-2 flex items-center gap-2 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left cursor-pointer"
              >
                <Info className="w-3.5 h-3.5 text-emerald-600" />
                <span>Document Information</span>
              </button>

              <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />

              <div className="px-3 py-2 flex items-start gap-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Your document stays on this device while you edit. Zero cloud uploads.</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Simple Document Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Document Information</h3>
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="text-neutral-400 hover:text-neutral-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-300">
              <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-neutral-400">Name</span>
                <span className="font-semibold text-right truncate max-w-[180px]">{docInfo?.name || 'Unknown'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-neutral-400">Page Count</span>
                <span className="font-semibold">{docInfo?.pageCount || 1} Pages</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-neutral-400">File Size</span>
                <span className="font-semibold">
                  {docInfo?.size ? `${(docInfo.size / (1024 * 1024)).toFixed(2)} MB` : 'In Memory'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-neutral-400">Security</span>
                <span className="font-semibold text-emerald-600">Client-Side Local</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowInfoModal(false)}
              className="w-full py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 font-bold text-xs hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
