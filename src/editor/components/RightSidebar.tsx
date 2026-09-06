import React from 'react';
import {
  FileText,
  Sliders,
  ZoomIn,
  Type,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
  Copy,
  ChevronRight,
  RotateCw,
  ShieldCheck,
  Shapes,
  Image as ImageIcon,
  PenTool,
  Stamp as StampIcon,
  ShieldAlert,
  MessageSquare,
  Square,
  Circle,
  Minus,
  ArrowRight,
  Triangle,
  Star,
  Diamond,
  FileEdit,
} from 'lucide-react';
import {
  PdfDocumentInfo,
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
  ShapeType,
} from '../types/editorTypes';
import { ZOOM_PRESETS } from '../hooks/useZoom';

interface RightSidebarProps {
  docInfo: PdfDocumentInfo | null;
  currentPage: number;
  totalPages: number;
  pageDimensions: PdfPageDimensions | null;
  zoom: number;
  selectedElement: EditorElement | null;
  onUpdateSelectedElement?: (updates: Partial<EditorElement>) => void;
  onDeleteSelected?: () => void;
  onDuplicateSelected?: () => void;
  onDeselect?: () => void;
  onSetZoom: (zoom: number) => void;
  onGoToPage: (page: number) => void;
  onRotatePage: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

const COLOR_PALETTE = [
  { hex: '#0f172a', label: 'Dark Slate' },
  { hex: '#16a34a', label: 'PDFTOOL Green' },
  { hex: '#d97706', label: 'Amber' },
  { hex: '#dc2626', label: 'Crimson' },
  { hex: '#2563eb', label: 'Royal Blue' },
  { hex: '#7c3aed', label: 'Purple' },
  { hex: '#475569', label: 'Slate Gray' },
  { hex: '#ffffff', label: 'White' },
];

export const RightSidebar: React.FC<RightSidebarProps> = ({
  docInfo,
  currentPage,
  totalPages,
  pageDimensions,
  zoom,
  selectedElement,
  onUpdateSelectedElement,
  onDeleteSelected,
  onDuplicateSelected,
  onDeselect,
  onSetZoom,
  onGoToPage,
  onRotatePage,
  isOpen,
  onToggle,
}) => {
  if (!isOpen) {
    return (
      <div className="border-l border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-1 flex flex-col items-center">
        <button
          type="button"
          onClick={onToggle}
          aria-label="Open Properties Panel"
          title="Open Properties Panel"
          className="p-2 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const formatBytes = (bytes: number): string => {
    if (!bytes) return '0 KB';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  const isLandscape = pageDimensions ? pageDimensions.width > pageDimensions.height : false;

  const renderSelectedHeader = () => {
    if (!selectedElement) {
      return (
        <div className="flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Document & Page</span>
        </div>
      );
    }

    switch (selectedElement.type) {
      case 'text':
        return (
          <div className="flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-emerald-600" />
            <span>Text Properties</span>
          </div>
        );
      case 'shape':
        return (
          <div className="flex items-center gap-1.5">
            <Shapes className="w-3.5 h-3.5 text-emerald-600" />
            <span>Shape Properties</span>
          </div>
        );
      case 'image':
      case 'signature':
        return (
          <div className="flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span>{selectedElement.type === 'signature' ? 'Signature' : 'Image'}</span>
          </div>
        );
      case 'stamp':
        return (
          <div className="flex items-center gap-1.5">
            <StampIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span>Stamp Properties</span>
          </div>
        );
      case 'draw':
        return (
          <div className="flex items-center gap-1.5">
            <PenTool className="w-3.5 h-3.5 text-emerald-600" />
            <span>Drawing Stroke</span>
          </div>
        );
      case 'redact':
        return (
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>Redaction Area</span>
          </div>
        );
      case 'comment':
        return (
          <div className="flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
            <span>Sticky Comment</span>
          </div>
        );
      default:
        return <span>Element</span>;
    }
  };

  return (
    <aside
      aria-label="Document Properties and Viewport Controls"
      className="w-68 bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 flex flex-col h-full z-10 select-none flex-shrink-0"
    >
      {/* Sidebar Header */}
      <div className="h-10 px-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs font-semibold text-neutral-800 dark:text-neutral-200">
        {renderSelectedHeader()}

        <div className="flex items-center gap-1">
          {selectedElement && onDeselect && (
            <button
              type="button"
              onClick={onDeselect}
              className="text-[10px] text-neutral-400 hover:text-neutral-600 px-1.5 py-0.5 rounded hover:bg-neutral-100 cursor-pointer"
              title="Deselect"
            >
              Done
            </button>
          )}
          <button
            type="button"
            onClick={onToggle}
            title="Collapse properties panel"
            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 text-xs">
        {/* ============================================================== */}
        {/* CONTEXTUAL MODE 1: ANY ELEMENT SELECTED */}
        {/* ============================================================== */}
        {selectedElement && onUpdateSelectedElement ? (
          <>
            {/* TEXT PROPERTIES */}
            {selectedElement.type === 'text' && (
              <>
                {(() => {
                  const textEl = selectedElement as TextElement;
                  return (
                    <>
                      {/* Font Family */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                          Font Family
                        </label>
                        <select
                          value={textEl.fontFamily}
                          onChange={(e) => onUpdateSelectedElement({ fontFamily: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-600 cursor-pointer"
                        >
                          <option value="Roboto">Roboto (Recommended)</option>
                          <option value="Helvetica">Helvetica / Arial</option>
                          <option value="Times New Roman">Times New Roman</option>
                          <option value="Courier">Courier New</option>
                        </select>
                      </div>

                      {/* Font Size & Styles */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                          <span>Font Size & Style</span>
                          <span className="font-mono text-emerald-600 font-bold">{textEl.fontSize} pt</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden flex-1 bg-neutral-50 dark:bg-neutral-800">
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateSelectedElement({ fontSize: Math.max(8, textEl.fontSize - 2) })
                              }
                              className="px-2.5 py-1.5 text-xs font-bold hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 cursor-pointer"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={8}
                              max={120}
                              value={textEl.fontSize}
                              onChange={(e) =>
                                onUpdateSelectedElement({
                                  fontSize: Math.max(8, Math.min(120, parseInt(e.target.value, 10) || 12)),
                                })
                              }
                              className="w-full text-center bg-transparent border-none text-xs font-bold font-mono focus:outline-none py-1 text-neutral-900 dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateSelectedElement({ fontSize: Math.min(120, textEl.fontSize + 2) })
                              }
                              className="px-2.5 py-1.5 text-xs font-bold hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 cursor-pointer"
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => onUpdateSelectedElement({ isBold: !textEl.isBold })}
                            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                              textEl.isBold
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100'
                            }`}
                            title="Bold"
                          >
                            <Bold className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onUpdateSelectedElement({ isItalic: !textEl.isItalic })}
                            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                              textEl.isItalic
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100'
                            }`}
                            title="Italic"
                          >
                            <Italic className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onUpdateSelectedElement({ isUnderline: !textEl.isUnderline })}
                            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                              textEl.isUnderline
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100'
                            }`}
                            title="Underline"
                          >
                            <Underline className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Alignment */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                          Alignment
                        </label>
                        <div className="grid grid-cols-3 gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                          <button
                            type="button"
                            onClick={() => onUpdateSelectedElement({ alignment: 'left' })}
                            className={`py-1.5 flex items-center justify-center rounded transition-colors cursor-pointer ${
                              textEl.alignment === 'left'
                                ? 'bg-white dark:bg-neutral-700 shadow-2xs font-bold text-neutral-900 dark:text-white'
                                : 'text-neutral-500 hover:text-neutral-900'
                            }`}
                            title="Align Left"
                          >
                            <AlignLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateSelectedElement({ alignment: 'center' })}
                            className={`py-1.5 flex items-center justify-center rounded transition-colors cursor-pointer ${
                              textEl.alignment === 'center'
                                ? 'bg-white dark:bg-neutral-700 shadow-2xs font-bold text-neutral-900 dark:text-white'
                                : 'text-neutral-500 hover:text-neutral-900'
                            }`}
                            title="Align Center"
                          >
                            <AlignCenter className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateSelectedElement({ alignment: 'right' })}
                            className={`py-1.5 flex items-center justify-center rounded transition-colors cursor-pointer ${
                              textEl.alignment === 'right'
                                ? 'bg-white dark:bg-neutral-700 shadow-2xs font-bold text-neutral-900 dark:text-white'
                                : 'text-neutral-500 hover:text-neutral-900'
                            }`}
                            title="Align Right"
                          >
                            <AlignRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Text Color */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                          <span>Text Color</span>
                          <span className="font-mono text-[10px] text-neutral-400">{textEl.color}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          {COLOR_PALETTE.map((c) => (
                            <button
                              key={c.hex}
                              type="button"
                              onClick={() => onUpdateSelectedElement({ color: c.hex })}
                              className={`h-7 rounded-lg border transition-transform flex items-center justify-center cursor-pointer ${
                                textEl.color.toLowerCase() === c.hex.toLowerCase()
                                  ? 'ring-2 ring-emerald-600 scale-105 shadow-2xs'
                                  : 'border-neutral-200 hover:scale-105'
                              }`}
                              style={{ backgroundColor: c.hex }}
                              title={c.label}
                            />
                          ))}
                        </div>
                      </div>

                      {/* PDF Text Cover Background */}
                      <div className="space-y-1.5 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                            Cover Original PDF Text
                          </span>
                          <input
                            type="checkbox"
                            checked={!!textEl.coverOriginal}
                            onChange={(e) =>
                              onUpdateSelectedElement({
                                coverOriginal: e.target.checked,
                                backgroundColor: e.target.checked ? '#ffffff' : undefined,
                              })
                            }
                            className="accent-emerald-600 cursor-pointer w-4 h-4"
                          />
                        </div>
                        {textEl.coverOriginal && (
                          <p className="text-[10px] text-neutral-400">
                            Draws an opaque patch behind this text to cover original PDF words.
                          </p>
                        )}
                      </div>
                    </>
                  );
                })()}
              </>
            )}

            {/* SHAPE PROPERTIES */}
            {selectedElement.type === 'shape' && (
              <>
                {(() => {
                  const shapeEl = selectedElement as ShapeElement;
                  return (
                    <>
                      {/* Shape Type Selector */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 block">
                          Shape Type
                        </span>
                        <div className="grid grid-cols-4 gap-1">
                          {[
                            { type: 'rectangle' as ShapeType, label: 'Rect', icon: Square },
                            { type: 'rounded-rectangle' as ShapeType, label: 'Round', icon: Square },
                            { type: 'circle' as ShapeType, label: 'Circle', icon: Circle },
                            { type: 'triangle' as ShapeType, label: 'Tri', icon: Triangle },
                            { type: 'star' as ShapeType, label: 'Star', icon: Star },
                            { type: 'diamond' as ShapeType, label: 'Diam', icon: Diamond },
                            { type: 'line' as ShapeType, label: 'Line', icon: Minus },
                            { type: 'arrow' as ShapeType, label: 'Arrow', icon: ArrowRight },
                          ].map((item) => {
                            const Icon = item.icon;
                            const isActive = shapeEl.shapeType === item.type;
                            return (
                              <button
                                key={item.type}
                                type="button"
                                onClick={() => onUpdateSelectedElement({ shapeType: item.type })}
                                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg border text-[10px] font-medium transition-colors cursor-pointer ${
                                  isActive
                                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold shadow-2xs'
                                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                }`}
                                title={item.label}
                              >
                                <Icon className="w-3.5 h-3.5 mb-0.5" />
                                <span>{item.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Stroke Width */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                          <span>Border / Stroke Width</span>
                          <span className="font-mono text-emerald-600 font-bold">{shapeEl.strokeWidth} px</span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={16}
                          value={shapeEl.strokeWidth}
                          onChange={(e) =>
                            onUpdateSelectedElement({ strokeWidth: parseInt(e.target.value, 10) || 2 })
                          }
                          className="w-full accent-emerald-600 cursor-pointer"
                        />
                      </div>

                      {/* Stroke Style */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 block">
                          Border Style
                        </span>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(['solid', 'dashed', 'dotted'] as const).map((style) => (
                            <button
                              key={style}
                              type="button"
                              onClick={() => onUpdateSelectedElement({ strokeStyle: style })}
                              className={`py-1.5 px-2 rounded-lg border text-[11px] capitalize font-medium transition-colors cursor-pointer text-center ${
                                (shapeEl.strokeStyle || 'solid') === style
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                                  : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                              }`}
                            >
                              {style}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Corner Radius (for rectangle or rounded-rectangle) */}
                      {(shapeEl.shapeType === 'rectangle' || shapeEl.shapeType === 'rounded-rectangle') && (
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                            <span>Corner Radius</span>
                            <span className="font-mono text-emerald-600 font-bold">
                              {shapeEl.cornerRadius ?? (shapeEl.shapeType === 'rounded-rectangle' ? 12 : 0)} px
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={32}
                            value={shapeEl.cornerRadius ?? (shapeEl.shapeType === 'rounded-rectangle' ? 12 : 0)}
                            onChange={(e) =>
                              onUpdateSelectedElement({ cornerRadius: parseInt(e.target.value, 10) || 0 })
                            }
                            className="w-full accent-emerald-600 cursor-pointer"
                          />
                        </div>
                      )}

                      {/* Stroke Color */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 block">
                          Border Color
                        </span>
                        <div className="grid grid-cols-4 gap-1.5">
                          {COLOR_PALETTE.map((c) => (
                            <button
                              key={c.hex}
                              type="button"
                              onClick={() => onUpdateSelectedElement({ strokeColor: c.hex })}
                              className={`h-7 rounded-lg border transition-transform flex items-center justify-center cursor-pointer ${
                                shapeEl.strokeColor.toLowerCase() === c.hex.toLowerCase()
                                  ? 'ring-2 ring-emerald-600 scale-105'
                                  : 'border-neutral-200 hover:scale-105'
                              }`}
                              style={{ backgroundColor: c.hex }}
                              title={c.label}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Fill Options */}
                      {shapeEl.shapeType !== 'line' && shapeEl.shapeType !== 'arrow' && (
                        <div className="space-y-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                              Fill Shape
                            </span>
                            <input
                              type="checkbox"
                              checked={shapeEl.isFilled}
                              onChange={(e) => onUpdateSelectedElement({ isFilled: e.target.checked })}
                              className="accent-emerald-600 cursor-pointer w-4 h-4"
                            />
                          </div>

                          {shapeEl.isFilled && (
                            <>
                              <div className="space-y-1.5">
                                <span className="text-[11px] font-semibold text-neutral-500">Fill Color:</span>
                                <div className="grid grid-cols-4 gap-1.5">
                                  {COLOR_PALETTE.map((c) => (
                                    <button
                                      key={c.hex}
                                      type="button"
                                      onClick={() => onUpdateSelectedElement({ fillColor: c.hex })}
                                      className={`h-7 rounded-lg border transition-transform flex items-center justify-center cursor-pointer ${
                                        shapeEl.fillColor.toLowerCase() === c.hex.toLowerCase()
                                          ? 'ring-2 ring-emerald-600 scale-105'
                                          : 'border-neutral-200 hover:scale-105'
                                      }`}
                                      style={{ backgroundColor: c.hex }}
                                      title={c.label}
                                    />
                                  ))}
                                </div>
                              </div>

                              {/* Fill Opacity */}
                              <div className="space-y-1">
                                <div className="flex justify-between items-center text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                                  <span>Fill Opacity</span>
                                  <span className="font-mono text-emerald-600 font-bold">
                                    {Math.round((shapeEl.fillOpacity ?? 1) * 100)}%
                                  </span>
                                </div>
                                <input
                                  type="range"
                                  min={10}
                                  max={100}
                                  value={Math.round((shapeEl.fillOpacity ?? 1) * 100)}
                                  onChange={(e) =>
                                    onUpdateSelectedElement({
                                      fillOpacity: (parseInt(e.target.value, 10) || 100) / 100,
                                    })
                                  }
                                  className="w-full accent-emerald-600 cursor-pointer"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}
              </>
            )}

            {/* STAMP PROPERTIES */}
            {selectedElement.type === 'stamp' && (
              <>
                {(() => {
                  const stampEl = selectedElement as StampElement;
                  return (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                          Stamp Text
                        </label>
                        <input
                          type="text"
                          value={stampEl.text}
                          onChange={(e) =>
                            onUpdateSelectedElement({ text: e.target.value.toUpperCase() })
                          }
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 font-bold uppercase bg-neutral-50 dark:bg-neutral-800"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 block">
                          Stamp Color
                        </span>
                        <div className="grid grid-cols-4 gap-1.5">
                          {COLOR_PALETTE.slice(0, 6).map((c) => (
                            <button
                              key={c.hex}
                              type="button"
                              onClick={() =>
                                onUpdateSelectedElement({ color: c.hex, borderColor: c.hex })
                              }
                              className={`h-7 rounded-lg border transition-transform flex items-center justify-center cursor-pointer ${
                                stampEl.color.toLowerCase() === c.hex.toLowerCase()
                                  ? 'ring-2 ring-emerald-600 scale-105'
                                  : 'border-neutral-200 hover:scale-105'
                              }`}
                              style={{ backgroundColor: c.hex }}
                              title={c.label}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </>
            )}

            {/* DRAWING PROPERTIES */}
            {selectedElement.type === 'draw' && (
              <>
                {(() => {
                  const drawEl = selectedElement as DrawElement;
                  return (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 block">
                          Stroke Color
                        </span>
                        <div className="grid grid-cols-4 gap-1.5">
                          {COLOR_PALETTE.map((c) => (
                            <button
                              key={c.hex}
                              type="button"
                              onClick={() => onUpdateSelectedElement({ strokeColor: c.hex })}
                              className={`h-7 rounded-lg border transition-transform flex items-center justify-center cursor-pointer ${
                                drawEl.strokeColor.toLowerCase() === c.hex.toLowerCase()
                                  ? 'ring-2 ring-emerald-600 scale-105'
                                  : 'border-neutral-200 hover:scale-105'
                              }`}
                              style={{ backgroundColor: c.hex }}
                              title={c.label}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </>
            )}

            {/* REDACT PROPERTIES */}
            {selectedElement.type === 'redact' && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900 space-y-2">
                <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-bold text-[11px]">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Permanent Blackout</span>
                </div>
                <p className="text-[10.5px] text-rose-600 dark:text-rose-300 leading-relaxed">
                  This section will be covered with a solid opaque block in the exported PDF, concealing confidential text or figures.
                </p>
              </div>
            )}

            {/* COMMON: Opacity slider for all non-redact elements */}
            {selectedElement.type !== 'redact' && (
              <div className="space-y-1.5 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <div className="flex justify-between items-center text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                  <span>Opacity</span>
                  <span className="font-mono text-neutral-500 font-bold">
                    {Math.round((selectedElement.opacity ?? 1.0) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={1.0}
                  step={0.05}
                  value={selectedElement.opacity ?? 1.0}
                  onChange={(e) =>
                    onUpdateSelectedElement({ opacity: parseFloat(e.target.value) })
                  }
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>
            )}

            {/* Element Actions: Duplicate & Delete */}
            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
              {onDuplicateSelected && selectedElement.type !== 'redact' && (
                <button
                  type="button"
                  onClick={onDuplicateSelected}
                  className="flex-1 py-1.5 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 font-semibold flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Duplicate</span>
                </button>
              )}

              {onDeleteSelected && (
                <button
                  type="button"
                  onClick={onDeleteSelected}
                  className="py-1.5 px-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 font-semibold flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </>
        ) : (
          /* ============================================================== */
          /* CONTEXTUAL MODE 2: DOCUMENT & PAGE PROPERTIES (NO SELECTION) */
          /* ============================================================== */
          <>
            {/* Section 1: Page Navigation */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between font-bold text-neutral-900 dark:text-white">
                <span>Current Page</span>
                <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded font-mono">
                  Page {currentPage} of {totalPages}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={1}
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => onGoToPage(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              {pageDimensions && (
                <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/70 dark:border-neutral-800 space-y-1 text-[11px] text-neutral-600 dark:text-neutral-300">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Dimensions</span>
                    <span className="font-semibold font-mono">
                      {Math.round(pageDimensions.width)} × {Math.round(pageDimensions.height)} pt
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Orientation</span>
                    <span className="font-semibold">{isLandscape ? 'Landscape' : 'Portrait'}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-neutral-200/50 dark:border-neutral-700/50">
                    <span className="text-neutral-400">Rotate View</span>
                    <button
                      type="button"
                      onClick={onRotatePage}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                    >
                      <RotateCw className="w-3 h-3" />
                      <span>+90° CW</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-neutral-200 dark:border-neutral-800" />

            {/* Section 2: Zoom Controls */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between font-bold text-neutral-900 dark:text-white">
                <div className="flex items-center gap-1.5">
                  <ZoomIn className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Canvas Zoom</span>
                </div>
                <span className="font-mono font-bold text-neutral-700 dark:text-neutral-300">{zoom}%</span>
              </div>

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-4 gap-1">
                {ZOOM_PRESETS.slice(1, 7).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => onSetZoom(preset)}
                    className={`py-1 rounded text-[10px] font-semibold transition-colors cursor-pointer font-mono ${
                      zoom === preset
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {preset}%
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-neutral-200 dark:border-neutral-800" />

            {/* Section 3: Document Metadata */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-white">
                <FileText className="w-3.5 h-3.5 text-neutral-500" />
                <span>Document File</span>
              </div>

              <div className="space-y-1.5 text-[11px] text-neutral-600 dark:text-neutral-400">
                <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800/80">
                  <span className="text-neutral-400">Filename</span>
                  <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate max-w-[130px]" title={docInfo?.name}>
                    {docInfo?.name || 'document.pdf'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800/80">
                  <span className="text-neutral-400">Total Pages</span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">{totalPages}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800/80">
                  <span className="text-neutral-400">File Size</span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200 font-mono">
                    {formatBytes(docInfo?.size || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 4: Privacy Guarantee */}
            <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-900 dark:text-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Local Privacy</span>
              </div>
              <p className="text-[10.5px] leading-relaxed text-emerald-800/90 dark:text-emerald-300/90">
                Your document stays on this device while you edit. All page rendering executes entirely in your browser.
              </p>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};
