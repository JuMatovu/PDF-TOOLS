import React, { useState } from 'react';
import { useRouter } from '../hooks/useRouter';
import {
  FileText,
  MousePointer,
  Type,
  Image as ImageIcon,
  PenTool,
  Highlighter,
  Shapes,
  Eraser,
  Save,
  Download,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
  Undo2,
  Redo2,
  Sliders,
  Maximize2,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

type ActiveTool = 'select' | 'text' | 'image' | 'draw' | 'highlight' | 'shapes' | 'eraser';

export const EditorPage: React.FC = () => {
  const { navigate } = useRouter();

  const [activeTool, setActiveTool] = useState<ActiveTool>('select');
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 4;
  const [zoom, setZoom] = useState(100);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [selectedFont, setSelectedFont] = useState('Inter');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>('left');
  const [documentName, setDocumentName] = useState('sample-contract.pdf');
  const [savedNotification, setSavedNotification] = useState(false);

  const colors = [
    { label: 'Black', hex: '#000000', class: 'bg-black' },
    { label: 'Red', hex: '#EF4444', class: 'bg-red-500' },
    { label: 'Green', hex: '#10B981', class: 'bg-emerald-500' },
    { label: 'Blue', hex: '#3B82F6', class: 'bg-blue-500' },
    { label: 'Yellow', hex: '#FACC15', class: 'bg-amber-400' },
    { label: 'Purple', hex: '#8B5CF6', class: 'bg-purple-500' },
  ];

  const handleSave = () => {
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 2000);
  };

  const handleDownload = () => {
    // Generates a mock instant download notification
    alert(`Downloading edited document: ${documentName}`);
  };

  return (
    <div id="pdftool-editor" className="min-h-screen flex flex-col bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-white">
      {/* 1. TOP TOOLBAR */}
      <header className="h-16 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-4 flex items-center justify-between flex-shrink-0 z-20 shadow-xs">
        {/* Left: Brand & Document Name */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
            title="Back to PDFTOOL Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div className="hidden sm:flex items-center gap-1 font-bold text-sm tracking-tight text-neutral-900 dark:text-white mr-2">
              PDF<span className="text-emerald-600">TOOL</span>
            </div>
          </div>

          <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-700 hidden sm:block" />

          {/* Document name input */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-400 hidden md:inline">Document:</span>
            <input
              type="text"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              className="px-2.5 py-1 text-xs font-semibold rounded-md border border-transparent hover:border-neutral-300 dark:hover:border-neutral-700 bg-transparent text-neutral-800 dark:text-neutral-200 focus:bg-white dark:focus:bg-neutral-800 focus:border-emerald-500 outline-none max-w-[140px] sm:max-w-[220px]"
            />
          </div>
        </div>

        {/* Center: Undo/Redo & History */}
        <div className="hidden md:flex items-center gap-1 text-neutral-500 dark:text-neutral-400">
          <button
            type="button"
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Actions (Save, Download, More) */}
        <div className="flex items-center gap-2">
          {savedNotification && (
            <span className="text-xs text-emerald-600 font-semibold px-2 py-1 bg-emerald-50 dark:bg-emerald-950/60 rounded-md animate-fade-in">
              Changes Saved!
            </span>
          )}

          {/* Save Button (Green) */}
          <button
            type="button"
            id="editor-save-btn"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save</span>
          </button>

          {/* Download Button (Yellow) */}
          <button
            type="button"
            id="editor-download-btn"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-neutral-950 font-bold text-xs border border-amber-500/40 transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>

          <button
            type="button"
            className="p-2 rounded-xl text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
            title="More Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT TOOLBAR */}
        <aside
          id="editor-left-toolbar"
          className="w-16 sm:w-20 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col items-center py-4 space-y-2 flex-shrink-0 z-10 shadow-xs"
        >
          <button
            type="button"
            onClick={() => setActiveTool('select')}
            title="Select tool"
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTool === 'select'
                ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-300 dark:border-emerald-700'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <MousePointer className="w-4 h-4" />
            <span className="text-[10px] font-medium leading-none">Select</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTool('text')}
            title="Add Text"
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTool === 'text'
                ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-300 dark:border-emerald-700'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Type className="w-4 h-4" />
            <span className="text-[10px] font-medium leading-none">Text</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTool('image')}
            title="Insert Image"
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTool === 'image'
                ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-300 dark:border-emerald-700'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span className="text-[10px] font-medium leading-none">Image</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTool('draw')}
            title="Freehand Draw / Signature"
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTool === 'draw'
                ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-300 dark:border-emerald-700'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span className="text-[10px] font-medium leading-none">Draw</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTool('highlight')}
            title="Highlighter"
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTool === 'highlight'
                ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-300 dark:border-emerald-700'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Highlighter className="w-4 h-4" />
            <span className="text-[10px] font-medium leading-none">Highlight</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTool('shapes')}
            title="Insert Shapes"
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTool === 'shapes'
                ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-300 dark:border-emerald-700'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Shapes className="w-4 h-4" />
            <span className="text-[10px] font-medium leading-none">Shapes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTool('eraser')}
            title="Eraser"
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTool === 'eraser'
                ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-300 dark:border-emerald-700'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Eraser className="w-4 h-4" />
            <span className="text-[10px] font-medium leading-none">Eraser</span>
          </button>
        </aside>

        {/* CENTER CANVAS AREA */}
        <main
          id="editor-canvas-container"
          className="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center bg-neutral-200/70 dark:bg-neutral-950"
        >
          {/* Realistic PDF Paper Canvas */}
          <div
            id="pdf-document-canvas"
            className="relative bg-white text-neutral-900 shadow-2xl rounded-sm transition-transform duration-200 select-none"
            style={{
              width: '680px',
              minHeight: '880px',
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
            }}
          >
            {/* Document Header */}
            <div className="p-10 pb-6 border-b border-neutral-100">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-neutral-900">
                    SAMPLE <span className="text-amber-500">DOCUMENT</span>
                  </h1>
                  <p className="text-xs text-neutral-400 mt-1 uppercase tracking-widest font-mono">
                    CONFIDENTIAL AGREEMENT • PAGE {currentPage} OF {totalPages}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center font-bold text-neutral-400 text-xs">
                  PAGE {currentPage}
                </div>
              </div>
            </div>

            {/* Document Body Sample Content */}
            <div className="p-10 space-y-6 text-sm text-neutral-700 leading-relaxed">
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>

              {/* Sample Embedded Image with caption (matching reference) */}
              <div className="grid grid-cols-12 gap-4 items-center pt-2">
                <div className="col-span-7 space-y-2">
                  <p className="text-xs text-neutral-600">
                    Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                  </p>
                  <p className="text-xs text-neutral-600">
                    Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam.
                  </p>
                </div>

                <div className="col-span-5">
                  <div className="rounded-xl overflow-hidden border border-neutral-200 shadow-sm bg-neutral-100 relative group">
                    <img
                      src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80"
                      alt="Landscape attachment placeholder"
                      className="w-full h-32 object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-white font-mono">
                      Figure 1.1
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Draggable/Selectable Signature Box (matching reference image) */}
              <div className="mt-8 pt-6 border-t border-dashed border-neutral-300">
                <div className="text-xs font-semibold text-neutral-400 mb-2 uppercase tracking-wider">
                  Authorized Signatory:
                </div>

                {/* Selection frame box with handles and delete button */}
                <div className="relative inline-block p-4 rounded-lg border-2 border-blue-500 bg-blue-50/20 shadow-xs cursor-move">
                  {/* Four corner resizing dots */}
                  <span className="w-2.5 h-2.5 rounded-full bg-white border-2 border-blue-500 absolute -top-1.5 -left-1.5" />
                  <span className="w-2.5 h-2.5 rounded-full bg-white border-2 border-blue-500 absolute -top-1.5 -right-1.5" />
                  <span className="w-2.5 h-2.5 rounded-full bg-white border-2 border-blue-500 absolute -bottom-1.5 -left-1.5" />
                  <span className="w-2.5 h-2.5 rounded-full bg-white border-2 border-blue-500 absolute -bottom-1.5 -right-1.5" />

                  {/* Delete Trash Icon at top-right */}
                  <button
                    type="button"
                    title="Delete element"
                    className="absolute -top-3.5 right-4 p-1 rounded bg-white shadow-md border border-neutral-200 text-red-500 hover:text-red-700 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Elegant Signature Drawing representation */}
                  <div className="font-serif italic text-2xl text-blue-900 tracking-wide font-light select-none px-4 py-1">
                    John Doe
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-1 border-t border-neutral-200 pt-0.5">
                    Verified Digital Signature • 2026-09-03
                  </div>
                </div>
              </div>
            </div>

            {/* Document Footer */}
            <div className="absolute bottom-6 left-10 right-10 flex justify-between text-[11px] text-neutral-400 border-t border-neutral-100 pt-3 font-mono">
              <span>PDFTOOL Browser Engine</span>
              <span>CONFIDENTIAL</span>
              <span>Page {currentPage} of {totalPages}</span>
            </div>
          </div>
        </main>

        {/* RIGHT CONTROL PANEL */}
        <aside
          id="editor-right-panel"
          className="w-72 bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 p-5 space-y-6 flex-shrink-0 overflow-y-auto hidden lg:block shadow-xs"
        >
          {/* 1. Page Navigation (< 1 / 4 >) */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-neutral-400 dark:text-neutral-500 tracking-wider">
              Page Navigation
            </label>
            <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-neutral-700 disabled:opacity-30 cursor-pointer text-neutral-700 dark:text-neutral-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-neutral-700 disabled:opacity-30 cursor-pointer text-neutral-700 dark:text-neutral-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 2. Zoom Controls (- 100% +) */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-neutral-400 dark:text-neutral-500 tracking-wider">
              Zoom
            </label>
            <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(50, z - 10))}
                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-neutral-700 cursor-pointer text-neutral-700 dark:text-neutral-200"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 tabular-nums">
                {zoom}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(175, z + 10))}
                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-neutral-700 cursor-pointer text-neutral-700 dark:text-neutral-200"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 3. Color Palette Swatches (Black, Red, Green, Blue, Yellow, Purple) */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-neutral-400 dark:text-neutral-500 tracking-wider">
              Color Palette
            </label>
            <div className="flex items-center justify-between gap-1.5 p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
              {colors.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setSelectedColor(c.hex)}
                  title={c.label}
                  className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${c.class} ${
                    selectedColor === c.hex
                      ? 'ring-2 ring-emerald-500 ring-offset-2 scale-110'
                      : 'hover:scale-105'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* 4. Font Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-neutral-400 dark:text-neutral-500 tracking-wider">
              Font Family
            </label>
            <select
              value={selectedFont}
              onChange={(e) => setSelectedFont(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Inter">Inter (Sans-serif)</option>
              <option value="Roboto">Roboto</option>
              <option value="Times New Roman">Times New Roman (Serif)</option>
              <option value="Courier New">Courier New (Monospace)</option>
            </select>
          </div>

          {/* 5. Typography Formatting (B, I, U, Alignment) */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-neutral-400 dark:text-neutral-500 tracking-wider">
              Style & Alignment
            </label>
            <div className="grid grid-cols-6 gap-1 p-1.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
              <button
                type="button"
                onClick={() => setIsBold(!isBold)}
                className={`p-1.5 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                  isBold ? 'bg-white dark:bg-neutral-700 text-emerald-600 shadow-xs' : 'text-neutral-600 dark:text-neutral-400'
                }`}
                title="Bold"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsItalic(!isItalic)}
                className={`p-1.5 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                  isItalic ? 'bg-white dark:bg-neutral-700 text-emerald-600 shadow-xs' : 'text-neutral-600 dark:text-neutral-400'
                }`}
                title="Italic"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsUnderline(!isUnderline)}
                className={`p-1.5 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                  isUnderline ? 'bg-white dark:bg-neutral-700 text-emerald-600 shadow-xs' : 'text-neutral-600 dark:text-neutral-400'
                }`}
                title="Underline"
              >
                <Underline className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setAlignment('left')}
                className={`p-1.5 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                  alignment === 'left' ? 'bg-white dark:bg-neutral-700 text-emerald-600 shadow-xs' : 'text-neutral-600 dark:text-neutral-400'
                }`}
                title="Align Left"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setAlignment('center')}
                className={`p-1.5 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                  alignment === 'center' ? 'bg-white dark:bg-neutral-700 text-emerald-600 shadow-xs' : 'text-neutral-600 dark:text-neutral-400'
                }`}
                title="Align Center"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setAlignment('right')}
                className={`p-1.5 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                  alignment === 'right' ? 'bg-white dark:bg-neutral-700 text-emerald-600 shadow-xs' : 'text-neutral-600 dark:text-neutral-400'
                }`}
                title="Align Right"
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Notice */}
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-[11px] text-amber-900 dark:text-amber-300 flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>This is the complete visual editor shell. WebAssembly editing engine will connect here in the next stage.</span>
          </div>
        </aside>
      </div>
    </div>
  );
};
